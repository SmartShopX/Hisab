import { Router, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// GET /api/v1/purchases - Server-side search & pagination
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const {
      page = '1',
      limit = '50',
      search = '',
      supplierId = '',
      dateFrom = '',
      dateTo = '',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const params: any[] = [businessId];
    let whereClauses = 'WHERE p.business_id = $1';

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClauses += ` AND (LOWER(p.invoice_number) LIKE $${params.length} OR LOWER(p.supplier_name) LIKE $${params.length})`;
    }

    if (supplierId && typeof supplierId === 'string') {
      params.push(supplierId);
      whereClauses += ` AND p.supplier_id = $${params.length}`;
    }

    if (dateFrom && typeof dateFrom === 'string') {
      params.push(dateFrom);
      whereClauses += ` AND p.purchase_date >= $${params.length}`;
    }

    if (dateTo && typeof dateTo === 'string') {
      params.push(dateTo);
      whereClauses += ` AND p.purchase_date <= $${params.length}`;
    }

    const countQuery = `SELECT COUNT(*) as total FROM purchases p ${whereClauses}`;
    const countRes = await query(countQuery, params);
    const totalRecords = parseInt(countRes.rows[0]?.total || '0', 10);

    const listQuery = `
      SELECT p.id, p.invoice_number as "invoiceNumber",
             p.supplier_id as "supplierId", p.supplier_name as "supplierName",
             p.subtotal::float as subtotal, p.discount::float as discount,
             p.vat::float as vat, p.transport_cost::float as "transportCost",
             p.total_amount::float as "totalAmount",
             p.paid_amount::float as "paidAmount",
             p.due_amount::float as "dueAmount",
             p.purchase_date as "purchaseDate",
             p.notes, p.branch_id as "branchId",
             p.created_at as "createdAt"
      FROM purchases p
      ${whereClauses}
      ORDER BY p.purchase_date DESC, p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limitNum, offset);
    const listRes = await query(listQuery, params);

    // Fetch items for each purchase
    const purchases = await Promise.all(
      listRes.rows.map(async (pur) => {
        const itemsRes = await query(
          `SELECT id, product_id as "productId", product_name as "productName",
                  quantity::float as quantity, unit_cost::float as "unitCost",
                  previous_price::float as "previousPrice",
                  price_change_type as "priceChangeType",
                  price_diff_absolute::float as "priceDiffAbsolute",
                  price_diff_percent::float as "priceDiffPercent",
                  total_cost::float as "totalCost"
           FROM purchase_items
           WHERE purchase_id = $1`,
          [pur.id]
        );
        return { ...pur, items: itemsRes.rows };
      })
    );

    return res.json({
      data: purchases,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// GET /api/v1/purchases/price-history/:productId - Authoritative rate history & metrics
router.get('/price-history/:productId', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { productId } = req.params;
  const businessId = req.business?.id;

  try {
    const historyRes = await query(
      `SELECT pi.unit_cost::float as "unitCost",
              p.purchase_date as "purchaseDate",
              p.supplier_id as "supplierId",
              p.supplier_name as "supplierName",
              p.invoice_number as "invoiceNumber"
       FROM purchase_items pi
       JOIN purchases p ON pi.purchase_id = p.id
       WHERE pi.product_id = $1 AND p.business_id = $2
       ORDER BY p.purchase_date DESC, p.created_at DESC
       LIMIT 10`,
      [productId, businessId]
    );

    const rates = historyRes.rows.map((r) => r.unitCost);
    const lowestRate = rates.length > 0 ? Math.min(...rates) : 0;
    const highestRate = rates.length > 0 ? Math.max(...rates) : 0;
    const averageRate =
      rates.length > 0
        ? parseFloat((rates.reduce((sum, r) => sum + r, 0) / rates.length).toFixed(2))
        : 0;

    // Previous price is the most recent purchase before today, or current catalog purchase price
    let previousPrice = 0;
    if (historyRes.rows.length > 0) {
      previousPrice = historyRes.rows[0].unitCost;
    } else {
      const prodRes = await query(
        `SELECT purchase_price::float as "purchasePrice" FROM products WHERE id = $1 AND business_id = $2`,
        [productId, businessId]
      );
      previousPrice = prodRes.rows[0]?.purchasePrice || 0;
    }

    return res.json({
      productId,
      previousPrice,
      lowestRate,
      highestRate,
      averageRate,
      history: historyRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching product price history:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/purchases - Atomic purchase creation with stock inward & price comparison
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const {
    supplierId,
    supplierName,
    items,
    subtotal = 0,
    discount = 0,
    vat = 0,
    transportCost = 0,
    totalAmount,
    paidAmount = 0,
    purchaseDate,
    branchId,
    notes,
  } = req.body;

  if (!supplierId) {
    return res.status(422).json({ error: 'ValidationError', message: 'Supplier is required' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Purchase items cannot be empty' });
  }

  const businessId = req.business?.id;
  const purchaseId = `pur_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const invoiceNumber = `PUR-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const effectiveDate = purchaseDate || new Date().toISOString().split('T')[0];
  const finalTotal = parseFloat(totalAmount) || 0;
  const finalPaid = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, finalTotal - finalPaid);

  try {
    const result = await transaction(async (client) => {
      // 1. Process each item: compare with previous price and update stock
      const processedItems: any[] = [];

      for (const item of items) {
        const prodId = item.productId;
        const qty = parseFloat(item.quantity) || 0;
        const currentCost = parseFloat(item.unitCost || item.purchasePrice) || 0;

        if (qty <= 0 || currentCost < 0) {
          throw new Error(`Invalid quantity or cost for product ${item.productName}`);
        }

        // Fetch current product record
        const prodRes = await client.query(
          `SELECT id, name, stock, purchase_price::float as "purchasePrice"
           FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE`,
          [prodId, businessId]
        );

        if (prodRes.rows.length === 0) {
          throw new Error(`Product not found: ${prodId}`);
        }

        const prevPrice = prodRes.rows[0].purchasePrice || 0;
        const currentStock = parseFloat(prodRes.rows[0].stock) || 0;
        const newStock = currentStock + qty;

        // Authoritative price comparison
        let priceChangeType: 'HIGHER' | 'LOWER' | 'NO_CHANGE' = 'NO_CHANGE';
        let priceDiffAbsolute = 0;
        let priceDiffPercent = 0;

        if (prevPrice > 0) {
          const diff = currentCost - prevPrice;
          priceDiffAbsolute = parseFloat(Math.abs(diff).toFixed(2));
          priceDiffPercent = parseFloat(((Math.abs(diff) / prevPrice) * 100).toFixed(2));

          if (diff > 0.01) {
            priceChangeType = 'HIGHER';
          } else if (diff < -0.01) {
            priceChangeType = 'LOWER';
          }
        }

        // Update product stock and latest purchase price
        await client.query(
          `UPDATE products
           SET stock = $1, purchase_price = $2, updated_at = NOW()
           WHERE id = $3`,
          [newStock, currentCost, prodId]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (
            id, business_id, product_id, branch_id, movement_type, quantity,
            stock_before, stock_after, reason, reference_id, created_by
          ) VALUES ($1, $2, $3, $4, 'PURCHASE', $5, $6, $7, $8, $9, $10)`,
          [
            `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            businessId,
            prodId,
            branchId || null,
            qty,
            currentStock,
            newStock,
            `Purchase invoice ${invoiceNumber}`,
            purchaseId,
            req.user?.id,
          ]
        );

        processedItems.push({
          productId: prodId,
          productName: prodRes.rows[0].name,
          quantity: qty,
          unitCost: currentCost,
          previousPrice: prevPrice,
          priceChangeType,
          priceDiffAbsolute,
          priceDiffPercent,
          totalCost: qty * currentCost,
        });
      }

      // 2. Insert purchase header
      await client.query(
        `INSERT INTO purchases (
          id, business_id, branch_id, invoice_number, supplier_id, supplier_name,
          subtotal, discount, vat, transport_cost, total_amount, paid_amount, due_amount,
          purchase_date, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          purchaseId,
          businessId,
          branchId || null,
          invoiceNumber,
          supplierId,
          supplierName || '',
          subtotal,
          discount,
          vat,
          transportCost,
          finalTotal,
          finalPaid,
          dueAmount,
          effectiveDate,
          notes || '',
          req.user?.id,
        ]
      );

      // 3. Insert purchase items
      for (const it of processedItems) {
        await client.query(
          `INSERT INTO purchase_items (
            id, purchase_id, product_id, product_name, quantity, unit_cost,
            previous_price, price_change_type, price_diff_absolute, price_diff_percent, total_cost
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            `pui_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            purchaseId,
            it.productId,
            it.productName,
            it.quantity,
            it.unitCost,
            it.previousPrice,
            it.priceChangeType,
            it.priceDiffAbsolute,
            it.priceDiffPercent,
            it.totalCost,
          ]
        );
      }

      // 4. Update Supplier balance & record Supplier Ledger
      const supRes = await client.query(
        `SELECT id, total_payable::float as "totalPayable", total_paid::float as "totalPaid"
         FROM suppliers WHERE id = $1 AND business_id = $2 FOR UPDATE`,
        [supplierId, businessId]
      );

      if (supRes.rows.length > 0) {
        const currentPayable = supRes.rows[0].totalPayable || 0;
        const currentPaid = supRes.rows[0].totalPaid || 0;
        const newPayable = currentPayable + dueAmount;
        const newPaid = currentPaid + finalPaid;

        await client.query(
          `UPDATE suppliers
           SET total_payable = $1, total_paid = $2, updated_at = NOW()
           WHERE id = $3`,
          [newPayable, newPaid, supplierId]
        );

        // Supplier Ledger Entry
        await client.query(
          `INSERT INTO supplier_ledger (
            id, business_id, supplier_id, date, type, reference_id, debit, credit, balance, notes
          ) VALUES ($1, $2, $3, $4, 'Purchase', $5, $6, $7, $8, $9)`,
          [
            `sled_${Date.now()}`,
            businessId,
            supplierId,
            effectiveDate,
            purchaseId,
            finalPaid, // debit = payment reduces liability
            finalTotal, // credit = purchase invoice increases liability
            newPayable,
            `Purchase Invoice ${invoiceNumber}`,
          ]
        );
      }

      // 5. Record Payment if paidAmount > 0
      if (finalPaid > 0) {
        await client.query(
          `INSERT INTO payments (
            id, business_id, branch_id, transaction_number, payment_type, method,
            amount, supplier_id, reference_note, created_by
          ) VALUES ($1, $2, $3, $4, 'Supplier Payment', 'Cash', $5, $6, $7, $8)`,
          [
            `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            businessId,
            branchId || null,
            `TXN-PUR-${Date.now().toString().slice(-6)}`,
            finalPaid,
            supplierId,
            `Payment for purchase ${invoiceNumber}`,
            req.user?.id,
          ]
        );
      }

      // 6. Audit
      await client.query(
        `INSERT INTO audit_logs (id, user_id, business_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, 'PURCHASE_CREATED', 'purchase', $4, $5)`,
        [
          `aud_${Date.now()}`,
          req.user?.id,
          businessId,
          purchaseId,
          JSON.stringify({ invoiceNumber, supplierId, totalAmount: finalTotal, paidAmount: finalPaid, dueAmount }),
        ]
      );

      return {
        id: purchaseId,
        invoiceNumber,
        supplierId,
        supplierName,
        subtotal,
        discount,
        vat,
        transportCost,
        totalAmount: finalTotal,
        paidAmount: finalPaid,
        dueAmount,
        purchaseDate: effectiveDate,
        items: processedItems,
        createdAt: new Date().toISOString(),
      };
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Purchase creation transaction failed (rolled back):', error.message);
    return res.status(400).json({ error: 'PurchaseFailed', message: error.message });
  }
});

// GET /api/v1/purchases/returns - List purchase returns
router.get('/returns', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const { page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const listRes = await query(
      `SELECT pr.id, pr.return_number as "returnNumber", pr.purchase_id as "purchaseId",
              pr.supplier_id as "supplierId", s.name as "supplierName",
              pr.return_date as "returnDate",
              pr.total_refund_amount::float as "totalRefundAmount",
              pr.refund_status as "refundStatus",
              pr.reason, pr.notes, pr.created_at as "createdAt"
       FROM purchase_returns pr
       JOIN suppliers s ON pr.supplier_id = s.id
       WHERE pr.business_id = $1
       ORDER BY pr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [businessId, limitNum, offset]
    );

    const returnsWithItems = await Promise.all(
      listRes.rows.map(async (ret) => {
        const items = await query(
          `SELECT id, product_id as "productId", product_name as "productName",
                  quantity::float as quantity, unit_cost::float as "unitCost",
                  total_amount::float as "totalAmount"
           FROM purchase_return_items
           WHERE purchase_return_id = $1`,
          [ret.id]
        );
        return { ...ret, items: items.rows };
      })
    );

    return res.json({ data: returnsWithItems });
  } catch (error: any) {
    console.error('Error fetching purchase returns:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/purchases/returns - Authoritative Purchase Return to Supplier
router.post('/returns', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const {
    purchaseId,
    supplierId,
    items,
    reason,
    notes,
    refundStatus = 'Adjusted_In_Due',
    branchId,
  } = req.body;

  if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Supplier and returned items are required' });
  }

  const businessId = req.business?.id;
  const returnId = `pret_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const returnNumber = `PRET-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const result = await transaction(async (client) => {
      let totalRefund = 0;
      const processedItems: any[] = [];

      // 1. Process items: reduce product stock and record stock movement
      for (const item of items) {
        const prodId = item.productId;
        const qty = parseFloat(item.quantity) || 0;
        const unitCost = parseFloat(item.unitCost) || 0;
        const itemTotal = qty * unitCost;

        if (qty <= 0) {
          throw new Error(`Invalid return quantity for product: ${item.productName || prodId}`);
        }

        totalRefund += itemTotal;

        // Verify and lock product stock
        const pRes = await client.query(
          `SELECT id, name, stock FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE`,
          [prodId, businessId]
        );

        if (pRes.rows.length === 0) {
          throw new Error(`Product not found: ${prodId}`);
        }

        const currentStock = parseFloat(pRes.rows[0].stock) || 0;
        if (currentStock < qty) {
          throw new Error(
            `Insufficient stock to return "${pRes.rows[0].name}". Current stock: ${currentStock}, Return requested: ${qty}`
          );
        }

        const updateRes = await client.query(
          `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND stock >= $1 RETURNING stock`,
          [qty, prodId]
        );

        if (updateRes.rows.length === 0) {
          throw new Error(`Stock concurrency conflict for "${pRes.rows[0].name}".`);
        }

        const newStock = parseFloat(updateRes.rows[0].stock);

        if (branchId) {
          await client.query(
            `UPDATE branch_inventory SET stock = stock - $1, updated_at = NOW() WHERE branch_id = $2 AND product_id = $3 AND stock >= $1`,
            [qty, branchId, prodId]
          );
        }

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (
            id, business_id, branch_id, product_id, movement_type, quantity,
            stock_before, stock_after, reason, reference_id, created_by
          ) VALUES ($1, $2, $3, $4, 'PURCHASE_RETURN', $5, $6, $7, $8, $9, $10)`,
          [
            `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            businessId,
            branchId || null,
            prodId,
            qty,
            currentStock,
            newStock,
            `Supplier Return: ${returnNumber} (${reason || 'Returned to supplier'})`,
            returnId,
            req.user?.id,
          ]
        );

        processedItems.push({
          productId: prodId,
          productName: pRes.rows[0].name,
          quantity: qty,
          unitCost,
          totalAmount: itemTotal,
        });
      }

      totalRefund = parseFloat(totalRefund.toFixed(2));

      // 2. Insert Purchase Return Header
      await client.query(
        `INSERT INTO purchase_returns (
          id, business_id, branch_id, purchase_id, supplier_id, return_number,
          return_date, total_refund_amount, refund_status, reason, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, $10, $11)`,
        [
          returnId,
          businessId,
          branchId || null,
          purchaseId || null,
          supplierId,
          returnNumber,
          totalRefund,
          refundStatus,
          reason || '',
          notes || '',
          req.user?.id,
        ]
      );

      // 3. Insert Purchase Return Items
      for (const it of processedItems) {
        await client.query(
          `INSERT INTO purchase_return_items (
            id, purchase_return_id, product_id, product_name, quantity, unit_cost, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            `preti_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            returnId,
            it.productId,
            it.productName,
            it.quantity,
            it.unitCost,
            it.totalAmount,
          ]
        );
      }

      // 4. Update Supplier Payable & Supplier Ledger
      const supRes = await client.query(
        `SELECT id, total_payable::float as "totalPayable" FROM suppliers WHERE id = $1 AND business_id = $2 FOR UPDATE`,
        [supplierId, businessId]
      );

      if (supRes.rows.length > 0) {
        const currentPayable = supRes.rows[0].totalPayable || 0;
        let newPayable = currentPayable;

        if (refundStatus === 'Adjusted_In_Due') {
          newPayable = Math.max(0, currentPayable - totalRefund);
          await client.query(
            `UPDATE suppliers SET total_payable = $1, updated_at = NOW() WHERE id = $2`,
            [newPayable, supplierId]
          );
        }

        // Supplier Ledger Entry
        await client.query(
          `INSERT INTO supplier_ledger (
            id, business_id, supplier_id, date, type, reference_id, debit, credit, balance, notes
          ) VALUES ($1, $2, $3, CURRENT_DATE, 'Purchase Return', $4, $5, 0, $6, $7)`,
          [
            `sled_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            businessId,
            supplierId,
            returnId,
            totalRefund, // debit = supplier return reduces liability
            newPayable,
            `Purchase Return ${returnNumber} - Reason: ${reason || 'Return to vendor'}`,
          ]
        );
      }

      // 5. If supplier provided cash/bank refund
      if (['Cash_Refund', 'Bank_Refund'].includes(refundStatus) && totalRefund > 0) {
        await client.query(
          `INSERT INTO payments (
            id, business_id, branch_id, transaction_number, payment_type, method,
            amount, supplier_id, reference_note, created_by
          ) VALUES ($1, $2, $3, $4, 'Supplier Refund', $5, $6, $7, $8, $9)`,
          [
            `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            businessId,
            branchId || null,
            `TXN-SUPREF-${Date.now().toString().slice(-6)}`,
            refundStatus === 'Cash_Refund' ? 'Cash' : 'Bank',
            totalRefund,
            supplierId,
            `Refund for purchase return ${returnNumber}`,
            req.user?.id,
          ]
        );
      }

      // 6. Audit Log
      await client.query(
        `INSERT INTO audit_logs (id, user_id, business_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, 'PURCHASE_RETURN_PROCESSED', 'purchase_return', $4, $5)`,
        [
          `aud_${Date.now()}`,
          req.user?.id,
          businessId,
          returnId,
          JSON.stringify({ returnNumber, supplierId, totalRefund, itemCount: processedItems.length }),
        ]
      );

      return {
        id: returnId,
        returnNumber,
        supplierId,
        totalRefundAmount: totalRefund,
        refundStatus,
        items: processedItems,
        createdAt: new Date().toISOString(),
      };
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Purchase return transaction failed (rolled back):', error.message);
    return res.status(400).json({ error: 'PurchaseReturnFailed', message: error.message });
  }
});

export default router;

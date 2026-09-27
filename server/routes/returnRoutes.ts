import { Router, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// GET /api/v1/returns - List returns & exchanges with filtering & pagination
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const {
      page = '1',
      limit = '50',
      search = '',
      type = '',
      channel = '',
      condition = '',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const params: any[] = [businessId];
    let whereClauses = 'WHERE r.business_id = $1';

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClauses += ` AND (LOWER(r.return_number) LIKE $${params.length} OR LOWER(r.invoice_number) LIKE $${params.length} OR LOWER(r.customer_name) LIKE $${params.length} OR r.customer_mobile LIKE $${params.length})`;
    }

    if (type && typeof type === 'string' && type !== 'all') {
      params.push(type);
      whereClauses += ` AND r.type = $${params.length}`;
    }

    if (channel && typeof channel === 'string' && channel !== 'all') {
      params.push(channel);
      whereClauses += ` AND r.channel = $${params.length}`;
    }

    if (condition && typeof condition === 'string' && condition !== 'all') {
      params.push(condition);
      whereClauses += ` AND r.condition = $${params.length}`;
    }

    const countRes = await query(`SELECT COUNT(*) as total FROM returns r ${whereClauses}`, params);
    const totalRecords = parseInt(countRes.rows[0]?.total || '0', 10);

    const listQuery = `
      SELECT r.id, r.return_number as "returnNumber", r.invoice_number as "invoiceNumber",
             r.order_id as "orderId", r.customer_id as "customerId",
             r.customer_name as "customerName", r.customer_mobile as "customerMobile",
             r.type, r.channel, r.condition, r.refund_method as "refundMethod",
             r.store_credit_code as "storeCreditCode",
             r.courier_provider as "courierProvider",
             r.courier_tracking_code as "courierTrackingCode",
             r.courier_return_fee::float as "courierReturnFee",
             r.refund_amount::float as "refundAmount",
             r.additional_charge::float as "additionalCharge",
             r.stock_restocked as "stockRestocked",
             r.reason, r.notes, r.created_at as "createdAt"
      FROM returns r
      ${whereClauses}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limitNum, offset);
    const listRes = await query(listQuery, params);

    // Fetch items for each return
    const returnRecords = await Promise.all(
      listRes.rows.map(async (ret) => {
        const itemsRes = await query(
          `SELECT id, product_id as "productId", product_name as "productName",
                  quantity::float as quantity, unit_price::float as "unitPrice",
                  refund_amount::float as "refundAmount", item_type as "itemType",
                  condition
           FROM return_items
           WHERE return_id = $1`,
          [ret.id]
        );

        const returnedItems = itemsRes.rows.filter((it) => it.itemType === 'RETURNED');
        const exchangedItems = itemsRes.rows.filter((it) => it.itemType === 'EXCHANGED');

        return {
          ...ret,
          returnedItems,
          exchangedItems: exchangedItems.length > 0 ? exchangedItems : undefined,
        };
      })
    );

    return res.json({
      data: returnRecords,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching returns:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/returns - Authoritative Return & Exchange Transaction
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const {
    invoiceNumber,
    customerName,
    customerMobile,
    customerId,
    orderId,
    type = 'Return',
    channel = 'Direct_Store',
    condition = 'Resellable',
    refundMethod = 'Cash',
    courierProvider,
    courierTrackingCode,
    courierReturnFee = 0,
    returnedItems,
    exchangedItems,
    refundAmount = 0,
    additionalCharge = 0,
    reason,
    notes,
    stockRestocked = true,
    branchId,
  } = req.body;

  if (!returnedItems || !Array.isArray(returnedItems) || returnedItems.length === 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Returned items list cannot be empty' });
  }

  const businessId = req.business?.id;
  const returnId = `ret_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const returnNumber = `RET-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const finalRefundAmount = Math.max(0, parseFloat(refundAmount) || 0);
  const finalCourierFee = Math.max(0, parseFloat(courierReturnFee) || 0);
  const finalAdditionalCharge = Math.max(0, parseFloat(additionalCharge) || 0);

  // Generate Store Credit voucher code if Store Credit refund
  let storeCreditCode: string | null = null;
  if (refundMethod === 'Store_Credit') {
    storeCreditCode = `SC-${new Date().toISOString().slice(2, 7).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  try {
    const result = await transaction(async (client) => {
      // 1. Process Returned Items: Restock if Resellable and stockRestocked is true
      const processedReturned: any[] = [];
      const shouldRestock = stockRestocked && condition === 'Resellable';

      for (const item of returnedItems) {
        const prodId = item.productId;
        const qty = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemRefund = parseFloat(item.refundAmount) || qty * unitPrice;

        if (qty <= 0) {
          throw new Error(`Invalid return quantity for product: ${item.productName || prodId}`);
        }

        // Lock product
        const pRes = await client.query(
          `SELECT id, name, stock FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE`,
          [prodId, businessId]
        );

        if (pRes.rows.length === 0) {
          throw new Error(`Product not found: ${item.productName || prodId}`);
        }

        const currentStock = parseFloat(pRes.rows[0].stock) || 0;
        let newStock = currentStock;

        if (shouldRestock) {
          newStock = currentStock + qty;
          await client.query(
            `UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2`,
            [qty, prodId]
          );

          if (branchId) {
            await client.query(
              `UPDATE branch_inventory SET stock = stock + $1, updated_at = NOW() WHERE branch_id = $2 AND product_id = $3`,
              [qty, branchId, prodId]
            );
          }

          // Stock movement for restock
          await client.query(
            `INSERT INTO stock_movements (
              id, business_id, branch_id, product_id, movement_type, quantity,
              stock_before, stock_after, reason, reference_id, created_by
            ) VALUES ($1, $2, $3, $4, 'RETURN_RESTOCK', $5, $6, $7, $8, $9, $10)`,
            [
              `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              businessId,
              branchId || null,
              prodId,
              qty,
              currentStock,
              newStock,
              `Customer return restock: ${returnNumber}`,
              returnId,
              req.user?.id,
            ]
          );
        } else {
          // Record damaged return quarantine movement (without adding to saleable stock)
          await client.query(
            `INSERT INTO stock_movements (
              id, business_id, branch_id, product_id, movement_type, quantity,
              stock_before, stock_after, reason, reference_id, created_by
            ) VALUES ($1, $2, $3, $4, 'RETURN_DAMAGED', $5, $6, $7, $8, $9, $10)`,
            [
              `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              businessId,
              branchId || null,
              prodId,
              qty,
              currentStock,
              currentStock,
              `Damaged return quarantined: ${returnNumber} (${reason || 'Defective'})`,
              returnId,
              req.user?.id,
            ]
          );
        }

        processedReturned.push({
          productId: prodId,
          productName: pRes.rows[0].name,
          quantity: qty,
          unitPrice,
          refundAmount: itemRefund,
          condition: item.condition || condition,
        });
      }

      // 2. Process Exchanged Items if Exchange
      const processedExchanged: any[] = [];
      if (type === 'Exchange' && exchangedItems && Array.isArray(exchangedItems) && exchangedItems.length > 0) {
        for (const exItem of exchangedItems) {
          const exProdId = exItem.productId;
          const exQty = parseFloat(exItem.quantity) || 0;
          const exUnitPrice = parseFloat(exItem.unitPrice) || 0;

          if (exQty <= 0) {
            throw new Error(`Invalid exchange quantity for item: ${exItem.productName || exProdId}`);
          }

          const exPRes = await client.query(
            `SELECT id, name, stock FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE`,
            [exProdId, businessId]
          );

          if (exPRes.rows.length === 0) {
            throw new Error(`Exchange product not found: ${exProdId}`);
          }

          const curExStock = parseFloat(exPRes.rows[0].stock) || 0;
          if (curExStock < exQty) {
            throw new Error(`Insufficient stock for exchange item "${exPRes.rows[0].name}". Available: ${curExStock}`);
          }

          const updateExRes = await client.query(
            `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND stock >= $1 RETURNING stock`,
            [exQty, exProdId]
          );

          if (updateExRes.rows.length === 0) {
            throw new Error(`Concurrency stock conflict for exchange item "${exPRes.rows[0].name}".`);
          }

          const newExStock = parseFloat(updateExRes.rows[0].stock);

          if (branchId) {
            await client.query(
              `UPDATE branch_inventory SET stock = stock - $1, updated_at = NOW() WHERE branch_id = $2 AND product_id = $3 AND stock >= $1`,
              [exQty, branchId, exProdId]
            );
          }

          // Stock movement for exchange item dispatch
          await client.query(
            `INSERT INTO stock_movements (
              id, business_id, branch_id, product_id, movement_type, quantity,
              stock_before, stock_after, reason, reference_id, created_by
            ) VALUES ($1, $2, $3, $4, 'EXCHANGE_OUT', $5, $6, $7, $8, $9, $10)`,
            [
              `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              businessId,
              branchId || null,
              exProdId,
              exQty,
              curExStock,
              newExStock,
              `Exchange item dispatch for ${returnNumber}`,
              returnId,
              req.user?.id,
            ]
          );

          processedExchanged.push({
            productId: exProdId,
            productName: exPRes.rows[0].name,
            quantity: exQty,
            unitPrice: exUnitPrice,
            totalPrice: exQty * exUnitPrice,
          });
        }
      }

      // 3. Insert Returns Header
      await client.query(
        `INSERT INTO returns (
          id, business_id, branch_id, return_number, invoice_number, order_id,
          customer_id, customer_name, customer_mobile, type, channel, condition,
          refund_method, store_credit_code, courier_provider, courier_tracking_code,
          courier_return_fee, refund_amount, additional_charge, stock_restocked,
          reason, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
        [
          returnId,
          businessId,
          branchId || null,
          returnNumber,
          invoiceNumber ? invoiceNumber.trim() : null,
          orderId || null,
          customerId || null,
          customerName ? customerName.trim() : 'Walk-in Customer',
          customerMobile ? customerMobile.trim() : '',
          type,
          channel,
          condition,
          type === 'Exchange' ? 'Adjust_With_Exchange' : refundMethod,
          storeCreditCode,
          channel === 'Courier_RTO' ? courierProvider : null,
          channel === 'Courier_RTO' ? courierTrackingCode : null,
          finalCourierFee,
          finalRefundAmount,
          finalAdditionalCharge,
          shouldRestock,
          reason || '',
          notes ? notes.trim() : '',
          req.user?.id,
        ]
      );

      // 4. Insert Return Items
      for (const item of processedReturned) {
        await client.query(
          `INSERT INTO return_items (
            id, return_id, product_id, product_name, quantity, unit_price, refund_amount, item_type, condition
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'RETURNED', $8)`,
          [
            `reti_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            returnId,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.refundAmount,
            item.condition,
          ]
        );
      }

      for (const item of processedExchanged) {
        await client.query(
          `INSERT INTO return_items (
            id, return_id, product_id, product_name, quantity, unit_price, refund_amount, item_type, condition
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'EXCHANGED', 'Resellable')`,
          [
            `reti_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            returnId,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
          ]
        );
      }

      // 5. Customer Ledger & Due Synchronization
      let targetCustId = customerId;
      if (!targetCustId && customerMobile) {
        const custLookup = await client.query(
          `SELECT id FROM customers WHERE mobile = $1 AND business_id = $2`,
          [customerMobile.trim(), businessId]
        );
        if (custLookup.rows.length > 0) {
          targetCustId = custLookup.rows[0].id;
        }
      }

      if (targetCustId) {
        const custRes = await client.query(
          `SELECT id, total_due::float as "totalDue" FROM customers WHERE id = $1 AND business_id = $2 FOR UPDATE`,
          [targetCustId, businessId]
        );

        if (custRes.rows.length > 0) {
          const currentDue = custRes.rows[0].totalDue || 0;
          let newDue = currentDue;

          if (refundMethod === 'Adjust_With_Due' || type === 'Exchange') {
            newDue = Math.max(0, currentDue - finalRefundAmount + finalAdditionalCharge);
            await client.query(
              `UPDATE customers SET total_due = $1, updated_at = NOW() WHERE id = $2`,
              [newDue, targetCustId]
            );

            // Record in Customer Ledger
            await client.query(
              `INSERT INTO customer_ledger (
                id, business_id, customer_id, date, type, reference_id, debit, credit, balance, notes
              ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9)`,
              [
                `cleg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                businessId,
                targetCustId,
                type === 'Exchange' ? 'Exchange Adjustment' : 'Return Refund Adjustment',
                returnId,
                finalAdditionalCharge, // debit = additional charge increases due
                finalRefundAmount, // credit = return refund reduces due
                newDue,
                `${type} ${returnNumber} for Invoice ${invoiceNumber || 'N/A'}`,
              ]
            );
          }
        }
      }

      // 6. Record Refund Payment if cash/mfs/bank refund
      if (['Cash', 'MFS', 'Bank'].includes(refundMethod) && finalRefundAmount > 0) {
        await client.query(
          `INSERT INTO payments (
            id, business_id, branch_id, transaction_number, payment_type, method,
            amount, customer_id, reference_note, created_by
          ) VALUES ($1, $2, $3, $4, 'Refund', $5, $6, $7, $8, $9)`,
          [
            `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            businessId,
            branchId || null,
            `TXN-REF-${Date.now().toString().slice(-6)}`,
            refundMethod,
            finalRefundAmount,
            targetCustId || null,
            `Refund for return ${returnNumber}`,
            req.user?.id,
          ]
        );
      }

      // 7. Update order return_status if order found
      if (invoiceNumber) {
        await client.query(
          `UPDATE orders SET return_status = $1, updated_at = NOW() WHERE order_number = $2 AND business_id = $3`,
          [type === 'Exchange' ? 'exchanged' : 'returned', invoiceNumber.trim(), businessId]
        );
      }

      // 8. Audit Log
      await client.query(
        `INSERT INTO audit_logs (id, user_id, business_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, 'RETURN_PROCESSED', 'return', $4, $5)`,
        [
          `aud_${Date.now()}`,
          req.user?.id,
          businessId,
          returnId,
          JSON.stringify({
            returnNumber,
            invoiceNumber,
            type,
            refundAmount: finalRefundAmount,
            refundMethod,
            stockRestocked: shouldRestock,
          }),
        ]
      );

      return {
        id: returnId,
        returnNumber,
        invoiceNumber,
        type,
        channel,
        condition,
        refundMethod,
        storeCreditCode,
        refundAmount: finalRefundAmount,
        additionalCharge: finalAdditionalCharge,
        returnedItems: processedReturned,
        exchangedItems: processedExchanged.length > 0 ? processedExchanged : undefined,
        stockRestocked: shouldRestock,
        createdAt: new Date().toISOString(),
      };
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Return/Exchange transaction failed (rolled back):', error.message);
    return res.status(400).json({ error: 'ReturnFailed', message: error.message });
  }
});

export default router;

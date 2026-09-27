import { Router, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

const memBranches: any[] = [];

// GET /api/v1/branches - List all branches for business tenant
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    let bRes = await query(
      `SELECT id, business_id as "businessId", name, code, address, phone, city,
              is_main as "isMain", is_active as "isActive",
              target_monthly_sales::float as "targetMonthlySales",
              manager_name as "managerName", created_at as "createdAt"
       FROM branches
       WHERE business_id = $1
       ORDER BY is_main DESC, created_at ASC`,
      [businessId]
    );

    // Backward compatibility: If no branch exists, provision default "Main Branch" automatically
    if (bRes.rows.length === 0) {
      const defaultBranchId = `br_${businessId}_main`;
      await query(
        `INSERT INTO branches (id, business_id, name, code, address, phone, city, is_main, is_active, target_monthly_sales, manager_name)
         VALUES ($1, $2, 'মূল শাখা (Main Branch)', 'MAIN-01', 'দোকানের প্রধান কার্যালয়', $3, 'ঢাকা', true, true, 200000, $4)
         ON CONFLICT (id) DO NOTHING`,
        [defaultBranchId, businessId, req.user?.mobile || '', req.user?.name || 'ম্যানেজার']
      );

      bRes = await query(
        `SELECT id, business_id as "businessId", name, code, address, phone, city,
                is_main as "isMain", is_active as "isActive",
                target_monthly_sales::float as "targetMonthlySales",
                manager_name as "managerName", created_at as "createdAt"
         FROM branches
         WHERE business_id = $1`,
        [businessId]
      );
    }

    return res.json(bRes.rows);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const businessId = req.business?.id;
      const tenantBranches = memBranches.filter((b) => b.businessId === businessId);
      if (tenantBranches.length > 0) return res.json(tenantBranches);
      return res.json([
        {
          id: `br_${businessId}_main`,
          businessId,
          name: 'মূল শাখা (Main Branch)',
          code: 'MAIN-01',
          address: 'দোকানের প্রধান কার্যালয়',
          phone: req.user?.mobile || '',
          city: 'ঢাকা',
          isMain: true,
          isActive: true,
          targetMonthlySales: 200000,
          managerName: req.user?.name || 'ম্যানেজার',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    console.error('Error fetching branches:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/branches - Create new branch
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { name, code, address, phone, city = 'ঢাকা', targetMonthlySales = 200000, managerName } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(422).json({ error: 'ValidationError', message: 'Branch name is required' });
  }

  const businessId = req.business?.id;
  const branchId = `br_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const branchCode = code && code.trim() ? code.trim() : `BR-${Math.floor(100 + Math.random() * 900)}`;

  try {
    const result = await query(
      `INSERT INTO branches (id, business_id, name, code, address, phone, city, is_main, is_active, target_monthly_sales, manager_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, true, $8, $9)
       RETURNING id, business_id as "businessId", name, code, address, phone, city,
                 is_main as "isMain", is_active as "isActive",
                 target_monthly_sales::float as "targetMonthlySales",
                 manager_name as "managerName", created_at as "createdAt"`,
      [
        branchId,
        businessId,
        name.trim(),
        branchCode,
        address || '',
        phone || '',
        city,
        parseFloat(targetMonthlySales) || 0,
        managerName || '',
      ]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, business_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, 'BRANCH_CREATED', 'branch', $4, $5)`,
      [
        `aud_${Date.now()}`,
        req.user?.id,
        businessId,
        branchId,
        JSON.stringify({ name: name.trim(), code: branchCode }),
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const devBranch = {
        id: branchId,
        businessId,
        name: name.trim(),
        code: branchCode,
        address: address || '',
        phone: phone || '',
        city,
        isMain: false,
        isActive: true,
        targetMonthlySales: parseFloat(targetMonthlySales) || 200000,
        managerName: managerName || '',
        createdAt: new Date().toISOString(),
      };
      memBranches.push(devBranch);
      return res.status(201).json(devBranch);
    }
    console.error('Error creating branch:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// PUT /api/v1/branches/:id - Update branch details
router.put('/:id', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { name, code, address, phone, city, isActive, targetMonthlySales, managerName } = req.body;
  const businessId = req.business?.id;

  try {
    const check = await query(
      `SELECT id, is_main FROM branches WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'BranchNotFound', message: 'Branch not found' });
    }

    const updated = await query(
      `UPDATE branches
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           address = COALESCE($3, address),
           phone = COALESCE($4, phone),
           city = COALESCE($5, city),
           is_active = COALESCE($6, is_active),
           target_monthly_sales = COALESCE($7, target_monthly_sales),
           manager_name = COALESCE($8, manager_name),
           updated_at = NOW()
       WHERE id = $9 AND business_id = $10
       RETURNING id, business_id as "businessId", name, code, address, phone, city,
                 is_main as "isMain", is_active as "isActive",
                 target_monthly_sales::float as "targetMonthlySales",
                 manager_name as "managerName", updated_at as "updatedAt"`,
      [
        name ? name.trim() : null,
        code ? code.trim() : null,
        address !== undefined ? address : null,
        phone !== undefined ? phone : null,
        city !== undefined ? city : null,
        isActive !== undefined ? Boolean(isActive) : null,
        targetMonthlySales !== undefined ? parseFloat(targetMonthlySales) : null,
        managerName !== undefined ? managerName : null,
        id,
        businessId,
      ]
    );

    return res.json(updated.rows[0]);
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// GET /api/v1/branches/transfers - List stock transfer requests
router.get('/transfers', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const tRes = await query(
      `SELECT bt.id, bt.transfer_number as "transferNumber",
              bt.source_branch_id as "sourceBranchId", sb.name as "sourceBranchName",
              bt.dest_branch_id as "destBranchId", db.name as "destBranchName",
              bt.status, bt.total_items as "totalItems",
              bt.total_amount::float as "totalAmount",
              bt.driver_name as "driverName", bt.vehicle_number as "vehicleNumber",
              bt.tracking_number as "trackingNumber", bt.notes,
              bt.created_at as "createdAt"
       FROM branch_transfers bt
       LEFT JOIN branches sb ON bt.source_branch_id = sb.id
       LEFT JOIN branches db ON bt.dest_branch_id = db.id
       WHERE bt.business_id = $1
       ORDER BY bt.created_at DESC
       LIMIT 100`,
      [businessId]
    );

    // Fetch transfer items for each transfer
    const transfers = await Promise.all(
      tRes.rows.map(async (transfer) => {
        const itemsRes = await query(
          `SELECT id, product_id as "productId", product_name as "productName",
                  sku, quantity::float as quantity, unit_price::float as "unitPrice",
                  total_price::float as "totalPrice"
           FROM branch_transfer_items
           WHERE transfer_id = $1`,
          [transfer.id]
        );
        return { ...transfer, items: itemsRes.rows };
      })
    );

    return res.json(transfers);
  } catch (error: any) {
    console.error('Error fetching branch transfers:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/branches/transfers - Create atomic stock transfer
router.post('/transfers', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const {
    sourceBranchId,
    destBranchId,
    items,
    driverName,
    vehicleNumber,
    trackingNumber,
    notes,
  } = req.body;

  if (!sourceBranchId || !destBranchId || sourceBranchId === destBranchId) {
    return res.status(422).json({
      error: 'ValidationError',
      message: 'Different source and destination branches are required',
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(422).json({
      error: 'ValidationError',
      message: 'Transfer items list cannot be empty',
    });
  }

  const businessId = req.business?.id;
  const transferId = `bt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const transferNumber = `ST-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  let totalItemsCount = 0;
  let totalAmount = 0;

  try {
    const result = await transaction(async (client) => {
      // 1. Verify and deduct stock from source branch
      for (const it of items) {
        const prodId = it.productId;
        const qty = parseFloat(it.quantity) || 0;
        const price = parseFloat(it.unitPrice) || 0;

        if (qty <= 0) {
          throw new Error(`Invalid transfer quantity for item: ${it.productName}`);
        }

        totalItemsCount += qty;
        totalAmount += qty * price;

        // Check product master stock
        const pRes = await client.query(
          `SELECT id, name, stock FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE`,
          [prodId, businessId]
        );

        if (pRes.rows.length === 0) {
          throw new Error(`Product not found: ${prodId}`);
        }

        const currentStock = parseFloat(pRes.rows[0].stock);
        if (currentStock < qty) {
          throw new Error(`Insufficient stock for "${pRes.rows[0].name}". Available: ${currentStock}, Requested: ${qty}`);
        }

        // Record stock movement for transfer out
        await client.query(
          `INSERT INTO stock_movements (
            id, business_id, product_id, branch_id, movement_type, quantity,
            stock_before, stock_after, reason, reference_id, created_by
          ) VALUES ($1, $2, $3, $4, 'BRANCH_TRANSFER_OUT', $5, $6, $7, $8, $9, $10)`,
          [
            `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            businessId,
            prodId,
            sourceBranchId,
            qty,
            currentStock,
            currentStock - qty,
            `Stock transfer to branch ${destBranchId}`,
            transferId,
            req.user?.id,
          ]
        );
      }

      // 2. Insert branch transfer header
      await client.query(
        `INSERT INTO branch_transfers (
          id, business_id, transfer_number, source_branch_id, dest_branch_id,
          status, total_items, total_amount, driver_name, vehicle_number,
          tracking_number, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, 'In_Transit', $6, $7, $8, $9, $10, $11, $12)`,
        [
          transferId,
          businessId,
          transferNumber,
          sourceBranchId,
          destBranchId,
          totalItemsCount,
          totalAmount,
          driverName || '',
          vehicleNumber || '',
          trackingNumber || '',
          notes || '',
          req.user?.id,
        ]
      );

      // 3. Insert transfer items
      for (const it of items) {
        await client.query(
          `INSERT INTO branch_transfer_items (
            id, transfer_id, product_id, product_name, sku, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            `bti_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            transferId,
            it.productId,
            it.productName,
            it.sku || '',
            it.quantity,
            it.unitPrice || 0,
            (it.quantity || 1) * (it.unitPrice || 0),
          ]
        );
      }

      // 4. Audit
      await client.query(
        `INSERT INTO audit_logs (id, user_id, business_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, 'STOCK_TRANSFER_CREATED', 'branch_transfer', $4, $5)`,
        [
          `aud_${Date.now()}`,
          req.user?.id,
          businessId,
          transferId,
          JSON.stringify({ transferNumber, sourceBranchId, destBranchId, totalItemsCount, totalAmount }),
        ]
      );

      return {
        id: transferId,
        transferNumber,
        sourceBranchId,
        destBranchId,
        status: 'In_Transit',
        totalItems: totalItemsCount,
        totalAmount,
        createdAt: new Date().toISOString(),
      };
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Stock transfer transaction failed (rolled back):', error.message);
    return res.status(400).json({ error: 'TransferFailed', message: error.message });
  }
});

// PUT /api/v1/branches/transfers/:id/status - Update stock transfer status (e.g., Completed)
router.put('/transfers/:id/status', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const businessId = req.business?.id;

  if (!['In_Transit', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(422).json({ error: 'ValidationError', message: 'Valid status required' });
  }

  try {
    const result = await transaction(async (client) => {
      const tRes = await client.query(
        `SELECT id, source_branch_id, dest_branch_id, status FROM branch_transfers WHERE id = $1 AND business_id = $2 FOR UPDATE`,
        [id, businessId]
      );

      if (tRes.rows.length === 0) {
        throw new Error('Transfer record not found');
      }

      const current = tRes.rows[0];
      if (current.status === 'Completed') {
        throw new Error('Transfer is already completed');
      }

      // If completed, record arrival in destination branch and update branch_inventory
      if (status === 'Completed') {
        const itemsRes = await client.query(
          `SELECT product_id, quantity FROM branch_transfer_items WHERE transfer_id = $1`,
          [id]
        );

        for (const item of itemsRes.rows) {
          const qty = parseFloat(item.quantity) || 0;
          const prodId = item.product_id;

          // Upsert into destination branch_inventory
          await client.query(
            `INSERT INTO branch_inventory (id, business_id, branch_id, product_id, stock)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (branch_id, product_id)
             DO UPDATE SET stock = branch_inventory.stock + $5, updated_at = NOW()`,
            [
              `binv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              businessId,
              current.dest_branch_id,
              prodId,
              qty,
            ]
          );

          // Record stock movement for transfer in
          await client.query(
            `INSERT INTO stock_movements (
              id, business_id, product_id, branch_id, movement_type, quantity,
              stock_before, stock_after, reason, reference_id, created_by
            ) VALUES ($1, $2, $3, $4, 'BRANCH_TRANSFER_IN', $5, 0, $5, $6, $7, $8)`,
            [
              `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              businessId,
              prodId,
              current.dest_branch_id,
              qty,
              `Stock received from transfer ${id}`,
              id,
              req.user?.id,
            ]
          );
        }
      } else if (status === 'Cancelled') {
        // If cancelled, restore stock to source branch
        const itemsRes = await client.query(
          `SELECT product_id, quantity FROM branch_transfer_items WHERE transfer_id = $1`,
          [id]
        );

        for (const item of itemsRes.rows) {
          const qty = parseFloat(item.quantity) || 0;
          const prodId = item.product_id;

          await client.query(
            `UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2`,
            [qty, prodId]
          );

          await client.query(
            `INSERT INTO branch_inventory (id, business_id, branch_id, product_id, stock)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (branch_id, product_id)
             DO UPDATE SET stock = branch_inventory.stock + $5, updated_at = NOW()`,
            [
              `binv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              businessId,
              tRes.rows[0].source_branch_id || current.source_branch_id,
              prodId,
              qty,
            ]
          );

          await client.query(
            `INSERT INTO stock_movements (
              id, business_id, product_id, branch_id, movement_type, quantity,
              stock_before, stock_after, reason, reference_id, created_by
            ) VALUES ($1, $2, $3, $4, 'BRANCH_TRANSFER_CANCEL', $5, 0, $5, $6, $7, $8)`,
            [
              `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              businessId,
              prodId,
              tRes.rows[0].source_branch_id || current.source_branch_id,
              qty,
              `Stock restored from cancelled transfer ${id}`,
              id,
              req.user?.id,
            ]
          );
        }
      }

      await client.query(
        `UPDATE branch_transfers SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, id]
      );

      return { id, status };
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error updating transfer status:', error);
    return res.status(400).json({ error: 'UpdateFailed', message: error.message });
  }
});

export default router;

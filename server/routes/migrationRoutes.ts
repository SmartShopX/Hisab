import { Router, Response } from 'express';
import { transaction, query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// Safe transactional import of client localStorage/backup data into PostgreSQL
router.post('/import', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const backupData = req.body;

  if (!backupData || typeof backupData !== 'object') {
    return res.status(422).json({ error: 'ValidationError', message: 'Valid backup payload object required' });
  }

  const businessId = req.business?.id;
  const report = {
    productsImported: 0,
    customersImported: 0,
    suppliersImported: 0,
    ordersImported: 0,
    expensesImported: 0,
    errors: [] as string[],
  };

  try {
    await transaction(async (client) => {
      // 1. Import Products
      const products = backupData.products || backupData[`smartshopx_business_${businessId}_products`] || [];
      if (Array.isArray(products)) {
        for (const p of products) {
          if (!p.id || !p.name) continue;
          await client.query(
            `INSERT INTO products (
              id, business_id, name, category, brand, sku, barcode,
              purchase_price, selling_price, stock, min_stock_alert, unit, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                selling_price = EXCLUDED.selling_price,
                stock = EXCLUDED.stock,
                updated_at = NOW()`,
            [
              p.id,
              businessId,
              p.name,
              p.category || 'General',
              p.brand || '',
              p.sku || '',
              p.barcode || '',
              p.purchasePrice || 0,
              p.sellingPrice || 0,
              p.stock || 0,
              p.minStockAlert || 5,
              p.unit || 'pcs',
              p.image || '',
            ]
          );
          report.productsImported++;
        }
      }

      // 2. Import Customers
      const customers = backupData.customers || backupData[`smartshopx_business_${businessId}_customers`] || [];
      if (Array.isArray(customers)) {
        for (const c of customers) {
          if (!c.id || !c.name) continue;
          await client.query(
            `INSERT INTO customers (id, business_id, name, mobile, address, email, total_spent, total_due)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE
             SET name = EXCLUDED.name,
                 total_spent = EXCLUDED.total_spent,
                 total_due = EXCLUDED.total_due,
                 updated_at = NOW()`,
            [c.id, businessId, c.name, c.mobile || '', c.address || '', c.email || '', c.totalSpent || 0, c.totalDue || 0]
          );
          report.customersImported++;
        }
      }

      // 3. Import Suppliers
      const suppliers = backupData.suppliers || backupData[`smartshopx_business_${businessId}_suppliers`] || [];
      if (Array.isArray(suppliers)) {
        for (const s of suppliers) {
          if (!s.id || !s.name) continue;
          await client.query(
            `INSERT INTO suppliers (id, business_id, name, company, mobile, email, address, total_payable, total_paid)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE
             SET name = EXCLUDED.name,
                 total_payable = EXCLUDED.total_payable,
                 total_paid = EXCLUDED.total_paid,
                 updated_at = NOW()`,
            [
              s.id,
              businessId,
              s.name,
              s.company || '',
              s.mobile || '',
              s.email || '',
              s.address || '',
              s.totalPayable || 0,
              s.totalPaid || 0,
            ]
          );
          report.suppliersImported++;
        }
      }

      // 4. Import Orders
      const orders = backupData.orders || backupData[`smartshopx_business_${businessId}_orders`] || [];
      if (Array.isArray(orders)) {
        for (const o of orders) {
          if (!o.id) continue;
          await client.query(
            `INSERT INTO orders (
              id, business_id, order_number, customer_name, customer_phone,
              subtotal, discount, total, paid_amount, due_amount, payment_method, payment_status, order_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO NOTHING`,
            [
              o.id,
              businessId,
              o.orderNumber || 'ORD-' + o.id,
              o.customerName || 'Customer',
              o.customerPhone || '',
              o.subtotal || o.total || 0,
              o.discount || 0,
              o.total || 0,
              o.paidAmount || o.total || 0,
              o.dueAmount || 0,
              o.paymentMethod || 'cash',
              o.paymentStatus || 'paid',
              o.orderStatus || 'completed',
            ]
          );
          report.ordersImported++;
        }
      }
    });

    return res.json({
      success: true,
      message: 'Migration completed safely with full database transactional integrity',
      report,
    });
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    return res.status(500).json({ error: 'MigrationFailed', message: error.message });
  }
});

// Status of migration & database counts
router.get('/status', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const pRes = await query('SELECT COUNT(*) FROM products WHERE business_id = $1', [businessId]);
    const cRes = await query('SELECT COUNT(*) FROM customers WHERE business_id = $1', [businessId]);
    const sRes = await query('SELECT COUNT(*) FROM suppliers WHERE business_id = $1', [businessId]);
    const oRes = await query('SELECT COUNT(*) FROM orders WHERE business_id = $1', [businessId]);

    return res.json({
      businessId,
      databaseCounts: {
        products: parseInt(pRes.rows[0].count, 10),
        customers: parseInt(cRes.rows[0].count, 10),
        suppliers: parseInt(sRes.rows[0].count, 10),
        orders: parseInt(oRes.rows[0].count, 10),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;

import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// List customers
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const cRes = await query(
      `SELECT id, name, mobile, address, email,
              total_spent::float as "totalSpent",
              total_orders as "totalOrders",
              total_due::float as "totalDue",
              credit_limit::float as "creditLimit",
              created_at as "createdAt"
       FROM customers
       WHERE business_id = $1 AND is_active = true
       ORDER BY name ASC`,
      [req.business?.id]
    );
    return res.json(cRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Create customer
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { name, mobile, address, email, creditLimit = 0 } = req.body;
  if (!name) {
    return res.status(422).json({ error: 'ValidationError', message: 'Customer name is required' });
  }

  const customerId = 'cust_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  try {
    const created = await query(
      `INSERT INTO customers (id, business_id, name, mobile, address, email, credit_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, mobile, address, email, total_spent::float as "totalSpent", total_due::float as "totalDue"`,
      [customerId, req.business?.id, name, mobile || '', address || '', email || '', creditLimit]
    );
    return res.status(201).json(created.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Update customer
router.put('/:id', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { name, mobile, address, email, creditLimit } = req.body;
  try {
    const updated = await query(
      `UPDATE customers
       SET name = COALESCE($1, name),
           mobile = COALESCE($2, mobile),
           address = COALESCE($3, address),
           email = COALESCE($4, email),
           credit_limit = COALESCE($5, credit_limit),
           updated_at = NOW()
       WHERE id = $6 AND business_id = $7
       RETURNING id, name, mobile, address, email, total_spent::float as "totalSpent", total_due::float as "totalDue"`,
      [name, mobile, address, email, creditLimit, id, req.business?.id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'CustomerNotFound' });
    }

    return res.json(updated.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// GET /api/v1/customers/:id/ledger - Customer Ledger History & Running Balance
router.get('/:id/ledger', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const businessId = req.business?.id;

  try {
    const custRes = await query(
      `SELECT id, name, mobile, total_due::float as "totalDue", credit_limit::float as "creditLimit"
       FROM customers WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: 'CustomerNotFound', message: 'Customer not found' });
    }

    const ledgerRes = await query(
      `SELECT id, date, type, reference_id as "referenceId",
              debit::float as debit, credit::float as credit,
              balance::float as balance, notes, created_at as "createdAt"
       FROM customer_ledger
       WHERE customer_id = $1 AND business_id = $2
       ORDER BY date ASC, created_at ASC`,
      [id, businessId]
    );

    return res.json({
      customer: custRes.rows[0],
      entries: ledgerRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching customer ledger:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/customers/:id/adjustment - Add ledger adjustment (Debit / Credit)
router.post('/:id/adjustment', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { type, amount, notes, date } = req.body;
  const businessId = req.business?.id;

  const adjAmount = parseFloat(amount) || 0;
  if (adjAmount <= 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Valid adjustment amount required' });
  }

  const isDebit = type === 'Debit'; // increases customer due
  const debit = isDebit ? adjAmount : 0;
  const credit = isDebit ? 0 : adjAmount;

  try {
    const custRes = await query(
      `SELECT id, total_due::float as "totalDue" FROM customers WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: 'CustomerNotFound' });
    }

    const currentDue = custRes.rows[0].totalDue || 0;
    const newDue = isDebit ? currentDue + adjAmount : Math.max(0, currentDue - adjAmount);
    const effectiveDate = date || new Date().toISOString().split('T')[0];
    const adjId = `cadj_${Date.now()}`;

    // Update customer due
    await query(
      `UPDATE customers SET total_due = $1, updated_at = NOW() WHERE id = $2 AND business_id = $3`,
      [newDue, id, businessId]
    );

    // Insert ledger entry
    const entryRes = await query(
      `INSERT INTO customer_ledger (id, business_id, customer_id, date, type, reference_id, debit, credit, balance, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, date, type, reference_id as "referenceId", debit, credit, balance, notes`,
      [
        adjId,
        businessId,
        id,
        effectiveDate,
        isDebit ? 'Debit Adjustment' : 'Credit Adjustment',
        adjId,
        debit,
        credit,
        newDue,
        notes || 'Manual Ledger Adjustment',
      ]
    );

    return res.status(201).json({
      success: true,
      currentDue: newDue,
      entry: entryRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating customer adjustment:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;

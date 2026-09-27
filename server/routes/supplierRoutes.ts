import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// List suppliers
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const sRes = await query(
      `SELECT id, name, company, mobile, email, address,
              total_payable::float as "totalPayable",
              total_paid::float as "totalPaid",
              created_at as "createdAt"
       FROM suppliers
       WHERE business_id = $1 AND is_active = true
       ORDER BY name ASC`,
      [req.business?.id]
    );
    return res.json(sRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Create supplier
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { name, company, mobile, email, address, totalPayable = 0 } = req.body;
  if (!name) {
    return res.status(422).json({ error: 'ValidationError', message: 'Supplier name is required' });
  }

  const supplierId = 'sup_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  try {
    const created = await query(
      `INSERT INTO suppliers (id, business_id, name, company, mobile, email, address, total_payable)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, company, mobile, email, address, total_payable::float as "totalPayable"`,
      [supplierId, req.business?.id, name, company || '', mobile || '', email || '', address || '', totalPayable]
    );
    return res.status(201).json(created.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// GET /api/v1/suppliers/:id/ledger - Supplier Ledger & Running Balance
router.get('/:id/ledger', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const businessId = req.business?.id;

  try {
    const supRes = await query(
      `SELECT id, name, company, mobile, total_payable::float as "totalPayable", total_paid::float as "totalPaid"
       FROM suppliers WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (supRes.rows.length === 0) {
      return res.status(404).json({ error: 'SupplierNotFound', message: 'Supplier not found' });
    }

    const ledgerRes = await query(
      `SELECT id, date, type, reference_id as "referenceId",
              debit::float as debit, credit::float as credit,
              balance::float as balance, notes, created_at as "createdAt"
       FROM supplier_ledger
       WHERE supplier_id = $1 AND business_id = $2
       ORDER BY date ASC, created_at ASC`,
      [id, businessId]
    );

    return res.json({
      supplier: supRes.rows[0],
      entries: ledgerRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching supplier ledger:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/suppliers/:id/pay - Pay supplier due with atomic transaction & ledger
router.post('/:id/pay', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { amount, paymentMethod = 'Bank', notes } = req.body;
  const businessId = req.business?.id;

  const payAmount = parseFloat(amount) || 0;
  if (payAmount <= 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Valid payment amount required' });
  }

  try {
    const supRes = await query(
      `SELECT id, name, company, total_payable::float as "totalPayable", total_paid::float as "totalPaid"
       FROM suppliers WHERE id = $1 AND business_id = $2 FOR UPDATE`,
      [id, businessId]
    );

    if (supRes.rows.length === 0) {
      return res.status(404).json({ error: 'SupplierNotFound' });
    }

    const currentPayable = supRes.rows[0].totalPayable || 0;
    const currentPaid = supRes.rows[0].totalPaid || 0;
    const newPayable = Math.max(0, currentPayable - payAmount);
    const newPaid = currentPaid + payAmount;
    const effectiveDate = new Date().toISOString().split('T')[0];
    const txnId = `pay_sup_${Date.now()}`;

    // Update supplier totals
    await query(
      `UPDATE suppliers SET total_payable = $1, total_paid = $2, updated_at = NOW() WHERE id = $3`,
      [newPayable, newPaid, id]
    );

    // Insert payment record
    await query(
      `INSERT INTO payments (
        id, business_id, transaction_number, payment_type, method, amount,
        supplier_id, reference_note, created_by
      ) VALUES ($1, $2, $3, 'Supplier Due Pay', $4, $5, $6, $7, $8)`,
      [
        txnId,
        businessId,
        `TXN-SUP-${Date.now().toString().slice(-6)}`,
        paymentMethod,
        payAmount,
        id,
        notes || 'Supplier due payment',
        req.user?.id,
      ]
    );

    // Insert supplier ledger entry
    const entryRes = await query(
      `INSERT INTO supplier_ledger (
        id, business_id, supplier_id, date, type, reference_id, debit, credit, balance, notes
      ) VALUES ($1, $2, $3, $4, 'Payment', $5, $6, 0, $7, $8)
      RETURNING id, date, type, reference_id as "referenceId", debit, credit, balance, notes`,
      [
        `sled_${Date.now()}`,
        businessId,
        id,
        effectiveDate,
        txnId,
        payAmount, // debit reduces payable liability
        newPayable,
        notes || 'Supplier payment voucher',
      ]
    );

    return res.json({
      success: true,
      currentPayable: newPayable,
      totalPaid: newPaid,
      entry: entryRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error paying supplier:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;

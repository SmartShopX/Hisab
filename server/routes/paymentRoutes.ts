import { Router, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// List payments
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const pRes = await query(
      `SELECT id, transaction_number as "transactionNumber",
              payment_type as "paymentType", method, amount::float as amount,
              customer_id as "customerId", supplier_id as "supplierId", order_id as "orderId",
              status, reference_note as "referenceNote", created_at as "createdAt"
       FROM payments
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.business?.id]
    );
    return res.json(pRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Record new payment / due repayment
router.post('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { paymentType, method, amount, customerId, supplierId, orderId, referenceNote } = req.body;

  if (!paymentType || !method || !amount || amount <= 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Valid payment type, method, and amount required' });
  }

  const paymentId = 'pay_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const txnNumber = 'TXN-' + Date.now().toString().slice(-8);

  try {
    const result = await transaction(async (client) => {
      // 1. Insert payment record
      const insertRes = await client.query(
        `INSERT INTO payments (
          id, business_id, transaction_number, payment_type, method,
          amount, customer_id, supplier_id, order_id, reference_note, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          paymentId,
          req.business?.id,
          txnNumber,
          paymentType,
          method,
          amount,
          customerId || null,
          supplierId || null,
          orderId || null,
          referenceNote || '',
          req.user?.id,
        ]
      );

      // 2. Adjust customer due and customer ledger if CustomerPayment
      if (customerId && (paymentType === 'CustomerDuePayment' || paymentType === 'CustomerPayment')) {
        const custRes = await client.query(
          `SELECT id, total_due::float as "totalDue" FROM customers WHERE id = $1 AND business_id = $2 FOR UPDATE`,
          [customerId, req.business?.id]
        );

        if (custRes.rows.length > 0) {
          const currentDue = custRes.rows[0].totalDue || 0;
          const newDue = Math.max(0, currentDue - amount);

          await client.query(
            `UPDATE customers
             SET total_due = $1, updated_at = NOW()
             WHERE id = $2 AND business_id = $3`,
            [newDue, customerId, req.business?.id]
          );

          await client.query(
            `INSERT INTO customer_ledger (
              id, business_id, customer_id, date, type, reference_id, debit, credit, balance, notes
            ) VALUES ($1, $2, $3, CURRENT_DATE, 'Due Collection', $4, 0, $5, $6, $7)`,
            [
              `cleg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              req.business?.id,
              customerId,
              paymentId,
              amount,
              newDue,
              referenceNote || `Due collection (${method})`,
            ]
          );
        }
      }

      // 3. Adjust supplier payable and supplier ledger if SupplierPayment
      if (supplierId && (paymentType === 'SupplierPayment' || paymentType === 'SupplierDuePayment')) {
        const supRes = await client.query(
          `SELECT id, total_payable::float as "totalPayable", total_paid::float as "totalPaid"
           FROM suppliers WHERE id = $1 AND business_id = $2 FOR UPDATE`,
          [supplierId, req.business?.id]
        );

        if (supRes.rows.length > 0) {
          const currentPayable = supRes.rows[0].totalPayable || 0;
          const currentPaid = supRes.rows[0].totalPaid || 0;
          const newPayable = Math.max(0, currentPayable - amount);
          const newPaid = currentPaid + amount;

          await client.query(
            `UPDATE suppliers
             SET total_paid = $1,
                 total_payable = $2,
                 updated_at = NOW()
             WHERE id = $3 AND business_id = $4`,
            [newPaid, newPayable, supplierId, req.business?.id]
          );

          await client.query(
            `INSERT INTO supplier_ledger (
              id, business_id, supplier_id, date, type, reference_id, debit, credit, balance, notes
            ) VALUES ($1, $2, $3, CURRENT_DATE, 'Supplier Payment', $4, $5, 0, $6, $7)`,
            [
              `sled_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              req.business?.id,
              supplierId,
              paymentId,
              amount,
              newPayable,
              referenceNote || `Supplier payment (${method})`,
            ]
          );
        }
      }

      // 4. Synchronize order if orderId provided
      if (orderId) {
        const oRes = await client.query(
          `SELECT id, total::float as total, paid_amount::float as "paidAmount"
           FROM orders WHERE id = $1 AND business_id = $2 FOR UPDATE`,
          [orderId, req.business?.id]
        );

        if (oRes.rows.length > 0) {
          const ord = oRes.rows[0];
          const newPaid = ord.paidAmount + amount;
          const newDue = Math.max(0, ord.total - newPaid);
          const newPaymentStatus = newDue === 0 ? 'paid' : 'partial';

          await client.query(
            `UPDATE orders
             SET paid_amount = $1, due_amount = $2, payment_status = $3, updated_at = NOW()
             WHERE id = $4`,
            [newPaid, newDue, newPaymentStatus, orderId]
          );
        }
      }

      return insertRes.rows[0];
    });

    return res.status(201).json({
      id: result.id,
      transactionNumber: result.transaction_number,
      paymentType: result.payment_type,
      method: result.method,
      amount: parseFloat(result.amount),
      status: result.status,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;

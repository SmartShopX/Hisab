import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { devStore } from '../database/devStore.js';

const router = Router();

// List personal transactions (Strict user-level isolation, 0 business leakage)
router.get('/transactions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const tRes = await query(
      `SELECT id, type, category, amount::float as amount,
              payment_method as "paymentMethod", date, note, created_at as "createdAt"
       FROM personal_transactions
       WHERE user_id = $1
       ORDER BY date DESC, created_at DESC`,
      [req.user?.id]
    );
    return res.json(tRes.rows);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const filtered = devStore.personalTransactions.filter((t) => t.userId === req.user?.id);
      return res.json(filtered);
    }
    return res.status(503).json({ error: 'DatabaseUnavailable', message: 'PostgreSQL database is currently unreachable' });
  }
});

// Record personal transaction
router.post('/transactions', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { type, category, amount, paymentMethod = 'cash', date, note } = req.body;

  if (!type || !category || !amount || amount <= 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Valid type, category, and amount required' });
  }

  const txnId = 'ptxn_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  try {
    const created = await query(
      `INSERT INTO personal_transactions (id, user_id, type, category, amount, payment_method, date, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, type, category, amount::float as amount, payment_method as "paymentMethod", date, note`,
      [txnId, req.user?.id, type, category, amount, paymentMethod, date || new Date().toISOString().slice(0, 10), note || '']
    );
    return res.status(201).json(created.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// List personal dues
router.get('/dues', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const dRes = await query(
      `SELECT id, person_name as "personName", mobile, type, amount::float as amount,
              due_date as "dueDate", notes, status, created_at as "createdAt"
       FROM personal_dues
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user?.id]
    );
    return res.json(dRes.rows);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Record personal due
router.post('/dues', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { personName, mobile, type, amount, dueDate, notes } = req.body;

  if (!personName || !type || !amount || amount <= 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'Valid person name, type, and amount required' });
  }

  const dueId = 'pdue_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  try {
    const created = await query(
      `INSERT INTO personal_dues (id, user_id, person_name, mobile, type, amount, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, person_name as "personName", mobile, type, amount::float as amount, due_date as "dueDate", notes, status`,
      [dueId, req.user?.id, personName, mobile || '', type, amount, dueDate || null, notes || '']
    );
    return res.status(201).json(created.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;

import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// GET /api/v1/telecom/imei - List IMEI records
router.get('/imei', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const { status = '', search = '', productId = '' } = req.query;

    const params: any[] = [businessId];
    let whereClauses = 'WHERE t.business_id = $1';

    if (status && typeof status === 'string' && status !== 'all') {
      params.push(status);
      whereClauses += ` AND t.status = $${params.length}`;
    }

    if (productId && typeof productId === 'string') {
      params.push(productId);
      whereClauses += ` AND t.product_id = $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClauses += ` AND (LOWER(t.imei_serial) LIKE $${params.length} OR LOWER(p.name) LIKE $${params.length})`;
    }

    const listQuery = `
      SELECT t.id, t.product_id as "productId", p.name as "productName",
             t.imei_serial as "imeiSerial", t.imei_2 as "imei2",
             t.purchase_id as "purchaseId", t.sale_id as "saleId",
             t.customer_id as "customerId",
             t.warranty_months as "warrantyMonths",
             t.warranty_expiry as "warrantyExpiry",
             t.status, t.created_at as "createdAt"
      FROM telecom_imei_records t
      JOIN products p ON t.product_id = p.id
      ${whereClauses}
      ORDER BY t.created_at DESC
      LIMIT 100
    `;

    const resList = await query(listQuery, params);
    return res.json(resList.rows);
  } catch (error: any) {
    console.error('Error fetching telecom IMEI records:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/telecom/imei - Register new IMEI / serial units
router.post('/imei', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { productId, imeiSerial, imei2, warrantyMonths = 12, purchaseId } = req.body;

  if (!productId || !imeiSerial) {
    return res.status(422).json({ error: 'ValidationError', message: 'Product ID and IMEI/Serial are required' });
  }

  const businessId = req.business?.id;
  const imeiId = `imei_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Calculate warranty expiry date
  const now = new Date();
  const expiryDate = new Date(now.setMonth(now.getMonth() + parseInt(warrantyMonths, 10)));
  const expiryStr = expiryDate.toISOString().split('T')[0];

  try {
    const result = await query(
      `INSERT INTO telecom_imei_records (
        id, business_id, product_id, imei_serial, imei_2, purchase_id,
        warranty_months, warranty_expiry, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'In_Stock')
      RETURNING id, product_id as "productId", imei_serial as "imeiSerial",
                imei_2 as "imei2", warranty_months as "warrantyMonths",
                warranty_expiry as "warrantyExpiry", status, created_at as "createdAt"`,
      [
        imeiId,
        businessId,
        productId,
        imeiSerial.trim(),
        imei2 ? imei2.trim() : null,
        purchaseId || null,
        parseInt(warrantyMonths, 10) || 12,
        expiryStr,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error registering IMEI:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// PUT /api/v1/telecom/imei/:id/sell - Link sold IMEI to customer and order
router.put('/imei/:id/sell', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { saleId, customerId } = req.body;
  const businessId = req.business?.id;

  try {
    const updated = await query(
      `UPDATE telecom_imei_records
       SET status = 'Sold',
           sale_id = $1,
           customer_id = $2,
           updated_at = NOW()
       WHERE id = $3 AND business_id = $4
       RETURNING id, imei_serial as "imeiSerial", status, sale_id as "saleId",
                 customer_id as "customerId", warranty_expiry as "warrantyExpiry"`,
      [saleId || null, customerId || null, id, businessId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'NotFound', message: 'IMEI record not found' });
    }

    return res.json(updated.rows[0]);
  } catch (error: any) {
    console.error('Error updating IMEI sale status:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// GET /api/v1/telecom/repairs - List device servicing tickets
router.get('/repairs', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const { status = '', search = '' } = req.query;

    const params: any[] = [businessId];
    let where = 'WHERE r.business_id = $1';

    if (status && typeof status === 'string' && status !== 'all') {
      params.push(status);
      where += ` AND r.status = $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      where += ` AND (LOWER(r.ticket_number) LIKE $${params.length} OR LOWER(r.customer_name) LIKE $${params.length} OR r.customer_mobile LIKE $${params.length} OR LOWER(r.device_model) LIKE $${params.length})`;
    }

    const listQuery = `
      SELECT r.id, r.ticket_number as "ticketNumber",
             r.customer_name as "customerName", r.customer_mobile as "customerMobile",
             r.device_brand as "deviceBrand", r.device_model as "deviceModel",
             r.imei_serial as "imeiSerial", r.problem_desc as "problemDesc",
             r.estimated_cost::float as "estimatedCost", r.advance_paid::float as "advancePaid",
             r.actual_cost::float as "actualCost", r.final_paid::float as "finalPaid",
             r.due_amount::float as "dueAmount", r.status,
             r.received_date as "receivedDate", r.delivered_date as "deliveredDate",
             r.technician_name as "technicianName", r.notes, r.branch_id as "branchId",
             r.created_at as "createdAt"
      FROM telecom_repairs r
      ${where}
      ORDER BY r.created_at DESC
      LIMIT 100
    `;

    const resList = await query(listQuery, params);
    return res.json(resList.rows);
  } catch (error: any) {
    console.error('Error fetching repairs:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/telecom/repairs - Create new device repair ticket
router.post('/repairs', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const {
    customerName,
    customerMobile,
    deviceBrand,
    deviceModel,
    imeiSerial,
    problemDesc,
    estimatedCost = 0,
    advancePaid = 0,
    technicianName,
    branchId,
    notes,
  } = req.body;

  if (!customerName || !customerMobile || !deviceModel || !problemDesc) {
    return res.status(422).json({
      error: 'ValidationError',
      message: 'Customer name, phone, device model, and problem description are required',
    });
  }

  const businessId = req.business?.id;
  const ticketId = `rep_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
  const ticketNumber = `JOB-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

  const estCost = parseFloat(estimatedCost) || 0;
  const advPaid = parseFloat(advancePaid) || 0;
  const dueAmt = Math.max(0, estCost - advPaid);

  try {
    const result = await query(
      `INSERT INTO telecom_repairs (
        id, business_id, branch_id, ticket_number, customer_name, customer_mobile,
        device_brand, device_model, imei_serial, problem_desc, estimated_cost,
        advance_paid, actual_cost, due_amount, status, technician_name, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $11, $13, 'Pending', $14, $15, $16)
      RETURNING id, ticket_number as "ticketNumber", customer_name as "customerName",
                customer_mobile as "customerMobile", device_brand as "deviceBrand",
                device_model as "deviceModel", status, estimated_cost::float as "estimatedCost",
                advance_paid::float as "advancePaid", due_amount::float as "dueAmount",
                received_date as "receivedDate"`,
      [
        ticketId,
        businessId,
        branchId || null,
        ticketNumber,
        customerName.trim(),
        customerMobile.trim(),
        deviceBrand ? deviceBrand.trim() : 'Generic',
        deviceModel.trim(),
        imeiSerial ? imeiSerial.trim() : null,
        problemDesc.trim(),
        estCost,
        advPaid,
        dueAmt,
        technicianName || '',
        notes || '',
        req.user?.id,
      ]
    );

    // If advance paid > 0, record in payments
    if (advPaid > 0) {
      await query(
        `INSERT INTO payments (id, business_id, branch_id, transaction_number, payment_type, method, amount, reference_note, created_by)
         VALUES ($1, $2, $3, $4, 'Repair Advance', 'Cash', $5, $6, $7)`,
        [
          `pay_${Date.now()}`,
          businessId,
          branchId || null,
          `TXN-REP-${Date.now().toString().slice(-6)}`,
          advPaid,
          `Advance payment for repair ticket ${ticketNumber}`,
          req.user?.id,
        ]
      );
    }

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating repair ticket:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// PUT /api/v1/telecom/repairs/:id/status - Update repair ticket status & handle delivery payment
router.put('/repairs/:id/status', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { status, actualCost, paymentAmount = 0, paymentMethod = 'Cash', notes } = req.body;
  const businessId = req.business?.id;

  try {
    const repRes = await query(
      `SELECT id, ticket_number, customer_name, customer_mobile,
              advance_paid::float as "advancePaid",
              estimated_cost::float as "estimatedCost",
              status as "currentStatus", branch_id
       FROM telecom_repairs WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (repRes.rows.length === 0) {
      return res.status(404).json({ error: 'RepairNotFound', message: 'Repair ticket not found' });
    }

    const ticket = repRes.rows[0];
    const finalCost = actualCost !== undefined ? parseFloat(actualCost) : ticket.estimatedCost;
    const additionalPaid = parseFloat(paymentAmount) || 0;
    const totalPaid = ticket.advancePaid + additionalPaid;
    const dueAmount = Math.max(0, finalCost - totalPaid);

    const deliveredDate = status === 'Delivered' ? new Date().toISOString().split('T')[0] : null;

    const updated = await query(
      `UPDATE telecom_repairs
       SET status = COALESCE($1, status),
           actual_cost = $2,
           final_paid = $3,
           due_amount = $4,
           delivered_date = COALESCE($5, delivered_date),
           notes = COALESCE($6, notes),
           updated_at = NOW()
       WHERE id = $7 AND business_id = $8
       RETURNING id, ticket_number as "ticketNumber", status,
                 actual_cost::float as "actualCost", final_paid::float as "finalPaid",
                 due_amount::float as "dueAmount", delivered_date as "deliveredDate"`,
      [
        status || null,
        finalCost,
        totalPaid,
        dueAmount,
        deliveredDate,
        notes || null,
        id,
        businessId,
      ]
    );

    // Record delivery payment if additional paid > 0
    if (additionalPaid > 0) {
      await query(
        `INSERT INTO payments (id, business_id, branch_id, transaction_number, payment_type, method, amount, reference_note, created_by)
         VALUES ($1, $2, $3, $4, 'Repair Final Pay', $5, $6, $7, $8)`,
        [
          `pay_${Date.now()}`,
          businessId,
          ticket.branch_id || null,
          `TXN-REP-${Date.now().toString().slice(-6)}`,
          paymentMethod,
          additionalPaid,
          `Final delivery payment for repair ${ticket.ticket_number}`,
          req.user?.id,
        ]
      );
    }

    return res.json(updated.rows[0]);
  } catch (error: any) {
    console.error('Error updating repair ticket:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// GET /api/v1/telecom/transactions - List MFS transactions
router.get('/transactions', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const { provider = '', type = '' } = req.query;

    const params: any[] = [businessId];
    let where = 'WHERE t.business_id = $1';

    if (provider && typeof provider === 'string' && provider !== 'all') {
      params.push(provider);
      where += ` AND t.provider = $${params.length}`;
    }

    if (type && typeof type === 'string' && type !== 'all') {
      params.push(type);
      where += ` AND t.type = $${params.length}`;
    }

    const listQuery = `
      SELECT t.id, t.provider, t.type, t.customer_number as "customerNumber",
             t.amount::float as amount, t.fee::float as fee,
             t.commission::float as commission, t.status, t.trx_id as "trxId",
             t.notes, t.branch_id as "branchId", t.created_at as "createdAt"
      FROM telecom_transactions t
      ${where}
      ORDER BY t.created_at DESC
      LIMIT 100
    `;

    const resList = await query(listQuery, params);
    return res.json(resList.rows);
  } catch (error: any) {
    console.error('Error fetching telecom transactions:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/telecom/transactions - Record MFS transaction
router.post('/transactions', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { provider, type, customerNumber, amount, fee = 0, commission = 0, trxId, notes, branchId } = req.body;

  if (!provider || !type || !customerNumber || !amount || parseFloat(amount) <= 0) {
    return res.status(422).json({
      error: 'ValidationError',
      message: 'Provider, transaction type, customer phone number, and valid amount are required',
    });
  }

  const businessId = req.business?.id;
  const tId = `tt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await query(
      `INSERT INTO telecom_transactions (
        id, business_id, branch_id, provider, type, customer_number,
        amount, fee, commission, status, trx_id, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Success', $10, $11, $12)
      RETURNING id, provider, type, customer_number as "customerNumber",
                amount::float as amount, fee::float as fee,
                commission::float as commission, status, trx_id as "trxId",
                created_at as "createdAt"`,
      [
        tId,
        businessId,
        branchId || null,
        provider,
        type,
        customerNumber.trim(),
        parseFloat(amount),
        parseFloat(fee) || 0,
        parseFloat(commission) || 0,
        trxId || `TXN-${Date.now().toString().slice(-8)}`,
        notes || '',
        req.user?.id,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const devTrx = {
        id: tId,
        provider,
        type,
        customerNumber: customerNumber.trim(),
        amount: parseFloat(amount),
        fee: parseFloat(fee) || 0,
        commission: parseFloat(commission) || 0,
        status: 'Success',
        trxId: trxId || `TXN-${Date.now().toString().slice(-8)}`,
        createdAt: new Date().toISOString(),
      };
      return res.status(201).json(devTrx);
    }
    console.error('Error recording telecom transaction:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// GET /api/v1/telecom/closings - List daily closings
router.get('/closings', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const listRes = await query(
      `SELECT id, closing_date as "closingDate",
              opening_cash::float as "openingCash",
              system_sales_total::float as "systemSalesTotal",
              mfs_cashin_total::float as "mfsCashinTotal",
              mfs_cashout_total::float as "mfsCashoutTotal",
              mfs_commission_total::float as "mfsCommissionTotal",
              repairs_income_total::float as "repairsIncomeTotal",
              expenses_total::float as "expensesTotal",
              expected_closing_cash::float as "expectedClosingCash",
              actual_physical_cash::float as "actualPhysicalCash",
              cash_discrepancy::float as "cashDiscrepancy",
              status, notes, branch_id as "branchId", created_at as "createdAt"
       FROM telecom_daily_closings
       WHERE business_id = $1
       ORDER BY closing_date DESC, created_at DESC
       LIMIT 50`,
      [businessId]
    );

    return res.json(listRes.rows);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      return res.json([]);
    }
    console.error('Error fetching daily closings:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/telecom/closings - Record authoritative daily closing & reconciliation
router.post('/closings', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const {
    closingDate,
    openingCash = 0,
    actualPhysicalCash = 0,
    notes,
    branchId,
  } = req.body;

  const businessId = req.business?.id;
  const effectiveDate = closingDate || new Date().toISOString().split('T')[0];
  const cOpening = parseFloat(openingCash) || 0;
  const cPhysical = parseFloat(actualPhysicalCash) || 0;

  try {
    // 1. Authoritatively compute system totals for the day
    // Sales Cash
    const salesRes = await query(
      `SELECT COALESCE(SUM(paid_amount), 0)::float as total
       FROM orders
       WHERE business_id = $1 AND DATE(created_at) = $2 AND payment_method = 'cash'`,
      [businessId, effectiveDate]
    );
    const systemSalesTotal = salesRes.rows[0]?.total || 0;

    // MFS CashIn & CashOut
    const mfsInRes = await query(
      `SELECT COALESCE(SUM(amount), 0)::float as total, COALESCE(SUM(commission), 0)::float as comm
       FROM telecom_transactions
       WHERE business_id = $1 AND DATE(created_at) = $2 AND type = 'CashIn'`,
      [businessId, effectiveDate]
    );
    const mfsCashinTotal = mfsInRes.rows[0]?.total || 0;

    const mfsOutRes = await query(
      `SELECT COALESCE(SUM(amount), 0)::float as total, COALESCE(SUM(commission), 0)::float as comm
       FROM telecom_transactions
       WHERE business_id = $1 AND DATE(created_at) = $2 AND type = 'CashOut'`,
      [businessId, effectiveDate]
    );
    const mfsCashoutTotal = mfsOutRes.rows[0]?.total || 0;
    const mfsCommissionTotal = (mfsInRes.rows[0]?.comm || 0) + (mfsOutRes.rows[0]?.comm || 0);

    // Repairs Cash Income
    const repairsRes = await query(
      `SELECT COALESCE(SUM(amount), 0)::float as total
       FROM payments
       WHERE business_id = $1 AND DATE(created_at) = $2 AND payment_type LIKE 'Repair%'`,
      [businessId, effectiveDate]
    );
    const repairsIncomeTotal = repairsRes.rows[0]?.total || 0;

    // Expenses Cash
    const expRes = await query(
      `SELECT COALESCE(SUM(amount), 0)::float as total
       FROM expenses
       WHERE business_id = $1 AND (date = $2 OR DATE(created_at) = $2) AND payment_method = 'cash'`,
      [businessId, effectiveDate]
    );
    const expensesTotal = expRes.rows[0]?.total || 0;

    // Reconciliation Formula:
    // Opening Cash + POS Sales (Cash) + CashIn (received from customer) - CashOut (given to customer) + Repairs Income - Expenses
    const expectedClosingCash = parseFloat(
      (cOpening + systemSalesTotal + mfsCashinTotal - mfsCashoutTotal + repairsIncomeTotal - expensesTotal).toFixed(2)
    );
    const cashDiscrepancy = parseFloat((cPhysical - expectedClosingCash).toFixed(2));

    let status: 'Balanced' | 'Excess' | 'Short' = 'Balanced';
    if (cashDiscrepancy > 1) {
      status = 'Excess';
    } else if (cashDiscrepancy < -1) {
      status = 'Short';
    }

    const closingId = `tc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const result = await query(
      `INSERT INTO telecom_daily_closings (
        id, business_id, branch_id, closing_date, opening_cash, system_sales_total,
        mfs_cashin_total, mfs_cashout_total, mfs_commission_total, repairs_income_total,
        expenses_total, expected_closing_cash, actual_physical_cash, cash_discrepancy,
        status, notes, reconciled_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, closing_date as "closingDate", opening_cash::float as "openingCash",
                system_sales_total::float as "systemSalesTotal",
                mfs_cashin_total::float as "mfsCashinTotal",
                mfs_cashout_total::float as "mfsCashoutTotal",
                mfs_commission_total::float as "mfsCommissionTotal",
                repairs_income_total::float as "repairsIncomeTotal",
                expenses_total::float as "expensesTotal",
                expected_closing_cash::float as "expectedClosingCash",
                actual_physical_cash::float as "actualPhysicalCash",
                cash_discrepancy::float as "cashDiscrepancy",
                status, notes, created_at as "createdAt"`,
      [
        closingId,
        businessId,
        branchId || null,
        effectiveDate,
        cOpening,
        systemSalesTotal,
        mfsCashinTotal,
        mfsCashoutTotal,
        mfsCommissionTotal,
        repairsIncomeTotal,
        expensesTotal,
        expectedClosingCash,
        cPhysical,
        cashDiscrepancy,
        status,
        notes || '',
        req.user?.id,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating daily closing:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;

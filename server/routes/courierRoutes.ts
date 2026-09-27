import { Router, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';

const router = Router();

// GET /api/v1/courier/shipments - List shipments with tenant isolation & pagination
router.get('/shipments', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  try {
    const businessId = req.business?.id;
    const {
      page = '1',
      limit = '50',
      search = '',
      status = '',
      provider = '',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const params: any[] = [businessId];
    let whereClauses = 'WHERE s.business_id = $1';

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClauses += ` AND (LOWER(s.tracking_code) LIKE $${params.length} OR LOWER(s.customer_name) LIKE $${params.length} OR s.customer_phone LIKE $${params.length})`;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      params.push(status);
      whereClauses += ` AND s.status = $${params.length}`;
    }

    if (provider && typeof provider === 'string' && provider !== 'all') {
      params.push(provider);
      whereClauses += ` AND s.provider = $${params.length}`;
    }

    const countRes = await query(`SELECT COUNT(*) as total FROM shipments s ${whereClauses}`, params);
    const totalRecords = parseInt(countRes.rows[0]?.total || '0', 10);

    const listQuery = `
      SELECT s.id, s.consignment_id as "consignmentId",
             s.provider, s.tracking_code as "trackingCode",
             s.customer_name as "customerName", s.customer_phone as "customerPhone",
             s.delivery_address as "deliveryAddress", s.delivery_zone as "deliveryZone",
             s.cod_amount::float as "codAmount", s.delivery_charge::float as "deliveryCharge",
             s.status, s.driver_name as "driverName", s.driver_phone as "driverPhone",
             s.vehicle_info as "vehicleInfo", s.route, s.otp_pod_code as "otpPodCode",
             s.settlement_status as "settlementStatus",
             s.settlement_amount::float as "settlementAmount",
             s.order_id as "orderId", s.notes, s.created_at as "createdAt"
      FROM shipments s
      ${whereClauses}
      ORDER BY s.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limitNum, offset);
    const listRes = await query(listQuery, params);

    return res.json({
      data: listRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching shipments:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/courier/shipments - Create a new shipment consignment
router.post('/shipments', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const {
    orderId,
    provider = 'Steadfast',
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryZone = 'Inside Dhaka',
    codAmount = 0,
    deliveryCharge = 70,
    driverName,
    driverPhone,
    vehicleInfo,
    route,
    notes,
  } = req.body;

  if (!customerName || !customerPhone || !deliveryAddress) {
    return res.status(422).json({
      error: 'ValidationError',
      message: 'Customer name, phone, and delivery address are required',
    });
  }

  const businessId = req.business?.id;
  const shipmentId = `shp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const consignmentId = `CN-${provider.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const trackingCode = `${provider.slice(0, 2).toUpperCase()}${Math.floor(1000000 + Math.random() * 9000000)}`;
  const otpPodCode = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit proof of delivery OTP

  try {
    const result = await query(
      `INSERT INTO shipments (
        id, business_id, order_id, consignment_id, provider, tracking_code,
        customer_name, customer_phone, delivery_address, delivery_zone,
        cod_amount, delivery_charge, status, driver_name, driver_phone,
        vehicle_info, route, otp_pod_code, settlement_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending', $13, $14, $15, $16, $17, 'Unsettled', $18)
      RETURNING id, consignment_id as "consignmentId", provider, tracking_code as "trackingCode",
                customer_name as "customerName", customer_phone as "customerPhone",
                delivery_address as "deliveryAddress", delivery_zone as "deliveryZone",
                cod_amount::float as "codAmount", delivery_charge::float as "deliveryCharge",
                status, otp_pod_code as "otpPodCode", settlement_status as "settlementStatus",
                created_at as "createdAt"`,
      [
        shipmentId,
        businessId,
        orderId || null,
        consignmentId,
        provider,
        trackingCode,
        customerName.trim(),
        customerPhone.trim(),
        deliveryAddress.trim(),
        deliveryZone,
        parseFloat(codAmount) || 0,
        parseFloat(deliveryCharge) || 0,
        driverName || '',
        driverPhone || '',
        vehicleInfo || '',
        route || '',
        otpPodCode,
        notes || '',
      ]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, business_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, 'SHIPMENT_CREATED', 'shipment', $4, $5)`,
      [
        `aud_${Date.now()}`,
        req.user?.id,
        businessId,
        shipmentId,
        JSON.stringify({ trackingCode, provider, customerName, codAmount }),
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const devShipment = {
        id: shipmentId,
        businessId,
        orderId: orderId || null,
        consignmentId,
        provider,
        trackingCode,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryZone,
        codAmount: parseFloat(codAmount) || 0,
        deliveryCharge: parseFloat(deliveryCharge) || 0,
        status: 'Pending',
        otpPodCode,
        settlementStatus: 'Unsettled',
        createdAt: new Date().toISOString(),
      };
      return res.status(201).json(devShipment);
    }
    console.error('Error creating shipment:', error);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// PUT /api/v1/courier/shipments/:id/status - Update shipment status and COD settlement with financial synchronization
router.put('/shipments/:id/status', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { status, settlementStatus, settlementAmount, otpEntered } = req.body;
  const businessId = req.business?.id;

  try {
    const syncResult = await transaction(async (client) => {
      const sRes = await client.query(
        `SELECT id, order_id, provider, tracking_code, otp_pod_code,
                cod_amount::float as "codAmount", status as "currentStatus",
                settlement_status as "currentSettlementStatus",
                branch_id
         FROM shipments
         WHERE id = $1 AND business_id = $2
         FOR UPDATE`,
        [id, businessId]
      );

      if (sRes.rows.length === 0) {
        throw new Error('Shipment record not found');
      }

      const shipment = sRes.rows[0];

      // If attempting delivery verification via OTP
      if (status === 'Delivered' && otpEntered) {
        if (otpEntered.trim() !== shipment.otp_pod_code) {
          throw new Error('Proof of Delivery (OTP) does not match');
        }
      }

      const newStatus = status || shipment.currentStatus;
      const newSettlementStatus = settlementStatus || shipment.currentSettlementStatus;
      const finalSettlementAmount = settlementAmount !== undefined ? parseFloat(settlementAmount) : shipment.codAmount;

      // Update shipment record
      const updateRes = await client.query(
        `UPDATE shipments
         SET status = $1,
             settlement_status = $2,
             settlement_amount = $3,
             updated_at = NOW()
         WHERE id = $4 AND business_id = $5
         RETURNING id, consignment_id as "consignmentId", provider, tracking_code as "trackingCode",
                   status, settlement_status as "settlementStatus",
                   settlement_amount::float as "settlementAmount", updated_at as "updatedAt"`,
        [
          newStatus,
          newSettlementStatus,
          finalSettlementAmount,
          id,
          businessId,
        ]
      );

      // Financial & Operational Synchronization with Order
      if (shipment.order_id) {
        const orderRes = await client.query(
          `SELECT id, order_number, customer_id, total::float as total,
                  paid_amount::float as "paidAmount", due_amount::float as "dueAmount"
           FROM orders
           WHERE id = $1 AND business_id = $2
           FOR UPDATE`,
          [shipment.order_id, businessId]
        );

        if (orderRes.rows.length > 0) {
          const order = orderRes.rows[0];

          // 1. If delivered or COD settled, record COD payment into order and payments
          const isNewlySettled = (newSettlementStatus === 'Settled' && shipment.currentSettlementStatus !== 'Settled') ||
                                (newStatus === 'Delivered' && shipment.currentStatus !== 'Delivered' && shipment.codAmount > 0);

          if (isNewlySettled && shipment.codAmount > 0) {
            const newPaid = Math.min(order.total, order.paidAmount + shipment.codAmount);
            const newDue = Math.max(0, order.total - newPaid);
            const newPaymentStatus = newDue === 0 ? 'paid' : 'partial';

            await client.query(
              `UPDATE orders
               SET paid_amount = $1,
                   due_amount = $2,
                   payment_status = $3,
                   order_status = CASE WHEN $4 = 'Delivered' THEN 'delivered' ELSE order_status END,
                   updated_at = NOW()
               WHERE id = $5`,
              [newPaid, newDue, newPaymentStatus, newStatus, order.id]
            );

            // Record payment transaction
            await client.query(
              `INSERT INTO payments (
                id, business_id, branch_id, transaction_number, payment_type, method,
                amount, customer_id, order_id, reference_note, created_by
              ) VALUES ($1, $2, $3, $4, 'Courier COD Settlement', $5, $6, $7, $8, $9, $10)`,
              [
                `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                businessId,
                shipment.branch_id || null,
                `TXN-COD-${Date.now().toString().slice(-6)}`,
                shipment.provider || 'Courier',
                shipment.codAmount,
                order.customer_id || null,
                order.id,
                `Courier COD settled for tracking ${shipment.tracking_code} (Order ${order.order_number})`,
                req.user?.id,
              ]
            );

            // If order has a customer, update customer due and ledger
            if (order.customer_id) {
              await client.query(
                `UPDATE customers
                 SET total_due = GREATEST(0, total_due - $1),
                     updated_at = NOW()
                 WHERE id = $2 AND business_id = $3`,
                [shipment.codAmount, order.customer_id, businessId]
              );

              await client.query(
                `INSERT INTO customer_ledger (
                  id, business_id, customer_id, date, type, reference_id, debit, credit, balance, notes
                ) VALUES ($1, $2, $3, CURRENT_DATE, 'Courier COD Payment', $4, 0, $5, 0, $6)`,
                [
                  `cleg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                  businessId,
                  order.customer_id,
                  order.id,
                  shipment.codAmount,
                  `COD collected by ${shipment.provider} for ${order.order_number}`,
                ]
              );
            }
          } else if (newStatus === 'Delivered') {
            await client.query(
              `UPDATE orders SET order_status = 'delivered', updated_at = NOW() WHERE id = $1`,
              [order.id]
            );
          } else if (newStatus === 'Returned' || newStatus === 'RTO') {
            await client.query(
              `UPDATE orders SET order_status = 'returned', return_status = 'returned', updated_at = NOW() WHERE id = $1`,
              [order.id]
            );
          }
        }
      }

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (id, user_id, business_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, 'SHIPMENT_STATUS_UPDATED', 'shipment', $4, $5)`,
        [
          `aud_${Date.now()}`,
          req.user?.id,
          businessId,
          id,
          JSON.stringify({ status: newStatus, settlementStatus: newSettlementStatus, amount: finalSettlementAmount }),
        ]
      );

      return updateRes.rows[0];
    });

    return res.json(syncResult);
  } catch (error: any) {
    console.error('Error updating shipment status:', error.message);
    return res.status(400).json({ error: 'UpdateFailed', message: error.message });
  }
});

export default router;

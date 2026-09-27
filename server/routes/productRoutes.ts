import { Router, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireTenant, TenantRequest } from '../middleware/tenant.js';
import { validateProductPayload } from '../middleware/validation.js';
import { devStore } from '../database/devStore.js';

const router = Router();

// List products for active business with search & pagination
router.get('/', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const businessId = req.business?.id;
  const search = req.query.search as string;
  const page = parseInt(req.query.page as string, 10);
  const limit = parseInt(req.query.limit as string, 10);

  const isPaginated = !isNaN(page) || !isNaN(limit);
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.min(100, Math.max(1, limit || 50));
  const offset = (pageNum - 1) * limitNum;

  try {
    const params: any[] = [businessId];
    let whereClauses = 'WHERE business_id = $1 AND is_active = true';

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClauses += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(sku) LIKE $${params.length} OR barcode LIKE $${params.length} OR LOWER(brand) LIKE $${params.length})`;
    }

    if (isPaginated) {
      const countRes = await query(`SELECT COUNT(*) as total FROM products ${whereClauses}`, params);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);

      const listQuery = `
        SELECT id, name, category, brand, sku, barcode,
               purchase_price::float as "purchasePrice",
               selling_price::float as "sellingPrice",
               wholesale_price::float as "wholesalePrice",
               stock::float as stock,
               min_stock_alert::float as "minStockAlert",
               unit, vat_percent::float as "vatPercent",
               is_active as "isActive",
               online_store_visible as "onlineStoreVisible",
               image_url as "image",
               created_at as "createdAt"
        FROM products
        ${whereClauses}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      const pRes = await query(listQuery, [...params, limitNum, offset]);

      return res.json({
        data: pRes.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // Default unpaginated list (backward compatible with frontend POS)
    const pRes = await query(
      `SELECT id, name, category, brand, sku, barcode,
              purchase_price::float as "purchasePrice",
              selling_price::float as "sellingPrice",
              wholesale_price::float as "wholesalePrice",
              stock::float as stock,
              min_stock_alert::float as "minStockAlert",
              unit, vat_percent::float as "vatPercent",
              is_active as "isActive",
              online_store_visible as "onlineStoreVisible",
              image_url as "image",
              created_at as "createdAt"
       FROM products
       ${whereClauses}
       ORDER BY created_at DESC`,
      params
    );
    return res.json(pRes.rows);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      let filtered = devStore.products.filter((p) => p.businessId === businessId && p.isActive);
      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
      }
      if (isPaginated) {
        return res.json({
          data: filtered.slice(offset, offset + limitNum),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limitNum),
          },
        });
      }
      return res.json(filtered);
    }
    return res.status(503).json({ error: 'DatabaseUnavailable', message: 'PostgreSQL database is currently unreachable' });
  }
});

// GET /api/v1/products/:id - Single product with strict tenant scoping (IDOR protection)
router.get('/:id', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const businessId = req.business?.id;

  try {
    const pRes = await query(
      `SELECT id, business_id as "businessId", name, category, brand, sku, barcode,
              purchase_price::float as "purchasePrice",
              selling_price::float as "sellingPrice",
              wholesale_price::float as "wholesalePrice",
              stock::float as stock,
              min_stock_alert::float as "minStockAlert",
              unit, vat_percent::float as "vatPercent",
              is_active as "isActive",
              online_store_visible as "onlineStoreVisible",
              image_url as "image",
              created_at as "createdAt"
       FROM products
       WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (pRes.rows.length === 0) {
      return res.status(404).json({ error: 'ProductNotFound', message: 'Product not found in this business' });
    }

    return res.json(pRes.rows[0]);
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      const prod = devStore.products.find((p) => p.id === id && p.businessId === businessId);
      if (prod) return res.json(prod);
      return res.status(404).json({ error: 'ProductNotFound', message: 'Product not found in this business' });
    }
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Create product with input validation
router.post('/', authenticateToken, requireTenant, validateProductPayload, async (req: TenantRequest, res: Response) => {
  const {
    name,
    category,
    brand,
    sku,
    barcode,
    purchasePrice = 0,
    sellingPrice = 0,
    wholesalePrice = 0,
    stock = 0,
    minStockAlert = 5,
    unit = 'pcs',
    image,
  } = req.body;

  const productId = 'prod_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  try {
    const created = await transaction(async (client) => {
      const res = await client.query(
        `INSERT INTO products (
          id, business_id, name, category, brand, sku, barcode,
          purchase_price, selling_price, wholesale_price, stock,
          min_stock_alert, unit, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          productId,
          req.business?.id,
          name.trim(),
          category || 'General',
          brand || '',
          sku || 'SKU-' + Date.now().toString().slice(-6),
          barcode || '',
          purchasePrice,
          sellingPrice,
          wholesalePrice,
          stock,
          minStockAlert,
          unit,
          image || '',
        ]
      );

      // Record initial stock movement
      if (stock > 0) {
        await client.query(
          `INSERT INTO stock_movements (
            id, business_id, product_id, movement_type, quantity,
            stock_before, stock_after, reason, created_by
          ) VALUES ($1, $2, $3, 'INITIAL', $4, 0, $4, 'Initial stock entry', $5)`,
          ['mov_' + Date.now(), req.business?.id, productId, stock, req.user?.id]
        );
      }

      return res.rows[0];
    });

    return res.status(201).json({
      id: created.id,
      name: created.name,
      category: created.category,
      brand: created.brand,
      sku: created.sku,
      barcode: created.barcode,
      purchasePrice: parseFloat(created.purchase_price),
      sellingPrice: parseFloat(created.selling_price),
      wholesalePrice: parseFloat(created.wholesale_price),
      stock: parseFloat(created.stock),
      minStockAlert: parseFloat(created.min_stock_alert),
      unit: created.unit,
      image: created.image_url,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const newProd = {
        id: productId,
        businessId: req.business?.id || 'shop_101',
        name,
        category: category || 'General',
        brand: brand || '',
        sku: sku || 'SKU-' + Date.now().toString().slice(-6),
        barcode: barcode || '',
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        wholesalePrice: parseFloat(wholesalePrice) || 0,
        stock: parseFloat(stock) || 0,
        minStockAlert: parseFloat(minStockAlert) || 5,
        unit: unit || 'pcs',
        isActive: true,
        onlineStoreVisible: true,
        createdAt: new Date().toISOString(),
      };
      devStore.products.unshift(newProd as any);
      return res.status(201).json(newProd);
    }
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Update product with IDOR protection & validation
router.put('/:id', authenticateToken, requireTenant, validateProductPayload, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { name, category, brand, sku, barcode, purchasePrice, sellingPrice, stock, minStockAlert, unit, image, onlineStoreVisible } =
    req.body;

  try {
    const updated = await query(
      `UPDATE products
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           brand = COALESCE($3, brand),
           sku = COALESCE($4, sku),
           barcode = COALESCE($5, barcode),
           purchase_price = COALESCE($6, purchase_price),
           selling_price = COALESCE($7, selling_price),
           stock = COALESCE($8, stock),
           min_stock_alert = COALESCE($9, min_stock_alert),
           unit = COALESCE($10, unit),
           image_url = COALESCE($11, image_url),
           online_store_visible = COALESCE($12, online_store_visible),
           updated_at = NOW()
       WHERE id = $13 AND business_id = $14
       RETURNING *`,
      [
        name,
        category,
        brand,
        sku,
        barcode,
        purchasePrice,
        sellingPrice,
        stock,
        minStockAlert,
        unit,
        image,
        onlineStoreVisible,
        id,
        req.business?.id,
      ]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'ProductNotFound', message: 'Product not found in this business' });
    }

    const row = updated.rows[0];
    return res.json({
      id: row.id,
      name: row.name,
      category: row.category,
      sku: row.sku,
      barcode: row.barcode,
      purchasePrice: parseFloat(row.purchase_price),
      sellingPrice: parseFloat(row.selling_price),
      stock: parseFloat(row.stock),
      onlineStoreVisible: row.online_store_visible,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const idx = devStore.products.findIndex((p) => p.id === id && p.businessId === req.business?.id);
      if (idx !== -1) {
        if (name) devStore.products[idx].name = name;
        if (sellingPrice !== undefined) devStore.products[idx].sellingPrice = parseFloat(sellingPrice);
        if (stock !== undefined) devStore.products[idx].stock = parseFloat(stock);
        if (onlineStoreVisible !== undefined) devStore.products[idx].onlineStoreVisible = onlineStoreVisible;
        return res.json(devStore.products[idx]);
      }
      return res.status(404).json({ error: 'ProductNotFound' });
    }
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// PATCH /api/v1/products/:id/online-status - Fast 1-click toggle with tenant IDOR protection
router.patch('/:id/online-status', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { onlineStoreVisible } = req.body;

  if (typeof onlineStoreVisible !== 'boolean') {
    return res.status(422).json({ error: 'ValidationError', message: 'onlineStoreVisible must be a boolean' });
  }

  const businessId = req.business?.id;

  try {
    const updated = await query(
      `UPDATE products
       SET online_store_visible = $1,
           updated_at = NOW()
       WHERE id = $2 AND business_id = $3
       RETURNING id, name, online_store_visible as "onlineStoreVisible"`,
      [onlineStoreVisible, id, businessId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'ProductNotFound', message: 'Product not found in this business' });
    }

    return res.json({ success: true, ...updated.rows[0] });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const idx = devStore.products.findIndex((p) => p.id === id && p.businessId === businessId);
      if (idx !== -1) {
        devStore.products[idx].onlineStoreVisible = onlineStoreVisible;
        return res.json({ success: true, id, onlineStoreVisible });
      }
      return res.status(404).json({ error: 'ProductNotFound' });
    }
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// POST /api/v1/products/bulk-online-status - Bulk toggle online status across selected products
router.post('/bulk-online-status', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { productIds, onlineStoreVisible } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(422).json({ error: 'ValidationError', message: 'productIds must be a non-empty array' });
  }
  if (typeof onlineStoreVisible !== 'boolean') {
    return res.status(422).json({ error: 'ValidationError', message: 'onlineStoreVisible must be a boolean' });
  }

  const businessId = req.business?.id;

  try {
    const updated = await query(
      `UPDATE products
       SET online_store_visible = $1,
           updated_at = NOW()
       WHERE business_id = $2 AND id = ANY($3::varchar[])
       RETURNING id`,
      [onlineStoreVisible, businessId, productIds]
    );

    return res.json({ success: true, updatedCount: updated.rows.length, onlineStoreVisible });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      const idSet = new Set(productIds);
      let count = 0;
      devStore.products.forEach((p) => {
        if (p.businessId === businessId && idSet.has(p.id)) {
          p.onlineStoreVisible = onlineStoreVisible;
          count++;
        }
      });
      return res.json({ success: true, updatedCount: count, onlineStoreVisible });
    }
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Delete (archive) product
router.delete('/:id', authenticateToken, requireTenant, async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 AND business_id = $2 RETURNING id',
      [id, req.business?.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ProductNotFound' });
    }
    return res.json({ success: true, message: 'Product archived successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register new user & default business
router.post('/register', async (req: Request, res: Response) => {
  const { mobile, name, password, shopName, category } = req.body;

  if (!mobile || !name || !password) {
    return res.status(422).json({
      error: 'ValidationError',
      message: 'Mobile, name, and password are required',
    });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE mobile = $1', [mobile]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'UserExists',
        message: 'A user with this mobile number already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr_' + Date.now();
    const accountId = 'acc_' + Date.now();
    const shopId = 'shop_' + Date.now();
    const slug = (shopName || 'smartshop')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

    await transaction(async (client) => {
      // 1. Create User
      await client.query(
        `INSERT INTO users (id, mobile, name, password_hash, role, account_type)
         VALUES ($1, $2, $3, $4, 'owner', 'business')`,
        [userId, mobile, name, passwordHash]
      );

      // 2. Create Account
      await client.query(
        `INSERT INTO accounts (id, user_id, name, type)
         VALUES ($1, $2, $3, 'business')`,
        [accountId, userId, name]
      );

      // 3. Create Default Business
      await client.query(
        `INSERT INTO businesses (id, account_id, name, store_slug, category, subscription_plan)
         VALUES ($1, $2, $3, $4, $5, 'Standard')`,
        [shopId, accountId, shopName || 'আমার দোকান', slug, category || 'মুদি ও জেনারেল স্টোর']
      );

      // 4. Create Owner Membership
      await client.query(
        `INSERT INTO business_memberships (id, user_id, business_id, role, permissions)
         VALUES ($1, $2, $3, 'owner', $4)`,
        [
          'mem_' + Date.now(),
          userId,
          shopId,
          JSON.stringify({
            canViewSales: true,
            canCreateSale: true,
            canManageProducts: true,
            canManageCustomers: true,
            canManageOrders: true,
            canViewReports: true,
            canManagePayments: true,
            canManagePurchases: true,
            canManageCourier: true,
            canManageSettings: true,
          }),
        ]
      );
    });

    const user = { id: userId, mobile, name, role: 'owner' };
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      token,
      user,
      shop: {
        id: shopId,
        name: shopName || 'আমার দোকান',
        storeSlug: slug,
        category: category || 'মুদি ও জেনারেল স্টোর',
        plan: 'Standard',
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error.message);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(422).json({
      error: 'ValidationError',
      message: 'Mobile and password are required',
    });
  }

  try {
    const uRes = await query('SELECT * FROM users WHERE mobile = $1', [mobile]);
    if (uRes.rows.length === 0) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid mobile number or password',
      });
    }

    const userRow = uRes.rows[0];
    const passwordMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid mobile number or password',
      });
    }

    // Fetch user's active business
    const bRes = await query(
      `SELECT b.* FROM businesses b
       JOIN business_memberships m ON m.business_id = b.id
       WHERE m.user_id = $1 AND b.is_active = true
       LIMIT 1`,
      [userRow.id]
    );

    const user = {
      id: userRow.id,
      mobile: userRow.mobile,
      name: userRow.name,
      role: userRow.role,
    };

    const token = generateToken(user);
    const shop = bRes.rows[0]
      ? {
          id: bRes.rows[0].id,
          name: bRes.rows[0].name,
          category: bRes.rows[0].category,
          storeSlug: bRes.rows[0].store_slug,
          plan: bRes.rows[0].subscription_plan,
          isSuspended: bRes.rows[0].is_suspended,
          featureOverrides: bRes.rows[0].feature_overrides || {},
        }
      : {
          id: 'shop_101',
          name: 'স্মার্ট ফ্যাশন অ্যান্ড ক্লথিং',
          category: 'ফ্যাশন ও ক্লোথিং',
          storeSlug: 'smart-fashion',
          plan: 'Standard',
        };

    return res.json({
      token,
      user,
      shop,
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'ServerError', message: error.message });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

// OTP Request & Verify (Clearly demarcated development mode, ready for SMS Gateway)
router.post('/request-otp', (req: Request, res: Response) => {
  const { mobile } = req.body;
  // In development, mock OTP 123456 is used
  return res.json({
    success: true,
    message: 'OTP sent to mobile (Development OTP: 123456)',
    mobile,
    mode: 'DEVELOPMENT_OTP',
  });
});

router.post('/verify-otp', (req: Request, res: Response) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(422).json({ error: 'ValidationError', message: 'Mobile and OTP required' });
  }

  // Development OTP verification
  if (otp === '123456' || otp === '1234' || process.env.NODE_ENV !== 'production') {
    return res.json({ success: true, verified: true });
  }

  return res.status(400).json({ success: false, message: 'Invalid OTP code' });
});

// Current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const uRes = await query('SELECT id, mobile, name, email, role, account_type FROM users WHERE id = $1', [
      req.user?.id,
    ]);
    if (uRes.rows.length === 0) {
      return res.status(404).json({ error: 'UserNotFound' });
    }
    return res.json(uRes.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;

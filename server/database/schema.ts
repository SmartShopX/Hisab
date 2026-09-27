export const SCHEMA_SQL = `
-- SmartShopX Authoritative PostgreSQL Schema
-- Enforces multi-tenancy, atomic financial integrity, Bangla UTF-8, and strict decimal precision

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'owner',
  account_type VARCHAR(50) DEFAULT 'business',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
  id VARCHAR(64) PRIMARY KEY,
  account_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  store_slug VARCHAR(100) UNIQUE,
  category VARCHAR(100) NOT NULL,
  business_type VARCHAR(100),
  business_model VARCHAR(100),
  template VARCHAR(100),
  subscription_plan VARCHAR(50) DEFAULT 'Standard',
  subscription_status VARCHAR(50) DEFAULT 'Active',
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  feature_overrides JSONB DEFAULT '{}'::jsonb,
  modules JSONB DEFAULT '{}'::jsonb,
  address TEXT,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_memberships (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  role VARCHAR(50) NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  purchase_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  wholesale_price NUMERIC(15,2) DEFAULT 0.00,
  stock NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  min_stock_alert NUMERIC(15,2) DEFAULT 5.00,
  unit VARCHAR(50) DEFAULT 'pcs',
  vat_percent NUMERIC(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  online_store_visible BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  movement_type VARCHAR(50) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  stock_before NUMERIC(15,2) NOT NULL,
  stock_after NUMERIC(15,2) NOT NULL,
  reason TEXT,
  reference_id VARCHAR(100),
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50),
  address TEXT,
  email VARCHAR(255),
  total_spent NUMERIC(15,2) DEFAULT 0.00,
  total_orders INTEGER DEFAULT 0,
  total_due NUMERIC(15,2) DEFAULT 0.00,
  credit_limit NUMERIC(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  mobile VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  total_payable NUMERIC(15,2) DEFAULT 0.00,
  total_paid NUMERIC(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  order_number VARCHAR(100) NOT NULL,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  delivery_charge NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  vat NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  due_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  order_status VARCHAR(50) NOT NULL DEFAULT 'completed',
  channel VARCHAR(50) DEFAULT 'pos',
  notes TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  purchase_price NUMERIC(15,2) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  total_price NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  transaction_number VARCHAR(100),
  payment_type VARCHAR(50) NOT NULL,
  method VARCHAR(50) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  customer_id VARCHAR(64),
  supplier_id VARCHAR(64),
  order_id VARCHAR(64),
  status VARCHAR(50) DEFAULT 'Completed',
  reference_note TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  date DATE NOT NULL,
  note TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_transactions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_dues (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  person_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50),
  type VARCHAR(50) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  due_date DATE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  business_id VARCHAR(64),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Product Studio tables
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  subscription_plan VARCHAR(50) DEFAULT 'FREE',
  operation VARCHAR(50) NOT NULL,
  credits_consumed INT DEFAULT 1,
  request_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'success',
  provider VARCHAR(100) DEFAULT 'gemini',
  model VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_video_jobs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64),
  product_name VARCHAR(255),
  source_image_url TEXT,
  provider VARCHAR(100) DEFAULT 'demo-showcase',
  model VARCHAR(100),
  status VARCHAR(50) DEFAULT 'queued',
  progress INT DEFAULT 0,
  result_url TEXT,
  preview_poster TEXT,
  error_code VARCHAR(100),
  error_message TEXT,
  credits_reserved INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Phase 5 Multi-Branch Architecture
CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  city VARCHAR(100) DEFAULT 'ঢাকা',
  is_main BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  target_monthly_sales NUMERIC(15,2) DEFAULT 0.00,
  manager_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branch_inventory (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
  stock NUMERIC(15,2) DEFAULT 0.00,
  min_stock_alert NUMERIC(15,2) DEFAULT 5.00,
  rack_location VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, product_id)
);

CREATE TABLE IF NOT EXISTS branch_transfers (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  transfer_number VARCHAR(100) NOT NULL,
  source_branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE RESTRICT,
  dest_branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE RESTRICT,
  status VARCHAR(50) DEFAULT 'Pending',
  total_items INT DEFAULT 0,
  total_amount NUMERIC(15,2) DEFAULT 0.00,
  driver_name VARCHAR(100),
  vehicle_number VARCHAR(100),
  tracking_number VARCHAR(100),
  notes TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branch_transfer_items (
  id VARCHAR(64) PRIMARY KEY,
  transfer_id VARCHAR(64) REFERENCES branch_transfers(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  quantity NUMERIC(15,2) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(15,2) NOT NULL DEFAULT 0.00
);

-- Phase 5 Purchases and Supplier Price Tracking
CREATE TABLE IF NOT EXISTS purchases (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  branch_id VARCHAR(64),
  invoice_number VARCHAR(100) NOT NULL,
  supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE RESTRICT,
  supplier_name VARCHAR(255),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  vat NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  transport_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  due_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id VARCHAR(64) PRIMARY KEY,
  purchase_id VARCHAR(64) REFERENCES purchases(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  unit_cost NUMERIC(15,2) NOT NULL,
  previous_price NUMERIC(15,2) DEFAULT 0.00,
  price_change_type VARCHAR(20) DEFAULT 'NO_CHANGE',
  price_diff_absolute NUMERIC(15,2) DEFAULT 0.00,
  price_diff_percent NUMERIC(5,2) DEFAULT 0.00,
  total_cost NUMERIC(15,2) NOT NULL
);

-- Phase 5 Logistics & Courier Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  branch_id VARCHAR(64),
  order_id VARCHAR(64),
  consignment_id VARCHAR(100),
  provider VARCHAR(50) NOT NULL,
  tracking_code VARCHAR(100),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_zone VARCHAR(100),
  cod_amount NUMERIC(15,2) DEFAULT 0.00,
  delivery_charge NUMERIC(15,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Pending',
  driver_name VARCHAR(100),
  driver_phone VARCHAR(50),
  vehicle_info VARCHAR(100),
  route VARCHAR(100),
  otp_pod_code VARCHAR(20),
  settlement_status VARCHAR(50) DEFAULT 'Unsettled',
  settlement_amount NUMERIC(15,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 5 Customer Ledger and Supplier Ledger
CREATE TABLE IF NOT EXISTS customer_ledger (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(50) NOT NULL,
  reference_id VARCHAR(100),
  debit NUMERIC(15,2) DEFAULT 0.00,
  credit NUMERIC(15,2) DEFAULT 0.00,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_ledger (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(50) NOT NULL,
  reference_id VARCHAR(100),
  debit NUMERIC(15,2) DEFAULT 0.00,
  credit NUMERIC(15,2) DEFAULT 0.00,
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 5 Telecom & IMEI Tracking
CREATE TABLE IF NOT EXISTS telecom_imei_records (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  imei_serial VARCHAR(100) NOT NULL,
  imei_2 VARCHAR(100),
  purchase_id VARCHAR(64),
  sale_id VARCHAR(64),
  customer_id VARCHAR(64),
  warranty_months INT DEFAULT 12,
  warranty_expiry DATE,
  status VARCHAR(50) DEFAULT 'In_Stock',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additive Column migrations for existing tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id VARCHAR(64);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS branch_id VARCHAR(64);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS branch_id VARCHAR(64);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS branch_id VARCHAR(64);

-- Indexes for performance and multi-tenant scoping
CREATE INDEX IF NOT EXISTS idx_businesses_store_slug ON businesses(store_slug);
CREATE INDEX IF NOT EXISTS idx_business_memberships_user_business ON business_memberships(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_product ON stock_movements(business_id, product_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_id ON suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_personal_transactions_user_id ON personal_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_dues_user_id ON personal_dues(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_store_created ON ai_usage_logs(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_video_jobs_store_status ON ai_video_jobs(store_id, status);
CREATE INDEX IF NOT EXISTS idx_branches_business_id ON branches(business_id);
CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch ON branch_inventory(branch_id, product_id);
CREATE INDEX IF NOT EXISTS idx_branch_transfers_business ON branch_transfers(business_id);
CREATE INDEX IF NOT EXISTS idx_purchases_business ON purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_business ON shipments(business_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_customer_ledger_customer ON customer_ledger(customer_id, date);
CREATE INDEX IF NOT EXISTS idx_supplier_ledger_supplier ON supplier_ledger(supplier_id, date);
CREATE INDEX IF NOT EXISTS idx_telecom_imei_business ON telecom_imei_records(business_id, imei_serial);

-- Phase 6 Idempotency Protection for Transactions
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE CASCADE,
  key_hash VARCHAR(128) NOT NULL,
  request_path VARCHAR(255) NOT NULL,
  response_status INT,
  response_body JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, key_hash)
);

-- Phase 6 Returns & Exchanges Authoritative Architecture
CREATE TABLE IF NOT EXISTS returns (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  branch_id VARCHAR(64),
  return_number VARCHAR(100) NOT NULL,
  invoice_number VARCHAR(100),
  order_id VARCHAR(64),
  customer_id VARCHAR(64),
  customer_name VARCHAR(255),
  customer_mobile VARCHAR(50),
  type VARCHAR(50) DEFAULT 'Return',
  channel VARCHAR(50) DEFAULT 'Direct_Store',
  condition VARCHAR(50) DEFAULT 'Resellable',
  refund_method VARCHAR(50) DEFAULT 'Cash',
  store_credit_code VARCHAR(100),
  courier_provider VARCHAR(50),
  courier_tracking_code VARCHAR(100),
  courier_return_fee NUMERIC(15,2) DEFAULT 0.00,
  refund_amount NUMERIC(15,2) DEFAULT 0.00,
  additional_charge NUMERIC(15,2) DEFAULT 0.00,
  stock_restocked BOOLEAN DEFAULT true,
  reason TEXT,
  notes TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_items (
  id VARCHAR(64) PRIMARY KEY,
  return_id VARCHAR(64) REFERENCES returns(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  refund_amount NUMERIC(15,2) NOT NULL,
  item_type VARCHAR(50) DEFAULT 'RETURNED',
  condition VARCHAR(50) DEFAULT 'Resellable',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 6 Purchase Returns (Supplier Return & Due Reduction)
CREATE TABLE IF NOT EXISTS purchase_returns (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  branch_id VARCHAR(64),
  purchase_id VARCHAR(64) REFERENCES purchases(id) ON DELETE RESTRICT,
  supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE RESTRICT,
  return_number VARCHAR(100) NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_refund_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  refund_status VARCHAR(50) DEFAULT 'Adjusted_In_Due',
  reason TEXT,
  notes TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_return_items (
  id VARCHAR(64) PRIMARY KEY,
  purchase_return_id VARCHAR(64) REFERENCES purchase_returns(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  unit_cost NUMERIC(15,2) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL
);

-- Phase 6 Telecom Servicing & Repairs Job Sheet
CREATE TABLE IF NOT EXISTS telecom_repairs (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  branch_id VARCHAR(64),
  ticket_number VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_mobile VARCHAR(50) NOT NULL,
  device_brand VARCHAR(100) NOT NULL,
  device_model VARCHAR(100) NOT NULL,
  imei_serial VARCHAR(100),
  problem_desc TEXT NOT NULL,
  estimated_cost NUMERIC(15,2) DEFAULT 0.00,
  advance_paid NUMERIC(15,2) DEFAULT 0.00,
  actual_cost NUMERIC(15,2) DEFAULT 0.00,
  final_paid NUMERIC(15,2) DEFAULT 0.00,
  due_amount NUMERIC(15,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Pending',
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivered_date DATE,
  technician_name VARCHAR(100),
  notes TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 6 Telecom MFS & Utility Transactions
CREATE TABLE IF NOT EXISTS telecom_transactions (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  branch_id VARCHAR(64),
  provider VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  customer_number VARCHAR(50) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  fee NUMERIC(15,2) DEFAULT 0.00,
  commission NUMERIC(15,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Success',
  trx_id VARCHAR(100),
  notes TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 6 Telecom Daily Closing & Multi-channel Cash Reconciliation
CREATE TABLE IF NOT EXISTS telecom_daily_closings (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  branch_id VARCHAR(64),
  closing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_cash NUMERIC(15,2) DEFAULT 0.00,
  system_sales_total NUMERIC(15,2) DEFAULT 0.00,
  mfs_cashin_total NUMERIC(15,2) DEFAULT 0.00,
  mfs_cashout_total NUMERIC(15,2) DEFAULT 0.00,
  mfs_commission_total NUMERIC(15,2) DEFAULT 0.00,
  repairs_income_total NUMERIC(15,2) DEFAULT 0.00,
  expenses_total NUMERIC(15,2) DEFAULT 0.00,
  expected_closing_cash NUMERIC(15,2) DEFAULT 0.00,
  actual_physical_cash NUMERIC(15,2) DEFAULT 0.00,
  cash_discrepancy NUMERIC(15,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Balanced',
  notes TEXT,
  reconciled_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional additive columns for existing tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) DEFAULT 'none';

-- Phase 6 Indexes
CREATE INDEX IF NOT EXISTS idx_idempotency_business_key ON idempotency_keys(business_id, key_hash);
CREATE INDEX IF NOT EXISTS idx_returns_business_id ON returns(business_id);
CREATE INDEX IF NOT EXISTS idx_returns_invoice_number ON returns(invoice_number);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_business ON purchase_returns(business_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_supplier ON purchase_returns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_telecom_repairs_business ON telecom_repairs(business_id);
CREATE INDEX IF NOT EXISTS idx_telecom_repairs_ticket ON telecom_repairs(ticket_number);
CREATE INDEX IF NOT EXISTS idx_telecom_transactions_business ON telecom_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_telecom_daily_closings_business ON telecom_daily_closings(business_id);
`;

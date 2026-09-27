/**
 * Authoritative Business Logic Calculation Service
 * Single source of truth for pure financial, stock, ledger, and telecom calculations.
 * Ensures consistent decimal arithmetic and zero divergence across frontend & backend.
 */

// -------------------------------------------------------------
// 1. FINANCIAL CALCULATIONS
// -------------------------------------------------------------

export interface CartItemInput {
  quantity: number;
  unitPrice: number;
}

/**
 * Calculates subtotal from cart items
 */
export function calculateSubtotal(items: CartItemInput[]): number {
  if (!items || !Array.isArray(items)) return 0;
  const sum = items.reduce((acc, item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    return acc + qty * price;
  }, 0);
  return parseFloat(sum.toFixed(2));
}

/**
 * Calculates discount amount (supports fixed value or percentage)
 */
export function calculateDiscount(
  subtotal: number,
  discountValue: number,
  type: 'fixed' | 'percent' = 'fixed'
): number {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const safeVal = Math.max(0, Number(discountValue) || 0);

  let discountAmount = 0;
  if (type === 'percent') {
    discountAmount = (safeSubtotal * Math.min(100, safeVal)) / 100;
  } else {
    discountAmount = Math.min(safeSubtotal, safeVal);
  }
  return parseFloat(discountAmount.toFixed(2));
}

/**
 * Calculates VAT / Tax
 */
export function calculateVat(taxableAmount: number, vatPercent: number): number {
  const safeAmount = Math.max(0, Number(taxableAmount) || 0);
  const safePercent = Math.max(0, Number(vatPercent) || 0);
  return parseFloat(((safeAmount * safePercent) / 100).toFixed(2));
}

/**
 * Validates and normalizes delivery charge
 */
export function calculateDelivery(deliveryCharge: number): number {
  return parseFloat(Math.max(0, Number(deliveryCharge) || 0).toFixed(2));
}

/**
 * Calculates grand total: subtotal - discount + vat + delivery
 */
export function calculateGrandTotal(
  subtotal: number,
  discount: number,
  vat: number,
  delivery: number = 0
): number {
  const s = Math.max(0, Number(subtotal) || 0);
  const d = Math.min(s, Math.max(0, Number(discount) || 0));
  const v = Math.max(0, Number(vat) || 0);
  const del = Math.max(0, Number(delivery) || 0);
  return parseFloat((s - d + v + del).toFixed(2));
}

/**
 * Evaluates payment, due, and payment status
 */
export function calculatePaymentAndDue(
  grandTotal: number,
  paidAmount: number
): { paid: number; due: number; status: 'paid' | 'partial' | 'unpaid' } {
  const total = Math.max(0, Number(grandTotal) || 0);
  const paidRaw = Math.max(0, Number(paidAmount) || 0);
  const finalPaid = Math.min(total, parseFloat(paidRaw.toFixed(2)));
  const due = parseFloat((total - finalPaid).toFixed(2));

  let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
  if (due === 0 && total > 0) {
    status = 'paid';
  } else if (finalPaid > 0) {
    status = 'partial';
  }

  return { paid: finalPaid, due, status };
}

/**
 * Calculates refund amount for returns after deducting return or restocking fees
 */
export function calculateRefund(
  returnedItemsTotal: number,
  deductionFee: number = 0
): { netRefund: number; deduction: number } {
  const itemsTotal = Math.max(0, Number(returnedItemsTotal) || 0);
  const fee = Math.max(0, Number(deductionFee) || 0);
  const netRefund = parseFloat(Math.max(0, itemsTotal - fee).toFixed(2));
  return { netRefund, deduction: fee };
}

/**
 * Calculates exchange difference:
 * - customer_pays: new total > returned total
 * - store_refunds: new total < returned total
 * - even: exactly equal
 */
export function calculateExchangeDifference(
  newItemsTotal: number,
  returnedItemsTotal: number
): { diffAmount: number; action: 'customer_pays' | 'store_refunds' | 'even' } {
  const newTot = Math.max(0, Number(newItemsTotal) || 0);
  const retTot = Math.max(0, Number(returnedItemsTotal) || 0);
  const diff = parseFloat((newTot - retTot).toFixed(2));

  if (diff > 0) {
    return { diffAmount: diff, action: 'customer_pays' };
  } else if (diff < 0) {
    return { diffAmount: Math.abs(diff), action: 'store_refunds' };
  }
  return { diffAmount: 0, action: 'even' };
}

// -------------------------------------------------------------
// 2. STOCK CALCULATIONS
// -------------------------------------------------------------

/**
 * Calculates stock deduction after sale (throws error if insufficient stock)
 */
export function calculateSaleDeduction(currentStock: number, quantity: number): number {
  const current = Number(currentStock) || 0;
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    throw new Error('Sale quantity must be strictly greater than 0');
  }
  if (current < qty) {
    throw new Error(`Insufficient stock. Available: ${current}, Requested: ${qty}`);
  }
  return parseFloat((current - qty).toFixed(2));
}

/**
 * Calculates stock addition after purchase
 */
export function calculatePurchaseAddition(currentStock: number, quantity: number): number {
  const current = Math.max(0, Number(currentStock) || 0);
  const qty = Math.max(0, Number(quantity) || 0);
  return parseFloat((current + qty).toFixed(2));
}

/**
 * Calculates stock addition after sales return (restock)
 */
export function calculateReturnAddition(currentStock: number, quantity: number): number {
  const current = Math.max(0, Number(currentStock) || 0);
  const qty = Math.max(0, Number(quantity) || 0);
  return parseFloat((current + qty).toFixed(2));
}

/**
 * Calculates stock deduction after purchase return to supplier
 */
export function calculatePurchaseReturnDeduction(currentStock: number, quantity: number): number {
  const current = Number(currentStock) || 0;
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    throw new Error('Purchase return quantity must be greater than 0');
  }
  if (current < qty) {
    throw new Error(`Insufficient stock for supplier return. Available: ${current}, Requested: ${qty}`);
  }
  return parseFloat((current - qty).toFixed(2));
}

/**
 * Calculates branch transfer stock between source and destination branches
 */
export function calculateBranchTransfer(
  sourceStock: number,
  destStock: number,
  quantity: number
): { newSourceStock: number; newDestStock: number } {
  const src = Number(sourceStock) || 0;
  const dst = Math.max(0, Number(destStock) || 0);
  const qty = Number(quantity) || 0;

  if (qty <= 0) {
    throw new Error('Transfer quantity must be greater than 0');
  }
  if (src < qty) {
    throw new Error(`Source branch has insufficient stock. Available: ${src}, Requested: ${qty}`);
  }

  return {
    newSourceStock: parseFloat((src - qty).toFixed(2)),
    newDestStock: parseFloat((dst + qty).toFixed(2)),
  };
}

/**
 * Calculates stock deduction for damaged or expired goods
 */
export function calculateDamagedStock(currentStock: number, damagedQty: number): number {
  const current = Number(currentStock) || 0;
  const damaged = Number(damagedQty) || 0;
  if (damaged <= 0) {
    throw new Error('Damaged quantity must be greater than 0');
  }
  if (current < damaged) {
    throw new Error(`Damaged quantity cannot exceed current stock. Available: ${current}, Damaged: ${damaged}`);
  }
  return parseFloat((current - damaged).toFixed(2));
}

/**
 * Evaluates stock audit physical reconciliation adjustment
 */
export function calculateAdjustment(
  systemStock: number,
  physicalCount: number
): { adjustmentQty: number; type: 'SURPLUS' | 'DEFICIT' | 'EXACT' } {
  const sys = Math.max(0, Number(systemStock) || 0);
  const physical = Math.max(0, Number(physicalCount) || 0);
  const diff = parseFloat((physical - sys).toFixed(2));

  if (diff > 0) {
    return { adjustmentQty: diff, type: 'SURPLUS' };
  } else if (diff < 0) {
    return { adjustmentQty: Math.abs(diff), type: 'DEFICIT' };
  }
  return { adjustmentQty: 0, type: 'EXACT' };
}

// -------------------------------------------------------------
// 3. LEDGER CALCULATIONS
// -------------------------------------------------------------

/**
 * Customer Debit: increases customer's outstanding balance (due added from sale)
 */
export function calculateCustomerDebit(currentBalance: number, saleDueAmount: number): number {
  const bal = Number(currentBalance) || 0;
  const due = Math.max(0, Number(saleDueAmount) || 0);
  return parseFloat((bal + due).toFixed(2));
}

/**
 * Customer Credit: decreases customer's outstanding balance (payment received)
 */
export function calculateCustomerCredit(currentBalance: number, paymentAmount: number): number {
  const bal = Number(currentBalance) || 0;
  const pmt = Math.max(0, Number(paymentAmount) || 0);
  return parseFloat((bal - pmt).toFixed(2));
}

/**
 * Supplier Credit: increases supplier payable balance (goods purchased on credit)
 */
export function calculateSupplierCredit(currentPayable: number, purchaseDueAmount: number): number {
  const payable = Number(currentPayable) || 0;
  const due = Math.max(0, Number(purchaseDueAmount) || 0);
  return parseFloat((payable + due).toFixed(2));
}

/**
 * Supplier Debit: decreases supplier payable balance (payment made to supplier)
 */
export function calculateSupplierDebit(currentPayable: number, paymentToSupplier: number): number {
  const payable = Number(currentPayable) || 0;
  const pmt = Math.max(0, Number(paymentToSupplier) || 0);
  return parseFloat((payable - pmt).toFixed(2));
}

/**
 * Calculates continuous running balance: previous + debit - credit
 */
export function calculateRunningBalance(
  previousBalance: number,
  debit: number,
  credit: number
): number {
  const prev = Number(previousBalance) || 0;
  const d = Math.max(0, Number(debit) || 0);
  const c = Math.max(0, Number(credit) || 0);
  return parseFloat((prev + d - c).toFixed(2));
}

// -------------------------------------------------------------
// 4. TELECOM & CASH RECONCILIATION CALCULATIONS
// -------------------------------------------------------------

/**
 * Calculates MFS agent commission
 */
export function calculateMfsCommission(amount: number, commissionPercent: number): number {
  const amt = Math.max(0, Number(amount) || 0);
  const rate = Math.max(0, Number(commissionPercent) || 0);
  return parseFloat(((amt * rate) / 100).toFixed(2));
}

export interface DailyClosingParams {
  openingCash: number;
  systemSalesTotal: number;
  mfsCashIn: number;       // Cash received from customer for MFS deposit
  mfsCashOut: number;      // Cash paid to customer for MFS withdrawal
  mfsCommission: number;   // Income from commissions
  repairsIncome: number;   // Income from repairs
  expensesTotal: number;   // Cash paid for store expenses
}

/**
 * Calculates expected closing cash:
 * openingCash + sales + mfsCashIn - mfsCashOut + mfsCommission + repairsIncome - expenses
 */
export function calculateDailyClosing(params: DailyClosingParams): number {
  const open = Math.max(0, Number(params.openingCash) || 0);
  const sales = Math.max(0, Number(params.systemSalesTotal) || 0);
  const cashIn = Math.max(0, Number(params.mfsCashIn) || 0);
  const cashOut = Math.max(0, Number(params.mfsCashOut) || 0);
  const comm = Math.max(0, Number(params.mfsCommission) || 0);
  const repairs = Math.max(0, Number(params.repairsIncome) || 0);
  const exp = Math.max(0, Number(params.expensesTotal) || 0);

  const expected = open + sales + cashIn - cashOut + comm + repairs - exp;
  return parseFloat(expected.toFixed(2));
}

/**
 * Evaluates cash discrepancy between expected cash and physical cash count
 */
export function evaluateCashDiscrepancy(
  expectedCash: number,
  actualPhysicalCash: number
): { discrepancy: number; status: 'Balanced' | 'Over' | 'Short' } {
  const exp = Number(expectedCash) || 0;
  const actual = Number(actualPhysicalCash) || 0;
  const diff = parseFloat((actual - exp).toFixed(2));

  if (diff > 0.01) {
    return { discrepancy: diff, status: 'Over' };
  } else if (diff < -0.01) {
    return { discrepancy: Math.abs(diff), status: 'Short' };
  }
  return { discrepancy: 0, status: 'Balanced' };
}

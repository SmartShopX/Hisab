import { Request, Response, NextFunction } from 'express';

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

export class ValidationError extends Error {
  public code = 'VALIDATION_ERROR';
  public status = 422;
  public details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Validate numeric value is safe, finite, and non-negative
 */
export function isSafeNonNegativeNumber(val: any): boolean {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return typeof num === 'number' && !isNaN(num) && isFinite(num) && num >= 0;
}

/**
 * Validate numeric value is safe, finite, and strictly positive (> 0)
 */
export function isSafePositiveNumber(val: any): boolean {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return typeof num === 'number' && !isNaN(num) && isFinite(num) && num > 0;
}

/**
 * Validate string ID format
 */
export function isValidId(val: any): boolean {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.length > 0 && trimmed.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

/**
 * Validate ISO date or YYYY-MM-DD
 */
export function isValidDate(val: any): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  const parsed = Date.parse(val);
  return !isNaN(parsed);
}

/**
 * Validate BD Mobile number
 */
export function isValidBdMobile(mobile: string): boolean {
  if (typeof mobile !== 'string') return false;
  const clean = mobile.replace(/[^0-9]/g, '');
  return /^(01[3-9]\d{8}|8801[3-9]\d{8})$/.test(clean);
}

/**
 * Validate POS Sale Checkout payload
 */
export function validateSalePayload(req: Request, res: Response, next: NextFunction) {
  const { items, discount, deliveryCharge, vat, paidAmount } = req.body;
  const errors: ValidationErrorDetail[] = [];

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'Cart items cannot be empty' });
  } else {
    items.forEach((item, index) => {
      if (!item.productId || typeof item.productId !== 'string' || !item.productId.trim()) {
        errors.push({ field: `items[${index}].productId`, message: 'Valid product ID is required' });
      }
      if (!isSafePositiveNumber(item.quantity)) {
        errors.push({
          field: `items[${index}].quantity`,
          message: 'Quantity must be a positive number greater than 0, not NaN or Infinity',
          value: item.quantity,
        });
      }
      if (item.unitPrice !== undefined && !isSafeNonNegativeNumber(item.unitPrice)) {
        errors.push({
          field: `items[${index}].unitPrice`,
          message: 'Unit price must be a non-negative number',
          value: item.unitPrice,
        });
      }
    });
  }

  if (discount !== undefined && !isSafeNonNegativeNumber(discount)) {
    errors.push({ field: 'discount', message: 'Discount must be a non-negative number', value: discount });
  }

  if (deliveryCharge !== undefined && !isSafeNonNegativeNumber(deliveryCharge)) {
    errors.push({ field: 'deliveryCharge', message: 'Delivery charge must be a non-negative number', value: deliveryCharge });
  }

  if (vat !== undefined && !isSafeNonNegativeNumber(vat)) {
    errors.push({ field: 'vat', message: 'VAT must be a non-negative number', value: vat });
  }

  if (paidAmount !== undefined && !isSafeNonNegativeNumber(paidAmount)) {
    errors.push({ field: 'paidAmount', message: 'Paid amount must be a non-negative number', value: paidAmount });
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: errors[0].message,
      details: errors,
      requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
    });
  }

  next();
}

/**
 * Validate Product creation / update payload
 */
export function validateProductPayload(req: Request, res: Response, next: NextFunction) {
  const { name, sellingPrice, purchasePrice, stock } = req.body;
  const errors: ValidationErrorDetail[] = [];

  if (req.method === 'POST') {
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push({ field: 'name', message: 'Product name is required' });
    }
    if (!isSafeNonNegativeNumber(sellingPrice)) {
      errors.push({ field: 'sellingPrice', message: 'Selling price must be a non-negative number', value: sellingPrice });
    }
  }

  if (purchasePrice !== undefined && !isSafeNonNegativeNumber(purchasePrice)) {
    errors.push({ field: 'purchasePrice', message: 'Purchase price must be a non-negative number', value: purchasePrice });
  }

  if (stock !== undefined && !isSafeNonNegativeNumber(stock)) {
    errors.push({ field: 'stock', message: 'Stock must be a non-negative number', value: stock });
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: errors[0].message,
      details: errors,
      requestId: req.id || req.headers['x-request-id'] || `req_${Date.now()}`,
    });
  }

  next();
}

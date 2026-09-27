import React from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import {
  Package,
  Barcode,
  Layers,
  Smartphone,
  ShieldCheck,
  MapPin,
  Calendar,
  Percent,
  Star,
  Printer,
  Edit2,
  DollarSign,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
  onPrintBarcode: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onPrintBarcode,
}) => {
  const { showToast } = useToast();

  if (!isOpen || !product) return null;

  const cost = product.purchasePrice || 0;
  const sellNet = product.sellingPrice - (product.discount || 0);
  const profit = sellNet - cost;
  const marginPct = cost > 0 ? ((profit / cost) * 100).toFixed(1) : sellNet > 0 ? '100' : '0';

  // Expiry check
  let expiryStatus: { isExpired: boolean; daysLeft: number } | null = null;
  if (product.expiryDate) {
    const exp = new Date(product.expiryDate);
    const now = new Date();
    const diffTime = exp.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    expiryStatus = {
      isExpired: daysLeft <= 0,
      daysLeft,
    };
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} কপি করা হয়েছে`, 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="পণ্যের পূর্ণাঙ্গ তথ্য ও বিবরণ"
      subtitle={`আইডি: ${product.id} • ক্যাটাগরি: ${product.category}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="relative w-full sm:w-44 h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {product.isFeatured && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                ফিচারড
              </span>
            )}
            <span
              className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                product.isActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {product.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                {product.category}
              </span>
              {product.subCategory && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                  {product.subCategory}
                </span>
              )}
              {product.brand && (
                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                  ব্র্যান্ড: {product.brand}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>

            {product.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {product.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1 text-slate-600">
                <span className="text-slate-400">SKU:</span>
                <span className="font-mono font-bold text-slate-800">{product.sku}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.sku, 'SKU')}
                  className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-slate-600">
                <span className="text-slate-400">বারকোড:</span>
                <span className="font-mono font-bold text-slate-800">{product.barcode}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.barcode, 'বারকোড')}
                  className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              {product.rackLocation && (
                <div className="flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  <MapPin className="w-3 h-3" />
                  <span>র্যাক / তাক: {product.rackLocation}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Financial Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block">ক্রয়মূল্য (Cost)</span>
            <span className="text-base font-bold font-mono text-slate-700">
              {formatCurrency(product.purchasePrice)}
            </span>
          </div>

          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
            <span className="text-[11px] text-emerald-800 font-semibold block">খুচরা বিক্রয় (MRP)</span>
            <span className="text-base font-bold font-mono text-emerald-700">
              {formatCurrency(sellNet)}
            </span>
            {product.discount > 0 && (
              <div className="text-[10px] text-emerald-600 line-through">
                {formatCurrency(product.sellingPrice)}
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
            <span className="text-[11px] text-blue-800 font-semibold block">পাইকারি মূল্য (Wholesale)</span>
            <span className="text-base font-bold font-mono text-blue-700">
              {product.wholesalePrice ? formatCurrency(product.wholesalePrice) : '—'}
            </span>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-2xl border border-purple-200">
            <span className="text-[11px] text-purple-800 font-semibold block">নিট লাভ ও মার্জিন</span>
            <span className="text-base font-bold font-mono text-purple-700">
              +{formatCurrency(profit)}
            </span>
            <div className="text-[10px] text-purple-600 font-semibold">মার্জিন: {marginPct}%</div>
          </div>
        </div>

        {/* Inventory, Warranty & Expiry Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Package className="w-3.5 h-3.5" />
              <span>স্টক ও পরিমাপ</span>
            </div>
            <div className="font-mono font-bold text-sm text-slate-900">
              {product.stock} {product.unit}
            </div>
            <div className="text-[10px] text-slate-400">ন্যূনতম অ্যালার্ট সীমা: {product.minStock} টি</div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ওয়ারেন্টি মেয়াদ</span>
            </div>
            <div className="font-semibold text-slate-800">
              {product.warrantyPeriod || 'কোনো ওয়ারেন্টি নেই'}
            </div>
            <div className="text-[10px] text-slate-400">ইনভয়েস ও রিসিটে ওয়ারেন্টি মুদ্রিত হবে</div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>মেয়াদ ও ব্যাচ</span>
            </div>
            {product.expiryDate ? (
              <div>
                <span className="font-mono font-bold text-slate-800">{product.expiryDate}</span>
                {expiryStatus && (
                  <span
                    className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      expiryStatus.isExpired
                        ? 'bg-rose-100 text-rose-700'
                        : expiryStatus.daysLeft <= 30
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {expiryStatus.isExpired
                      ? 'মেয়াদোত্তীর্ণ'
                      : `${expiryStatus.daysLeft} দিন বাকি`}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">মেয়াদ তারিখ উল্লেখ নেই</span>
            )}
            {product.batchNumber && (
              <div className="text-[10px] text-slate-500 font-mono">ব্যাচ: {product.batchNumber}</div>
            )}
          </div>
        </div>

        {/* Variants Section (if available) */}
        {product.variants && product.variants.length > 0 && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-100 flex items-center justify-between text-xs font-bold text-purple-900">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>উপলব্ধ ভ্যারিয়েন্ট তালিকা ({(product.variants || []).length} টি)</span>
              </div>
              <span className="font-mono text-purple-700">
                মোট স্টক: {(product.variants || []).reduce((s, v) => s + (Number(v.stock) || 0), 0)} টি
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {(product.variants || []).map((v) => (
                <div key={v.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-800 block">{v.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU: {v.sku || '—'} • বারকোড: {v.barcode || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block">খুচরা দর</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(v.sellingPrice)}
                      </span>
                    </div>
                    {v.wholesalePrice ? (
                      <div>
                        <span className="text-[10px] text-slate-400 block">পাইকারি</span>
                        <span className="font-mono text-slate-700">
                          {formatCurrency(v.wholesalePrice)}
                        </span>
                      </div>
                    ) : null}
                    <div>
                      <span className="text-[10px] text-slate-400 block">স্টক</span>
                      <span className="font-mono font-bold text-emerald-700">{v.stock} টি</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IMEI / Serials Section (if available) */}
        {product.serials && product.serials.length > 0 && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden p-3.5 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>রেকর্ডকৃত আইএমইআই / সিরিয়াল নম্বর ({product.serials.length} টি)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
              {(product.serials || []).map((serial, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-100 font-mono text-[11px] font-semibold"
                >
                  {serial}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => onPrintBarcode(product)}
            >
              বারকোড প্রিন্ট
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="w-4 h-4" />}
              onClick={() => onEdit(product)}
            >
              সম্পাদনা করুন
            </Button>
          </div>

          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            বন্ধ করুন
          </Button>
        </div>
      </div>
    </Modal>
  );
};

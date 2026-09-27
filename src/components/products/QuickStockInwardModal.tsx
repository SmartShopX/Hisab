import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PackagePlus, AlertCircle, CheckCircle2, ArrowRight, Calendar, Hash } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface QuickStockInwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSaveStock: (productId: string, addedStock: number, additionalDetails?: { batchNumber?: string; expiryDate?: string; purchasePrice?: number }) => void;
}

export const QuickStockInwardModal: React.FC<QuickStockInwardModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaveStock,
}) => {
  const [addedStock, setAddedStock] = useState<number | ''>(50);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setAddedStock(50);
      setBatchNumber(product.batchNumber || '');
      setExpiryDate(product.expiryDate || '');
      setPurchasePrice(product.purchasePrice || '');
      setError('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = Number(product.stock) || 0;
  const qty = typeof addedStock === 'number' ? addedStock : 0;
  const newStock = currentStock + qty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || qty <= 0) {
      setError('অনুগ্রহ করে সঠিক স্টক সংখ্যা লিখুন (১ বা তার বেশি)');
      return;
    }

    onSaveStock(product.id, qty, {
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate || undefined,
      purchasePrice: typeof purchasePrice === 'number' && purchasePrice > 0 ? purchasePrice : undefined,
    });
    onClose();
  };

  const quickPills = [10, 20, 50, 100, 200, 500];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="স্টক ইনওয়ার্ড / নতুন মাল যোগ করুন"
      subtitle="দোকানে নতুন চালান বা স্টক আসার পর সরাসরি স্টক সংখ্যা বৃদ্ধি করে বিক্রি চালু করুন"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Identity Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              {product.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
            {product.genericName && (
              <p className="text-xs text-slate-500 font-medium truncate">{product.genericName}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
              <span className="font-semibold">{product.brand || product.manufacturer || 'কোম্পানি'}</span>
              <span>•</span>
              <span className="font-mono">SKU: {product.sku}</span>
            </div>
          </div>
        </div>

        {/* Current vs New Stock Visualizer */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-r from-slate-100 via-indigo-50/60 to-emerald-50 border border-indigo-100 rounded-2xl items-center text-center">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">বর্তমান স্টক</span>
            <span
              className={`text-base font-black font-mono ${
                currentStock === 0 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {currentStock}
            </span>
            <span className="text-[10px] text-slate-400 block">{product.unit.split(' ')[0]}</span>
          </div>

          <div className="flex flex-col items-center justify-center text-indigo-600">
            <ArrowRight className="w-4 h-4" />
            <span className="text-[10px] font-bold text-indigo-700">+{qty} নতুন</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-emerald-700 block uppercase">পরবর্তী মোট স্টক</span>
            <span className="text-base font-black font-mono text-emerald-700">
              {newStock}
            </span>
            <span className="text-[10px] text-emerald-600 block">{product.unit.split(' ')[0]}</span>
          </div>
        </div>

        {/* Quantity Input & Fast Pills */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            নতুন ইনওয়ার্ড সংখ্যা (কতটি পিস যোগ করবেন?) <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={addedStock}
              onChange={(e) => {
                const val = e.target.value;
                setAddedStock(val === '' ? '' : Math.max(1, parseInt(val, 10) || 0));
                setError('');
              }}
              placeholder="যেমন: ৫০"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              autoFocus
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 font-mono">
              {product.unit}
            </span>
          </div>

          {/* Quick Click Quantity Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-500 font-medium">দ্রুত যোগ:</span>
            {quickPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => {
                  setAddedStock(pill);
                  setError('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                  addedStock === pill
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                +{pill}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Optional Inward Details: Batch, Expiry, Cost */}
        <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2.5 text-xs">
          <span className="font-bold text-slate-700 block text-[11px]">
            চালান / লট সংক্রান্ত অতিরিক্ত তথ্য (ঐচ্ছিক):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" />
                ব্যাচ / লট নম্বর
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="যেমন: BEX-2026-A"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                মেয়াদোত্তীর্ণ তারিখ (Expiry Date)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              একক ক্রয়মূল্য (নতুন চালান অনুসারে যদি পরিবর্তন হয়)
            </label>
            <input
              type="number"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={`বর্তমান: ${formatCurrency(product.purchasePrice || 0)}`}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Notice */}
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            স্টক যোগ করার সাথে সাথে POS সেলস স্ক্রিনে পণ্যটি স্বয়ংক্রিয়ভাবে বিক্রির জন্য সক্রিয় হবে।
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            বাতিল
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={<PackagePlus className="w-4 h-4" />}
          >
            স্টক যুক্ত করুন ও বিক্রি চালু করুন
          </Button>
        </div>
      </form>
    </Modal>
  );
};

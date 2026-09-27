import React, { useState, useMemo, useEffect } from 'react';
import { Purchase, Supplier, Product } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { supplierService } from '../../services/supplierService';
import { purchaseApi } from '../../services/apiServices';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Truck,
  Sparkles,
} from 'lucide-react';

export const PurchasesPage: React.FC = () => {
  const { showToast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>(() => DataStore.getPurchases());
  const [suppliers] = useState<Supplier[]>(() => DataStore.getSuppliers());
  const [products] = useState<Product[]>(() => DataStore.getProducts());

  const [search, setSearch] = useState('');
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);

  // New Purchase Form
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(products[0]?.purchasePrice || 500);
  const [discount, setDiscount] = useState<number>(0);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Price intelligence state
  const [priceHistoryData, setPriceHistoryData] = useState<{
    previousPrice: number;
    lowestRate: number;
    highestRate: number;
    averageRate: number;
  }>({
    previousPrice: products[0]?.purchasePrice || 500,
    lowestRate: products[0]?.purchasePrice || 500,
    highestRate: products[0]?.purchasePrice || 500,
    averageRate: products[0]?.purchasePrice || 500,
  });

  // Fetch price history when product changes
  useEffect(() => {
    if (selectedProductId) {
      purchaseApi.getPriceHistory(selectedProductId).then((res) => {
        if (res) {
          setPriceHistoryData({
            previousPrice: res.previousPrice || 0,
            lowestRate: res.lowestRate || 0,
            highestRate: res.highestRate || 0,
            averageRate: res.averageRate || 0,
          });
        }
      });
    }
  }, [selectedProductId]);

  const rawSubtotal = quantity * unitCost;
  const totalCost = Math.max(0, rawSubtotal - discount + transportCost);
  const dueAmount = Math.max(0, totalCost - paidAmount);

  // Real-time comparison metrics
  const prevPrice = priceHistoryData.previousPrice;
  const priceDiff = unitCost - prevPrice;
  const priceDiffAbsolute = Math.abs(priceDiff);
  const priceDiffPercent = prevPrice > 0 ? ((priceDiffAbsolute / prevPrice) * 100).toFixed(1) : '0';
  const priceChangeType = priceDiff > 0.01 ? 'HIGHER' : priceDiff < -0.01 ? 'LOWER' : 'NO_CHANGE';

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.invoiceNumber.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.items.some((it) => it.productName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [purchases, search]);

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    const prod = products.find((p) => p.id === selectedProductId);
    if (!sup || !prod) {
      showToast('সাপ্লায়ার ও পণ্য নির্বাচন করুন', 'warning');
      return;
    }

    try {
      await purchaseApi.create({
        supplierId: sup.id,
        supplierName: sup.company || sup.name,
        items: [
          {
            productId: prod.id,
            productName: prod.name,
            quantity,
            unitCost,
            purchasePrice: unitCost,
            costPrice: unitCost,
            previousPrice: prevPrice,
            priceChangeType,
            priceDiffAbsolute,
            priceDiffPercent: parseFloat(priceDiffPercent),
            total: rawSubtotal,
          },
        ],
        subtotal: rawSubtotal,
        discount,
        transportCost,
        totalAmount: totalCost,
        paidAmount,
        dueAmount,
        notes: `চালান প্রাপ্ত ও স্টকে যুক্ত (${priceChangeType === 'HIGHER' ? 'মূল্য বৃদ্ধি' : priceChangeType === 'LOWER' ? 'মূল্য হ্রাস' : 'অপরিবর্তিত'})`,
      });

      setPurchases(DataStore.getPurchases());
      setIsNewPurchaseModalOpen(false);
      showToast('ক্রয় চালান সফলভাবে রেকর্ড করা হয়েছে এবং পণ্যের স্টক বৃদ্ধি পেয়েছে', 'success');
    } catch {
      showToast('চালান তৈরি করতে সমস্যা হয়েছে', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ক্রয় চালান (Purchases)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            সাপ্লায়ার থেকে কেনা পণ্যের ভাউচার ও স্টক ইন রেকর্ড
          </p>
        </div>

        <Button
          onClick={() => {
            setPaidAmount(totalCost);
            setIsNewPurchaseModalOpen(true);
          }}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          নতুন ক্রয় চালান তৈরি
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="চালান নং, সাপ্লায়ার বা পণ্যের নাম দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">চালান নং ও তারিখ</th>
                <th className="py-3 px-4">সরবরাহকারী (Supplier)</th>
                <th className="py-3 px-4">ক্রয়কৃত পণ্য</th>
                <th className="py-3 px-4">মোট মূল্য</th>
                <th className="py-3 px-4">পরিশোধ</th>
                <th className="py-3 px-4">বকেয়া দেনা</th>
                <th className="py-3 px-4">পেমেন্ট অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-slate-900 block">{p.invoiceNumber}</span>
                    <span className="text-[11px] text-slate-400">{formatDate(p.purchaseDate)}</span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-800">{p.supplierName}</td>

                  <td className="py-3.5 px-4">
                    {(p.items || []).map((it, idx) => (
                      <span key={idx} className="block text-slate-700">
                        {it.productName} ({it.quantity} টি × ৳{it.costPrice})
                      </span>
                    ))}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatCurrency(p.totalAmount)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                    {formatCurrency(p.paidAmount)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-rose-700 font-bold">
                    {p.dueAmount > 0 ? formatCurrency(p.dueAmount) : '—'}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.dueAmount === 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {p.dueAmount === 0 ? 'সম্পূর্ণ পেইড' : 'বকেয়া রয়েছে'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={isNewPurchaseModalOpen}
        onClose={() => setIsNewPurchaseModalOpen(false)}
        title="নতুন ক্রয় চালান তৈরি ও স্টক ইন"
        subtitle="সাপ্লায়ার হতে ক্রয়কৃত পণ্য ইনভয়েসে যুক্ত করলে পণ্যের স্টক স্বয়ংক্রিয়ভাবে বৃদ্ধি পাবে"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              সরবরাহকারী নির্বাচন করুন *
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company} ({s.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্রয়কৃত পণ্য নির্বাচন *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const pr = products.find((p) => p.id === e.target.value);
                if (pr) setUnitCost(pr.purchasePrice);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (বর্তমান স্টক: {p.stock} {p.unit.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পরিমাণ *</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                একক ক্রয়মূল্য (৳) *
              </label>
              <input
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Price Intelligence & Rate Comparison Banner */}
          <div className="p-3 rounded-2xl border text-xs space-y-1.5 transition-all bg-slate-50/80 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">পূর্ববর্তী ক্রয়মূল্য: ৳{prevPrice}</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  priceChangeType === 'HIGHER'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : priceChangeType === 'LOWER'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {priceChangeType === 'HIGHER' && (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>▲ মূল্য বৃদ্ধি: +৳{priceDiffAbsolute} (+{priceDiffPercent}%)</span>
                  </>
                )}
                {priceChangeType === 'LOWER' && (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>▼ মূল্য সাশ্রয়: -৳{priceDiffAbsolute} (-{priceDiffPercent}%)</span>
                  </>
                )}
                {priceChangeType === 'NO_CHANGE' && (
                  <>
                    <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>= পূর্বমূল্য অপরিবর্তিত (৳{prevPrice})</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
              <span>সর্বনিম্ন: ৳{priceHistoryData.lowestRate}</span>
              <span>গড়: ৳{priceHistoryData.averageRate}</span>
              <span>সর্বোচ্চ: ৳{priceHistoryData.highestRate}</span>
            </div>
          </div>

          {/* Cost Summary Box */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>মোট চালানের বিল:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatCurrency(totalCost)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-slate-700">নগদ পরিশোধ (Paid):</span>
              <input
                type="number"
                min={0}
                max={totalCost}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-28 px-2 py-1 text-right font-mono font-bold rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-slate-200">
              <span>সাপ্লায়ারের বকেয়া (Due):</span>
              <span className="font-mono">{formatCurrency(dueAmount)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewPurchaseModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              চালান সংরক্ষণ ও স্টক ইন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

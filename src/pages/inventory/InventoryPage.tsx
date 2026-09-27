import React, { useState, useMemo } from 'react';
import { Product, StockLog } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { inventoryService } from '../../services/inventoryService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Plus,
  History,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>(() => DataStore.getProducts());
  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => DataStore.getStockLogs());

  // Search and view tab
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'levels' | 'low_stock' | 'history'>('levels');

  // Adjustment modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'Stock In' | 'Stock Out' | 'Adjustment'>('Stock In');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('নতুন চালান বা পার্সেল আগমন');

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeTab === 'low_stock' && p.stock > p.minStock) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, search, activeTab]);

  const openAdjust = (p: Product, type: 'Stock In' | 'Stock Out' | 'Adjustment') => {
    setSelectedProduct(p);
    setAdjustType(type);
    setAdjustQuantity(1);
    setAdjustReason(
      type === 'Stock In'
        ? 'নতুন চালান বা পার্সেল আগমন'
        : type === 'Stock Out'
        ? 'নষ্ট / মেয়াদোত্তীর্ণ পণ্য'
        : 'দৈনিক স্টক সংশোধন'
    );
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustQuantity <= 0) return;

    try {
      await inventoryService.adjustStock(
        selectedProduct.id,
        adjustQuantity,
        adjustType,
        adjustReason
      );
      setProducts(DataStore.getProducts());
      setStockLogs(DataStore.getStockLogs());
      setIsAdjustModalOpen(false);
      showToast(
        `${selectedProduct.name} এর স্টক সফলভাবে হালনাগাদ করা হয়েছে (${adjustType})`,
        'success'
      );
    } catch {
      showToast('স্টক সমন্বয় করতে সমস্যা হয়েছে', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ইনভেন্টরি ও স্টক ব্যবস্থাপনা</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            পণ্য মজুত পর্যবেক্ষণ, স্টক ইন/আউট এবং সমন্বয়ের বিস্তারিত লগ
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'levels'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            বর্তমান স্টক ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('low_stock')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'low_stock'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-orange-600 hover:bg-orange-50'
            }`}
          >
            কম স্টক সতর্কতা ({lowStockProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            স্টক লগ হিস্ট্রি
          </button>
        </div>
      </div>

      {activeTab !== 'history' ? (
        <>
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="পণ্য বা SKU দিয়ে সার্চ করুন..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                    <th className="py-3 px-4">পণ্য</th>
                    <th className="py-3 px-4">ক্যাটাগরি</th>
                    <th className="py-3 px-4">বর্তমান মজুত (Stock)</th>
                    <th className="py-3 px-4">অ্যালার্ট লেভেল</th>
                    <th className="py-3 px-4">স্টক ভ্যালু (৳)</th>
                    <th className="py-3 px-4 text-center">দ্রুত সমন্বয় (Stock Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= p.minStock;
                    const stockValue = p.stock * p.purchasePrice;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{p.name}</span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                SKU: {p.sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium">{p.category}</td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block font-mono font-bold px-2.5 py-1 rounded-xl text-xs ${
                              p.stock === 0
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {p.stock} {p.unit.split(' ')[0]}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          মিনিমাম: {p.minStock} {p.unit.split(' ')[0]}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {formatCurrency(stockValue)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              onClick={() => openAdjust(p, 'Stock In')}
                              variant="outline"
                              size="sm"
                              leftIcon={<ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />}
                            >
                              স্টক ইন
                            </Button>
                            <Button
                              onClick={() => openAdjust(p, 'Stock Out')}
                              variant="outline"
                              size="sm"
                              leftIcon={<ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />}
                            >
                              স্টক আউট
                            </Button>
                            <Button
                              onClick={() => openAdjust(p, 'Adjustment')}
                              variant="ghost"
                              size="sm"
                              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
                            >
                              সমন্বয়
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock History Logs Table */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                  <th className="py-3 px-4">পণ্যের নাম</th>
                  <th className="py-3 px-4">অ্যাকশন টাইপ</th>
                  <th className="py-3 px-4 text-center">পরিমাণ</th>
                  <th className="py-3 px-4">পূর্বের স্টক</th>
                  <th className="py-3 px-4">নতুন স্টক</th>
                  <th className="py-3 px-4">কারণ / রেফারেন্স</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{log.productName}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          log.type === 'Stock In'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.type === 'Stock Out'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {log.quantity}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{log.previousStock}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {log.newStock}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`স্টক সমন্বয়: ${selectedProduct.name}`}
          subtitle={`বর্তমান মজুত: ${selectedProduct.stock} ${selectedProduct.unit}`}
          maxWidth="sm"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সমন্বয়ের ধরন
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Stock In', 'Stock Out', 'Adjustment'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAdjustType(t)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      adjustType === t
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'Stock In' ? 'স্টক ইন (+)' : t === 'Stock Out' ? 'স্টক আউট (-)' : 'রিপ্লেস'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পরিমাণ ({selectedProduct.unit}) *
              </label>
              <input
                type="number"
                min={1}
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                কারণ বা রেফারেন্স নোট
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="যেমন: নতুন পার্সেল ডেলিভারি"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdjustModalOpen(false)}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" size="sm">
                স্টক আপডেট নিশ্চিত করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

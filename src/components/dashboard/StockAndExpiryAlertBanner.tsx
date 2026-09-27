import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { useNavigate } from 'react-router-dom';
import { getExpiryStatus } from '../../utils/pharmacyHelper';
import { formatCurrency } from '../../utils/formatters';
import {
  AlertTriangle,
  Clock,
  PackageX,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  PlusCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../common/Button';

interface StockAndExpiryAlertBannerProps {
  products: Product[];
  onQuickStockInward?: (product: Product) => void;
}

export const StockAndExpiryAlertBanner: React.FC<StockAndExpiryAlertBannerProps> = ({
  products,
  onQuickStockInward,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'stock' | 'expiry'>('all');

  const { outOfStockList, lowStockList, expiredList, nearExpiryList } = useMemo(() => {
    const outOfStock: Product[] = [];
    const lowStock: Product[] = [];
    const expired: Product[] = [];
    const nearExpiry: Product[] = [];

    products.forEach((p) => {
      if (!p.isActive) return;

      // Stock check
      if (p.stock <= 0) {
        outOfStock.push(p);
      } else if (p.stock <= (p.minStockLevel || 5)) {
        lowStock.push(p);
      }

      // Expiry check
      if (p.expiryDate) {
        const exp = getExpiryStatus(p.expiryDate, 60);
        if (exp.isExpired) {
          expired.push(p);
        } else if (exp.isNearExpiry) {
          nearExpiryListPush(nearExpiry, p);
        }
      }
    });

    function nearExpiryListPush(list: Product[], item: Product) {
      list.push(item);
    }

    return {
      outOfStockList: outOfStock,
      lowStockList: lowStock,
      expiredList: expired,
      nearExpiryList: nearExpiry,
    };
  }, [products]);

  const totalStockAlerts = outOfStockList.length + lowStockList.length;
  const totalExpiryAlerts = expiredList.length + nearExpiryList.length;
  const totalAlerts = totalStockAlerts + totalExpiryAlerts;

  if (totalAlerts === 0) return null;

  // Filtered displayed items
  const displayedItems = useMemo(() => {
    if (activeTab === 'stock') {
      return [
        ...(outOfStockList || []).map((p) => ({ ...p, alertType: 'OUT_OF_STOCK' as const })),
        ...(lowStockList || []).map((p) => ({ ...p, alertType: 'LOW_STOCK' as const })),
      ];
    }
    if (activeTab === 'expiry') {
      return [
        ...(expiredList || []).map((p) => ({ ...p, alertType: 'EXPIRED' as const })),
        ...(nearExpiryList || []).map((p) => ({ ...p, alertType: 'NEAR_EXPIRY' as const })),
      ];
    }
    // All
    return [
      ...(outOfStockList || []).map((p) => ({ ...p, alertType: 'OUT_OF_STOCK' as const })),
      ...(expiredList || []).map((p) => ({ ...p, alertType: 'EXPIRED' as const })),
      ...(nearExpiryList || []).map((p) => ({ ...p, alertType: 'NEAR_EXPIRY' as const })),
      ...(lowStockList || []).map((p) => ({ ...p, alertType: 'LOW_STOCK' as const })),
    ].slice(0, 8);
  }, [activeTab, outOfStockList, lowStockList, expiredList, nearExpiryList]);

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/80 rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                দৈনন্দিন স্টক ও মেয়াদোত্তীর্ণ সতর্কতা (Smart Stock & Expiry Alert)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold font-mono">
                {totalAlerts} টি নোটিশ
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              আজকের বিক্রয় ও কাস্টমার সন্তুষ্টি ধরে রাখতে দ্রুত স্টক রিলোড ও মেয়াদ পর্যবেক্ষণ করুন
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl hover:bg-amber-100/60 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isExpanded ? 'লুকান' : 'বিস্তারিত দেখুন'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-amber-200/60 space-y-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              সবগুলো অ্যালার্ট ({totalAlerts})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stock'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <PackageX className="w-3.5 h-3.5 text-rose-500" />
              <span>স্টক আউট ও কম স্টক ({totalStockAlerts})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expiry')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'expiry'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>মেয়াদোত্তীর্ণ ও আসন্ন মেয়াদ ({totalExpiryAlerts})</span>
            </button>
          </div>

          {/* Alert Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(displayedItems || []).map((item) => {
              const isStockOut = item.alertType === 'OUT_OF_STOCK';
              const isExpired = item.alertType === 'EXPIRED';
              const isNearExp = item.alertType === 'NEAR_EXPIRY';

              return (
                <div
                  key={`${item.id}_${item.alertType}`}
                  className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate flex-1">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isStockOut || isExpired
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isStockOut && 'স্টক শেষ (০)'}
                        {isExpired && `মেয়াদ শেষ (${item.expiryDate})`}
                        {isNearExp && `মেয়াদ আসন্ন (${item.expiryDate})`}
                        {item.alertType === 'LOW_STOCK' && `কম স্টক: ${item.stock} ${item.unit}`}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {onQuickStockInward && (
                      <button
                        type="button"
                        onClick={() => onQuickStockInward(item)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                        title="দ্রুত স্টক যোগ করুন"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Nav Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-slate-500">
              টিপস: স্টক শেষ হওয়ার আগেই সাপ্লায়ারের কাছে পারচেজ অর্ডার পাঠিয়ে দিন
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/purchases')}
                variant="outline"
                size="sm"
                className="bg-white text-slate-800 border-slate-300"
                leftIcon={<Truck className="w-3.5 h-3.5" />}
              >
                সাপ্লায়ার চালান তৈরি করুন
              </Button>
              <Button
                onClick={() => navigate('/products')}
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                সব পণ্য ক্যাটালগ দেখুন
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

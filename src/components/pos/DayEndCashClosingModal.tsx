import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  cashRegisterService,
  CashRegisterClosing,
} from '../../services/cashRegisterService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  MinusCircle,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Printer,
  History,
  Coins,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';

interface DayEndCashClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const DayEndCashClosingModal: React.FC<DayEndCashClosingModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { user, shop } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'closing' | 'history'>('closing');
  const [openingCashInput, setOpeningCashInput] = useState<number>(2000);
  const [physicalCashInput, setPhysicalCashInput] = useState<string>('');
  const [closingNote, setClosingNote] = useState<string>('');
  const [historyList, setHistoryList] = useState<CashRegisterClosing[]>([]);

  // Calculate live day stats
  const stats = useMemo(() => {
    return cashRegisterService.calculateDayStats(undefined, openingCashInput);
  }, [openingCashInput, isOpen]);

  // Load history
  useEffect(() => {
    if (isOpen) {
      const history = cashRegisterService.getClosingHistory();
      setHistoryList(history);

      // Check if already closed today
      const today = new Date().toISOString().split('T')[0];
      const existing = cashRegisterService.getClosingForDate(today);
      if (existing) {
        setOpeningCashInput(existing.openingCash);
        setPhysicalCashInput(existing.physicalDrawerCash.toString());
        setClosingNote(existing.note || '');
      } else {
        setPhysicalCashInput(stats.expectedDrawerCash.toString());
      }
    }
  }, [isOpen]);

  const countedCash = Number(physicalCashInput) || 0;
  const difference = countedCash - stats.expectedDrawerCash;

  const isBalanced = Math.abs(difference) < 1;
  const isShortage = difference < -1;
  const isExcess = difference > 1;

  const handleSaveClosing = () => {
    const today = new Date().toISOString().split('T')[0];

    let status: 'BALANCED' | 'SHORTAGE' | 'EXCESS' = 'BALANCED';
    if (isShortage) status = 'SHORTAGE';
    if (isExcess) status = 'EXCESS';

    const closingRecord: CashRegisterClosing = {
      id: `cls_${Date.now()}`,
      date: today,
      closedAt: new Date().toISOString(),
      closedBy: user?.name || 'প্রধান ক্যাশিয়ার',
      openingCash: stats.openingCash,
      cashSales: stats.cashSales,
      digitalSales: stats.digitalSales,
      cashDueCollected: stats.cashDueCollected,
      cashExpenses: stats.cashExpenses,
      expectedDrawerCash: stats.expectedDrawerCash,
      physicalDrawerCash: countedCash,
      difference,
      status,
      totalSalesAmount: stats.totalSalesAmount,
      estimatedCostOfGoods: stats.estimatedCostOfGoods,
      grossProfit: stats.grossProfit,
      netProfit: stats.netProfit,
      note: closingNote.trim() || undefined,
      breakdown: {
        ordersCount: stats.ordersCount,
        cashOrdersCount: stats.cashOrdersCount,
        digitalOrdersCount: stats.digitalOrdersCount,
      },
    };

    cashRegisterService.saveClosing(closingRecord);
    setHistoryList(cashRegisterService.getClosingHistory());
    showToast('আজকের দিনশেষের ক্যাশ হিসাব সফলভাবে ক্লোজ ও সংরক্ষণ করা হয়েছে!', 'success');
    if (onSaved) onSaved();
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="দিনশেষের ক্যাশ ড্রয়ার ক্লোজিং ও নিট লাভ (Day-End Register Closing)"
      subtitle="ক্যাশ কাউন্টারের দৈনন্দিন হিসাব সমন্বয়, ড্রয়ার ক্যাশ মেলানো ও নিট লাভ খতিয়ান"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('closing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'closing'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>আজকের ক্লোজিং ফরম</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>বিগত দিনের ক্লোজিং ইতিহাস ({historyList.length})</span>
          </button>
        </div>

        {activeTab === 'closing' ? (
          <div className="space-y-5">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500">মোট বিক্রয় (অর্ডার: {stats.ordersCount})</p>
                <p className="text-base sm:text-lg font-black font-mono text-slate-900 mt-1">
                  {formatCurrency(stats.totalSalesAmount)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  নগদ: {formatCurrency(stats.cashSales)} | ডিজিটাল: {formatCurrency(stats.digitalSales)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <p className="text-[11px] font-semibold text-emerald-800">নগদ বকেয়া আদায়</p>
                <p className="text-base sm:text-lg font-black font-mono text-emerald-700 mt-1">
                  +{formatCurrency(stats.cashDueCollected)}
                </p>
                <p className="text-[10px] text-emerald-600 mt-0.5">বাকি খাতা থেকে সংগ্রহ</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <p className="text-[11px] font-semibold text-rose-800">নগদ দোকান খরচ</p>
                <p className="text-base sm:text-lg font-black font-mono text-rose-700 mt-1">
                  -{formatCurrency(stats.cashExpenses)}
                </p>
                <p className="text-[10px] text-rose-600 mt-0.5">চা/নাস্তা, ভাড়া ও ভ্যানভাড়া</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
                <p className="text-[11px] font-semibold text-indigo-800">আজকের আনুমানিক নিট লাভ</p>
                <p className="text-base sm:text-lg font-black font-mono text-indigo-700 mt-1">
                  {formatCurrency(stats.netProfit)}
                </p>
                <p className="text-[10px] text-indigo-600 mt-0.5">গ্রস লাভ - আজকের খরচ</p>
              </div>
            </div>

            {/* Reconciliation Calculator Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">ক্যাশ ড্রয়ার রিকনসিলিয়েশন (Drawer Cash Match)</h3>
                    <p className="text-xs text-slate-300">হাতে থাকা আসল নগদ টাকা হিসাবের সাথে মেলান</p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  তারিখ: {stats.date} | ক্যাশিয়ার: {user?.name || 'এডমিন'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Expected Math */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                    <span className="text-slate-300">সকালের প্রারম্ভিক ক্যাশ (Opening Float):</span>
                    <input
                      type="number"
                      value={openingCashInput}
                      onChange={(e) => setOpeningCashInput(Number(e.target.value) || 0)}
                      className="w-28 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-right font-mono text-white text-xs focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                    <span className="text-slate-300">(+) আজকের নগদ বিক্রয়:</span>
                    <span className="font-mono font-bold text-emerald-400">+{formatCurrency(stats.cashSales)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                    <span className="text-slate-300">(+) নগদ বকেয়া আদায়:</span>
                    <span className="font-mono font-bold text-emerald-400">+{formatCurrency(stats.cashDueCollected)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-700/60">
                    <span className="text-slate-300">(-) নগদ দোকান খরচ:</span>
                    <span className="font-mono font-bold text-rose-400">-{formatCurrency(stats.cashExpenses)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-sm font-bold">
                    <span className="text-slate-200">ড্রয়ারে নগদ থাকার কথা (Expected Cash):</span>
                    <span className="font-mono text-emerald-400 text-base">{formatCurrency(stats.expectedDrawerCash)}</span>
                  </div>
                </div>

                {/* Right: Physical Count & Difference */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-700 flex flex-col justify-between space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      কাউন্টারের ড্রয়ারে গুনে পাওয়া আসল ক্যাশ (Physical Count) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        value={physicalCashInput}
                        onChange={(e) => setPhysicalCashInput(e.target.value)}
                        placeholder="যেমন: ১৫৭৫০"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-600 text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Difference Badge */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isBalanced
                        ? 'bg-emerald-900/40 border-emerald-600 text-emerald-300'
                        : isShortage
                        ? 'bg-rose-900/40 border-rose-600 text-rose-300'
                        : 'bg-amber-900/40 border-amber-600 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isBalanced ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                      <div>
                        <p className="text-xs font-bold">
                          {isBalanced
                            ? 'ক্যাশ হুবহু মিলে গেছে! (Perfect Match)'
                            : isShortage
                            ? 'ক্যাশ কম আছে (Shortage)'
                            : 'অতিরিক্ত ক্যাশ আছে (Surplus)'}
                        </p>
                        <p className="text-[10px] opacity-80">
                          {isBalanced
                            ? 'কোনো গরমিল নেই'
                            : isShortage
                            ? 'ড্রয়ারে হিসাবের চেয়ে কম ক্যাশ পাওয়া গেছে'
                            : 'ড্রয়ারে হিসাবের চেয়ে বেশি ক্যাশ পাওয়া গেছে'}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-black">
                      {difference > 0 ? `+৳${difference.toLocaleString('bn-BD')}` : `৳${difference.toLocaleString('bn-BD')}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note / Remarks */}
              <div>
                <input
                  type="text"
                  value={closingNote}
                  onChange={(e) => setClosingNote(e.target.value)}
                  placeholder="কোনো বিশেষ নোট বা মন্তব্য থাকলে লিখুন (ঐচ্ছিক)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                onClick={handlePrintZReport}
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
              >
                প্রিন্ট রিপোর্ট (Z-Report)
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button onClick={onClose} variant="secondary" size="sm">
                  বন্ধ করুন
                </Button>
                <Button
                  onClick={handleSaveClosing}
                  variant="primary"
                  size="sm"
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  দিনশেষে ড্রয়ার ক্লোজ ও সংরক্ষণ করুন
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* History View */
          <div className="space-y-3">
            {historyList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                এখনো কোনো ক্যাশ ড্রয়ার ক্লোজিং হিস্টোরি সংরক্ষিত নেই।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {historyList.map((item) => (
                  <div key={item.id} className="p-3.5 sm:p-4 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">{item.date}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'BALANCED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'SHORTAGE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status === 'BALANCED' ? 'মিলে গেছে' : item.status === 'SHORTAGE' ? 'কম ছিল' : 'বেশি ছিল'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        ক্যাশিয়ার: {item.closedBy} | ক্লোজ টাইম: {formatDateTime(item.closedAt)}
                      </p>
                      {item.note && <p className="text-[11px] text-slate-600 italic">নোট: {item.note}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-right font-mono shrink-0">
                      <div>
                        <p className="text-[10px] text-slate-400">মোট বিক্রয়</p>
                        <p className="font-bold text-slate-800">{formatCurrency(item.totalSalesAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">ড্রয়ার ক্যাশ</p>
                        <p className="font-bold text-emerald-700">{formatCurrency(item.physicalDrawerCash)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">নিট লাভ</p>
                        <p className="font-bold text-indigo-700">{formatCurrency(item.netProfit)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

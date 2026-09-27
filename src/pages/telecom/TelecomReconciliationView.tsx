import React, { useState, useEffect } from 'react';
import { TelecomBalance, TelecomDailyClosing } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Calculator,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  DollarSign,
  Smartphone,
  CreditCard,
  History,
  TrendingDown,
  TrendingUp,
  Save,
  Trash2,
  HelpCircle,
} from 'lucide-react';

interface TelecomReconciliationViewProps {
  balances: TelecomBalance[];
  closings: TelecomDailyClosing[];
  onSaveClosing: (closing: Omit<TelecomDailyClosing, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteClosing: (id: string) => Promise<void>;
}

export const TelecomReconciliationView: React.FC<TelecomReconciliationViewProps> = ({
  balances,
  closings,
  onSaveClosing,
  onDeleteClosing,
}) => {
  const { showToast } = useToast();

  // Closing Form State
  const [closingDate, setClosingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [simValues, setSimValues] = useState<{ [id: string]: number }>({});
  const [cashInDrawer, setCashInDrawer] = useState<number | ''>(18500);
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize simValues from current live balances
  useEffect(() => {
    const initialMap: { [id: string]: number } = {};
    balances.forEach((b) => {
      initialMap[b.id] = b.balance;
    });
    setSimValues(initialMap);
  }, [balances]);

  const handleSimBalanceChange = (id: string, val: number) => {
    setSimValues((prev) => ({
      ...prev,
      [id]: val,
    }));
  };

  // Calculations
  const rechargeSims = balances.filter((b) => b.category === 'RECHARGE');
  const mfsSims = balances.filter((b) => b.category === 'MFS');

  const totalRechargeFloat = rechargeSims.reduce((sum, b) => sum + (simValues[b.id] ?? b.balance), 0);
  const totalMfsFloat = mfsSims.reduce((sum, b) => sum + (simValues[b.id] ?? b.balance), 0);
  const totalDigitalFloat = totalRechargeFloat + totalMfsFloat;
  const currentDrawerCash = Number(cashInDrawer) || 0;
  const totalClosingAssets = totalDigitalFloat + currentDrawerCash;

  // Comparison with the latest saved closing
  const previousClosing = closings.length > 0 ? closings[0] : null;
  const varianceFromPrevious = previousClosing
    ? totalClosingAssets - previousClosing.totalClosingAssets
    : 0;

  const handleSaveClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDrawerCash < 0) {
      showToast('ক্যাশ ড্রয়ারের সঠিক পরিমাণ লিখুন', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const closingSims = balances.map((b) => ({
        provider: b.provider,
        category: b.category,
        simNumber: b.simNumber,
        closingBalance: simValues[b.id] ?? b.balance,
      }));

      await onSaveClosing({
        date: closingDate,
        simBalances: closingSims,
        cashInDrawer: currentDrawerCash,
        totalFloat: totalDigitalFloat,
        totalClosingAssets,
        notes: closingNotes.trim() || undefined,
      });

      setClosingNotes('');
      showToast('আজকের টেলিকম ব্যালেন্স সফলভাবে ক্লোজ ও সংরক্ষণ করা হয়েছে', 'success');
    } catch {
      showToast('ব্যালেন্স ক্লোজ সেভ করা যায়নি', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              টেলিকম ব্যালেন্স রিকনসিলিয়েশন ও দিন শেষের ক্লোজিং (Daily Closing)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
              ক্যাশ শর্ট রোধ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            সকল রিচার্জ সিম + বিকাশ/নগদ এজেন্ট ব্যালেন্স + ক্যাশ ড্রয়ার নগদ টাকার একক সমন্বয়
          </p>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>সর্বশেষ ক্লোজিং:</span>
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
            {previousClosing ? previousClosing.date : 'কোনো রেকর্ড নেই'}
          </span>
        </div>
      </div>

      {/* Live Financial Health Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/15 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">রিচার্জ সিম ব্যালেন্স</span>
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-0.5">
            {formatCurrency(totalRechargeFloat)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">জিপি, রবি, বাংলালিংক ব্যালেন্স</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-pink-200 bg-pink-50/15 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">এমএফএস ওয়ালেট ব্যালেন্স</span>
            <CreditCard className="w-3.5 h-3.5 text-pink-600" />
          </div>
          <div className="text-xl font-bold font-mono text-pink-700 mt-0.5">
            {formatCurrency(totalMfsFloat)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">বিকাশ ও নগদ এজেন্ট ওয়ালেট</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/15 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">ক্যাশ ড্রয়ারে নগদ ক্যাশ</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">
            {formatCurrency(currentDrawerCash)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">টেলিকম কাউন্টারের নগদ টাকা</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-300 bg-emerald-50/30 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800">মোট টেলিকম কার্যকরী সম্পদ</span>
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-700 mt-0.5">
            {formatCurrency(totalClosingAssets)}
          </div>
          <div className="flex items-center gap-1 text-[10px] mt-0.5">
            {varianceFromPrevious >= 0 ? (
              <span className="text-emerald-700 font-mono font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +{formatCurrency(varianceFromPrevious)} (পূর্বের তুলনায়)
              </span>
            ) : (
              <span className="text-rose-600 font-mono font-bold flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" /> {formatCurrency(varianceFromPrevious)} (পূর্বের তুলনায়)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Closing Sheet */}
      <form onSubmit={handleSaveClosing} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>আজকের ব্যালেন্স ক্লোজিং শিট</span>
              <span className="text-xs font-normal text-slate-500">
                (সিমগুলো চেক করে বর্তমান ব্যালেন্স ইনপুট দিন)
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">ক্লোজিং তারিখ:</label>
            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 font-mono"
              required
            />
          </div>
        </div>

        {/* Multi-SIM Inputs Grid */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              ১. ফ্লেক্সিলোড / ইজিলোড সিম সমূহের ক্লোজিং ব্যালেন্স
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rechargeSims.map((sim) => (
                <div key={sim.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{sim.provider}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{sim.simNumber}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={simValues[sim.id] ?? sim.balance}
                      onChange={(e) => handleSimBalanceChange(sim.id, Number(e.target.value) || 0)}
                      className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-pink-600" />
              ২. বিকাশ, নগদ ও এমএফএস ওয়ালেট ক্লোজিং ব্যালেন্স
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mfsSims.map((sim) => (
                <div key={sim.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{sim.provider}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{sim.simNumber}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={simValues[sim.id] ?? sim.balance}
                      onChange={(e) => handleSimBalanceChange(sim.id, Number(e.target.value) || 0)}
                      className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Cash in Drawer Input */}
          <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 space-y-2">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-600" />
              ৩. ক্যাশ ড্রয়ারে কাউন্ট করা নগদ টাকা (Physical Cash)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  value={cashInDrawer}
                  onChange={(e) => setCashInDrawer(Number(e.target.value) || '')}
                  placeholder="কাউন্টারের ক্যাশ টাকা লিখুন"
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-amber-300 text-sm font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="নোট: যেমন - আজ কোনো ক্যাশ শর্ট নেই / ৳৫০ বাড়তি"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Footer & Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-mono">
              ডিজিটাল ফ্লট: <strong>{formatCurrency(totalDigitalFloat)}</strong>
            </span>
            <span>+</span>
            <span className="font-mono">
              নগদ ক্যাশ: <strong>{formatCurrency(currentDrawerCash)}</strong>
            </span>
            <span>=</span>
            <span className="text-sm font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              সর্বমোট: {formatCurrency(totalClosingAssets)}
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={isSaving}
            className="shadow-sm"
          >
            আজকের টেলিকম ব্যালেন্স সংরক্ষণ করুন
          </Button>
        </div>
      </form>

      {/* Historical Closings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500" />
            পূর্ববর্তী টেলিকম ক্লোজিং ইতিহাস ({closings.length} টি রেকর্ড)
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">তারিখ</th>
                <th className="py-2.5 px-3 font-semibold">ডিজিটাল ফ্লট</th>
                <th className="py-2.5 px-3 font-semibold">ক্যাশ ড্রয়ার</th>
                <th className="py-2.5 px-3 font-semibold">মোট টেলিকম সম্পদ</th>
                <th className="py-2.5 px-3 font-semibold">মন্তব্য ও অডিট নোট</th>
                <th className="py-2.5 px-3 font-semibold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    কোনো পূর্ববর্তী ক্লোজিং রেকর্ড নেই
                  </td>
                </tr>
              ) : (
                closings.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {c.date}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {formatCurrency(c.totalFloat)}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-700 font-semibold whitespace-nowrap">
                      {formatCurrency(c.cashInDrawer)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {formatCurrency(c.totalClosingAssets)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {c.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onDeleteClosing(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

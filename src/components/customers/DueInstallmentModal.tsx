import React, { useState } from 'react';
import { Customer, DueInstallmentPlan, DueInstallmentItem, PaymentMethod } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { dueInstallmentService } from '../../services/dueInstallmentService';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Printer,
  Plus,
  ArrowRight,
  Receipt,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Tag,
  Calculator,
} from 'lucide-react';

interface DueInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export const DueInstallmentModal: React.FC<DueInstallmentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'schedule' | 'create'>('schedule');
  const [numInstallments, setNumInstallments] = useState<number>(3);
  const [intervalDays, setIntervalDays] = useState<number>(30); // 7, 15, 30
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [planNotes, setPlanNotes] = useState<string>('');

  // Selected installment to pay
  const [selectedPlan, setSelectedPlan] = useState<DueInstallmentPlan | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<DueInstallmentItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!customer) return null;

  const currentPlans = customer.installmentPlans || [];
  const hasActivePlan = currentPlans.some((p) => p.status === 'Active');

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (customer.totalDue <= 0) {
      showToast('গ্রাহকের কোনো বকেয়া নেই', 'warning');
      return;
    }

    try {
      const plan = dueInstallmentService.createInstallmentPlan(
        customer.id,
        numInstallments,
        intervalDays,
        startDate,
        planNotes
      );
      showToast(`${customer.name} এর জন্য ${numInstallments} কিস্তির পরিকল্পনা তৈরি হয়েছে`, 'success');
      setActiveTab('schedule');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'কিস্তি প্ল্যান তৈরিতে সমস্যা হয়েছে', 'error');
    }
  };

  const handlePayInstallment = async (plan: DueInstallmentPlan, item: DueInstallmentItem) => {
    setIsSubmitting(true);
    try {
      await dueInstallmentService.payInstallment(
        customer.id,
        plan.id,
        item.id,
        item.amount,
        paymentMethod,
        `কিস্তি #${item.installmentNo}`
      );
      showToast(`কিস্তি #${item.installmentNo} (৳${item.amount}) সফলভাবে আদায় হয়েছে`, 'success');
      setSelectedInstallment(null);
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'পরিশোধ করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="কিস্তি ও ইএমআই শিডিউল (Installment & EMI Management)"
      subtitle={`গ্রাহক: ${customer.name} | বর্তমান মোট বাকি: ${formatCurrency(customer.totalDue)}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              চলমান কিস্তি তালিকা ({currentPlans.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              + নতুন কিস্তি প্ল্যান তৈরি
            </button>
          </div>

          {currentPlans.length > 0 && (
            <button
              type="button"
              onClick={handlePrintSchedule}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>শিডিউল প্রিন্ট</span>
            </button>
          )}
        </div>

        {activeTab === 'create' ? (
          /* CREATE NEW INSTALLMENT FORM */
          <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  মোট বকেয়া {formatCurrency(customer.totalDue)} কে কিস্তিতে রূপান্তর
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  গ্রাহক সুবিধাজনক সময়ে কয়েক ধাপে বাকি পরিশোধের জন্য কিস্তি শিডিউল তৈরি করুন।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  কিস্তির সংখ্যা (Number of Installments)
                </label>
                <select
                  value={numInstallments}
                  onChange={(e) => setNumInstallments(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold font-mono"
                >
                  <option value={2}>২ কিস্তি (প্রতি কিস্তি ৳{Math.round(customer.totalDue / 2)})</option>
                  <option value={3}>৩ কিস্তি (প্রতি কিস্তি ৳{Math.round(customer.totalDue / 3)})</option>
                  <option value={4}>৪ কিস্তি (প্রতি কিস্তি ৳{Math.round(customer.totalDue / 4)})</option>
                  <option value={6}>৬ কিস্তি (প্রতি কিস্তি ৳{Math.round(customer.totalDue / 6)})</option>
                  <option value={10}>১০ কিস্তি (প্রতি কিস্তি ৳{Math.round(customer.totalDue / 10)})</option>
                  <option value={12}>১২ কিস্তি (প্রতি কিস্তি ৳{Math.round(customer.totalDue / 12)})</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  কিস্তির ব্যবধান (Interval)
                </label>
                <select
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                >
                  <option value={7}>সাপ্তাহিক (৭ দিন পর পর)</option>
                  <option value={15}>পাক্ষিক (১৫ দিন পর পর)</option>
                  <option value={30}>মাসিক (৩০ দিন পর পর)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  প্রথম কিস্তির তারিখ (Start Date)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                বিশেষ মন্তব্য বা জামিনদার তথ্য (Optional)
              </label>
              <input
                type="text"
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                placeholder="যেমন: মৌখিক সম্মতি অনুযায়ী প্রতি মাসের ৫ তারিখে পরিশোধ"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            {/* Live Installment Preview */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                শিডিউল প্রিভিউ (Schedule Preview):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({ length: numInstallments }).map((_, idx) => {
                  const d = new Date(startDate);
                  d.setDate(d.getDate() + idx * intervalDays);
                  const approxAmount = Math.round(customer.totalDue / numInstallments);
                  return (
                    <div
                      key={idx}
                      className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          কিস্তি #{idx + 1}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {d.toISOString().split('T')[0]}
                        </p>
                      </div>
                      <span className="font-bold font-mono text-emerald-600">
                        {formatCurrency(approxAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('schedule')}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary" size="sm">
                কিস্তি শিডিউল সেভ করুন
              </Button>
            </div>
          </form>
        ) : (
          /* ACTIVE INSTALLMENT SCHEDULES VIEW */
          <div className="space-y-4">
            {currentPlans.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <Layers className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  কোনো সক্রিয় কিস্তি প্ল্যান নেই
                </p>
                <p className="text-xs text-slate-500">
                  গ্রাহকের বকেয়া পরিশোধ সহজ করতে একটি কিস্তি প্ল্যান তৈরি করুন।
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('create')}
                  className="mt-2"
                >
                  + কিস্তি প্ল্যান তৈরি করুন
                </Button>
              </div>
            ) : (
              currentPlans.map((plan) => {
                const paidCount = plan.installments.filter((i) => i.status === 'Paid').length;
                const progressPct = Math.round((paidCount / plan.numberOfInstallments) * 100);

                return (
                  <div
                    key={plan.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    {/* Plan Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            {plan.numberOfInstallments} কিস্তির পরিকল্পনা
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              plan.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {plan.status === 'Completed' ? 'পরিশোধিত' : 'চলমান'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          শুরু: {plan.startDate} • ব্যবধান: {plan.intervalDays} দিন পর পর
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold font-mono text-emerald-600">
                          {paidCount}/{plan.numberOfInstallments} কিস্তি আদায় ({progressPct}%)
                        </span>
                        <div className="w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Installments Table / Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {plan.installments.map((item) => {
                        const isPaid = item.status === 'Paid';
                        const isOverdue = item.status === 'Overdue';

                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border transition-all text-xs ${
                              isPaid
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                : isOverdue
                                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                                : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                কিস্তি #{item.installmentNo}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                  isPaid
                                    ? 'bg-emerald-600 text-white'
                                    : isOverdue
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200'
                                }`}
                              >
                                {isPaid ? 'আদায় সম্পন্ন' : isOverdue ? 'বকেয়া অতিক্রান্ত' : 'প্রতীক্ষিত'}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-baseline justify-between">
                              <div>
                                <p className="text-[10px] text-slate-400">নির্ধারিত তারিখ</p>
                                <p className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                                  {item.dueDate}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                                {formatCurrency(item.amount)}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="mt-2 pt-1.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                              {isPaid ? (
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                                  {item.paidDate} ({item.receiptNumber})
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handlePayInstallment(plan, item)}
                                  className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Receipt className="w-3 h-3" />
                                  <span>আদায় করুন</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DueInstallmentModal;

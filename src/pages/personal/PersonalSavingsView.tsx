import React, { useState } from 'react';
import { DataStore } from '../../services/dataStorage';
import { personalApi } from '../../services/apiServices';
import { PersonalSavingsRecord, PersonalSavingsType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  PiggyBank,
  Plus,
  Landmark,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  DollarSign,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

interface PersonalSavingsViewProps {
  onTransactionAdded?: () => void;
}

export const PersonalSavingsView: React.FC<PersonalSavingsViewProps> = ({ onTransactionAdded }) => {
  const { showToast } = useToast();
  const [savingsList, setSavingsList] = useState<PersonalSavingsRecord[]>(() =>
    DataStore.getPersonalSavings()
  );
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentDay = new Date().getDate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [type, setType] = useState<PersonalSavingsType>('DPS');
  const [monthlyInstallment, setMonthlyInstallment] = useState<number | ''>('');
  const [installmentDay, setInstallmentDay] = useState<number | ''>(10);
  const [totalDeposited, setTotalDeposited] = useState<number | ''>('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [maturityDate, setMaturityDate] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Installment Modal
  const [paymentModalSavings, setPaymentModalSavings] = useState<PersonalSavingsRecord | null>(null);
  const [payWallet, setPayWallet] = useState<'Cash' | 'Bank' | 'bKash' | 'Nagad'>('Bank');
  const [payAmount, setPayAmount] = useState<number | ''>('');

  const updateSavings = (list: PersonalSavingsRecord[]) => {
    setSavingsList(list);
    DataStore.setPersonalSavings(list);
  };

  const totalAccumulated = savingsList.reduce((sum, s) => sum + s.totalDeposited, 0);
  const totalMonthlyCommitment = savingsList
    .filter((s) => s.status === 'Active' && s.monthlyInstallment)
    .reduce((sum, s) => sum + (s.monthlyInstallment || 0), 0);
  const totalTargetExpected = savingsList.reduce((sum, s) => sum + (s.targetAmount || s.totalDeposited), 0);

  const handleCreateSavings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !institution.trim() || !totalDeposited) {
      showToast('সঠিক শিরোনাম, ব্যাংকের নাম ও জমার পরিমাণ প্রদান করুন', 'warning');
      return;
    }

    const newRecord: PersonalSavingsRecord = {
      id: `ps_${Date.now()}`,
      title: title.trim(),
      institution: institution.trim(),
      accountNumber: accountNumber.trim() || undefined,
      type,
      monthlyInstallment: monthlyInstallment ? Number(monthlyInstallment) : undefined,
      installmentDay: installmentDay ? Number(installmentDay) : undefined,
      totalDeposited: Number(totalDeposited),
      targetAmount: targetAmount ? Number(targetAmount) : undefined,
      startDate,
      maturityDate: maturityDate || undefined,
      status: 'Active',
      lastPaidMonth: currentMonth,
      notes: notes.trim() || undefined,
    };

    updateSavings([newRecord, ...savingsList]);
    setIsModalOpen(false);
    setTitle('');
    setInstitution('');
    setAccountNumber('');
    setTotalDeposited('');
    setMonthlyInstallment('');
    setTargetAmount('');
    setMaturityDate('');
    setNotes('');
    showToast('নতুন সঞ্চয় / ডিপিএস স্কিম সফলভাবে যুক্ত হয়েছে', 'success');
  };

  const handlePayInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSavings || !payAmount || Number(payAmount) <= 0) {
      showToast('সঠিক কিস্তির টাকার পরিমাণ লিখুন', 'warning');
      return;
    }

    const amountNum = Number(payAmount);

    try {
      // 1. Record personal expense
      await personalApi.createTransaction({
        title: `ডিপিএস কিস্তি: ${paymentModalSavings.title}`,
        type: 'EXPENSE',
        category: 'Savings & DPS (সঞ্চয় ও ডিপিএস)',
        amount: amountNum,
        wallet: payWallet,
        date: new Date().toISOString().split('T')[0],
        notes: `${paymentModalSavings.institution} (${paymentModalSavings.accountNumber || ''})`,
      });

      // 2. Update total deposited & last paid month
      const updatedList = savingsList.map((s) => {
        if (s.id === paymentModalSavings.id) {
          return {
            ...s,
            totalDeposited: s.totalDeposited + amountNum,
            lastPaidMonth: currentMonth,
          };
        }
        return s;
      });

      updateSavings(updatedList);
      setPaymentModalSavings(null);
      setPayAmount('');
      showToast(`৳${amountNum} ডিপিএস কিস্তি সফলভাবে পরিশোধ ও জমার হিসাবে যোগ হয়েছে`, 'success');
      if (onTransactionAdded) onTransactionAdded();
    } catch {
      showToast('কিস্তির হিসাব সংরক্ষণ করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই সঞ্চয় রেকর্ডটি মুছে ফেলতে চান?')) return;
    const filtered = savingsList.filter((s) => s.id !== id);
    updateSavings(filtered);
    showToast('সঞ্চয় রেকর্ড মুছে ফেলা হয়েছে', 'info');
  };

  const getTypeBadge = (type: PersonalSavingsType) => {
    switch (type) {
      case 'DPS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">মাসিক ডিপিএস</span>;
      case 'Sanchayapatra':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">সঞ্চয়পত্র</span>;
      case 'FDR':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">ফিক্সড ডিপোজিট (FDR)</span>;
      case 'EmergencyFund':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">জরুরি তহবিল</span>;
      case 'Gold':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800">স্বর্ণ / গোল্ড</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">অন্যান্য</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600">মোট সঞ্চিত তহবিল (Total Savings)</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600">
            {formatCurrency(totalAccumulated)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ডিপিএস, সঞ্চয়পত্র ও সেভিংস ডিপোজিটে জমাকৃত মোট টাকা</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600">মাসিক কিস্তির দায়বদ্ধতা</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">
            {formatCurrency(totalMonthlyCommitment)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">প্রতি মাসে নিয়মিত কিস্তি বাবদ সঞ্চয় লক্ষ্যমাত্রা</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600">মেয়াদপূর্তিতে প্রত্যাশিত প্রাপ্তি</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600">
            {formatCurrency(totalTargetExpected)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ভবিষ্যতে মেয়াদের শেষে মোট সম্ভাব্য সঞ্চয় সম্পদ</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-600" />
            ডিপিএস, ব্যাংক ডিপোজিট ও সঞ্চয়পত্র খাতা
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            নিজের ও পরিবারের ভবিষ্যতের জন্য ব্যাংক ও আর্থিক প্রতিষ্ঠানে সঞ্চয়ের খতিয়ান
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          নতুন সঞ্চয় স্কিম যোগ করুন
        </Button>
      </div>

      {/* Savings Cards Grid */}
      {savingsList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 text-slate-400">
          <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-600" />
          <p className="text-base font-bold text-slate-700">কোনো ডিপিএস বা সঞ্চয় অ্যাকাউন্ট যুক্ত নেই</p>
          <p className="text-xs text-slate-400 mt-1">
            ভবিষ্যতের সঞ্চয় ও ডিপিএস ট্র্যাকিং শুরু করতে উপরের বাটনে ক্লিক করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsList.map((item) => {
            const isDueThisMonth =
              item.type === 'DPS' &&
              item.status === 'Active' &&
              item.lastPaidMonth !== currentMonth;

            const progress = item.targetAmount
              ? Math.min(100, Math.round((item.totalDeposited / item.targetAmount) * 100))
              : null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(item.type)}
                        {item.status === 'Active' ? (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            চলমান
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold">সম্পন্ন</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{item.institution}</p>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.accountNumber && (
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg inline-block mb-3">
                      A/C: {item.accountNumber}
                    </div>
                  )}

                  {/* Deposited vs Target */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 my-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>মোট জমা:</span>
                      <span className="font-mono font-bold text-indigo-700 text-sm">
                        {formatCurrency(item.totalDeposited)}
                      </span>
                    </div>
                    {item.targetAmount && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>লক্ষ্যমাত্রা:</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {formatCurrency(item.targetAmount)}
                        </span>
                      </div>
                    )}

                    {progress !== null && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                          <span>অগ্রগতি</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Installment details */}
                  {item.monthlyInstallment ? (
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        মাসিক কিস্তি:
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(item.monthlyInstallment)}
                        {item.installmentDay && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            (প্রতি মাসের {item.installmentDay} তারিখ)
                          </span>
                        )}
                      </span>
                    </div>
                  ) : null}

                  {item.maturityDate && (
                    <div className="text-[11px] text-slate-500 flex items-center justify-between mb-2">
                      <span>মেয়াদ শেষ:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {formatDate(item.maturityDate)}
                      </span>
                    </div>
                  )}

                  {/* Monthly Status Badge */}
                  {item.type === 'DPS' && item.status === 'Active' && (
                    <div className="mt-3">
                      {isDueThisMonth ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>চলতি মাসের কিস্তি বাকি</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentModalSavings(item);
                              setPayAmount(item.monthlyInstallment || '');
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-2xs transition-colors cursor-pointer"
                          >
                            পরিশোধ করুন
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs text-emerald-800 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>চলতি মাসের কিস্তি পরিশোধিত</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentModalSavings(item);
                              setPayAmount(item.monthlyInstallment || '');
                            }}
                            className="text-[11px] text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
                          >
                            অগ্রিম জমা
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {item.notes && (
                  <p className="text-[11px] text-slate-400 italic mt-3 pt-2 border-t border-slate-100">
                    {item.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Savings Scheme Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="নতুন ডিপিএস / সঞ্চয় স্কিম যোগ করুন"
        subtitle="ব্যাংক ডিপিএস, সঞ্চয়পত্র বা ভবিষ্যৎ ফান্ডের বিবরণ সংরক্ষণ করুন"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSavings} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                স্কিমের ধরন *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PersonalSavingsType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="DPS">ডিপিএস (DPS - মাসিক কিস্তি)</option>
                <option value="Sanchayapatra">জাতীয় সঞ্চয়পত্র</option>
                <option value="FDR">ফিক্সড ডিপোজিট (FDR)</option>
                <option value="EmergencyFund">জরুরি ইমার্জেন্সি ফান্ড</option>
                <option value="Gold">স্বর্ণ বা মূল্যবান সম্পদ</option>
                <option value="Other">অন্যান্য সঞ্চয়</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ব্যাংক বা প্রতিষ্ঠানের নাম *
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="যেমন: ইসলামী ব্যাংক / ব্র্যাক ব্যাংক"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              স্কিমের শিরোনাম / নাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ৫ বছর মেয়াদি মিলিওনিয়ার ডিপিএস"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                অ্যাকাউন্ট নম্বর (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="A/C: 2050XXXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                অদ্যাবধি মোট জমার পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min="0"
                value={totalDeposited}
                onChange={(e) => setTotalDeposited(Number(e.target.value) || '')}
                placeholder="৫০,০০০"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                required
              />
            </div>
          </div>

          {type === 'DPS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মাসিক কিস্তির টাকা (৳)
                </label>
                <input
                  type="number"
                  min="100"
                  value={monthlyInstallment}
                  onChange={(e) => setMonthlyInstallment(Number(e.target.value) || '')}
                  placeholder="৫,০০০"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  কিস্তি দেওয়ার তারিখ (মাসের কত তারিখ)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={installmentDay}
                  onChange={(e) => setInstallmentDay(Number(e.target.value) || '')}
                  placeholder="১০"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মেয়াদপূর্তিতে প্রত্যাশিত প্রাপ্তি (৳)
              </label>
              <input
                type="number"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value) || '')}
                placeholder="৩,৮০,০০০"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মেয়াদ শেষ হওয়ার তারিখ
              </label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">নোট / বিবরণ</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="অতিরিক্ত কোনো তথ্য বা শর্ত"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Installment Modal */}
      <Modal
        isOpen={!!paymentModalSavings}
        onClose={() => setPaymentModalSavings(null)}
        title="ডিপিএস কিস্তি পরিশোধ ও রেকর্ড"
        subtitle={paymentModalSavings?.title}
        maxWidth="sm"
      >
        <form onSubmit={handlePayInstallment} className="space-y-4 py-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>প্রতিষ্ঠান:</span>
              <span className="font-semibold text-slate-900">
                {paymentModalSavings?.institution}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>বর্তমান মোট জমা:</span>
              <span className="font-mono font-bold text-indigo-700">
                {formatCurrency(paymentModalSavings?.totalDeposited || 0)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              কিস্তির পরিমাণ (৳) *
            </label>
            <input
              type="number"
              min="1"
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value) || '')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              কোন অ্যাকাউন্ট থেকে কিস্তি দিচ্ছেন? *
            </label>
            <select
              value={payWallet}
              onChange={(e) => setPayWallet(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Bank">ব্যাংক অ্যাকাউন্ট (Bank)</option>
              <option value="Cash">নগদ ক্যাশ (Cash)</option>
              <option value="bKash">বিকাশ পার্সোনাল (bKash)</option>
              <option value="Nagad">নগদ পার্সোনাল (Nagad)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              * এটি আপনার ব্যক্তিগত ব্যয় হিসাবে 'সঞ্চয় ও ডিপিএস' ক্যাটাগরিতে স্বয়ংক্রিয়ভাবে যুক্ত হবে।
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPaymentModalSavings(null)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              কিস্তি জমা নিশ্চিত করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

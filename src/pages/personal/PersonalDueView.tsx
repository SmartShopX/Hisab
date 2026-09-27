import React, { useState } from 'react';
import { DataStore } from '../../services/dataStorage';
import { PersonalDueRecord, PersonalDuePayment } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Scale,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Trash2,
  History,
} from 'lucide-react';

export const PersonalDueView: React.FC = () => {
  const { showToast } = useToast();
  const [dueRecords, setDueRecords] = useState<PersonalDueRecord[]>(() => DataStore.getPersonalDues());
  const [filterType, setFilterType] = useState<'ALL' | 'RECEIVABLE' | 'PAYABLE'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  // Modal State for New Due
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [personMobile, setPersonMobile] = useState('');
  const [type, setType] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  // Modal State for Payment Entry
  const [paymentModalRecord, setPaymentModalRecord] = useState<PersonalDueRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNote, setPaymentNote] = useState('');

  const updateRecords = (records: PersonalDueRecord[]) => {
    setDueRecords(records);
    DataStore.setPersonalDues(records);
  };

  const totalReceivable = dueRecords
    .filter((r) => r.type === 'RECEIVABLE' && r.status !== 'Paid')
    .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);

  const totalPayable = dueRecords
    .filter((r) => r.type === 'PAYABLE' && r.status !== 'Paid')
    .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);

  const netBalance = totalReceivable - totalPayable;

  const handleCreateDue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount || Number(amount) <= 0) {
      showToast('ব্যক্তির নাম ও টাকার সঠিক পরিমাণ প্রদান করুন', 'warning');
      return;
    }

    const newRecord: PersonalDueRecord = {
      id: `pdue_${Date.now()}`,
      personName: personName.trim(),
      personMobile: personMobile.trim() || undefined,
      type,
      amount: Number(amount),
      paidAmount: 0,
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate || undefined,
      status: 'Pending',
      note: note.trim() || undefined,
      paymentHistory: [],
    };

    updateRecords([newRecord, ...dueRecords]);
    setIsAddModalOpen(false);
    setPersonName('');
    setPersonMobile('');
    setAmount('');
    setDueDate('');
    setNote('');
    showToast('ব্যক্তিগত দেনা-পাওনার হিসাব যুক্ত করা হয়েছে', 'success');
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalRecord || !paymentAmount || Number(paymentAmount) <= 0) {
      showToast('সঠিক পেমেন্টের পরিমাণ দিন', 'warning');
      return;
    }

    const payNum = Number(paymentAmount);
    const remaining = paymentModalRecord.amount - paymentModalRecord.paidAmount;

    if (payNum > remaining) {
      showToast(`বাকি দেনা ${formatCurrency(remaining)} এর চেয়ে বেশি পেমেন্ট দেওয়া সম্ভব নয়`, 'warning');
      return;
    }

    const newPaidTotal = paymentModalRecord.paidAmount + payNum;
    const newStatus = newPaidTotal >= paymentModalRecord.amount ? 'Paid' : 'Partial';

    const paymentEntry: PersonalDuePayment = {
      id: `pay_${Date.now()}`,
      amount: payNum,
      date: new Date().toISOString().split('T')[0],
      note: paymentNote.trim() || undefined,
    };

    const updated = dueRecords.map((r) =>
      r.id === paymentModalRecord.id
        ? {
            ...r,
            paidAmount: newPaidTotal,
            status: newStatus,
            paymentHistory: [...(r.paymentHistory || []), paymentEntry],
          }
        : r
    );

    updateRecords(updated);
    setPaymentModalRecord(null);
    setPaymentAmount('');
    setPaymentNote('');
    showToast('পেমেন্ট সফলভাবে এন্ট্রি করা হয়েছে', 'success');
  };

  const handleDeleteRecord = (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই দেনা-পাওনার রেকর্ডটি মুছে ফেলতে চান?')) return;
    const updated = dueRecords.filter((r) => r.id !== id);
    updateRecords(updated);
    showToast('রেকর্ড মুছে ফেলা হয়েছে', 'info');
  };

  const filteredRecords = dueRecords.filter((r) => {
    if (filterType !== 'ALL' && r.type !== filterType) return false;
    if (filterStatus === 'PAID' && r.status !== 'Paid') return false;
    if (filterStatus === 'UNPAID' && r.status === 'Paid') return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">মোট পাওনা টাকা (ধার দিয়েছি)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600">
            {formatCurrency(totalReceivable)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">মানুষের কাছ থেকে আপনার প্রাপ্য অর্থ</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">মোট দেনা টাকা (ধার নিয়েছি)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-rose-600">
            {formatCurrency(totalPayable)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">অন্যদের আপনার পরিশোধযোগ্য দেনা</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">নিট ব্যক্তিগত দেনা/পাওনা</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-black font-mono ${
              netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(netBalance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {netBalance >= 0 ? 'আপনি মোট উদ্বৃত্ত পাওনা আছেন' : 'আপনার নিট দেনা রয়েছে'}
          </p>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              সকল ({dueRecords.length})
            </button>
            <button
              onClick={() => setFilterType('RECEIVABLE')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === 'RECEIVABLE' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              আমি পাবো
            </button>
            <button
              onClick={() => setFilterType('PAYABLE')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === 'PAYABLE' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              আমি দেবো
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white cursor-pointer"
          >
            <option value="ALL">সকল স্ট্যাটাস</option>
            <option value="UNPAID">বকেয়া / অপূর্ণ</option>
            <option value="PAID">সম্পূর্ণ পরিশোধিত</option>
          </select>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          নতুন দেনা বা পাওনা যুক্ত করুন
        </Button>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">কোনো দেনা-পাওনার রেকর্ড পাওয়া যায়নি</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              বন্ধুবান্ধব বা পরিচিতদের ধার দেওয়া অথবা ঋণ নেওয়ার হিসেব লিখে রাখুন যাতে কোনো পাওনা মিস না হয়।
            </p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="outline"
              size="sm"
              className="mt-3"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              প্রথম রেকর্ড যোগ করুন
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((r) => {
              const remaining = r.amount - r.paidAmount;
              const isReceivable = r.type === 'RECEIVABLE';
              const isPaid = r.status === 'Paid';

              return (
                <div key={r.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isReceivable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isReceivable ? 'আমি পাবো' : 'আমি দেবো'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{r.personName}</h4>
                        {isPaid && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> পরিশোধিত
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                        {r.personMobile && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {r.personMobile}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          শুরু: {formatDate(r.date)}
                        </span>
                        {r.dueDate && (
                          <span className="flex items-center gap-1 text-amber-700 font-medium">
                            <Clock className="w-3 h-3" />
                            পরিশোধের তারিখ: {formatDate(r.dueDate)}
                          </span>
                        )}
                      </div>

                      {r.note && <p className="text-[11px] text-slate-500 mt-1 italic">{r.note}</p>}
                    </div>

                    <div className="flex items-center gap-4 sm:text-right">
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-800">
                          মোট: {formatCurrency(r.amount)}
                        </div>
                        <div
                          className={`text-xs font-bold font-mono mt-0.5 ${
                            isPaid
                              ? 'text-slate-400 line-through'
                              : isReceivable
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {isPaid ? 'সম্পূর্ণ পরিশোধিত' : `বাকি: ${formatCurrency(remaining)}`}
                        </div>
                        {r.paidAmount > 0 && !isPaid && (
                          <div className="text-[10px] text-slate-400">
                            (পরিশোধ হয়েছে: {formatCurrency(r.paidAmount)})
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isPaid && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPaymentModalRecord(r);
                              setPaymentAmount(remaining);
                            }}
                            className="text-xs"
                          >
                            পেমেন্ট এন্ট্রি
                          </Button>
                        )}

                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Due Record Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ব্যক্তিগত ধার বা দেনা-পাওনা এন্ট্রি"
        subtitle="কাউকে টাকা ধার দিলে বা কারো কাছ থেকে ঋণ নিলে সংরক্ষণ করুন"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDue} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">লেনদেনের ধরন *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('RECEIVABLE')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === 'RECEIVABLE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                কাউকে ধার দিয়েছি (পাবো)
              </button>
              <button
                type="button"
                onClick={() => setType('PAYABLE')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  type === 'PAYABLE'
                    ? 'border-rose-500 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                কারো কাছ থেকে ধার নিয়েছি (দেবো)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ব্যক্তির নাম *</label>
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="যেমন: মো: রফিক হোসেন"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
              <input
                type="tel"
                value={personMobile}
                onChange={(e) => setPersonMobile(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">টাকার পরিমাণ *</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="যেমন: ৫০০০"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">পরিশোধের সম্ভাব্য তারিখ</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">নোট বা কারণ (ঐচ্ছিক)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: জরুরি প্রয়োজনে সাহায্য"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Entry Modal */}
      {paymentModalRecord && (
        <Modal
          isOpen={true}
          onClose={() => setPaymentModalRecord(null)}
          title={`পেমেন্ট গ্রহণ / পরিশোধ (${paymentModalRecord.personName})`}
          subtitle={`বাকি দেনা: ${formatCurrency(
            paymentModalRecord.amount - paymentModalRecord.paidAmount
          )}`}
          maxWidth="sm"
        >
          <form onSubmit={handleAddPayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">পরিশোধকৃত টাকার পরিমাণ *</label>
              <input
                type="number"
                required
                min="1"
                max={paymentModalRecord.amount - paymentModalRecord.paidAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="যেমন: ২০০০"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট নোট</label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="যেমন: বিকাশে পেমেন্ট"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaymentModalRecord(null)}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" size="sm">
                পেমেন্ট নিশ্চিত করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

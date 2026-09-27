import React, { useState, useMemo } from 'react';
import { Supplier } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Building2,
  DollarSign,
  Calendar,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Phone,
  Share2,
} from 'lucide-react';

interface SupplierDuePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupplierDuePaymentModal: React.FC<SupplierDuePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { shop, user } = useAuth();
  const { showToast } = useToast();

  const suppliers = useMemo(() => DataStore.getSuppliers(), [isOpen]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || ''
  );
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'bKash' | 'Nagad'>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [transactionNote, setTransactionNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    receiptNo: string;
    supplierName: string;
    companyName: string;
    amount: number;
    method: string;
    date: string;
    remainingPayable: number;
    note?: string;
  } | null>(null);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
  }, [suppliers, selectedSupplierId]);

  if (!isOpen) return null;

  const totalPayableAll = suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      showToast('পরিশোধের সঠিক পরিমাণ লিখুন', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const remaining = Math.max(0, (selectedSupplier.totalPayable || 0) - amt);
      const updatedSupplier: Supplier = {
        ...selectedSupplier,
        totalPaid: (selectedSupplier.totalPaid || 0) + amt,
        totalPayable: remaining,
      };

      const updatedList = suppliers.map((s) =>
        s.id === selectedSupplier.id ? updatedSupplier : s
      );

      DataStore.setSuppliers(updatedList);

      // Record as expense/payment
      const newExpense = {
        id: `exp_sup_${Date.now()}`,
        title: `সাপ্লায়ার দেনা পরিশোধ: ${selectedSupplier.companyName || selectedSupplier.name}`,
        category: 'Supplier Payment',
        amount: amt,
        paymentMethod,
        date: paymentDate,
        note: `রসিদ নং #SUP-PAY-${Date.now().toString().slice(-4)}. ${transactionNote.trim()}`,
        createdAt: new Date().toISOString(),
      };
      const existingExpenses = DataStore.getExpenses();
      DataStore.setExpenses([newExpense, ...existingExpenses]);

      const receipt = {
        receiptNo: `SPAY-${Date.now().toString().slice(-6)}`,
        supplierName: selectedSupplier.name,
        companyName: selectedSupplier.companyName,
        amount: amt,
        method: paymentMethod,
        date: paymentDate,
        remainingPayable: remaining,
        note: transactionNote,
      };

      setLastReceipt(receipt);
      setPaymentAmount('');
      setTransactionNote('');
      showToast('সাপ্লায়ারের দেনা পরিশোধ সফলভাবে লিপিবদ্ধ হয়েছে!', 'success');
      if (onSuccess) onSuccess();
    } catch {
      showToast('পেমেন্ট সংরক্ষণে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="সাপ্লায়ার দেনা পরিশোধ ও খতিয়ান (Supplier Payables Hub)"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* KPI Overview Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
            <span className="text-xs font-semibold text-rose-700">মোট সাপ্লায়ার দেনা (বকেয়া)</span>
            <div className="text-xl font-black font-mono text-rose-800 mt-0.5">
              {formatCurrency(totalPayableAll)}
            </div>
            <p className="text-[10px] text-rose-600 mt-0.5">সকল সাপ্লায়ার মিলিয়ে প্রদেয় হিসাব</p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="text-xs font-semibold text-blue-700">নির্বাচিত সাপ্লায়ারের বকেয়া</span>
            <div className="text-xl font-black font-mono text-blue-800 mt-0.5">
              {formatCurrency(selectedSupplier?.totalPayable || 0)}
            </div>
            <p className="text-[10px] text-blue-600 mt-0.5">{selectedSupplier?.companyName || selectedSupplier?.name}</p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <span className="text-xs font-semibold text-emerald-700">মোট পরিশোধিত বিল</span>
            <div className="text-xl font-black font-mono text-emerald-800 mt-0.5">
              {formatCurrency(selectedSupplier?.totalPaid || 0)}
            </div>
            <p className="text-[10px] text-emerald-600 mt-0.5">পূর্বের সফল পেমেন্টসমূহ</p>
          </div>
        </div>

        {lastReceipt ? (
          /* Payment Success Voucher Slip */
          <div className="p-5 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>পেমেন্ট রসিদ ভাউচার (Money Receipt)</span>
              </div>
              <span className="font-mono text-xs font-black text-emerald-800">
                #{lastReceipt.receiptNo}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">প্রাপক সাপ্লায়ার:</span>
                <p className="font-bold text-slate-800">{lastReceipt.companyName} ({lastReceipt.supplierName})</p>
              </div>
              <div>
                <span className="text-slate-500">পরিশোধের মাধ্যম ও তারিখ:</span>
                <p className="font-bold text-slate-800">{lastReceipt.method} | {lastReceipt.date}</p>
              </div>
              <div>
                <span className="text-slate-500">পরিশোধকৃত টাকা:</span>
                <p className="font-mono font-black text-base text-emerald-700">{formatCurrency(lastReceipt.amount)}</p>
              </div>
              <div>
                <span className="text-slate-500">অবশিষ্ট দেনা / বকেয়া:</span>
                <p className="font-mono font-black text-base text-rose-700">{formatCurrency(lastReceipt.remainingPayable)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLastReceipt(null)}
              >
                + আরও পেমেন্ট এন্ট্রি করুন
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={handlePrint}
                >
                  রসিদ প্রিন্ট করুন
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleRecordPayment} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সাপ্লায়ার বা কোম্পানি নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName || s.name} [বকেয়া দেনা: ৳{s.totalPayable || 0}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পরিশোধের টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={selectedSupplier?.totalPayable || undefined}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="যেমন: ৫০০০"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                  {selectedSupplier?.totalPayable > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(selectedSupplier.totalPayable.toString())}
                      className="px-2.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors"
                    >
                      সব বকেয়া
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পরিশোধের মাধ্যম
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Cash">নগদ ক্যাশ (Cash)</option>
                  <option value="bKash">বিকাশ (bKash)</option>
                  <option value="Nagad">নগদ (Nagad)</option>
                  <option value="Bank">ব্যাংক ট্রান্সফার / চেক (Bank)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পরিশোধের তারিখ
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                নোট বা রেফারেন্স (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
                placeholder="যেমন: চালান #CH-8821 এর আংশিক চেক পেমেন্ট..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                বাতিল
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                পেমেন্ট এন্ট্রি সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

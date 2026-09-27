import React, { useState, useMemo } from 'react';
import { Supplier } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { supplierService } from '../../services/supplierService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { SupplierLedgerModal } from '../../components/suppliers/SupplierLedgerModal';
import {
  Truck,
  Search,
  Plus,
  Phone,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Edit2,
  Eye,
} from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => DataStore.getSuppliers());
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    mobile: '',
    address: '',
  });

  // Payment State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Cash' | 'bKash' | 'Bank'>('Bank');

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.company.toLowerCase().includes(q) ||
          s.mobile.includes(q)
        );
      }
      return true;
    });
  }, [suppliers, search]);

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim() || !formData.mobile.trim()) {
      showToast('নাম, কোম্পানি ও মোবাইল নম্বর আবশ্যক', 'warning');
      return;
    }

    try {
      await supplierService.addSupplier(formData);
      setSuppliers(DataStore.getSuppliers());
      setIsAddModalOpen(false);
      setFormData({ name: '', company: '', mobile: '', address: '' });
      showToast('নতুন সরবরাহকারী সফলভাবে যুক্ত হয়েছে', 'success');
    } catch {
      showToast('সংরক্ষণ ব্যর্থ হয়েছে', 'error');
    }
  };

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupplier || payAmount <= 0) return;

    try {
      await supplierService.paySupplier(
        activeSupplier.id,
        payAmount,
        payMethod,
        'সাপ্লায়ার দেনা পরিশোধ'
      );
      setSuppliers(DataStore.getSuppliers());
      setIsPayModalOpen(false);
      showToast(`${activeSupplier.company} কে ৳${payAmount} পরিশোধ সম্পন্ন হয়েছে`, 'success');
    } catch {
      showToast('পেমেন্ট প্রক্রিয়াকরণে সমস্যা হয়েছে', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">সরবরাহকারী তালিকা (Suppliers)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            পাইকারি বিক্রেতা ও সাপ্লায়ারদের দেনা-পাওনা এবং ক্রয়ের হিসাব
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          নতুন সাপ্লায়ার যোগ
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
            placeholder="কোম্পানির নাম, সরবরাহকারীর নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">প্রতিষ্ঠান ও যোগাযোগ</th>
                <th className="py-3 px-4">ঠিকানা</th>
                <th className="py-3 px-4">মোট ক্রয়</th>
                <th className="py-3 px-4">মোট পরিশোধ</th>
                <th className="py-3 px-4">বর্তমান দেনা (Payable)</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{s.company}</span>
                    <span className="text-slate-600 text-[11px] block">{s.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{s.mobile}</span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate">{s.address}</td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatCurrency(s.totalPurchased)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                    {formatCurrency(s.totalPaid)}
                  </td>

                  <td className="py-3.5 px-4">
                    {s.totalPayable > 0 ? (
                      <span className="inline-block font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                        {formatCurrency(s.totalPayable)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">পরিশোধিত</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        onClick={() => {
                          setActiveSupplier(s);
                          setIsLedgerModalOpen(true);
                        }}
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5 text-indigo-600" />}
                      >
                        খতিয়ান
                      </Button>
                      {s.totalPayable > 0 && (
                        <Button
                          onClick={() => {
                            setActiveSupplier(s);
                            setPayAmount(s.totalPayable);
                            setIsPayModalOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          leftIcon={<CreditCard className="w-3.5 h-3.5 text-rose-600" />}
                        >
                          পরিশোধ
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="নতুন সরবরাহকারী যুক্ত করুন"
        maxWidth="md"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              কোম্পানি বা ডিস্ট্রিবিউটর নাম *
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="যেমন: ঢাকা ডিস্ট্রিবিউশন ট্রেডার্স"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              যোগাযোগকারীর নাম *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="যেমন: এম. এ. কালাম"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকানা</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="মার্কেট বা গোডাউনের ঠিকানা..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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

      {/* Supplier Payment Modal */}
      {activeSupplier && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="সাপ্লায়ার পাওনা পরিশোধ"
          subtitle={`${activeSupplier.company} (মোট দেনা: ৳${activeSupplier.totalPayable})`}
          maxWidth="sm"
        >
          <form onSubmit={handlePaySupplier} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পরিশোধের পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min={1}
                max={activeSupplier.totalPayable}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Cash">ক্যাশ (নগদ)</option>
                <option value="Bank">ব্যাংক অ্যাকাউন্ট / চেক</option>
                <option value="bKash">বিকাশ মার্চেন্ট</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPayModalOpen(false)}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" size="sm">
                পরিশোধ সম্পন্ন করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Supplier Ledger Statement Modal */}
      <SupplierLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        supplier={activeSupplier}
        onMakePaymentClick={(sup) => {
          setActiveSupplier(sup);
          setPayAmount(sup.totalPayable);
          setIsPayModalOpen(true);
        }}
      />
    </div>
  );
};

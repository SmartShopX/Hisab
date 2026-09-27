import React, { useState } from 'react';
import { Customer, CustomerType, CustomerTier } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { customerService } from '../../services/customerService';
import { useToast } from '../../context/ToastContext';
import { ShieldAlert, CheckCircle2, Lock, ShieldCheck, UserCog } from 'lucide-react';

interface CreditLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export const CreditLimitModal: React.FC<CreditLimitModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [creditLimit, setCreditLimit] = useState<number>(customer?.creditLimit || 10000);
  const [creditTermDays, setCreditTermDays] = useState<number>(customer?.creditTermDays || 30);
  const [isCreditLocked, setIsCreditLocked] = useState<boolean>(customer?.isCreditLocked || false);
  const [customerType, setCustomerType] = useState<CustomerType>(customer?.customerType || 'Retail');
  const [tier, setTier] = useState<CustomerTier>(customer?.tier || 'General');
  const [nidOrTradeLicense, setNidOrTradeLicense] = useState<string>(
    customer?.nidOrTradeLicense || ''
  );
  const [alternateMobile, setAlternateMobile] = useState<string>(customer?.alternateMobile || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (customer) {
      setCreditLimit(customer.creditLimit ?? 10000);
      setCreditTermDays(customer.creditTermDays ?? 30);
      setIsCreditLocked(customer.isCreditLocked || false);
      setCustomerType(customer.customerType || 'Retail');
      setTier(customer.tier || 'General');
      setNidOrTradeLicense(customer.nidOrTradeLicense || '');
      setAlternateMobile(customer.alternateMobile || '');
    }
  }, [customer]);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await customerService.updateCustomer(customer.id, {
        creditLimit: Number(creditLimit) || 0,
        creditTermDays: Number(creditTermDays) || 0,
        isCreditLocked,
        customerType,
        tier,
        nidOrTradeLicense: nidOrTradeLicense.trim() || undefined,
        alternateMobile: alternateMobile.trim() || undefined,
      });

      onSuccess();
      showToast(`${customer.name} এর ক্রেডিট লিমিট ও প্রোফাইল আপডেট হয়েছে`, 'success');
      onClose();
    } catch {
      showToast('তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ক্রেডিট লিমিট ও ঝুঁকি নিয়ন্ত্রণ (Credit & Risk Control)"
      subtitle={`গ্রাহক: ${customer.name} | বর্তমান বাকি: ${formatCurrency(customer.totalDue)}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Type & Tier */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">গ্রাহকের ধরন</label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as CustomerType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Retail">খুচরা গ্রাহক (Retail)</option>
              <option value="Wholesale">পাইকারি গ্রাহক (Wholesale)</option>
              <option value="Corporate">কর্পোরেট ক্লায়েন্ট (Corporate)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">মেম্বারশিপ টায়ার</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as CustomerTier)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="General">General</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
            </select>
          </div>
        </div>

        {/* Credit Limit & Term */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              সর্বোচ্চ বাকি সীমা (৳) *
            </label>
            <input
              type="number"
              min={0}
              step={500}
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
              placeholder="যেমন: 15000"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">০ দিলে বাকি নিষেধ</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পরিশোধের মেয়াদ (দিন)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={creditTermDays}
              onChange={(e) => setCreditTermDays(Number(e.target.value) || 0)}
              placeholder="যেমন: 7, 15, 30"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">সর্বোচ্চ পরিশোধের সময়সীমা</span>
          </div>
        </div>

        {/* Verification and Alternates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              বিকল্প মোবাইল নম্বর
            </label>
            <input
              type="tel"
              value={alternateMobile}
              onChange={(e) => setAlternateMobile(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              NID বা ট্রেড লাইসেন্স
            </label>
            <input
              type="text"
              value={nidOrTradeLicense}
              onChange={(e) => setNidOrTradeLicense(e.target.value)}
              placeholder="জাতীয় পরিচয়পত্র নম্বর"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Credit Lock Toggle */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isCreditLocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">নতুন বাকি বিক্রয় ব্লক (Lock Due)</span>
              <span className="text-[11px] text-slate-500 block">
                সক্রিয় থাকলে পিওএস-এ এই গ্রাহককে বাকি দেওয়া যাবে না
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isCreditLocked}
              onChange={(e) => setIsCreditLocked(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            বাতিল
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
            {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ সংরক্ষণ করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

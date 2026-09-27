import React, { useState, useMemo } from 'react';
import { Customer } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { customerService } from '../../services/customerService';
import { smsService } from '../../services/smsService';
import { useToast } from '../../context/ToastContext';
import { DataStore } from '../../services/dataStorage';
import {
  Send,
  PhoneCall,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  QrCode,
  CreditCard,
  Share2,
} from 'lucide-react';

interface DueReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export const DueReminderModal: React.FC<DueReminderModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const shop = DataStore.getShop();
  const mfsAccounts = useMemo(() => DataStore.getMfsAccounts(), []);

  // Template Type
  const [templateType, setTemplateType] = useState<'friendly' | 'notice' | 'urgent'>('friendly');
  const [selectedMfs, setSelectedMfs] = useState<string>(
    mfsAccounts.length > 0 ? `${mfsAccounts[0].provider}: ${mfsAccounts[0].accountNumber}` : 'bKash Merchant: 01800000000'
  );
  const [showQrCard, setShowQrCard] = useState(false);

  // Promise to pay fields
  const [promiseDate, setPromiseDate] = useState<string>(customer?.promiseDate || '');
  const [reminderNote, setReminderNote] = useState<string>(customer?.reminderNotes || '');

  // Custom Editable Message
  const [message, setMessage] = useState<string>('');

  // Sync message when customer, template, or mfs changes
  React.useEffect(() => {
    if (customer) {
      const generated = customerService.generateReminderMessage(
        customer,
        shop.name || 'SmartShopX Store',
        templateType,
        selectedMfs
      );
      setMessage(generated);
      setPromiseDate(customer.promiseDate || '');
      setReminderNote(customer.reminderNotes || '');
    }
  }, [customer, templateType, selectedMfs, shop.name]);

  if (!customer) return null;

  // Clean phone number for WhatsApp (e.g. 01812345678 -> 8801812345678)
  const getWhatsAppNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('880')) return digits;
    if (digits.startsWith('0')) return `88${digits}`;
    return `880${digits}`;
  };

  const handleSendSms = async () => {
    if (!customer.mobile) {
      showToast('গ্রাহকের মোবাইল নম্বর নেই', 'warning');
      return;
    }

    const res = smsService.sendSms(customer.mobile, message, 'বকেয়া তাগাদা');
    if (res.success) {
      await customerService.recordReminderSent(customer.id, 'sms');
      onSuccess();
      showToast(`${customer.name} এর মোবাইলে বকেয়া তাগাদা এসএমএস পাঠানো হয়েছে`, 'success');
      onClose();
    } else {
      showToast(res.error || 'এসএমএস পাঠাতে সমস্যা হয়েছে', 'error');
    }
  };

  const handleOpenWhatsApp = async () => {
    if (!customer.mobile) {
      showToast('গ্রাহকের মোবাইল নম্বর নেই', 'warning');
      return;
    }

    const waNum = getWhatsAppNumber(customer.mobile);
    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${waNum}?text=${encodedText}`;

    await customerService.recordReminderSent(customer.id, 'whatsapp');
    onSuccess();
    window.open(waUrl, '_blank');
    showToast('WhatsApp চ্যাট উইন্ডো ওপেন হয়েছে', 'success');
    onClose();
  };

  const handleSavePromise = async () => {
    if (!promiseDate) {
      showToast('অনুগ্রহ করে প্রতিশ্রুতি তারিখ নির্বাচন করুন', 'warning');
      return;
    }

    try {
      await customerService.recordPromise(customer.id, promiseDate, reminderNote);
      onSuccess();
      showToast('গ্রাহকের পরিশোধের প্রতিশ্রুতি সংরক্ষণ হয়েছে', 'success');
      onClose();
    } catch {
      showToast('প্রতিশ্রুতি সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    showToast('তাগাদা বার্তা কপি করা হয়েছে', 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="বকেয়া তাগাদা ও ডিজিটাল পেমেন্ট স্লিপ"
      subtitle={`গ্রাহক: ${customer.name} | মোট বাকি: ${formatCurrency(customer.totalDue)}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Customer Balance Header */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">গ্রাহক ও মোবাইল</span>
            <span className="font-bold text-slate-900">{customer.name}</span>
            <span className="font-mono text-slate-600 block">{customer.mobile}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">মোট বকেয়া</span>
            <span className="font-mono font-black text-rose-600 text-sm">
              {formatCurrency(customer.totalDue)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">বকেয়ার বয়স</span>
            <span className="font-medium text-slate-800">
              {customer.oldestDueDays ? `${customer.oldestDueDays} দিন পুরনো` : 'সাম্প্রতিক'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={`tel:${customer.mobile}`}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-semibold flex items-center gap-1 hover:bg-emerald-100 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>কল</span>
            </a>
            <button
              type="button"
              onClick={() => setShowQrCard(!showQrCard)}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-semibold flex items-center gap-1 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQrCard ? 'QR লুকান' : 'পেমেন্ট QR'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic bKash / Nagad QR Payment Card */}
        {showQrCard && (
          <div className="p-4 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl border border-pink-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center shrink-0">
                <QrCode className="w-16 h-16 text-slate-900" />
                <span className="text-[9px] font-mono text-slate-500 font-bold">bKash / Nagad</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{shop.name}</span>
                <span className="text-xs text-slate-600 block">মার্চেন্ট নম্বর: <strong>{selectedMfs || '01800000000'}</strong></span>
                <span className="text-xs text-rose-600 font-black block mt-1">পরিশোধের পরিমাণ: {formatCurrency(customer.totalDue)}</span>
                <span className="text-[10px] text-slate-500 block">রেফারেন্স দিন: {customer.name.substring(0, 10)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const text = `দোকান: ${shop.name}\nবকেয়া পরিশোধের লিংক ও নম্বর: ${selectedMfs}\nপরিশোধের পরিমাণ: ৳${customer.totalDue}\nরেফারেন্স: ${customer.name}`;
                navigator.clipboard.writeText(text);
                showToast('পেমেন্ট নির্দেশনাবলী কপি করা হয়েছে', 'success');
              }}
              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>পেমেন্ট তথ্য কপি</span>
            </button>
          </div>
        )}

        {/* Template Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            তাগাদার ধরন নির্বাচন করুন (Template)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTemplateType('friendly')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                templateType === 'friendly'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="block">১. বিনম্র তাগাদা</span>
              <span className="text-[10px] text-slate-500 font-normal">সাধারণ বন্ধুত্বপূর্ণ রিমাইন্ডার</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateType('notice')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                templateType === 'notice'
                  ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="block">২. পরিশোধের নোটিশ</span>
              <span className="text-[10px] text-slate-500 font-normal">সময় অতিক্রান্ত তাগাদা</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateType('urgent')}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                templateType === 'urgent'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-500/20'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="block">৩. জরুরি / চূড়ান্ত</span>
              <span className="text-[10px] text-slate-500 font-normal">দীর্ঘমেয়াদী বকেয়া নোটিশ</span>
            </button>
          </div>
        </div>

        {/* Payment Account Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            বার্তায় পেমেন্ট নম্বর যুক্ত করুন (বিকাশ / নগদ)
          </label>
          <select
            value={selectedMfs}
            onChange={(e) => setSelectedMfs(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">কোনো পেমেন্ট নম্বর নয়</option>
            {mfsAccounts.length > 0 ? (
              mfsAccounts.map((m) => (
                <option key={m.id} value={`${m.provider}: ${m.accountNumber}`}>
                  {m.provider} ({m.type}) - {m.accountNumber}
                </option>
              ))
            ) : (
              <>
                <option value="bKash Merchant: 01800000000">bKash (Merchant) - 01800000000</option>
                <option value="Nagad Personal: 01700000000">Nagad (Personal) - 01700000000</option>
              </>
            )}
          </select>
        </div>

        {/* Message Editor */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">
              তাগাদা বার্তার খসড়া (Message Preview & Edit)
            </label>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>কপি করুন</span>
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Promise to Pay Date & Call Notes */}
        <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>টাকা পরিশোধের প্রতিশ্রুতি (Promise to Pay Date)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-amber-800 block mb-0.5 font-medium">
                প্রতিশ্রুত পরিশোধের তারিখ
              </span>
              <input
                type="date"
                value={promiseDate}
                onChange={(e) => setPromiseDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <span className="text-[10px] text-amber-800 block mb-0.5 font-medium">
                ফলো-আপ নোট বা মন্তব্য
              </span>
              <input
                type="text"
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="যেমন: আগামী রবিবার বিকালে দোকানে এসে দেবেন"
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSavePromise}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
            >
              প্রতিশ্রুতি সংরক্ষণ করুন
            </button>
          </div>
        </div>

        {/* Action Buttons for Dispatch */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
            বাতিল
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenWhatsApp}
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
              className="flex-1 sm:flex-none border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-semibold"
            >
              WhatsApp এ পাঠান
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSendSms}
              leftIcon={<Send className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              এসএমএস পাঠান
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

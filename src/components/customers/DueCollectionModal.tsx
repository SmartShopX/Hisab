import React, { useState } from 'react';
import { Customer, PaymentMethod } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { customerService, DueCollectionReceipt } from '../../services/customerService';
import { useToast } from '../../context/ToastContext';
import { DataStore } from '../../services/dataStorage';
import { DigitalSignatureCanvas } from '../common/DigitalSignatureCanvas';
import {
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  Receipt,
  FileCheck,
  Building,
  PenTool,
  QrCode,
  Share2,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Tag,
} from 'lucide-react';

interface DueCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export const DueCollectionModal: React.FC<DueCollectionModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const shop = DataStore.getShop();

  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [receiptNumber, setReceiptNumber] = useState<string>(
    () => `MR-${Date.now().toString().slice(-6)}`
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Digital Signature & OTP
  const [showSignatureCanvas, setShowSignatureCanvas] = useState<boolean>(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [showOtpInput, setShowOtpInput] = useState<boolean>(false);

  // Success Receipt view
  const [generatedReceipt, setGeneratedReceipt] = useState<DueCollectionReceipt | null>(null);

  // Sync initial state when customer changes
  React.useEffect(() => {
    if (customer) {
      setCollectAmount(customer.totalDue);
      setDiscountAmount(0);
      setReceiptNumber(`MR-${Date.now().toString().slice(-6)}`);
      setNotes('');
      setGeneratedReceipt(null);
      setSignatureData(null);
      setShowSignatureCanvas(false);
      setIsOtpVerified(false);
      setShowOtpInput(false);
    }
  }, [customer]);

  if (!customer) return null;

  const totalDeduction = (collectAmount || 0) + (discountAmount || 0);
  const remainingDue = Math.max(0, customer.totalDue - totalDeduction);

  const handleSendOtpSimulation = () => {
    setShowOtpInput(true);
    showToast(`গ্রাহকের মোবাইল ${customer.mobile} এ ওটিপি পাঠানো হয়েছে (ডেমো কোড: ১২৩৪)`, 'info');
  };

  const handleVerifyOtp = () => {
    if (otpCode === '1234' || otpCode.length >= 4) {
      setIsOtpVerified(true);
      setShowOtpInput(false);
      showToast('গ্রাহক ওটিপি যাচাই সফল হয়েছে!', 'success');
    } else {
      showToast('ভুল ওটিপি কোড। অনুগ্রহ করে ১২৩৪ লিখুন', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (collectAmount <= 0 && discountAmount <= 0) {
      showToast('আদায়ের পরিমাণ বা ছাড়ের টাকা প্রদান করুন', 'warning');
      return;
    }

    if (totalDeduction > customer.totalDue) {
      showToast('আদায় ও ছাড়ের মোট যোগফল বর্তমান বকেয়ার চেয়ে বেশি হতে পারে না', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { receipt } = await customerService.collectDue({
        customerId: customer.id,
        amount: collectAmount,
        discountAdjusted: discountAmount,
        method: paymentMethod,
        receiptNumber,
        notes: notes.trim() || 'বকেয়া খাতা হতে আদায়',
      });

      // Save signature to customer's latest ledger entry
      if (signatureData) {
        const customers = DataStore.getCustomers();
        const c = customers.find((cust) => cust.id === customer.id);
        if (c && c.ledger && c.ledger.length > 0) {
          c.ledger[0].signatureImage = signatureData;
          DataStore.setCustomers([...customers]);
        }
      }

      setGeneratedReceipt(receipt);
      onSuccess();
      showToast(`${customer.name} এর ৳${collectAmount} বকেয়া আদায় রেকর্ড হয়েছে`, 'success');
    } catch {
      showToast('বকেয়া সংগ্রহ করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleShareReceiptWhatsApp = () => {
    if (!generatedReceipt) return;
    const msg = `সম্মানিত ${generatedReceipt.customerName},\n${shop.name || 'SmartShopX'} এ আপনার ৳${generatedReceipt.collectedAmount} বকেয়া পরিশোধ সফলভাবে গৃহীত হয়েছে।\nরসিদ নং: ${generatedReceipt.receiptNumber}\nতারিখ: ${generatedReceipt.date}\nঅবশিষ্ট বকেয়া: ৳${generatedReceipt.newDue}\nধন্যবাদ।`;
    const cleanPhone = generatedReceipt.customerMobile.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('880') ? cleanPhone : `88${cleanPhone}`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={generatedReceipt ? 'টাকা আদায়ের মানি রিসিট (Money Receipt)' : 'বকেয়া আদায় ও ডিজিটাল রসিদ'}
      subtitle={
        generatedReceipt
          ? `রসিদ নং: ${generatedReceipt.receiptNumber}`
          : `গ্রাহক: ${customer.name} (মোবাইল: ${customer.mobile})`
      }
      maxWidth="lg"
    >
      {generatedReceipt ? (
        /* Printable Money Receipt View */
        <div className="space-y-4 text-xs">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs print:p-6 print:border-none print:shadow-none space-y-4">
            {/* Receipt Header */}
            <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{shop.name || 'SmartShopX Store'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{shop.address || 'দোকান ঠিকানা'}</p>
              <span className="inline-block mt-1 px-3 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                টাকা আদায়ের মানি রিসিট (Money Receipt)
              </span>
            </div>

            {/* Receipt Details */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">রসিদ নম্বর:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {generatedReceipt.receiptNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">তারিখ:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{generatedReceipt.date}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">গ্রাহকের নাম:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{generatedReceipt.customerName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">মোবাইল:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{generatedReceipt.customerMobile}</span>
              </div>
            </div>

            {/* Calculation Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">পূর্ববর্তী মোট বকেয়া</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(generatedReceipt.previousDue)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                    <td className="py-2 px-3 text-emerald-800 dark:text-emerald-300 font-semibold">
                      পরিশোধকৃত টাকা ({generatedReceipt.method})
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      (-) {formatCurrency(generatedReceipt.collectedAmount)}
                    </td>
                  </tr>
                  {generatedReceipt.discountAdjusted > 0 && (
                    <tr className="bg-amber-50/40 dark:bg-amber-950/20">
                      <td className="py-2 px-3 text-amber-800 dark:text-amber-300 font-medium">বিশেষ ছাড় / সমন্বয়</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                        (-) {formatCurrency(generatedReceipt.discountAdjusted)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-100/70 dark:bg-slate-800/80 font-bold">
                    <td className="py-2.5 px-3 text-slate-900 dark:text-slate-100">অবশিষ্ট বকেয়া ব্যালেন্স</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700 dark:text-rose-400">
                      {formatCurrency(generatedReceipt.newDue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {generatedReceipt.notes && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                মন্তব্য: {generatedReceipt.notes}
              </p>
            )}

            {/* Signature & Verification Proof */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between">
              <div className="text-center w-36 space-y-1">
                {signatureData ? (
                  <div className="h-12 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-1 bg-slate-50 dark:bg-slate-800">
                    <img src={signatureData} alt="গ্রাহকের ডিজিটাল স্বাক্ষর" className="max-h-full max-w-full" />
                  </div>
                ) : (
                  <div className="h-10 border-b border-slate-300 dark:border-slate-700" />
                )}
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                  গ্রাহকের স্বাক্ষর {signatureData && '✓ ডিজিটাল'}
                </span>
              </div>

              {isOtpVerified && (
                <div className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>OTP ভেরিফাইড</span>
                </div>
              )}

              <div className="text-center w-36 space-y-1">
                <div className="h-10 border-b border-slate-300 dark:border-slate-700" />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                  আদায়কারী / ম্যানেজার
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 print:hidden">
            <button
              type="button"
              onClick={handleShareReceiptWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp এ পাঠান</span>
            </button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintReceipt}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                রসিদ প্রিন্ট করুন
              </Button>
              <Button variant="primary" size="sm" onClick={onClose}>
                সম্পন্ন
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Form for Collection */
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Current Due Highlight */}
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold block">বর্তমান মোট বকেয়া</span>
              <span className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
                {formatCurrency(customer.totalDue)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCollectAmount(customer.totalDue);
                setDiscountAmount(0);
              }}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-100 cursor-pointer shadow-2xs"
            >
              সম্পূর্ণ বকেয়া
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Collected Amount */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                আদায়ের পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min={0}
                max={customer.totalDue}
                value={collectAmount || ''}
                onChange={(e) => setCollectAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Special Waiver / Discount */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                বিশেষ ছাড় / সমন্বয় (৳)
              </label>
              <input
                type="number"
                min={0}
                max={customer.totalDue - (collectAmount || 0)}
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="যেমন: ৫০ বা ১০০"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Payment Method */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                পেমেন্ট মাধ্যম *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Cash">নগদ টাকা (Cash)</option>
                <option value="bKash">বিকাশ (bKash)</option>
                <option value="Nagad">নগদ (Nagad)</option>
                <option value="Rocket">রকেট (Rocket)</option>
                <option value="Bank">ব্যাংক ট্রান্সফার (Bank)</option>
                <option value="Other">চেক বা অন্যান্য</option>
              </select>
            </div>

            {/* Receipt Number */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                মানি রিসিট নম্বর
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Digital Signature & OTP Options Accordion */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>অতিরিক্ত সুরক্ষা: ডিজিটাল প্রমাণ ও যাচাইকরণ</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowSignatureCanvas(!showSignatureCanvas)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                    signatureData
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <PenTool className="w-3 h-3" />
                  <span>{signatureData ? 'স্বাক্ষর যুক্ত হয়েছে ✓' : '+ ডিজিটাল স্বাক্ষর'}</span>
                </button>

                {!isOtpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtpSimulation}
                    className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Smartphone className="w-3 h-3 text-blue-600" />
                    <span>OTP যাচাই</span>
                  </button>
                )}
              </div>
            </div>

            {/* OTP Input box */}
            {showOtpInput && !isOtpVerified && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">OTP কোড লিখুন:</span>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="১২৩৪"
                    className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg font-mono font-bold text-center"
                  />
                </div>
                <Button type="button" variant="primary" size="sm" onClick={handleVerifyOtp}>
                  যাচাই করুন
                </Button>
              </div>
            )}

            {isOtpVerified && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>গ্রাহক ওটিপি কোড সফলভাবে প্রমাণিত হয়েছে।</span>
              </div>
            )}

            {/* Signature Canvas Box */}
            {showSignatureCanvas && (
              <div className="pt-2">
                <DigitalSignatureCanvas
                  onSaveSignature={(data) => {
                    setSignatureData(data);
                    setShowSignatureCanvas(false);
                    showToast('ডিজিটাল স্বাক্ষর সংযুক্ত হয়েছে', 'success');
                  }}
                  onCancel={() => setShowSignatureCanvas(false)}
                  initialSignature={signatureData || undefined}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              আদায়ের বিবরণ বা মন্তব্য
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: দোকানে এসে নগদ পরিশোধ করলেন..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Balance Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400 font-medium">আদায় ও ছাড় বাদে অবশিষ্ট বকেয়া:</span>
            <span
              className={`font-mono font-bold text-sm ${
                remainingDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatCurrency(remainingDue)}
            </span>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              {isSubmitting ? 'প্রসেসিং...' : 'আদায় নিশ্চিত করুন ও রসিদ প্রস্তুত করুন'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default DueCollectionModal;

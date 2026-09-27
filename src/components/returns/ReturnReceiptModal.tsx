import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ReturnExchangeRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  Printer,
  Share2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRightLeft,
  Truck,
  Ticket,
  BadgeCheck,
} from 'lucide-react';

interface ReturnReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ReturnExchangeRecord | null;
}

export const ReturnReceiptModal: React.FC<ReturnReceiptModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const { shop } = useAuth();
  const { showToast } = useToast();
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyVoucher = () => {
    if (record.storeCreditCode) {
      navigator.clipboard.writeText(record.storeCreditCode);
      setCopiedVoucher(true);
      showToast('স্টোর ক্রেডিট ভাউচার কোড কপি করা হয়েছে', 'success');
      setTimeout(() => setCopiedVoucher(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const rawNumber = record.customerMobile.replace(/[^0-9]/g, '');
    const mobile = rawNumber.startsWith('88') ? rawNumber : `88${rawNumber}`;

    const lines = [
      `*${shop.name} - রিটার্ন ও এক্সচেঞ্জ কনফার্মেশন*`,
      `সম্মানিত গ্রাহক ${record.customerName}, আপনার রিটার্ন সফলভাবে সম্পন্ন হয়েছে।`,
      ``,
      `• ট্র্যাকিং নং: ${record.returnNumber}`,
      `• মূল চালান নং: ${record.invoiceNumber}`,
      `• ধরন: ${record.type === 'Exchange' ? 'পণ্য এক্সচেঞ্জ' : 'পণ্য রিটার্ন'}`,
      `• তারিখ: ${formatDate(record.date)}`,
    ];

    if (record.returnedItems && record.returnedItems.length > 0) {
      lines.push(`• ফেরত পণ্য: ${record.returnedItems.map((i) => `${i.productName} (${i.quantity}টি)`).join(', ')}`);
    }

    if (record.exchangedItems && record.exchangedItems.length > 0) {
      lines.push(`• নতুন পণ্য: ${record.exchangedItems.map((i) => `${i.productName} (${i.quantity}টি)`).join(', ')}`);
    }

    if (record.refundAmount > 0) {
      lines.push(`• রিফান্ড পরিমাণ: ৳${record.refundAmount}`);
    }
    if (record.additionalCharge && record.additionalCharge > 0) {
      lines.push(`• অতিরিক্ত আদায়: ৳${record.additionalCharge}`);
    }

    if (record.storeCreditCode) {
      lines.push(`• স্টোর ক্রেডিট ভাউচার কোড: *${record.storeCreditCode}*`);
      lines.push(`(পরবর্তী কেনাকাটায় এই কোডটি ব্যবহার করতে পারবেন)`);
    }

    lines.push(``);
    lines.push(`যেকোনো প্রয়োজনে যোগাযোগ করুন: ${shop.mobile || ''}`);
    lines.push(`ধন্যবাদ, ${shop.name}`);

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${mobile}?text=${text}`, '_blank');
  };

  const isDamaged = record.condition === 'Damaged_Defective';
  const isExchange = record.type === 'Exchange';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="রিটার্ন রিসিট ও ক্রেডিট নোট (Credit Note Slip)"
      subtitle={`ট্র্যাকিং নং: ${record.returnNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Printable Area */}
        <div id="return-receipt-slip" className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 text-slate-900">
          {/* Slip Header */}
          <div className="border-b border-slate-200 pb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-8 h-8 rounded-lg object-contain bg-slate-50 p-0.5 border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{shop.name}</h2>
            </div>
            <p className="text-xs text-slate-500">{shop.address} • ফোন: {shop.mobile}</p>
            <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider mt-1">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
              {isExchange ? 'পণ্য এক্সচেঞ্জ স্লিপ' : 'পণ্য রিটার্ন ও ক্রেডিট নোট'}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-b border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">রিটার্ন ট্র্যাকিং নং</span>
              <span className="font-mono font-bold text-slate-900">{record.returnNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">মূল বিক্রয় চালান</span>
              <span className="font-mono font-bold text-emerald-700">{record.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">তারিখ ও সময়</span>
              <span className="font-mono font-semibold text-slate-700">{formatDate(record.date)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">গ্রাহকের নাম</span>
              <span className="font-bold text-slate-800">{record.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">গ্রাহক মোবাইল</span>
              <span className="font-mono font-semibold text-slate-700">{record.customerMobile || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">চ্যানেল / মাধ্যম</span>
              <span className="font-semibold text-slate-700">
                {record.channel === 'Courier_RTO'
                  ? 'কুরিয়ার পার্সেল ফেরত (RTO)'
                  : record.channel === 'Online'
                  ? 'অনলাইন স্টোর'
                  : 'ইন-স্টোর পিওএস (POS)'}
              </span>
            </div>
          </div>

          {/* Courier RTO Badge & Loss info if applicable */}
          {record.channel === 'Courier_RTO' && (
            <div className="my-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900 block">
                    কুরিয়ার আরটিও ট্র্যাকিং: {record.courierProvider || 'কুরিয়ার সার্ভিস'}
                  </span>
                  <span className="text-[11px] text-amber-700 font-mono">
                    ট্র্যাকিং আইডি: {record.courierTrackingCode || 'N/A'}
                  </span>
                </div>
              </div>
              {record.courierReturnFee !== undefined && record.courierReturnFee > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-amber-700 block">কুরিয়ার রিটার্ন ক্ষতি চার্জ</span>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatCurrency(record.courierReturnFee)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Items Table */}
          <div className="py-3 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-2">
                ফেরত নেওয়া পণ্য (Returned Goods)
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">পণ্যের বিবরণ</th>
                      <th className="py-2 px-3 font-semibold text-center">অবস্থা</th>
                      <th className="py-2 px-3 font-semibold text-center">পরিমাণ</th>
                      <th className="py-2 px-3 font-semibold text-right">মূল্য</th>
                      <th className="py-2 px-3 font-semibold text-right">মোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(record.returnedItems || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800">{it.productName}</td>
                        <td className="py-2 px-3 text-center">
                          {it.condition === 'Damaged_Defective' || isDamaged ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> ড্যামেজ / ত্রুটিপূর্ণ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ভালো / রিস্টক
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-center">{it.quantity} টি</td>
                        <td className="py-2 px-3 font-mono text-right">{formatCurrency(it.unitPrice)}</td>
                        <td className="py-2 px-3 font-mono font-bold text-right">
                          {formatCurrency(it.unitPrice * it.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exchanged Items */}
            {isExchange && record.exchangedItems && record.exchangedItems.length > 0 && (
              <div>
                <span className="text-xs font-bold text-purple-900 block mb-2">
                  বিনিময়ে প্রদত্ত নতুন পণ্য (Exchanged Products Given)
                </span>
                <div className="border border-purple-200 rounded-xl overflow-hidden bg-purple-50/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-100/60 text-purple-900 border-b border-purple-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">নতুন পণ্য</th>
                        <th className="py-2 px-3 font-semibold text-center">পরিমাণ</th>
                        <th className="py-2 px-3 font-semibold text-right">ইউনিট মূল্য</th>
                        <th className="py-2 px-3 font-semibold text-right">মোট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {record.exchangedItems.map((ex, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-purple-950">{ex.productName}</td>
                          <td className="py-2 px-3 font-mono text-center">{ex.quantity} টি</td>
                          <td className="py-2 px-3 font-mono text-right">{formatCurrency(ex.unitPrice)}</td>
                          <td className="py-2 px-3 font-mono font-bold text-right">
                            {formatCurrency(ex.unitPrice * ex.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Financial Settlement & Store Credit Voucher */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">নিষ্পত্তির ধরন (Settlement Mode):</span>
              <span className="font-bold text-slate-900">
                {record.refundMethod === 'Store_Credit'
                  ? '🎟️ স্টোর ক্রেডিট ভাউচার প্রদান'
                  : record.refundMethod === 'bKash' || record.refundMethod === 'Nagad'
                  ? `📱 মোবাইল ব্যাংকিং (${record.refundMethod})`
                  : record.refundMethod === 'Bank'
                  ? '🏦 ব্যাংক ট্রান্সফার'
                  : isExchange
                  ? '🔄 এক্সচেঞ্জ ব্যালেন্স সমন্বয়'
                  : '💵 ক্যাশ রিফান্ড'}
              </span>
            </div>

            {record.refundAmount > 0 && (
              <div className="flex items-center justify-between text-sm font-bold pt-1 border-t border-slate-200">
                <span className="text-rose-600">মোট রিফান্ড / ক্রেডিট মূল্য:</span>
                <span className="font-mono text-rose-600 text-base">
                  {formatCurrency(record.refundAmount)}
                </span>
              </div>
            )}

            {record.additionalCharge ? (
              <div className="flex items-center justify-between text-sm font-bold pt-1 border-t border-slate-200">
                <span className="text-emerald-700">অতিরিক্ত পেমেন্ট আদায়:</span>
                <span className="font-mono text-emerald-700 text-base">
                  +{formatCurrency(record.additionalCharge)}
                </span>
              </div>
            ) : null}

            {/* Store Credit Voucher Box */}
            {record.storeCreditCode && (
              <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-5 h-5 text-purple-600" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-700 block tracking-wider">
                      স্টোর ক্রেডিট ভাউচার কোড
                    </span>
                    <span className="font-mono font-black text-sm text-purple-950">
                      {record.storeCreditCode}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyVoucher}
                  className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  {copiedVoucher ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> কপি হয়েছে
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> কোড কপি
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Reason & Notes */}
            <div className="pt-2 text-xs text-slate-500 border-t border-slate-200">
              <span className="font-semibold text-slate-700">কারণ: </span>
              {record.reason || 'উল্লেখ নেই'}
              {record.notes && (
                <span className="block mt-0.5 text-slate-400">
                  <strong className="text-slate-600">নোট: </strong>
                  {record.notes}
                </span>
              )}
            </div>
          </div>

          {/* Slip Footer */}
          <div className="pt-4 text-center text-[10px] text-slate-400">
            SmartShopX Cloud POS দ্বারা স্বয়ংক্রিয়ভাবে তৈরি • পণ্য ফেরত নেওয়ার সময় সিল ও স্বাক্ষর প্রযোজ্য
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            স্টক স্ট্যাটাস:{' '}
            <span className={record.stockRestocked ? 'text-emerald-600 font-semibold' : 'text-slate-600'}>
              {record.stockRestocked ? '✓ স্টকে যুক্ত হয়েছে' : '✗ রিস্টক করা হয়নি'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> হোয়াটসঅ্যাপে পাঠান
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4" /> প্রিন্ট স্লিপ
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { Order, Shop } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Store,
  Send,
  FileText,
  Truck,
  MessageSquare,
  QrCode,
  Tag,
  Receipt,
  FileCheck,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { smsService } from '../../services/smsService';

export type ReceiptFormat = 'standard' | 'challan' | 'a5' | 'thermal_58' | 'thermal_80' | 'shipping_label';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  shop: Shop;
  initialFormat?: ReceiptFormat;
  onNewSale?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  shop,
  initialFormat = 'standard',
  onNewSale,
}) => {
  const { showToast } = useToast();
  const [format, setFormat] = useState<ReceiptFormat>(initialFormat);
  const [isSendingSms, setIsSendingSms] = useState(false);

  useEffect(() => {
    if (isOpen && initialFormat) {
      setFormat(initialFormat);
    }
  }, [isOpen, initialFormat]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    showToast('ইনভয়েস প্রিন্ট / PDF ডায়ালগ ওপেন হচ্ছে...', 'info');
    window.print();
  };

  const buildWhatsAppMessage = () => {
    const safeItems = Array.isArray(order?.items) ? order.items : [];
    const itemsList = safeItems
      .map(
        (it) =>
          `• ${it.productName} (${it.quantity}টি × ৳${it.unitPrice.toLocaleString('bn-BD')}) = ৳${it.total.toLocaleString('bn-BD')}`
      )
      .join('\n');

    return (
      `*${shop.name} - ক্যাশ মেমো*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `মেমো নং: #${order.orderNumber}\n` +
      `তারিখ: ${formatDateTime(order.createdAt)}\n` +
      `সম্মানিত গ্রাহক: ${order.customerName}\n` +
      (order.customerMobile ? `মোবাইল: ${order.customerMobile}\n` : '') +
      `\n📦 *পণ্যের বিবরণ:*\n` +
      `${itemsList}\n` +
      `\n💰 *হিসাব:*\n` +
      `সাবটোটাল: ৳${order.subtotal.toLocaleString('bn-BD')}\n` +
      (order.discount > 0 ? `ডিসকাউন্ট: -৳${order.discount.toLocaleString('bn-BD')}\n` : '') +
      (order.deliveryCharge > 0 ? `ডেলিভারি চার্জ: +৳${order.deliveryCharge.toLocaleString('bn-BD')}\n` : '') +
      `*সর্বমোট বিল: ৳${order.totalAmount.toLocaleString('bn-BD')}*\n` +
      `পরিশোধ: ৳${order.paidAmount.toLocaleString('bn-BD')}\n` +
      (order.dueAmount > 0
        ? `⚠️ *বকেয়া / বাকি: ৳${order.dueAmount.toLocaleString('bn-BD')}*\n`
        : `✅ *সম্পূর্ণ পরিশোধিত (PAID)*\n`) +
      `\n🔗 ডিজিটাল মেমো দেখুন: https://smartshopx.com/invoice/${order.orderNumber}\n` +
      `ঠিকানা: ${shop.address}\n` +
      `হটলাইন: ${shop.mobile}\n` +
      `আমাদের সাথে থাকার জন্য আন্তরিক ধন্যবাদ!`
    );
  };

  const handleShareWhatsApp = () => {
    const rawMobile = order.customerMobile ? order.customerMobile.replace(/[^0-9]/g, '') : '';
    let targetPhone = '';
    if (rawMobile.startsWith('880')) {
      targetPhone = rawMobile;
    } else if (rawMobile.startsWith('01')) {
      targetPhone = `880${rawMobile.substring(1)}`;
    }

    const message = buildWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    const waUrl = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank');
    showToast('হোয়াটসঅ্যাপে ইনভয়েস মেসেজ প্রস্তুত করা হয়েছে', 'success');
  };

  const handleCopyText = () => {
    const message = buildWhatsAppMessage();
    navigator.clipboard.writeText(message);
    showToast('ইনভয়েসের বিস্তারিত টেক্সট ক্লিপবোর্ডে কপি করা হয়েছে', 'success');
  };

  const handleSendInvoiceSms = () => {
    if (!order.customerMobile) {
      showToast('গ্রাহকের মোবাইল নম্বর পাওয়া যায়নি', 'warning');
      return;
    }
    setIsSendingSms(true);
    const smsText = `প্রিয় ${order.customerName}, ${shop.name} থেকে আপনার মেমো নং ${order.orderNumber}। মোট: ৳${order.totalAmount}, পরিশোধ: ৳${order.paidAmount}${order.dueAmount > 0 ? `, বাকি: ৳${order.dueAmount}` : ''}। বিস্তারিত জানতে কল করুন: ${shop.mobile}`;
    const res = smsService.sendSms(order.customerMobile, smsText, 'মেমো এসএমএস');
    setIsSendingSms(false);
    if (res.success) {
      showToast(`ইনভয়েস এসএমএস পাঠানো হয়েছে: ${order.customerMobile}`, 'success');
    } else {
      showToast(res.error || 'এসএমএস পাঠাতে ব্যর্থ হয়েছে', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={format === 'challan' ? 'ডেলিভারি চালান (Delivery Challan)' : 'ক্যাশ মেমো ও চালান প্রিন্টার'}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Format Selector Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          {/* Formats Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 text-xs font-semibold no-scrollbar">
            <button
              onClick={() => setFormat('standard')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                format === 'standard'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>A4 ক্যাশ মেমো</span>
            </button>

            <button
              onClick={() => setFormat('challan')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                format === 'challan'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>ডেলিভারি চালান (Price-less)</span>
            </button>

            <button
              onClick={() => setFormat('a5')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                format === 'a5'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-purple-600" />
              <span>A5 হাফ পেইজ</span>
            </button>

            <button
              onClick={() => setFormat('thermal_58')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                format === 'thermal_58'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>POS ৫৮ মিমি</span>
            </button>

            <button
              onClick={() => setFormat('thermal_80')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                format === 'thermal_80'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>POS ৮০ মিমি</span>
            </button>

            <button
              onClick={() => setFormat('shipping_label')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                format === 'shipping_label'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-rose-600" />
              <span>কুরিয়ার স্টিকার (৪x৬)</span>
            </button>
          </div>

          {/* Direct Communication Actions */}
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="সরাসরি গ্রাহকের হোয়াটসঅ্যাপে পাঠান"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>হোয়াটসঅ্যাপ</span>
            </button>

            <button
              onClick={handleSendInvoiceSms}
              disabled={isSendingSms || !order.customerMobile}
              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="মেমো এসএমএস পাঠান"
            >
              <Send className="w-3.5 h-3.5" />
              <span>এসএমএস</span>
            </button>

            <button
              onClick={handleCopyText}
              className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-200/70 border border-slate-200 cursor-pointer"
              title="কপি টেক্সট"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CANVAS CONTAINER */}
        <div className="bg-slate-100/80 p-3 sm:p-6 rounded-2xl flex justify-center max-h-[580px] overflow-y-auto">
          {/* 1. STANDARD A4 INVOICE */}
          {format === 'standard' && (
            <div
              id="printable-invoice"
              className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 text-slate-800 text-sm space-y-6 w-full max-w-3xl shadow-xs"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-slate-900 gap-4">
                <div className="flex items-center gap-3.5">
                  {shop.logo ? (
                    <img
                      src={shop.logo}
                      alt={shop.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl">
                      <Store className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{shop.name}</h2>
                    <p className="text-xs text-slate-600 mt-0.5 max-w-sm">{shop.address}</p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-slate-500 font-mono mt-1">
                      <span>মোবাইল: {shop.mobile}</span>
                      {shop.email && <span>ইমেইল: {shop.email}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-md font-mono font-bold text-xs uppercase tracking-wider">
                    ক্যাশ মেমো / ইনভয়েস
                  </div>
                  <div className="text-xs font-mono text-slate-700 font-bold">
                    মেমো নং: <span className="text-emerald-700 font-black">{order.orderNumber}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">তারিখ: {formatDateTime(order.createdAt)}</p>
                  <p className="text-xs text-slate-600 font-medium">বিক্রয় মাধ্যম: {order.channel}</p>
                </div>
              </div>

              {/* Customer & Billing Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                    ক্রেতার তথ্য (Bill To):
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{order.customerName}</div>
                  <div className="text-slate-600 font-mono mt-0.5">{order.customerMobile || 'মোবাইল নেই'}</div>
                  <div className="text-slate-600 mt-0.5 leading-relaxed">
                    {order.customerAddress || 'কাউন্টার সরাসরি বিক্রয়'}
                  </div>
                </div>

                <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                    পেমেন্ট ও ডেলিভারি বিবরণ:
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">পেমেন্ট মেথড:</span>
                    <span className="font-semibold text-slate-800">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">অর্ডার স্ট্যাটাস:</span>
                    <span className="font-semibold text-slate-800">{order.orderStatus}</span>
                  </div>
                  {order.courierProvider && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">কুরিয়ার সার্ভিস:</span>
                      <span className="font-semibold text-slate-800">
                        {order.courierProvider} {order.courierTrackingId ? `(${order.courierTrackingId})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-y-2 border-slate-800 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">পণ্যের বিবরণ / আইটেম</th>
                      <th className="py-2.5 px-3 text-center w-24">পরিমাণ (Qty)</th>
                      <th className="py-2.5 px-3 text-right w-28">একক দর</th>
                      <th className="py-2.5 px-3 text-right w-32">মোট টাকা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(order.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.productName}</div>
                          {item.variant && (
                            <div className="text-[10px] text-slate-500 font-mono">ভ্যারিয়েন্ট: {item.variant}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                          {item.quantity} টি
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary & QR Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t-2 border-slate-200">
                {/* QR Code & Verification info */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="w-16 h-16 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-1">
                    {/* Simulated SVG QR Code */}
                    <svg viewBox="0 0 24 24" className="w-full h-full text-slate-800" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h2v2h-2v-2zm-4-2h2v4h-2v-4zm6 6h2v2h-2v-2zm-2-2h2v2h-2v-2zm-4 4h4v2h-4v-2zm6-4h2v2h-2v-2z" />
                    </svg>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-800">ডিজিটাল ভেরিফিকেশন কোড</p>
                    <p className="font-mono text-[10px] text-slate-500">ID: {order.id}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">✓ সত্যতা যাচাইকৃত চালান</p>
                  </div>
                </div>

                {/* Totals */}
                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>পণ্যের মূল্য (Subtotal):</span>
                    <span className="font-mono font-medium">{formatCurrency(order.subtotal)}</span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>বিশেষ ছাড় (Discount):</span>
                      <span className="font-mono font-medium">- {formatCurrency(order.discount)}</span>
                    </div>
                  )}

                  {order.deliveryCharge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>ডেলিভারি চার্জ (Shipping):</span>
                      <span className="font-mono font-medium">+ {formatCurrency(order.deliveryCharge)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                    <span>সর্বমোট বিল (Total):</span>
                    <span className="font-mono text-emerald-700">{formatCurrency(order.totalAmount)}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>নগদ পরিশোধ (Paid):</span>
                    <span className="font-mono">{formatCurrency(order.paidAmount)}</span>
                  </div>

                  <div
                    className={`flex justify-between font-bold p-2 rounded-lg text-xs ${
                      order.dueAmount > 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span>{order.dueAmount > 0 ? 'অবশিষ্ট বকেয়া / বাকি:' : 'পরিশোধ স্ট্যাটাস:'}</span>
                    <span className="font-mono">
                      {order.dueAmount > 0 ? formatCurrency(order.dueAmount) : 'পরিশোধিত (Fully Paid)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Seal Block */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-dashed border-slate-400 w-44 mx-auto pt-1 font-semibold text-slate-700">
                    ক্রেতার স্বাক্ষর
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">পণ্য বুঝে পেয়েছি</p>
                </div>
                <div>
                  <div className="border-t border-dashed border-slate-400 w-44 mx-auto pt-1 font-semibold text-slate-700">
                    অনুমোদিত কর্মকর্তার স্বাক্ষর
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{shop.name}</p>
                </div>
              </div>

              {/* Terms & Footer Note */}
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1 text-center">
                <p>
                  * শর্তাবলী: বিক্রিত পণ্য মেমোসহ অক্ষত অবস্থায় ৩ দিনের মধ্যে পরিবর্তনযোগ্য। কোনো সহায়তার জন্য কল করুন:{' '}
                  <span className="font-mono font-bold text-slate-700">{shop.mobile}</span>
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  SmartShopX Business POS & Invoices Cloud • {new Date().getFullYear()}
                </p>
              </div>
            </div>
          )}

          {/* 2. DELIVERY CHALLAN (PRICE-LESS COMMERCIAL DISPATCH SLIP) */}
          {format === 'challan' && (
            <div
              id="printable-invoice"
              className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 text-slate-800 text-sm space-y-6 w-full max-w-3xl shadow-xs"
            >
              {/* Challan Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-emerald-700 gap-4">
                <div className="flex items-center gap-3.5">
                  {shop.logo ? (
                    <img
                      src={shop.logo}
                      alt={shop.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl">
                      <Truck className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{shop.name}</h2>
                    <p className="text-xs text-slate-600 mt-0.5">{shop.address}</p>
                    <p className="text-xs text-slate-500 font-mono">হটলাইন: {shop.mobile}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="inline-block bg-emerald-700 text-white px-3.5 py-1.5 rounded-md font-mono font-bold text-xs uppercase tracking-wider">
                    ডেলিভারি চালান (DELIVERY CHALLAN)
                  </div>
                  <div className="text-xs font-mono text-slate-800 font-bold">
                    চালান নং: <span className="text-emerald-800 font-black">CHL-{order.orderNumber}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">তারিখ: {formatDateTime(order.createdAt)}</p>
                  <p className="text-xs text-slate-600 font-mono">অর্ডার রেফারেন্স: #{order.orderNumber}</p>
                </div>
              </div>

              {/* Delivery Consignee & Transit Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/80 text-xs">
                <div>
                  <span className="text-emerald-900 font-bold uppercase tracking-wider block text-[10px]">
                    পণ্য গ্রহণকারীর তথ্য (Consignee / Deliver To):
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1">{order.customerName}</div>
                  <div className="text-slate-700 font-mono mt-0.5 font-bold">
                    মোবাইল: {order.customerMobile || 'কাউন্টার ডেলিভারি'}
                  </div>
                  <div className="text-slate-700 mt-0.5 leading-relaxed font-medium">
                    গন্তব্য ঠিকানা: {order.customerAddress || 'দোকান কাউন্টার থেকে হস্তান্তর'}
                  </div>
                </div>

                <div className="space-y-1.5 sm:border-l sm:border-emerald-200 sm:pl-4">
                  <span className="text-emerald-900 font-bold uppercase tracking-wider block text-[10px]">
                    পরিবহন ও কুরিয়ার বিবরণ:
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-600">কুরিয়ার / মাধ্যম:</span>
                    <span className="font-bold text-slate-900">{order.courierProvider || 'নিজস্ব ডেলিভারি / POS'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ট্র্যাকিং কোড:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {order.courierTrackingId || 'প্রযোজ্য নয়'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">মোট কার্টন / প্যাকেট:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {order.items.reduce((sum, it) => sum + it.quantity, 0)} পিস (১ পার্সেল)
                    </span>
                  </div>
                </div>
              </div>

              {/* Price-less Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-y-2 border-slate-900 bg-slate-100 text-slate-800 font-bold uppercase text-[11px]">
                      <th className="py-3 px-3 w-12 text-center">ক্র.নং</th>
                      <th className="py-3 px-3">পণ্যের পূর্ণ বিবরণ ও স্পেসিফিকেশন</th>
                      <th className="py-3 px-3 w-28 text-center">আইটেম কোড</th>
                      <th className="py-3 px-3 text-center w-28">পরিমাণ (Qty)</th>
                      <th className="py-3 px-3 w-40 text-center">প্যাকেজিং স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(order.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 text-sm">{item.productName}</div>
                          {item.variant && (
                            <div className="text-xs text-slate-500 font-mono">ভ্যারিয়েন্ট: {item.variant}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">
                          PROD-{idx + 101}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-base font-black text-slate-900">
                          {item.quantity} পিস
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            অক্ষত ও সিল করা
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-800 bg-slate-50 font-bold">
                      <td colSpan={3} className="py-2.5 px-3 text-right">
                        মোট সরবরাহিত পণ্যের সংখ্যা:
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-base font-black text-emerald-700">
                        {order.items.reduce((sum, it) => sum + it.quantity, 0)} পিস
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Dispatch Declaration Notice */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-800">
                  ঘোষণা: উল্লেখিত সকল পণ্য সঠিক মান ও অক্ষত অবস্থায় ডেলিভারির জন্য প্রেরণ করা হয়েছে।
                </p>
                <p className="text-[11px] text-slate-500">
                  গ্রহীতাকে পার্সেল বা কার্টন খোলার পূর্বে প্যাকিং সিল ও সংখ্যা ভালো করে মিলিয়ে নেওয়ার জন্য অনুরোধ করা হচ্ছে।
                </p>
              </div>

              {/* 3 Signature Blocks */}
              <div className="pt-10 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="border-t border-dashed border-slate-400 w-36 mx-auto pt-1 font-bold text-slate-700">
                    প্রস্তুতকারক (Store Keeper)
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">প্যাকিং ও যাচাইকৃত</p>
                </div>
                <div>
                  <div className="border-t border-dashed border-slate-400 w-36 mx-auto pt-1 font-bold text-slate-700">
                    বাহক / কুরিয়ারের স্বাক্ষর
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">পরিবহনের জন্য গৃহীত</p>
                </div>
                <div>
                  <div className="border-t border-dashed border-slate-400 w-36 mx-auto pt-1 font-bold text-slate-700">
                    গ্রহণকারীর স্বাক্ষর ও সিল
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">তারিখসহ পণ্য বুঝে পেলাম</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. A5 HALF-PAGE COMPACT INVOICE (2-COPY / PAPER-SAVING) */}
          {format === 'a5' && (
            <div
              id="printable-invoice"
              className="bg-white p-5 rounded-xl border border-slate-200 text-slate-800 text-xs space-y-3.5 w-full max-w-xl shadow-xs"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">{shop.name}</h3>
                  <p className="text-[11px] text-slate-500">{shop.address} • {shop.mobile}</p>
                </div>
                <div className="text-right">
                  <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    A5 ক্যাশ মেমো
                  </span>
                  <div className="font-mono font-bold text-xs mt-0.5">#{order.orderNumber}</div>
                  <div className="text-[10px] text-slate-500">{formatDate(order.createdAt)}</div>
                </div>
              </div>

              {/* Customer */}
              <div className="flex justify-between bg-slate-50 p-2 rounded-lg text-[11px]">
                <div>
                  <span className="text-slate-400">গ্রাহক:</span>{' '}
                  <span className="font-bold text-slate-800">{order.customerName}</span>{' '}
                  <span className="font-mono text-slate-500">({order.customerMobile || 'কাউন্টার'})</span>
                </div>
                <div>
                  <span className="text-slate-400">মাধ্যম:</span>{' '}
                  <span className="font-semibold text-slate-700">{order.channel}</span>
                </div>
              </div>

              {/* Items */}
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300 font-bold text-slate-600">
                    <th className="py-1">পণ্য</th>
                    <th className="py-1 text-center">পরিমাণ</th>
                    <th className="py-1 text-right">দর</th>
                    <th className="py-1 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1 font-medium">{it.productName}</td>
                      <td className="py-1 text-center font-mono">{it.quantity}</td>
                      <td className="py-1 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-1 text-right font-mono font-bold">{formatCurrency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2 border-t border-slate-300">
                <div className="w-48 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>সর্বমোট বিল:</span>
                    <span className="font-bold text-slate-900 font-mono">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>পরিশোধিত:</span>
                    <span className="font-semibold text-emerald-700 font-mono">{formatCurrency(order.paidAmount)}</span>
                  </div>
                  {order.dueAmount > 0 && (
                    <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 pt-0.5">
                      <span>বকেয়া / বাকি:</span>
                      <span className="font-mono">{formatCurrency(order.dueAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 flex justify-between text-[10px] text-center text-slate-500">
                <div className="border-t border-dashed border-slate-400 w-28 pt-1">গ্রাহকের স্বাক্ষর</div>
                <div className="border-t border-dashed border-slate-400 w-28 pt-1">ম্যানেজারের স্বাক্ষর</div>
              </div>
            </div>
          )}

          {/* 4 & 5. THERMAL 58MM / 80MM POS RECEIPT FORMAT */}
          {(format === 'thermal_58' || format === 'thermal_80') && (
            <div
              id="printable-invoice"
              className={`bg-white p-4 text-black font-mono shadow-md border border-slate-300 text-xs ${
                format === 'thermal_58' ? 'w-[260px]' : 'w-[330px]'
              }`}
              style={{
                fontSize: format === 'thermal_58' ? '11px' : '12px',
                lineHeight: 1.35,
              }}
            >
              {/* Header */}
              <div className="text-center pb-2">
                <h3 className="font-bold text-sm tracking-tight uppercase leading-tight">
                  {shop.name}
                </h3>
                <p className="text-[10px] text-slate-700 mt-0.5">{shop.address}</p>
                <p className="text-[10px] text-slate-700 font-bold">মোবাইল: {shop.mobile}</p>
              </div>

              <div className="border-b border-dashed border-black my-1.5" />

              {/* Order Info */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>মেমো নং:</span>
                  <span className="font-bold">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>তারিখ:</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>গ্রাহক:</span>
                  <span className="truncate max-w-[150px] font-bold">{order.customerName}</span>
                </div>
                {order.customerMobile && (
                  <div className="flex justify-between">
                    <span>ফোন:</span>
                    <span>{order.customerMobile}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>পেমেন্ট:</span>
                  <span>{order.paymentMethod}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-black my-1.5" />

              {/* Items Table */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-[10px] pb-0.5">
                  <span className="flex-1">বিবরণ</span>
                  <span className="w-10 text-center">পরিমাণ</span>
                  <span className="w-14 text-right">টাকা</span>
                </div>

                {(order.items || []).map((it, i) => (
                  <div key={i} className="text-[10px] space-y-0.5">
                    <div className="font-semibold leading-tight">{it.productName}</div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-[9px]">
                        {it.quantity} × ৳{it.unitPrice.toLocaleString('bn-BD')}
                      </span>
                      <span className="font-bold text-black">
                        ৳{it.total.toLocaleString('bn-BD')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-black my-1.5" />

              {/* Calculation Breakdown */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>সাবটোটাল:</span>
                  <span>৳{order.subtotal.toLocaleString('bn-BD')}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span>ডিসকাউন্ট:</span>
                    <span>- ৳{order.discount.toLocaleString('bn-BD')}</span>
                  </div>
                )}
                {order.deliveryCharge > 0 && (
                  <div className="flex justify-between">
                    <span>ডেলিভারি চার্জ:</span>
                    <span>+ ৳{order.deliveryCharge.toLocaleString('bn-BD')}</span>
                  </div>
                )}
                <div className="border-b border-slate-400 my-1" />
                <div className="flex justify-between font-black text-xs">
                  <span>সর্বমোট বিল:</span>
                  <span>৳{order.totalAmount.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>জমা / পরিশোধ:</span>
                  <span>৳{order.paidAmount.toLocaleString('bn-BD')}</span>
                </div>
                {order.dueAmount > 0 && (
                  <div className="flex justify-between font-bold text-black">
                    <span>বকেয়া / বাকি:</span>
                    <span>৳{order.dueAmount.toLocaleString('bn-BD')}</span>
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-black my-2" />

              {/* Barcode representation */}
              <div className="text-center space-y-1">
                <div className="font-mono text-[9px] font-bold tracking-widest">
                  * {order.orderNumber} *
                </div>
                <p className="text-[9px] font-sans">ধন্যবাদ, আবার আসবেন!</p>
                <p className="text-[8px] text-slate-500 font-sans">
                  SmartShopX POS Cloud
                </p>
              </div>
            </div>
          )}

          {/* 6. COURIER SHIPPING STICKER LABEL (4x6 INCH STANDARD) */}
          {format === 'shipping_label' && (
            <div
              id="printable-invoice"
              className="bg-white p-5 text-black font-sans shadow-md border-2 border-black rounded-lg w-[380px] space-y-3 text-xs"
            >
              {/* Top Banner */}
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">{shop.name}</h4>
                  <p className="text-[10px] text-slate-600">কুরিয়ার পার্সেল লেবেল</p>
                </div>
                <div className="text-right">
                  <div className="bg-black text-white px-2 py-0.5 font-bold font-mono text-[10px] rounded">
                    {order.courierProvider || 'STEADFAST'}
                  </div>
                  <p className="text-[9px] font-mono mt-0.5">TRK: {order.courierTrackingId || order.orderNumber}</p>
                </div>
              </div>

              {/* Shipper (FROM) */}
              <div className="text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-bold text-slate-500 uppercase">প্রেরক (From):</span>
                <p className="font-bold text-slate-900">{shop.name}</p>
                <p className="text-slate-600">{shop.address}</p>
                <p className="font-mono text-slate-700">ফোন: {shop.mobile}</p>
              </div>

              {/* Consignee (TO) - LARGE AND PROMINENT */}
              <div className="p-3 bg-amber-50/50 rounded-lg border-2 border-black space-y-1">
                <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                  গ্রাহক / প্রাপক (Deliver To):
                </span>
                <h3 className="font-black text-base text-slate-900">{order.customerName}</h3>
                <p className="font-black text-sm font-mono text-slate-900">
                  মোবাইল: {order.customerMobile || 'ফোন নম্বর নেই'}
                </p>
                <p className="text-xs font-semibold text-slate-800 leading-snug pt-1">
                  ঠিকানা: {order.customerAddress || 'কাউন্টার ডেলিভারি'}
                </p>
              </div>

              {/* COD (Cash On Delivery) Amount Box */}
              <div className="p-3 bg-white border-2 border-dashed border-red-600 rounded-lg text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                  ক্যাশ অন ডেলিভারি (COD Amount):
                </span>
                <div className="text-2xl font-black text-red-700 font-mono mt-0.5">
                  {order.dueAmount > 0 ? formatCurrency(order.dueAmount) : '৳০ (PAID / পরিশোধিত)'}
                </div>
              </div>

              {/* Parcel Contents & Barcode */}
              <div className="text-[10px] border-t border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">আইটেম সংখ্যা:</span>
                  <span className="font-bold">{order.items.length} টি ({order.items.reduce((s, i) => s + i.quantity, 0)} পিস)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">অর্ডার আইডি:</span>
                  <span className="font-mono font-bold">{order.orderNumber}</span>
                </div>

                {/* Simulated Barcode */}
                <div className="text-center pt-2">
                  <div className="flex justify-center items-center gap-[2px] h-8 overflow-hidden">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-full bg-black ${
                          i % 3 === 0 ? 'w-[3px]' : i % 2 === 0 ? 'w-[1.5px]' : 'w-[1px]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-[9px] tracking-widest mt-0.5 font-bold">
                    *{order.orderNumber}*
                  </div>
                </div>

                <div className="text-center pt-1 text-[9px] font-bold text-slate-700">
                  ⚠️ ভঙ্গুর পণ্য! সাবধানে হ্যান্ডেল করুন (Handle with Care)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {onNewSale ? (
            <Button
              onClick={() => {
                onClose();
                onNewSale();
              }}
              variant="success"
              size="md"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              নতুন বিক্রয় শুরু করুন
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleShareWhatsApp}
              variant="outline"
              size="sm"
              leftIcon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
            >
              হোয়াটসঅ্যাপে পাঠান
            </Button>
            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
            >
              PDF ডাউনলোড
            </Button>
            <Button
              onClick={handlePrint}
              variant="primary"
              size="md"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              প্রিন্ট করুন
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

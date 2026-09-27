import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, QrCode, Store, Phone, MapPin } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface DigitalInvoiceModalProps {
  order: {
    orderNumber: string;
    customerName: string;
    customerMobile: string;
    customerAddress: string;
    createdAt?: string;
    orderStatus?: string;
    subtotal: number;
    deliveryCharge: number;
    discount?: number;
    totalAmount: number;
    paymentMethod?: string;
    paymentStatus?: string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      total?: number;
    }>;
    shopName?: string;
    notes?: string;
  };
  onClose: () => void;
}

export const DigitalInvoiceModal: React.FC<DigitalInvoiceModalProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('bn-BD');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Control Bar (Hidden during print) */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm">ডিজিটাল ক্যাশ মেমো / ইনভয়েস</span>
            <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট / সেভ করুন</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-rose-600 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                SX
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">SmartShopX.bd</h2>
                <p className="text-xs text-slate-500">অফিসিয়াল সেন্ট্রাল মার্কেটপ্লেস ও ডেলিভারি হাব</p>
                <p className="text-[11px] text-slate-400 font-mono">হেল্পলাইন: ০৯৬৭৮-০০০০০০</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-orange-50 border border-orange-200 px-3 py-1 rounded-xl text-right">
                <span className="text-[10px] text-orange-600 uppercase font-bold tracking-wider block">
                  অর্ডার মেমো নম্বর
                </span>
                <span className="font-mono text-sm font-black text-slate-900">{order.orderNumber}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">তারিখ: {formattedDate}</div>
            </div>
          </div>

          {/* Customer & Merchant Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block">
                গ্রাহকের তথ্য (Customer Details):
              </span>
              <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
              <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{order.customerMobile}</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{order.customerAddress}</span>
              </div>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block">
                সেলার ও পেমেন্ট বিবরণ:
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-orange-600" />
                <span>{order.shopName || 'দারাজ মল ভেরিফাইড মার্চেন্ট'}</span>
              </div>
              <div className="text-slate-600">
                পদ্ধতি: <span className="font-bold text-slate-800">{order.paymentMethod || 'ক্যাশ অন ডেলিভারি (COD)'}</span>
              </div>
              <div className="text-slate-600">
                স্ট্যাটাস:{' '}
                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.paymentStatus === 'Paid' ? 'পরিশোধিত (Paid)' : 'পেন্ডিং (ক্যাশ অন ডেলিভারি)'}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 text-[11px] font-bold">
                  <th className="py-2">বিবরণ</th>
                  <th className="py-2 text-center">পরিমাণ</th>
                  <th className="py-2 text-right">একক মূল্য</th>
                  <th className="py-2 text-right">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-bold text-slate-800">{item.productName}</td>
                    <td className="py-2.5 text-center font-mono font-medium">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.total || item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation */}
          <div className="border-t-2 border-slate-200 pt-3 flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>সাবটোটাল:</span>
                <span className="font-mono font-bold">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-mono font-bold">+{formatCurrency(order.deliveryCharge)}</span>
              </div>
              {order.discount ? (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>মোট ছাড় / ভাউচার:</span>
                  <span className="font-mono">-{formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-black text-slate-900">
                <span>সর্বমোট বিল:</span>
                <span className="font-mono text-base text-orange-600">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Guarantee Seal & QR */}
          <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>১০০% আসল পণ্য • ৭ দিনের সহজ রিটার্ন পলিসি সক্রিয়</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <QrCode className="w-4 h-4 text-slate-400" />
              <span>VERIFIED-DARAZ-MEMO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

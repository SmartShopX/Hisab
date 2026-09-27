import React, { useState } from 'react';
import { Order, Shop } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Printer, FileText, Truck, Tag, Layers } from 'lucide-react';

interface BatchInvoicesPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  shop: Shop;
}

export const BatchInvoicesPrintModal: React.FC<BatchInvoicesPrintModalProps> = ({
  isOpen,
  onClose,
  orders,
  shop,
}) => {
  const [printMode, setPrintMode] = useState<'invoice' | 'challan' | 'label'>('invoice');

  if (!orders || orders.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`নির্বাচিত (${orders.length} টি) চালানের বাল্ক প্রিন্ট`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setPrintMode('invoice')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                printMode === 'invoice'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>বাল্ক ক্যাশ মেমো (A4)</span>
            </button>

            <button
              onClick={() => setPrintMode('challan')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                printMode === 'challan'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>বাল্ক ডেলিভারি চালান (Price-less)</span>
            </button>

            <button
              onClick={() => setPrintMode('label')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                printMode === 'label'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-4 h-4 text-rose-600" />
              <span>কুরিয়ার শিপিং লেবেল (৪x৬)</span>
            </button>
          </div>

          <Button
            onClick={handlePrint}
            variant="primary"
            size="md"
            leftIcon={<Printer className="w-4 h-4" />}
          >
            সবগুলো একসাথে প্রিন্ট করুন
          </Button>
        </div>

        {/* Print Preview Canvas */}
        <div className="bg-slate-100 p-4 rounded-2xl max-h-[580px] overflow-y-auto space-y-6">
          {(orders || []).map((order, orderIdx) => (
            <div
              key={order.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0 print:mb-8 print:break-after-page text-xs"
            >
              {/* Top Banner indicating item */}
              <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-200 text-slate-400 font-mono text-[10px] print:hidden">
                <span>চালান #{orderIdx + 1} / {orders.length}</span>
                <span>অর্ডার আইডি: {order.orderNumber}</span>
              </div>

              {/* PRINT MODE: INVOICE */}
              {printMode === 'invoice' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                    <div>
                      <h3 className="font-black text-lg text-slate-900">{shop.name}</h3>
                      <p className="text-slate-500 text-[11px]">{shop.address} • ফোন: {shop.mobile}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                        ক্যাশ মেমো
                      </span>
                      <div className="font-mono font-bold text-xs mt-1">#{order.orderNumber}</div>
                      <div className="text-slate-500 text-[10px]">{formatDateTime(order.createdAt)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-bold block">ক্রেতা:</span>
                      <span className="font-bold text-slate-900">{order.customerName}</span>
                      <span className="block font-mono text-slate-600">{order.customerMobile || 'মোবাইল নেই'}</span>
                      <span className="text-slate-500">{order.customerAddress || 'কাউন্টার'}</span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div>মাধ্যম: <span className="font-semibold">{order.channel}</span></div>
                      <div>পেমেন্ট: <span className="font-semibold">{order.paymentMethod}</span></div>
                    </div>
                  </div>

                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-800 bg-slate-50 text-slate-700 font-bold">
                        <th className="py-1.5 px-2">বিবরণ</th>
                        <th className="py-1.5 px-2 text-center w-16">পরিমাণ</th>
                        <th className="py-1.5 px-2 text-right w-24">দর</th>
                        <th className="py-1.5 px-2 text-right w-28">মোট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(order.items || []).map((it, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-2 font-medium">{it.productName}</td>
                          <td className="py-1.5 px-2 text-center font-mono">{it.quantity}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">{formatCurrency(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-2 border-t border-slate-200">
                    <div className="w-56 space-y-1 text-right text-[11px]">
                      <div className="flex justify-between">
                        <span>সর্বমোট বিল:</span>
                        <span className="font-mono font-bold">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>পরিশোধ:</span>
                        <span className="font-mono font-bold">{formatCurrency(order.paidAmount)}</span>
                      </div>
                      {order.dueAmount > 0 && (
                        <div className="flex justify-between text-rose-600 font-bold">
                          <span>বকেয়া:</span>
                          <span className="font-mono">{formatCurrency(order.dueAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PRINT MODE: CHALLAN */}
              {printMode === 'challan' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b-2 border-emerald-700 pb-3">
                    <div>
                      <h3 className="font-black text-lg text-slate-900">{shop.name}</h3>
                      <p className="text-slate-500 text-[11px]">{shop.address} • ফোন: {shop.mobile}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-700 text-white px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                        ডেলিভারি চালান
                      </span>
                      <div className="font-mono font-bold text-xs mt-1 text-emerald-800">CHL-{order.orderNumber}</div>
                      <div className="text-slate-500 text-[10px]">{formatDateTime(order.createdAt)}</div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200 text-[11px]">
                    <span className="font-bold text-emerald-900 block">প্রাপক / গন্তব্য ঠিকানা:</span>
                    <span className="font-bold text-slate-900">{order.customerName}</span> ({order.customerMobile})
                    <p className="text-slate-600 mt-0.5">{order.customerAddress || 'কাউন্টার ডেলিভারি'}</p>
                  </div>

                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900 bg-slate-50 text-slate-800 font-bold">
                        <th className="py-1.5 px-2 w-10 text-center">#</th>
                        <th className="py-1.5 px-2">পণ্যের বিবরণ (আইটেম)</th>
                        <th className="py-1.5 px-2 text-center w-24">সংখ্যা / পরিমাণ</th>
                        <th className="py-1.5 px-2 text-center w-32">প্যাকিং স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(order.items || []).map((it, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-2 text-center font-mono">{i + 1}</td>
                          <td className="py-1.5 px-2 font-semibold">{it.productName}</td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-sm">{it.quantity} পিস</td>
                          <td className="py-1.5 px-2 text-center text-emerald-700 font-semibold">অক্ষত সিলড</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[10px]">
                    <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1">প্রস্তুতকারকের স্বাক্ষর</div>
                    <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1">গ্রহণকারীর স্বাক্ষর ও সিল</div>
                  </div>
                </div>
              )}

              {/* PRINT MODE: SHIPPING LABEL (4X6) */}
              {printMode === 'label' && (
                <div className="border-2 border-black p-4 rounded-lg space-y-3 max-w-md mx-auto">
                  <div className="flex justify-between items-center border-b-2 border-black pb-1.5">
                    <div>
                      <h4 className="font-black text-sm uppercase">{shop.name}</h4>
                      <p className="text-[10px] text-slate-600">{shop.mobile}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-black text-white font-mono px-2 py-0.5 rounded text-[10px] font-bold">
                        {order.courierProvider || 'PARCEL'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50/50 border-2 border-black rounded space-y-0.5">
                    <span className="font-bold text-[10px] uppercase block text-slate-600">প্রাপক (To):</span>
                    <p className="font-black text-sm">{order.customerName}</p>
                    <p className="font-black font-mono">{order.customerMobile}</p>
                    <p className="text-slate-800 text-[11px] pt-1 leading-snug">{order.customerAddress || 'কাউন্টার ডেলিভারি'}</p>
                  </div>

                  <div className="p-2 border-2 border-dashed border-red-600 rounded text-center">
                    <span className="text-[10px] font-bold uppercase text-red-600">ক্যাশ অন ডেলিভারি (COD):</span>
                    <p className="text-xl font-black text-red-700 font-mono">
                      {order.dueAmount > 0 ? formatCurrency(order.dueAmount) : '৳০ (PAID)'}
                    </p>
                  </div>

                  <div className="text-center pt-1 font-mono text-[10px] font-bold">
                    *{order.orderNumber}*
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

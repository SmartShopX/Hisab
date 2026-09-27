import React, { useState } from 'react';
import { IncompleteOrder } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import {
  PhoneCall,
  MessageSquare,
  RotateCcw,
  AlertCircle,
  Clock,
  ShoppingBag,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const IncompleteOrdersPage: React.FC = () => {
  const { showToast } = useToast();
  const [incompleteOrders, setIncompleteOrders] = useState<IncompleteOrder[]>(() =>
    DataStore.getIncompleteOrders()
  );

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile}`;
  };

  const handleSendReminder = (item: IncompleteOrder) => {
    const updated = incompleteOrders.map((o) =>
      o.id === item.id ? { ...o, followUpStatus: 'Contacted' as const } : o
    );
    setIncompleteOrders(updated);
    DataStore.setIncompleteOrders(updated);
    showToast(
      `${item.customerName} (${item.customerMobile}) এর কাছে রিমাইন্ডার এসএমএস পাঠানো হয়েছে`,
      'success'
    );
  };

  const handleRecoverOrder = (item: IncompleteOrder) => {
    const updated = incompleteOrders.map((o) =>
      o.id === item.id ? { ...o, followUpStatus: 'Recovered' as const } : o
    );
    setIncompleteOrders(updated);
    DataStore.setIncompleteOrders(updated);
    showToast(`অর্ডারটি সফলভাবে উদ্ধার করা হয়েছে এবং নিয়মিত অর্ডারে স্থানান্তরিত হয়েছে`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          অসম্পূর্ণ অর্ডার (Incomplete / Abandoned Orders)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          অনলাইন স্টোর ও ল্যান্ডিং পেজে চেকআউট শুরু করেও সম্পন্ন না হওয়া গ্রাহকদের তথ্য
        </p>
      </div>

      {/* Backend Tracking Disclaimer Banner (per prompt guidelines) */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">সতর্কবার্তা ও সিস্টেম নোটিশ:</span> ফ্রন্টএন্ড নিজে থেকে সব
          অসম্পূর্ণ অর্ডার যাচাই করতে পারে না। এই তথ্যটি ব্যাকএন্ড ইউজার ট্র্যাকিং ও টেলিমেট্রি
          সার্ভিসের মাধ্যমে নিয়মিত আপডেট হবে।
        </div>
      </div>

      {/* Incomplete Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">গ্রাহকের নাম ও মোবাইল</th>
                <th className="py-3 px-4">কার্ট বা অসম্পূর্ণ পণ্য</th>
                <th className="py-3 px-4">সম্ভাব্য মূল্য</th>
                <th className="py-3 px-4">সময়</th>
                <th className="py-3 px-4">ফলো-আপ অবস্থা</th>
                <th className="py-3 px-4 text-center">অ্যাকশন (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incompleteOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{order.customerName}</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {order.customerMobile}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 max-w-xs">
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} className="text-slate-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="truncate">{it.productName}</span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            ({it.quantity} টি)
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatCurrency(order.estimatedTotal)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTime(order.createdAt)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.followUpStatus === 'Recovered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.followUpStatus === 'Contacted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.followUpStatus === 'Recovered'
                        ? 'অর্ডার উদ্ধার হয়েছে'
                        : order.followUpStatus === 'Contacted'
                        ? 'যোগাযোগ করা হয়েছে'
                        : 'পেন্ডিং ফলো-আপ'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        onClick={() => handleCall(order.customerMobile)}
                        variant="outline"
                        size="sm"
                        leftIcon={<PhoneCall className="w-3.5 h-3.5 text-emerald-600" />}
                        title="কল করুন"
                      >
                        কল
                      </Button>

                      <Button
                        onClick={() => handleSendReminder(order)}
                        variant="outline"
                        size="sm"
                        leftIcon={<MessageSquare className="w-3.5 h-3.5 text-blue-600" />}
                        title="এসএমএস রিমাইন্ডার"
                      >
                        রিমাইন্ডার
                      </Button>

                      {order.followUpStatus !== 'Recovered' && (
                        <Button
                          onClick={() => handleRecoverOrder(order)}
                          variant="success"
                          size="sm"
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                          title="অর্ডারটি কনফার্ম করুন"
                        >
                          অর্ডার উদ্ধার
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
    </div>
  );
};

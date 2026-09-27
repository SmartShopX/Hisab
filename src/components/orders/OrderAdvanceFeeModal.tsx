import React, { useState } from 'react';
import { Order, PaymentMethod } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { orderService } from '../../services/orderService';
import { CreditCard, CheckCircle2, ShieldAlert } from 'lucide-react';

interface OrderAdvanceFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: (updatedOrder: Order) => void;
}

export const OrderAdvanceFeeModal: React.FC<OrderAdvanceFeeModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [amount, setAmount] = useState<number>(order?.deliveryCharge || 120);
  const [method, setMethod] = useState<PaymentMethod>('bKash');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('চার্জের পরিমাণ অবশ্যই শূন্যের বেশি হতে হবে', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await orderService.recordAdvanceDeliveryCharge(
        order.id,
        amount,
        method,
        trxId.trim()
      );
      showToast(
        `অর্ডার #${order.orderNumber} এর অগ্রিম ৳${amount} ডেলিভারি চার্জ সফলভাবে যোগ হয়েছে`,
        'success'
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'অগ্রিম চার্জ যোগ করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="অগ্রিম ডেলিভারি চার্জ আদায় (Advance COD Collection)"
      subtitle={`অর্ডার: #${order.orderNumber} • ${order.customerName}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-center">
          <div>
            <span className="text-slate-500 block text-[11px]">মোট বিল</span>
            <span className="font-mono font-bold text-slate-800">{formatCurrency(order.totalAmount)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">বর্তমান বকেয়া (COD)</span>
            <span className="font-mono font-bold text-rose-600">{formatCurrency(order.dueAmount)}</span>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            অগ্রিম আদায়ের পরিমাণ (টাকা) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
            <input
              type="number"
              min={1}
              max={order.dueAmount || order.totalAmount}
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2 mt-2">
            {[60, 100, 120, 150].map((quickVal) => (
              <button
                key={quickVal}
                type="button"
                onClick={() => setAmount(quickVal)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                  amount === quickVal
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                ৳{quickVal}
              </button>
            ))}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            পেমেন্ট মেথড
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="bKash">বিকাশ (bKash)</option>
            <option value="Nagad">নগদ (Nagad)</option>
            <option value="Rocket">রকেট (Rocket)</option>
            <option value="Bank">ব্যাংক ট্রান্সফার (Bank)</option>
            <option value="Cash">ক্যাশ (নগদ)</option>
          </select>
        </div>

        {/* Trx ID */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            ট্রানজেকশন আইডি (Trx ID)
          </label>
          <input
            type="text"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            placeholder="উদা: 9M48X7P2"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
          />
        </div>

        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
          💡 অগ্রিম ৳{amount || 0} টাকা যোগ হলে কুরিয়ারে ক্যাশ অন ডেলিভারি (COD) অ্যামাউন্ট হবে <strong>{formatCurrency(Math.max(0, order.dueAmount - (amount || 0)))}</strong>।
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            বাতিল
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
          >
            {isSubmitting ? 'যোগ হচ্ছে...' : 'অগ্রিম জমা নিশ্চিত করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

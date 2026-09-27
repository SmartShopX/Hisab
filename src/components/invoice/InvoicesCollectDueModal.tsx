import React, { useState, useEffect } from 'react';
import { Order, PaymentMethod } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { DataStore } from '../../services/dataStorage';
import { customerService } from '../../services/customerService';
import { CreditCard, CheckCircle2 } from 'lucide-react';

interface InvoicesCollectDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: () => void;
}

export const InvoicesCollectDueModal: React.FC<InvoicesCollectDueModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [trxId, setTrxId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setAmount(order.dueAmount || 0);
      setMethod('Cash');
      setTrxId('');
      setNotes(`ইনভয়েস #${order.orderNumber} এর বকেয়া আদায়`);
    }
  }, [order]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('আদায়ের পরিমাণ অবশ্যই শূন্যের চেয়ে বেশি হতে হবে', 'warning');
      return;
    }
    if (amount > order.dueAmount) {
      showToast(`আদায়ের পরিমাণ বর্তমান বকেয়া (৳${order.dueAmount}) এর চেয়ে বেশি হতে পারে না`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update Order in DataStore
      const orders = DataStore.getOrders();
      const orderIdx = orders.findIndex((o) => o.id === order.id);
      if (orderIdx !== -1) {
        const targetOrder = orders[orderIdx];
        const newPaid = targetOrder.paidAmount + amount;
        const newDue = Math.max(0, targetOrder.dueAmount - amount);
        const newStatus = newDue === 0 ? 'Paid' : 'Partial';

        orders[orderIdx] = {
          ...targetOrder,
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus: newStatus as any,
          paymentMethod: method,
        };
        DataStore.setOrders(orders);
      }

      // 2. Synchronize with Customer Ledger if customer exists
      if (order.customerId) {
        try {
          await customerService.collectDue({
            customerId: order.customerId,
            amount: amount,
            method: method,
            notes: `${notes || 'ইনভয়েস বকেয়া আদায়'} (অর্ডার #${order.orderNumber})`,
            receiptNumber: trxId || `MR-${Date.now().toString().slice(-6)}`,
          });
        } catch (e) {
          console.warn('Customer ledger update note:', e);
        }
      }

      // 3. Record Payment transaction
      const payments = DataStore.getPayments();
      payments.unshift({
        id: `pay_${Date.now()}`,
        transactionId: trxId || `TXN-${Date.now()}`,
        orderId: order.id,
        customerOrSupplierName: order.customerName,
        type: 'Due Collection',
        amount: amount,
        method: method,
        status: 'Paid',
        date: new Date().toISOString(),
        notes: notes || `ইনভয়েস #${order.orderNumber} এর আদায়`,
      });
      DataStore.setPayments(payments);

      showToast(`ইনভয়েস #${order.orderNumber} এর ৳${amount.toLocaleString('bn-BD')} সফলভাবে আদায় হয়েছে`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'বকেয়া আদায় প্রক্রিয়াকরণে ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ইনভয়েস বকেয়া আদায় (Collect Invoice Due)"
      subtitle={`মেমো নং: ${order.orderNumber} • গ্রাহক: ${order.customerName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Summary Card */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">মোট বিল</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">পরিশোধিত</span>
            <span className="font-mono font-bold text-emerald-600">{formatCurrency(order.paidAmount)}</span>
          </div>
          <div className="bg-rose-50/70 p-1 rounded-lg border border-rose-200">
            <span className="text-rose-600 block text-[11px] font-bold">বর্তমান বকেয়া</span>
            <span className="font-mono font-black text-rose-700">{formatCurrency(order.dueAmount)}</span>
          </div>
        </div>

        {/* Collection Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            আদায়ের পরিমাণ (টাকা) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
            <input
              type="number"
              min={1}
              max={order.dueAmount}
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => setAmount(order.dueAmount)}
              className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 hover:bg-emerald-100 cursor-pointer font-semibold"
            >
              পুরো বকেয়া (৳{order.dueAmount.toLocaleString('bn-BD')})
            </button>
            {order.dueAmount > 500 && (
              <button
                type="button"
                onClick={() => setAmount(Math.round(order.dueAmount / 2))}
                className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md hover:bg-slate-200 cursor-pointer"
              >
                ৫০% (৳{Math.round(order.dueAmount / 2).toLocaleString('bn-BD')})
              </button>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            পেমেন্ট মেথড
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Cash">ক্যাশ (নগদ)</option>
            <option value="bKash">বিকাশ (bKash)</option>
            <option value="Nagad">নগদ (Nagad)</option>
            <option value="Bank">ব্যাংক ট্রান্সফার (Bank)</option>
            <option value="Card">কার্ড (POS / Card)</option>
          </select>
        </div>

        {/* Trx ID / Receipt No */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ট্রানজেকশন আইডি / মানি রিসিট নং (ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            placeholder="উদা: TRX-987452 বা MR-01"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            মন্তব্য / রিমার্কস
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="আদায় সংক্রান্ত বিশেষ মন্তব্য..."
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
            {isSubmitting ? 'আদায় হচ্ছে...' : 'টাকা আদায় নিশ্চিত করুন'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

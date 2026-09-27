import React, { useState, useMemo, useRef } from 'react';
import { Supplier, Purchase } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { DataStore } from '../../services/dataStorage';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  CreditCard,
  Building2,
  Phone,
  Search,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Layers,
  MapPin,
  Clock,
} from 'lucide-react';

interface SupplierLedgerEntry {
  id: string;
  date: string;
  type: 'Purchase' | 'Payment' | 'Return';
  referenceId: string;
  debit: number; // Purchase added to payable
  credit: number; // Payment made, reducing payable
  balance: number; // Running payable balance
  method?: string;
  notes?: string;
}

interface SupplierLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onMakePaymentClick?: (supplier: Supplier) => void;
}

export const SupplierLedgerModal: React.FC<SupplierLedgerModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onMakePaymentClick,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'Purchase' | 'Payment'>('all');
  const [search, setSearch] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);
  const shop = useMemo(() => DataStore.getShop(), []);

  if (!supplier) return null;

  // Derive unified chronological ledger entries from purchases and expense/payment records
  const entries: SupplierLedgerEntry[] = useMemo(() => {
    const purchases = DataStore.getPurchases().filter(
      (p) => p.supplierId === supplier.id || p.supplierName?.toLowerCase() === supplier.company?.toLowerCase()
    );

    // Payments recorded for this supplier
    const allExpenses = DataStore.getExpenses();
    const supPayments = allExpenses.filter((e) =>
      e.category === 'Supplier Payment' &&
      (e.title?.toLowerCase().includes(supplier.company?.toLowerCase()) ||
        e.title?.toLowerCase().includes(supplier.name?.toLowerCase()))
    );

    const unified: SupplierLedgerEntry[] = [];
    let runningPayable = 0;

    // Sort by date ascending to compute running payable correctly
    const combinedEvents = [
      ...purchases.map((p) => ({
        type: 'Purchase' as const,
        date: p.purchaseDate || new Date().toISOString(),
        id: p.id,
        ref: p.invoiceNumber,
        total: p.totalAmount,
        paid: p.paidAmount,
        due: p.dueAmount,
        notes: p.notes || `ক্রয় চালান #${p.invoiceNumber}`,
      })),
      ...supPayments.map((e) => ({
        type: 'Payment' as const,
        date: e.date || e.createdAt,
        id: e.id,
        ref: e.id.slice(-6).toUpperCase(),
        total: 0,
        paid: e.amount,
        due: 0,
        method: e.paymentMethod,
        notes: e.note || e.title,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    combinedEvents.forEach((ev) => {
      if (ev.type === 'Purchase') {
        // Debit: purchased amount adds to liability, immediate cash payment reduces it
        runningPayable += ev.due;
        unified.push({
          id: `entry_pur_${ev.id}`,
          date: ev.date.split('T')[0],
          type: 'Purchase',
          referenceId: ev.ref,
          debit: ev.total,
          credit: ev.paid,
          balance: runningPayable,
          notes: ev.notes,
        });
      } else {
        // Payment reducing existing payable
        runningPayable = Math.max(0, runningPayable - ev.paid);
        unified.push({
          id: `entry_pay_${ev.id}`,
          date: ev.date.split('T')[0],
          type: 'Payment',
          referenceId: `PAY-${ev.ref}`,
          debit: 0,
          credit: ev.paid,
          balance: runningPayable,
          method: ev.method,
          notes: ev.notes,
        });
      }
    });

    // Return descending for UI presentation (latest first)
    return unified.reverse();
  }, [supplier]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.referenceId.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.date.includes(q)
        );
      }
      return true;
    });
  }, [entries, filterType, search]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="সরবরাহকারী খতিয়ান ও দেনা হিসাব (Supplier Ledger Statement)"
      subtitle={`${supplier.company} (${supplier.name}) • মোবাইল: ${supplier.mobile}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Printable Statement Sheet Container */}
        <div ref={printRef} className="space-y-4 print:p-6 print:text-black">
          {/* Shop and Supplier Header (Visible for Print & UI) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 print:border-none print:p-0 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {shop.name || 'SmartShopX Store'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {shop.address || 'দোকান ঠিকানা'} | মোবাইল: {shop.mobile || '—'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[11px] font-bold rounded-lg print:border">
                  সরবরাহকারী খতিয়ান (Supplier Ledger)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  তারিখ: {new Date().toLocaleDateString('bn-BD')}
                </p>
              </div>
            </div>

            {/* Supplier Profile Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">প্রতিষ্ঠান / সাপ্লায়ার:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{supplier.company}</span>
                <span className="text-slate-500 block text-[11px]">{supplier.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">যোগাযোগ ও মোবাইল:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {supplier.mobile}
                </span>
                <span className="text-slate-500 block text-[11px] truncate">{supplier.address || '—'}</span>
              </div>
              <div className="sm:text-right">
                <span className="text-slate-400 block text-[11px]">হিসাবের ধরন:</span>
                <span className="font-semibold text-rose-700 dark:text-rose-400">
                  দোকানদারের প্রদেয় দেনা (Supplier Payable)
                </span>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                মোট ক্রয় (Total Purchases)
              </span>
              <p className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCurrency(supplier.totalPurchased || 0)}
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block">
                মোট পরিশোধ (Total Paid)
              </span>
              <p className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                {formatCurrency(supplier.totalPaid || 0)}
              </p>
            </div>

            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800/60">
              <span className="text-[11px] font-medium text-rose-800 dark:text-rose-300 block">
                বর্তমান দেনা (Net Payable)
              </span>
              <p className="text-lg font-black font-mono text-rose-700 dark:text-rose-400 mt-0.5">
                {formatCurrency(supplier.totalPayable || 0)}
              </p>
            </div>
          </div>

          {/* Filter Bar (Hidden when printing) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 print:hidden">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                সব লেনদেন ({entries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('Purchase')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'Purchase'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                ক্রয় চালান
              </button>
              <button
                type="button"
                onClick={() => setFilterType('Payment')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'Payment'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                পরিশোধ খাতা
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="চালান নম্বর বা বিবরণ খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">ধরন ও রেফারেন্স</th>
                  <th className="py-2.5 px-3 text-right">চালান মূল্য (৳)</th>
                  <th className="py-2.5 px-3 text-right">পরিশোধ (৳)</th>
                  <th className="py-2.5 px-3 text-right">চলমান দেনা (৳)</th>
                  <th className="py-2.5 px-3">বিবরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      কোনো খতিয়ান রেকর্ড পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-sans">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            row.type === 'Purchase'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {row.type === 'Purchase' ? (
                            <ArrowDownLeft className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          )}
                          {row.type === 'Purchase' ? 'ক্রয় চালান' : 'পরিশোধ'}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                          #{row.referenceId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900 dark:text-slate-100 font-bold">
                        {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-black">
                        {formatCurrency(row.balance)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans text-[11px] max-w-[200px] truncate">
                        {row.notes}
                        {row.method && ` • [${row.method}]`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            স্টেটমেন্ট প্রিন্ট করুন
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              বন্ধ করুন
            </Button>
            {supplier.totalPayable > 0 && onMakePaymentClick && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  onMakePaymentClick(supplier);
                }}
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                দেনা পরিশোধ করুন
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

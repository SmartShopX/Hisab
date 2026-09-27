import React, { useState, useMemo, useRef } from 'react';
import { Customer, CustomerLedgerEntry } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { DataStore } from '../../services/dataStorage';
import {
  FileText,
  Printer,
  Calendar,
  CreditCard,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Tag,
  ShieldCheck,
  Layers,
  UserPlus,
  PenTool,
} from 'lucide-react';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCollectDueClick?: (customer: Customer) => void;
  onSendReminderClick?: (customer: Customer) => void;
  onManageInstallmentsClick?: (customer: Customer) => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onCollectDueClick,
  onSendReminderClick,
  onManageInstallmentsClick,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);
  const shop = useMemo(() => DataStore.getShop(), []);

  if (!customer) return null;

  // Build full ledger entries (fallback from orders if customer.ledger is empty)
  const entries: CustomerLedgerEntry[] = useMemo(() => {
    if (customer.ledger && customer.ledger.length > 0) {
      return customer.ledger;
    }

    // Fallback: derive entries from Orders & Payments in DataStore
    const orders = DataStore.getOrders().filter((o) => o.customerId === customer.id);
    const payments = DataStore.getPayments().filter(
      (p) => p.customerOrSupplierName.toLowerCase() === customer.name.toLowerCase()
    );

    const synthetic: CustomerLedgerEntry[] = [];
    let currentBalance = 0;

    orders.forEach((o) => {
      currentBalance += o.dueAmount;
      synthetic.push({
        id: `synth_ord_${o.id}`,
        date: o.createdAt.split('T')[0],
        type: 'Sale',
        referenceId: o.orderNumber,
        debit: o.totalAmount,
        credit: o.paidAmount,
        discount: o.discount > 0 ? o.discount : undefined,
        balance: currentBalance,
        method: o.paymentMethod,
        notes: `বিক্রয় চালান #${o.orderNumber}`,
      });
    });

    return synthetic.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customer]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (e.referenceId && e.referenceId.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.date.includes(q)
        );
      }
      return true;
    });
  }, [entries, filterType, search]);

  const creditLimit = customer.creditLimit || 0;
  const creditLimitUsage =
    creditLimit > 0 ? Math.min(100, Math.round((customer.totalDue / creditLimit) * 100)) : 0;
  const isOverLimit = creditLimit > 0 && customer.totalDue > creditLimit;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="গ্রাহকের ডিজিটাল খতিয়ান ও বাকি খাতা (Ledger Statement)"
      subtitle={`${customer.name} | মোবাইল: ${customer.mobile} ${
        customer.customerType ? `• ধরন: ${customer.customerType}` : ''
      }`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Printable Statement Sheet Container */}
        <div ref={printRef} className="space-y-4 print:p-6 print:text-black">
          {/* Shop and Customer Header (Visible for Print & UI) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 print:border-none print:p-0 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{shop.name || 'SmartShopX Store'}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {shop.address || 'দোকান ঠিকানা'} | মোবাইল: {shop.mobile || '—'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-lg print:border">
                  গ্রাহক খতিয়ান স্টেটমেন্ট
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  তারিখ: {new Date().toLocaleDateString('bn-BD')}
                </p>
              </div>
            </div>

            {/* Customer Details Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">গ্রাহকের নাম</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{customer.name}</span>
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {customer.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[9px] font-bold rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">মোবাইল নম্বর</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{customer.mobile}</span>
                {customer.alternateMobile && (
                  <span className="font-mono text-[10px] text-slate-500 block">বিকল্প: {customer.alternateMobile}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ঠিকানা ও এনআইডি</span>
                <span className="text-slate-700 dark:text-slate-300 truncate block">{customer.address || '—'}</span>
                {customer.nidOrTradeLicense && (
                  <span className="font-mono text-[10px] text-slate-500 block">NID: {customer.nidOrTradeLicense}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">গ্রাহক স্তর ও ধরন</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {customer.customerType || 'খুচরা'} ({customer.tier || 'General'})
                </span>
              </div>
            </div>

            {/* Guarantor / Reference info if exists */}
            {(customer.guarantorName || customer.guarantorMobile) && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs flex items-center gap-4 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5 text-blue-500" />
                  <span>জামিনদার / রেফারেন্স:</span>
                </span>
                <span>{customer.guarantorName}</span>
                {customer.guarantorMobile && <span className="font-mono">({customer.guarantorMobile})</span>}
                {customer.guarantorRelation && <span>• সম্পর্ক: {customer.guarantorRelation}</span>}
              </div>
            )}
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">মোট ক্রয় (Total)</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
                {formatCurrency(customer.totalPurchase)}
              </span>
              <span className="text-[10px] text-slate-400">{customer.ordersCount} টি চালান</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">মোট জমা (Paid)</span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">
                {formatCurrency(customer.totalPaid)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">পরিশোধিত</span>
            </div>

            <div
              className={`p-3 rounded-xl border shadow-2xs ${
                customer.totalDue > 0
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold block">বর্তমান বাকি (Current Due)</span>
                {customer.totalDue > 0 && customer.oldestDueDays ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded font-medium">
                    {customer.oldestDueDays} দিন পুরনো
                  </span>
                ) : null}
              </div>
              <span className="text-base font-bold font-mono mt-0.5 block text-rose-700 dark:text-rose-400">
                {formatCurrency(customer.totalDue)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {customer.promiseDate ? `প্রতিশ্রুতি: ${customer.promiseDate}` : 'জের বাকি'}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">বাকি সীমা (Limit)</span>
                {isOverLimit && (
                  <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                    <ShieldAlert className="w-3 h-3" /> সীমা অতিক্রম!
                  </span>
                )}
              </div>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">
                {creditLimit > 0 ? formatCurrency(creditLimit) : 'সীমাহীন'}
              </span>
              {creditLimit > 0 && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full ${
                      isOverLimit ? 'bg-rose-600' : creditLimitUsage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${creditLimitUsage}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Filtering and Search Bar (Hidden during Print) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 print:hidden">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
              {['all', 'Sale', 'Due Collection', 'Discount Adjustment'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterType === type
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {type === 'all'
                    ? 'সকল রেকর্ড'
                    : type === 'Sale'
                    ? 'বিক্রয় চালান'
                    : type === 'Due Collection'
                    ? 'টাকা জমা'
                    : 'ছাড় / সমন্বয়'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="চালান নং বা বিবরণ খুঁজুন..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট স্টেটমেন্ট</span>
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                    <th className="py-2.5 px-3">তারিখ</th>
                    <th className="py-2.5 px-3">রেফারেন্স / রসিদ</th>
                    <th className="py-2.5 px-3">বিবরণ (Transaction)</th>
                    <th className="py-2.5 px-3 text-right">ডেবিট (বাকি)</th>
                    <th className="py-2.5 px-3 text-right">ক্রেডিট (জমা)</th>
                    <th className="py-2.5 px-3 text-right">ছাড়</th>
                    <th className="py-2.5 px-3 text-right">অবশিষ্ট জের</th>
                    <th className="py-2.5 px-3 text-center">মেথড / স্বাক্ষর</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                          {item.date}
                        </td>

                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {item.referenceId || '—'}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {item.type === 'Sale' ? (
                              <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            ) : item.type === 'Due Collection' || item.type === 'Installment Payment' ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <ArrowDownLeft className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <FileText className="w-3 h-3" />
                              </span>
                            )}
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                {item.type === 'Sale'
                                  ? 'পণ্য বিক্রয় চালান'
                                  : item.type === 'Due Collection'
                                  ? 'বকেয়া টাকা জমা'
                                  : item.type === 'Installment Payment'
                                  ? 'কিস্তি পরিশোধ'
                                  : item.type === 'Discount Adjustment'
                                  ? 'বিশেষ ছাড়'
                                  : 'ওপেনিং হিসাব'}
                              </span>
                              {item.notes && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[200px]">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {item.debit > 0 ? formatCurrency(item.debit) : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.credit > 0 ? formatCurrency(item.credit) : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                          {item.discount && item.discount > 0 ? formatCurrency(item.discount) : '—'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20">
                          {formatCurrency(item.balance)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-medium">
                              {item.method || 'Cash'}
                            </span>
                            {item.signatureImage && (
                              <span title="ডিজিটাল স্বাক্ষরিত" className="text-emerald-600">
                                <PenTool className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Footer Note for Customer */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>* এটি একটি কম্পিউটার জেনারেটেড ডিজিটাল খতিয়ান স্টেটমেন্ট।</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              সর্বমোট বকেয়া জের: {formatCurrency(customer.totalDue)}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 print:hidden">
          {customer.totalDue > 0 && onManageInstallmentsClick && (
            <Button
              onClick={() => onManageInstallmentsClick(customer)}
              variant="outline"
              size="sm"
              leftIcon={<Layers className="w-3.5 h-3.5 text-indigo-600" />}
            >
              কিস্তি ও EMI শিডিউল
            </Button>
          )}

          {customer.totalDue > 0 && onSendReminderClick && (
            <Button
              onClick={() => onSendReminderClick(customer)}
              variant="outline"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5 text-blue-600" />}
            >
              তাগাদা বার্তা পাঠান
            </Button>
          )}

          {customer.totalDue > 0 && onCollectDueClick && (
            <Button
              onClick={() => onCollectDueClick(customer)}
              variant="primary"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
            >
              বকেয়া আদায় করুন
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onClose}>
            বন্ধ করুন
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerLedgerModal;

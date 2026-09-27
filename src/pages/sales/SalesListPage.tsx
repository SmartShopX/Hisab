import React, { useState, useMemo } from 'react';
import { DataStore } from '../../services/dataStorage';
import { Order, Shop } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';
import { useAuth } from '../../context/AuthContext';
import { Search, Printer, Eye, Download, Receipt } from 'lucide-react';

export const SalesListPage: React.FC = () => {
  const { shop } = useAuth();
  const [orders] = useState<Order[]>(() => DataStore.getOrders());
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const filteredSales = useMemo(() => {
    return orders.filter((o) => {
      if (filterChannel !== 'all' && o.channel !== filterChannel) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerMobile.includes(q)
        );
      }
      return true;
    });
  }, [orders, search, filterChannel]);

  const totalSalesRevenue = useMemo(() => {
    return filteredSales.reduce((acc, o) => acc + o.totalAmount, 0);
  }, [filteredSales]);

  const openInvoice = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">বিক্রয় হিস্ট্রি ও মেমো তালিকা</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            সকল কাউন্টার (POS) ও অনলাইন বিক্রয়ের বিস্তারিত রেকর্ড
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
          <span className="text-xs text-emerald-700 block">নির্বাচিত মোট বিক্রয়:</span>
          <span className="text-base font-black font-mono text-emerald-800">
            {formatCurrency(totalSalesRevenue)}
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="মেমো নং, কাস্টমারের নাম বা মোবাইল দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="all">সব বিক্রয় চ্যানেল</option>
          <option value="POS">কাউন্টার সেল (POS)</option>
          <option value="Online Store">অনলাইন স্টোর</option>
          <option value="Landing Page">ল্যান্ডিং পেজ</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">ইনভয়েস নং</th>
                <th className="py-3 px-4">তারিখ ও সময়</th>
                <th className="py-3 px-4">ক্রেতার তথ্য</th>
                <th className="py-3 px-4">চ্যানেল</th>
                <th className="py-3 px-4">মোট বিল</th>
                <th className="py-3 px-4">পরিশোধ / বাকি</th>
                <th className="py-3 px-4">পেমেন্ট মেথড</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {sale.orderNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {formatDateTime(sale.createdAt)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">{sale.customerName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{sale.customerMobile}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                        sale.channel === 'POS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {sale.channel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-emerald-700 font-semibold block">
                      পেইড: {formatCurrency(sale.paidAmount)}
                    </span>
                    {sale.dueAmount > 0 && (
                      <span className="font-mono text-rose-600 font-bold block text-[11px]">
                        বাকি: {formatCurrency(sale.dueAmount)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {sale.paymentMethod}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Button
                      onClick={() => openInvoice(sale)}
                      variant="outline"
                      size="sm"
                      leftIcon={<Printer className="w-3.5 h-3.5" />}
                    >
                      মেমো
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={selectedOrder}
        shop={shop}
      />
    </div>
  );
};

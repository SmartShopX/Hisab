import React, { useState, useEffect, useMemo } from 'react';
import { orderApi, purchaseApi } from '../../services/apiServices';
import { Order, Purchase } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { InvoiceModal, ReceiptFormat } from '../../components/invoice/InvoiceModal';
import { InvoicesCollectDueModal } from '../../components/invoice/InvoicesCollectDueModal';
import { BatchInvoicesPrintModal } from '../../components/invoice/BatchInvoicesPrintModal';
import {
  FileText,
  Search,
  Printer,
  Eye,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  User,
  Truck,
  MessageSquare,
  CreditCard,
  Download,
  CheckSquare,
  Square,
  Tag,
  Receipt,
  Layers,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { shop } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'sales' | 'online' | 'purchases'>('sales');
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'DUE' | 'PARTIAL'>('ALL');

  // Selected Order for Single Invoice Modal
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [invoiceInitialFormat, setInvoiceInitialFormat] = useState<ReceiptFormat>('standard');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Selected Order for Collect Due Modal
  const [selectedOrderForDue, setSelectedOrderForDue] = useState<Order | null>(null);
  const [isCollectDueOpen, setIsCollectDueOpen] = useState(false);

  // Selected Purchase for Purchase View Modal
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Bulk Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderList, purchaseList] = await Promise.all([
        orderApi.getAll(),
        purchaseApi.getAll(),
      ]);
      setOrders(orderList);
      setPurchases(purchaseList);
    } catch {
      showToast('চালান ও ইনভয়েস ডেটা লোড করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Split Orders into Sales (POS/Manual) and Online (Store/Landing)
  const salesOrders = useMemo(
    () => orders.filter((o) => o.channel === 'POS' || o.channel === 'Manual'),
    [orders]
  );
  const onlineOrders = useMemo(
    () => orders.filter((o) => o.channel === 'Online Store' || o.channel === 'Landing Page'),
    [orders]
  );

  // Filtered List
  const filteredOrders = useMemo(() => {
    const list = activeTab === 'sales' ? salesOrders : onlineOrders;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return list.filter((ord) => {
      // 1. Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchNumber = ord.orderNumber.toLowerCase().includes(q);
        const matchCustomer = ord.customerName.toLowerCase().includes(q);
        const matchMobile = ord.customerMobile?.includes(q) || false;
        const matchProduct = ord.items.some((it) => it.productName.toLowerCase().includes(q));
        if (!matchNumber && !matchCustomer && !matchMobile && !matchProduct) {
          return false;
        }
      }

      // 2. Date filter
      if (dateFilter === 'TODAY') {
        if (!ord.createdAt.startsWith(todayStr)) return false;
      } else if (dateFilter === 'WEEK') {
        const orderDate = new Date(ord.createdAt);
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (dateFilter === 'MONTH') {
        const orderDate = new Date(ord.createdAt);
        if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      // 3. Payment filter
      if (paymentFilter === 'PAID') {
        if (ord.dueAmount > 0) return false;
      } else if (paymentFilter === 'DUE') {
        if (ord.dueAmount <= 0) return false;
      } else if (paymentFilter === 'PARTIAL') {
        if (ord.paidAmount <= 0 || ord.dueAmount <= 0) return false;
      }

      return true;
    });
  }, [activeTab, salesOrders, onlineOrders, searchTerm, dateFilter, paymentFilter]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (p.purchaseNumber && p.purchaseNumber.toLowerCase().includes(q)) ||
        p.supplierName.toLowerCase().includes(q)
      );
    });
  }, [purchases, searchTerm]);

  // Overall Financial Statistics for current view
  const currentOrdersForStats = activeTab === 'sales' ? salesOrders : onlineOrders;
  const stats = useMemo(() => {
    const totalCount = currentOrdersForStats.length;
    const totalBilled = currentOrdersForStats.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalCollected = currentOrdersForStats.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const totalDue = currentOrdersForStats.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
    return { totalCount, totalBilled, totalCollected, totalDue };
  }, [currentOrdersForStats]);

  // Bulk selection handling
  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedOrdersList = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  // Quick Open Modal
  const openInvoice = (order: Order, format: ReceiptFormat = 'standard') => {
    setSelectedOrderForInvoice(order);
    setInvoiceInitialFormat(format);
    setIsInvoiceModalOpen(true);
  };

  // WhatsApp 1-Click Send
  const handleWhatsAppSend = (order: Order) => {
    const rawMobile = order.customerMobile ? order.customerMobile.replace(/[^0-9]/g, '') : '';
    let targetPhone = '';
    if (rawMobile.startsWith('880')) {
      targetPhone = rawMobile;
    } else if (rawMobile.startsWith('01')) {
      targetPhone = `880${rawMobile.substring(1)}`;
    }

    const safeItems = Array.isArray(order?.items) ? order.items : [];
    const itemsSummary = safeItems.map((i) => `• ${i.productName} (${i.quantity}টি)`).join('\n');
    const text =
      `*${shop.name} - ক্যাশ মেমো*\n` +
      `মেমো নং: #${order.orderNumber}\n` +
      `তারিখ: ${formatDate(order.createdAt)}\n` +
      `গ্রাহক: ${order.customerName}\n` +
      `পণ্যসমূহ:\n${itemsSummary}\n` +
      `মোট বিল: ৳${order.totalAmount.toLocaleString('bn-BD')}\n` +
      `পরিশোধ: ৳${order.paidAmount.toLocaleString('bn-BD')}\n` +
      (order.dueAmount > 0 ? `বকেয়া: ৳${order.dueAmount.toLocaleString('bn-BD')}\n` : `পরিশোধিত (PAID)\n`) +
      `ধন্যবাদ! হেল্পলাইন: ${shop.mobile}`;

    const url = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      showToast('এক্সপোর্ট করার মতো কোনো ইনভয়েস নেই', 'warning');
      return;
    }

    const headers = [
      'ইনভয়েস নং',
      'তারিখ ও সময়',
      'গ্রাহকের নাম',
      'মোবাইল',
      'ঠিকানা',
      'চ্যানেল',
      'পেমেন্ট মেথড',
      'মোট বিল (৳)',
      'ডিসকাউন্ট (৳)',
      'পরিশোধ (৳)',
      'বকেয়া (৳)',
      'স্ট্যাটাস',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${formatDateTime(o.createdAt)}"`,
      `"${o.customerName}"`,
      `"${o.customerMobile || ''}"`,
      `"${(o.customerAddress || '').replace(/"/g, '""')}"`,
      `"${o.channel}"`,
      `"${o.paymentMethod}"`,
      o.totalAmount,
      o.discount,
      o.paidAmount,
      o.dueAmount,
      `"${o.orderStatus}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SmartShopX_Invoices_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ইনভয়েস তালিকা CSV ফাইলে ডাউনলোড হয়েছে', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            চালান ও ইনভয়েস রিপোজিটরি (Invoices Center)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            সকল ক্যাশ মেমো, প্রাইসলেস ডেলিভারি চালান ও কুরিয়ার লেবেল তৈরি, প্রিন্ট ও হোয়াটসঅ্যাপ শেয়ারিং
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCsv}
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4 text-slate-600" />}
          >
            CSV এক্সপোর্ট
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
          >
            পৃষ্ঠা প্রিন্ট
          </Button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মোট বিক্রয় চালান</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono">
            {stats.totalCount} <span className="text-xs font-normal text-slate-500">টি মেমো</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">সর্বমোট বিক্রয় বিল</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-700 font-mono">
            {formatCurrency(stats.totalBilled)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">নগদ আদায় (Cash In)</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-purple-700 font-mono">
            {formatCurrency(stats.totalCollected)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">মোট বকেয়া পাওনা</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-rose-600 font-mono">
            {formatCurrency(stats.totalDue)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveTab('sales');
            setSelectedOrderIds([]);
          }}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sales'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          কাউন্টার ও পিওএস বিক্রয় চালান ({salesOrders.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('online');
            setSelectedOrderIds([]);
          }}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'online'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          অনলাইন ডেলিভারি ও কুরিয়ার চালান ({onlineOrders.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('purchases');
            setSelectedOrderIds([]);
          }}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'purchases'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          সাপ্লায়ার ক্রয় ইনভয়েস ({purchases.length})
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-b-2xl border-x border-b border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filters & Bulk Action Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          {/* Left: Search & Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ইনভয়েস নং, গ্রাহক, ফোন বা পণ্য..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            {activeTab !== 'purchases' && (
              <>
                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">সকল সময়</option>
                  <option value="TODAY">আজকের চালান</option>
                  <option value="WEEK">গত ৭ দিন</option>
                  <option value="MONTH">চলতি মাস</option>
                </select>

                {/* Payment Status Filter */}
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">সকল পেমেন্ট স্ট্যাটাস</option>
                  <option value="PAID">সম্পূর্ণ পরিশোধিত (Paid)</option>
                  <option value="DUE">বকেয়া রয়েছে (Due)</option>
                  <option value="PARTIAL">আংশিক পরিশোধিত</option>
                </select>
              </>
            )}
          </div>

          {/* Right: Bulk Selection Actions */}
          {activeTab !== 'purchases' && (
            <div className="flex items-center gap-2">
              {selectedOrderIds.length > 0 ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold">
                  <span>{selectedOrderIds.length} টি নির্বাচিত</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsBatchPrintOpen(true)}
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                  >
                    বাল্ক প্রিন্ট
                  </Button>
                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="text-[11px] text-slate-500 hover:text-slate-800 ml-1 underline cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  মোট চালান: <span className="font-bold text-slate-800">{filteredOrders.length} টি</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          {activeTab === 'purchases' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">ক্রয় চালান নং</th>
                  <th className="py-3 px-4 font-semibold">তারিখ</th>
                  <th className="py-3 px-4 font-semibold">সরবরাহকারী (Supplier)</th>
                  <th className="py-3 px-4 font-semibold">আইটেম সংখ্যা</th>
                  <th className="py-3 px-4 font-semibold">মোট মূল্য</th>
                  <th className="py-3 px-4 font-semibold">পরিশোধ</th>
                  <th className="py-3 px-4 font-semibold">বকেয়া</th>
                  <th className="py-3 px-4 font-semibold text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      কোনো ক্রয় চালান পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {pur.purchaseNumber || pur.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {formatDate(pur.purchaseDate || '2026-03-01')}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{pur.supplierName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{pur.items.length} টি</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(pur.totalAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {formatCurrency(pur.paidAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">
                        {formatCurrency(pur.dueAmount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPurchase(pur)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          চালান দেখুন
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="cursor-pointer text-slate-400 hover:text-slate-700"
                      title="সবগুলো নির্বাচন করুন"
                    >
                      {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">ইনভয়েস নং & চ্যানেল</th>
                  <th className="py-3 px-4 font-semibold">তারিখ ও সময়</th>
                  <th className="py-3 px-4 font-semibold">গ্রাহকের নাম ও মোবাইল</th>
                  <th className="py-3 px-4 font-semibold">পণ্য ও পরিমাণ</th>
                  <th className="py-3 px-4 font-semibold text-right">মোট বিল</th>
                  <th className="py-3 px-4 font-semibold text-right">পরিশোধ</th>
                  <th className="py-3 px-4 font-semibold text-right">বকেয়া</th>
                  <th className="py-3 px-4 font-semibold text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 font-semibold text-right">চালান ও অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      কোনো বিক্রয় ইনভয়েস পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const isSelected = selectedOrderIds.includes(ord.id);
                    return (
                      <tr
                        key={ord.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isSelected ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOrder(ord.id)}
                            className="cursor-pointer text-slate-400 hover:text-slate-700"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Order No & Channel */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">{ord.orderNumber}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              {ord.channel}
                            </span>
                            {ord.courierProvider && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono">
                                {ord.courierProvider}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {formatDateTime(ord.createdAt)}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ord.customerName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{ord.customerMobile || 'মোবাইল নেই'}</div>
                          {ord.customerAddress && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {ord.customerAddress}
                            </div>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">
                            {ord.items[0]?.productName}
                            {ord.items.length > 1 && (
                              <span className="text-[10px] text-slate-400 ml-1">
                                +{ord.items.length - 1}টি
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            মোট {ord.items.reduce((sum, it) => sum + it.quantity, 0)} পিস
                          </div>
                        </td>

                        {/* Total */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                          {formatCurrency(ord.totalAmount)}
                        </td>

                        {/* Paid */}
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-right">
                          {formatCurrency(ord.paidAmount)}
                        </td>

                        {/* Due */}
                        <td className="py-3 px-4 font-mono font-bold text-right">
                          {ord.dueAmount > 0 ? (
                            <span className="text-rose-600">{formatCurrency(ord.dueAmount)}</span>
                          ) : (
                            <span className="text-emerald-700 font-normal text-[11px]">পরিশোধিত</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.orderStatus === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.orderStatus === 'Confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : ord.orderStatus === 'Shipped'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Collect Due button if due exists */}
                            {ord.dueAmount > 0 && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrderForDue(ord);
                                  setIsCollectDueOpen(true);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 border-rose-600"
                                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                              >
                                আদায়
                              </Button>
                            )}

                            {/* View & Print Invoice */}
                            <button
                              onClick={() => openInvoice(ord, 'standard')}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="ক্যাশ মেমো প্রিন্ট করুন"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>মেমো</span>
                            </button>

                            {/* Price-less Delivery Challan */}
                            <button
                              onClick={() => openInvoice(ord, 'challan')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="ডেলিভারি চালান প্রিন্ট করুন (প্রাইসলেস)"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>চালান</span>
                            </button>

                            {/* WhatsApp Direct */}
                            <button
                              onClick={() => handleWhatsAppSend(ord)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                              title="হোয়াটসঅ্যাপে মেমো পাঠান"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* 4x6 Label if Online */}
                            {ord.channel !== 'POS' && (
                              <button
                                onClick={() => openInvoice(ord, 'shipping_label')}
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                                title="কুরিয়ার পার্সেল লেবেল"
                              >
                                <Tag className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invoice Modal for Orders */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={selectedOrderForInvoice}
        shop={shop}
        initialFormat={invoiceInitialFormat}
      />

      {/* Collect Due Modal */}
      <InvoicesCollectDueModal
        isOpen={isCollectDueOpen}
        onClose={() => setIsCollectDueOpen(false)}
        order={selectedOrderForDue}
        onSuccess={loadData}
      />

      {/* Batch Print Modal */}
      <BatchInvoicesPrintModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
        orders={selectedOrdersList}
        shop={shop}
      />

      {/* Purchase Invoice Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">সরবরাহকারী ক্রয় চালান বিস্তারিত</h3>
                <p className="text-xs font-mono text-slate-500">{selectedPurchase.purchaseNumber}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedPurchase(null)}>
                বন্ধ করুন
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
              <div>
                <span className="text-slate-500">সরবরাহকারী (Supplier):</span>
                <p className="font-bold text-slate-900">{selectedPurchase.supplierName}</p>
              </div>
              <div>
                <span className="text-slate-500">ক্রয়ের তারিখ:</span>
                <p className="font-bold text-slate-900">{formatDate(selectedPurchase.purchaseDate || '')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">পণ্য তালিকা:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2.5">পণ্য</th>
                      <th className="p-2.5 text-center">পরিমাণ</th>
                      <th className="p-2.5 text-right">দর</th>
                      <th className="p-2.5 text-right">মোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedPurchase.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{it.productName}</td>
                        <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(it.purchasePrice)}</td>
                        <td className="p-2.5 font-mono font-bold text-right">
                          {formatCurrency(it.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1 text-xs font-mono text-right">
              <div className="text-slate-600">
                মোট ক্রয়মূল্য: <span className="font-bold text-slate-900">{formatCurrency(selectedPurchase.totalAmount)}</span>
              </div>
              <div className="text-emerald-600">
                পরিশোধ: <span className="font-bold">{formatCurrency(selectedPurchase.paidAmount)}</span>
              </div>
              <div className="text-rose-600 font-bold text-sm">
                বকেয়া: {formatCurrency(selectedPurchase.dueAmount)}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                প্রিন্ট করুন
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, CourierProvider } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { orderService } from '../../services/orderService';
import { smsService } from '../../services/smsService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';
import { BatchInvoicesPrintModal } from '../../components/invoice/BatchInvoicesPrintModal';
import { OrderFraudCheckCard } from '../../components/orders/OrderFraudCheckCard';
import { OrderAdvanceFeeModal } from '../../components/orders/OrderAdvanceFeeModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Search,
  Truck,
  Printer,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ShoppingBag,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  RefreshCw,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  History,
  User,
  MapPin,
  Calendar,
  Package,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronDown,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { shop, user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>(() => DataStore.getOrders());

  // Filters & Tabs
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');

  // Bulk Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkStatusDropdownOpen, setIsBulkStatusDropdownOpen] = useState(false);

  // Modals State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isBulkCourierModalOpen, setIsBulkCourierModalOpen] = useState(false);
  const [isAdvanceFeeModalOpen, setIsAdvanceFeeModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState(false);

  // Single Courier form
  const [courierProvider, setCourierProvider] = useState<CourierProvider>('Steadfast');
  const [trackingId, setTrackingId] = useState('');

  // Bulk Courier form
  const [bulkCourierProvider, setBulkCourierProvider] = useState<CourierProvider>('Steadfast');

  // Reload orders from DataStore
  const refreshOrders = () => {
    const updated = DataStore.getOrders();
    setOrders([...updated]);
    if (selectedOrder) {
      const refreshed = updated.find((o) => o.id === selectedOrder.id);
      if (refreshed) setSelectedOrder(refreshed);
    }
  };

  // Pipeline Counts
  const counts = useMemo(() => {
    const all = orders.length;
    const newPending = orders.filter((o) => o.orderStatus === 'New' || o.orderStatus === 'Pending').length;
    const confirmed = orders.filter((o) => o.orderStatus === 'Confirmed').length;
    const packed = orders.filter((o) => o.orderStatus === 'Packed' || o.orderStatus === 'Processing').length;
    const shipped = orders.filter((o) => o.orderStatus === 'Courier Assigned' || o.orderStatus === 'Shipped').length;
    const delivered = orders.filter((o) => o.orderStatus === 'Delivered').length;
    const returnedOrCancelled = orders.filter((o) => o.orderStatus === 'Returned' || o.orderStatus === 'Cancelled').length;

    const totalValue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const deliveredRate = all > 0 ? Math.round((delivered / all) * 100) : 0;

    return {
      all,
      newPending,
      confirmed,
      packed,
      shipped,
      delivered,
      returnedOrCancelled,
      totalValue,
      deliveredRate,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerMobile.includes(q) ||
        (order.courierTrackingId && order.courierTrackingId.toLowerCase().includes(q)) ||
        (order.courierTrackingCode && order.courierTrackingCode.toLowerCase().includes(q)) ||
        order.items.some((i) => i.productName.toLowerCase().includes(q));

      let matchStatus = true;
      if (statusFilter === 'new_pending') {
        matchStatus = order.orderStatus === 'New' || order.orderStatus === 'Pending';
      } else if (statusFilter === 'confirmed') {
        matchStatus = order.orderStatus === 'Confirmed';
      } else if (statusFilter === 'packed') {
        matchStatus = order.orderStatus === 'Packed' || order.orderStatus === 'Processing';
      } else if (statusFilter === 'shipped') {
        matchStatus = order.orderStatus === 'Courier Assigned' || order.orderStatus === 'Shipped';
      } else if (statusFilter === 'delivered') {
        matchStatus = order.orderStatus === 'Delivered';
      } else if (statusFilter === 'returned_cancelled') {
        matchStatus = order.orderStatus === 'Returned' || order.orderStatus === 'Cancelled';
      } else if (statusFilter !== 'all') {
        matchStatus = order.orderStatus === statusFilter;
      }

      const matchChannel = channelFilter === 'all' || order.channel === channelFilter;

      const matchCourier =
        courierFilter === 'all' ||
        order.courierProvider === courierFilter ||
        order.courierName === courierFilter;

      return matchSearch && matchStatus && matchChannel && matchCourier;
    });
  }, [orders, search, statusFilter, channelFilter, courierFilter]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Selected orders array
  const selectedOrdersList = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  // Bulk Status Update
  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    try {
      const res = await orderService.bulkUpdateStatus(
        selectedOrderIds,
        status,
        user?.name || 'অ্যাডমিন'
      );
      showToast(`${res.updatedCount}টি অর্ডারের স্ট্যাটাস সফলভাবে "${status}" এ আপডেট হয়েছে`, 'success');
      refreshOrders();
      setSelectedOrderIds([]);
      setIsBulkStatusDropdownOpen(false);
    } catch (err: any) {
      showToast(err.message || 'বাল্ক স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Bulk Courier Assign
  const handleBulkAssignCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderIds.length === 0) return;

    try {
      let count = 0;
      for (const ordId of selectedOrderIds) {
        const prefix =
          bulkCourierProvider === 'Steadfast'
            ? 'STD'
            : bulkCourierProvider === 'Pathao'
            ? 'PTH'
            : bulkCourierProvider === 'RedX'
            ? 'RDX'
            : 'CR';
        const generatedCode = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
        await orderService.assignCourier(ordId, bulkCourierProvider, generatedCode);
        count++;
      }

      showToast(`${count}টি অর্ডারে "${bulkCourierProvider}" কুরিয়ার সফলভাবে অ্যাসাইন হয়েছে`, 'success');
      refreshOrders();
      setSelectedOrderIds([]);
      setIsBulkCourierModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'কুরিয়ার অ্যাসাইন করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  // Single Order Status Update
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await orderService.updateOrderStatus(
        orderId,
        newStatus,
        user?.name || 'অপারেটর'
      );
      refreshOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }

      if (newStatus === 'Returned' || newStatus === 'Cancelled') {
        showToast(`অর্ডার #${updated.orderNumber} ${newStatus === 'Returned' ? 'রিটার্ন' : 'বাতিল'} হয়েছে এবং ইনভেন্টরিতে স্টক ফেরত যোগ হয়েছে!`, 'info');
      } else {
        showToast(`অর্ডার #${updated.orderNumber} স্ট্যাটাস: ${newStatus}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে', 'error');
    }
  };

  // Single Courier Assign
  const handleAssignCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const finalTrackingId =
      trackingId.trim() ||
      `${courierProvider.substring(0, 3).toUpperCase()}-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

    try {
      await orderService.assignCourier(selectedOrder.id, courierProvider, finalTrackingId);

      // Send SMS notification
      try {
        const sent = smsService.triggerOrderSms(selectedOrder, 'DISPATCH', {
          courierName: courierProvider,
          trackingId: finalTrackingId,
        });
        if (sent) {
          showToast('কুরিয়ার ট্র্যাকিং এসএমএস পাঠানো হয়েছে', 'info');
        }
      } catch (e) {
        console.log('SMS dispatch skipped');
      }

      showToast(
        `অর্ডার #${selectedOrder.orderNumber} কুরিয়ারে অ্যাসাইন হয়েছে (${courierProvider})`,
        'success'
      );
      setIsCourierModalOpen(false);
      refreshOrders();
    } catch (err: any) {
      showToast(err.message || 'কুরিয়ার অ্যাসাইন করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  // 1-Click WhatsApp verification
  const openWhatsAppChat = (order: Order) => {
    const cleanMobile = order.customerMobile.replace(/[^0-9]/g, '');
    const bdMobile = cleanMobile.startsWith('880')
      ? cleanMobile
      : cleanMobile.startsWith('0')
      ? '88' + cleanMobile
      : '880' + cleanMobile;

    const safeItems = Array.isArray(order?.items) ? order.items : [];
    const itemsList = safeItems.map((it) => `${it.productName} (${it.quantity}টি)`).join(', ');
    const msg =
      `আসসালামু আলাইকুম ${order.customerName},\n` +
      `${shop?.name || 'আমাদের শপ'} থেকে আপনার অর্ডার #${order.orderNumber} সংক্রান্ত মেসেজ:\n\n` +
      `📦 আইটেম: ${itemsList}\n` +
      `💰 মোট বিল: ৳${order.totalAmount}\n` +
      (order.advanceDeliveryChargePaid ? `✅ অগ্রিম পরিশোধ: ৳${order.advanceDeliveryChargePaid}\n` : '') +
      `💵 ক্যাশ অন ডেলিভারি (COD): ৳${order.dueAmount}\n` +
      `📍 ডেলিভারি ঠিকানা: ${order.customerAddress || 'কাউন্টার সরাসরি'}\n\n` +
      `আপনার অর্ডারটি দ্রুত নিশ্চিত করতে অনুগ্রহ করে এই মেসেজে একটি রিপ্লাই দিন। ধন্যবাদ!`;

    window.open(`https://wa.me/${bdMobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      showToast('এক্সপোর্ট করার মতো কোনো অর্ডার নেই', 'warning');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Mobile',
      'Address',
      'Items Count',
      'Total Amount',
      'Advance Paid',
      'Due COD',
      'Payment Status',
      'Order Status',
      'Channel',
      'Courier',
      'Tracking Code',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.createdAt}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerMobile}"`,
      `"${(o.customerAddress || '').replace(/"/g, '""')}"`,
      o.items.length,
      o.totalAmount,
      o.advanceDeliveryChargePaid || 0,
      o.dueAmount,
      `"${o.paymentStatus}"`,
      `"${o.orderStatus}"`,
      `"${o.channel}"`,
      `"${o.courierProvider || o.courierName || ''}"`,
      `"${o.courierTrackingId || o.courierTrackingCode || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('অর্ডার ডাটা সফলভাবে CSV ফাইল হিসেবে ডাউনলোড হয়েছে', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            অর্ডার হাব ও ডেলিভারি পাইপলাইন
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Pipeline
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            অনলাইন স্টোর, ল্যান্ডিং পেজ ও পিওএস-এর সকল অর্ডার প্রক্রিয়াকরণ, কুরিয়ার বুকিং, ফ্রড চেকার ও বাল্ক অপারেশন
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshOrders}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            title="রিফ্রেশ করুন"
          >
            রিফ্রেশ
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            এক্সেল / CSV এক্সপোর্ট
          </Button>

          {selectedOrderIds.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsBatchPrintModalOpen(true)}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              প্রিন্ট ({selectedOrderIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              মোট অর্ডার ও গ্রস ভ্যালু
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono">{counts.all}</span>
              <span className="text-xs font-semibold text-emerald-600 font-mono">
                {formatCurrency(counts.totalValue)}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
              নতুন / পেন্ডিং যাচাই
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-700 font-mono">{counts.newPending}</span>
              <span className="text-[11px] text-slate-500">কনফার্মেশন বাকি</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block">
              কুরিয়ারে হস্তান্তর (In Transit)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-purple-700 font-mono">{counts.shipped}</span>
              <span className="text-[11px] text-slate-500">পার্সেল রানিং</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              ডেলিভারি সাকসেস রেট
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-700 font-mono">
                {counts.deliveredRate}%
              </span>
              <span className="text-[11px] text-slate-500">
                {counts.delivered} সফল / {counts.returnedOrCancelled} রিটার্ন
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pipeline Navigation Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200 no-scrollbar">
        {[
          { key: 'all', label: 'সকল অর্ডার', count: counts.all },
          { key: 'new_pending', label: 'নতুন ও পেন্ডিং', count: counts.newPending, color: 'text-amber-700 bg-amber-100' },
          { key: 'confirmed', label: 'কনফার্মড', count: counts.confirmed, color: 'text-blue-700 bg-blue-100' },
          { key: 'packed', label: 'প্যাকিং', count: counts.packed, color: 'text-indigo-700 bg-indigo-100' },
          { key: 'shipped', label: 'কুরিয়ারে হস্তান্তর', count: counts.shipped, color: 'text-purple-700 bg-purple-100' },
          { key: 'delivered', label: 'সফল ডেলিভার্ড', count: counts.delivered, color: 'text-emerald-700 bg-emerald-100' },
          { key: 'returned_cancelled', label: 'রিটার্ন ও বাতিল', count: counts.returnedOrCancelled, color: 'text-rose-700 bg-rose-100' },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl font-medium whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-600 text-white font-bold' : tab.color || 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="অর্ডার নম্বর, ক্রেতার নাম, মোবাইল, কুরিয়ার ট্র্যাকিং কোড দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">সকল অর্ডার চ্যানেল</option>
            <option value="Online Store">অনলাইন স্টোর (Website)</option>
            <option value="Landing Page">ল্যান্ডিং পেজ (Funnel)</option>
            <option value="POS">পিওএস / আউটলেট (POS)</option>
            <option value="Manual">ম্যানুয়াল / ফোন কল</option>
          </select>

          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">সকল কুরিয়ার</option>
            <option value="Steadfast">Steadfast (স্টেডফাস্ট)</option>
            <option value="Pathao">Pathao (পাঠাও)</option>
            <option value="RedX">RedX (রেডএক্স)</option>
            <option value="Paperfly">Paperfly</option>
            <option value="Sundarban">সুন্দরবন</option>
            <option value="eCourier">eCourier</option>
          </select>
        </div>
      </div>

      {/* Floating / Sticky Bulk Actions Toolbar */}
      {selectedOrderIds.length > 0 && (
        <div className="sticky top-4 z-20 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 font-mono">
              {selectedOrderIds.length} টি অর্ডার নির্বাচিত
            </span>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              নির্বাচন বাতিল
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsBulkStatusDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 cursor-pointer"
              >
                <span>স্ট্যাটাস পরিবর্তন</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isBulkStatusDropdownOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1 z-30 text-xs font-medium">
                  <div className="px-3 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    নতুন স্ট্যাটাস দিন
                  </div>
                  <button
                    onClick={() => handleBulkStatusUpdate('Confirmed')}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>কনফার্ম করুন</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('Packed')}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    <span>প্যাকিং সম্পন্ন</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('Courier Assigned')}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 text-purple-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5 text-purple-600" />
                    <span>কুরিয়ারে হস্তান্তর</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('Delivered')}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ডেলিভার্ড (সম্পন্ন)</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => handleBulkStatusUpdate('Cancelled')}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>বাতিল (স্টক ফেরত)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bulk Courier Assign Button */}
            <button
              onClick={() => setIsBulkCourierModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white shadow-sm cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>কুরিয়ারে বুকিং</span>
            </button>

            {/* Bulk Print Button */}
            <button
              onClick={() => setIsBatchPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ব্যাচ প্রিন্ট / লেবেল</span>
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                    title={selectedOrderIds.length === filteredOrders.length ? 'আনসিলেক্ট' : 'সব সিলেক্ট'}
                  >
                    {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : selectedOrderIds.length > 0 ? (
                      <div className="w-4 h-4 bg-emerald-600 rounded flex items-center justify-center text-white text-[10px] font-bold">
                        -
                      </div>
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">অর্ডার নং ও সময়</th>
                <th className="py-3 px-3">গ্রাহক ও ট্রাস্ট স্কোর</th>
                <th className="py-3 px-3">আইটেম ও বিবরণ</th>
                <th className="py-3 px-3">মোট ও পেমেন্ট (COD)</th>
                <th className="py-3 px-3">কুরিয়ার ও ট্র্যাকিং</th>
                <th className="py-3 px-3">বর্তমান অবস্থা</th>
                <th className="py-3 px-3 text-center">অ্যাকশন</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                      <p className="font-semibold text-slate-700 text-sm">কোনো অর্ডার পাওয়া যায়নি</p>
                      <p className="text-xs text-slate-400">
                        আপনার ফিল্টার বা সার্চ কিওয়ার্ড পরিবর্তন করে পুনরায় চেষ্টা করুন।
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOrder(order.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Order No & Timestamp */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailsModalOpen(true);
                          }}
                          className="font-mono font-bold text-slate-900 hover:text-emerald-700 text-xs block text-left cursor-pointer"
                        >
                          #{order.orderNumber}
                        </button>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {formatDateTime(order.createdAt)}
                        </span>
                        <span className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {order.channel}
                        </span>
                      </td>

                      {/* Customer & Fraud Score */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate max-w-[130px]">
                              {order.customerName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                            <span>{order.customerMobile}</span>
                            <button
                              onClick={() => openWhatsAppChat(order)}
                              title="হোয়াটসঅ্যাপে অর্ডার যাচাই বার্তা পাঠান"
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`tel:${order.customerMobile}`}
                              title="সরাসরি কল করুন"
                              className="text-blue-600 hover:text-blue-700 p-0.5 rounded cursor-pointer"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          </div>

                          {/* Fraud Check Badge */}
                          <OrderFraudCheckCard
                            customerMobile={order.customerMobile}
                            customerName={order.customerName}
                            compact={true}
                          />
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">
                          {(order.items || []).length} টি আইটেম ({(order.items || []).reduce((a, b) => a + (Number(b?.quantity) || 0), 0)} পিস)
                        </span>
                        <span className="text-[11px] text-slate-500 truncate block max-w-[150px]">
                          {(order.items || []).map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                        </span>
                      </td>

                      {/* Total & Due / COD */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 block text-xs">
                          {formatCurrency(order.totalAmount)}
                        </span>

                        <div className="mt-0.5">
                          {order.dueAmount > 0 ? (
                            <span className="text-[11px] font-mono font-bold text-rose-600 block">
                              বকেয়া (COD): {formatCurrency(order.dueAmount)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                              সম্পূর্ণ পেইড
                            </span>
                          )}

                          {order.advanceDeliveryChargePaid ? (
                            <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
                              অগ্রিম ৳{order.advanceDeliveryChargePaid} ({order.advancePaymentMethod || 'Paid'})
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Courier & Tracking */}
                      <td className="py-3 px-3">
                        {order.courierProvider || order.courierName ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800 block text-[11px] flex items-center gap-1">
                              <Truck className="w-3 h-3 text-purple-600" />
                              {order.courierProvider || order.courierName}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-700 font-bold block">
                              {order.courierTrackingId || order.courierTrackingCode}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsCourierModalOpen(true);
                            }}
                            className="text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Truck className="w-3 h-3" />
                            <span>কুরিয়ার অ্যাসাইন</span>
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <StatusBadge status={order.orderStatus} type="order" />
                      </td>

                      {/* Action Menu Icons */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Details & Pipeline */}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="বিস্তারিত ও স্ট্যাটাস আপডেট"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Advance Fee */}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsAdvanceFeeModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            title="অগ্রিম ডেলিভারি চার্জ আদায় (Advance COD Fee)"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Courier Assign */}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsCourierModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg cursor-pointer"
                            title="কুরিয়ার পার্সেল বুকিং ও ট্র্যাকিং"
                          >
                            <Truck className="w-4 h-4" />
                          </button>

                          {/* Invoice Print */}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="মেমো প্রিন্ট"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- ORDER DETAILS & PIPELINE AUDIT MODAL ---------------- */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`অর্ডার কন্ট্রোল ও ট্র্যাকিং হাব: #${selectedOrder.orderNumber}`}
          subtitle={`চ্যানেল: ${selectedOrder.channel} • তারিখ: ${formatDateTime(selectedOrder.createdAt)}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Customer Fraud & Delivery Success Card */}
            <OrderFraudCheckCard
              customerMobile={selectedOrder.customerMobile}
              customerName={selectedOrder.customerName}
            />

            {/* Quick Status Bar & Lifecycle Transition */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-600" />
                  অর্ডার লাইফসাইকেল ট্রানজিশন (Status Pipeline)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">বর্তমান অবস্থা:</span>
                  <StatusBadge status={selectedOrder.orderStatus} type="order" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 pt-1">
                {(
                  [
                    'Confirmed',
                    'Packed',
                    'Courier Assigned',
                    'Delivered',
                    'Returned',
                    'Cancelled',
                  ] as OrderStatus[]
                ).map((st) => {
                  const isCurrent = selectedOrder.orderStatus === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      className={`py-2 px-2 rounded-xl font-bold text-center transition-all cursor-pointer text-[11px] ${
                        isCurrent
                          ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900 ring-offset-1'
                          : st === 'Returned' || st === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : st === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {st === 'Confirmed'
                        ? 'কনফার্মড'
                        : st === 'Packed'
                        ? 'প্যাকিং'
                        : st === 'Courier Assigned'
                        ? 'কুরিয়ার'
                        : st === 'Delivered'
                        ? 'ডেলিভার্ড'
                        : st === 'Returned'
                        ? 'রিটার্ন'
                        : 'বাতিল'}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-500 mt-2 italic">
                * পরামর্শ: অর্ডার `Returned` অথবা `Cancelled` মার্ক করলে ইনভেন্টরি স্টক স্বয়ংক্রিয়ভাবে ফেরত যুক্ত হবে।
              </p>
            </div>

            {/* Customer & Delivery Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1 text-xs">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  গ্রাহকের তথ্য ও দ্রুত যোগাযোগ
                </span>
                <div>
                  <span className="font-bold text-slate-900 text-sm">{selectedOrder.customerName}</span>
                  <div className="flex items-center gap-2 font-mono text-slate-600 mt-0.5">
                    <span>{selectedOrder.customerMobile}</span>
                    <button
                      onClick={() => openWhatsAppChat(selectedOrder)}
                      className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] flex items-center gap-1 border border-emerald-200 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      হোয়াটসঅ্যাপ
                    </button>
                    <a
                      href={`tel:${selectedOrder.customerMobile}`}
                      className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[10px] flex items-center gap-1 border border-blue-200 cursor-pointer"
                    >
                      <Phone className="w-3 h-3" />
                      কল
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  শিপিং ও ডেলিভারি ঠিকানা
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {selectedOrder.customerAddress || 'কাউন্টার সরাসরি ডেলিভারি'}
                </p>
                {selectedOrder.notes && (
                  <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                    <strong>নোট:</strong> {selectedOrder.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Advance Delivery Charge Status Card */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  অগ্রিম ডেলিভারি চার্জ আদায় (Advance COD Charge)
                </span>
                {selectedOrder.advanceDeliveryChargePaid ? (
                  <p className="text-emerald-700 font-medium text-[11px] mt-0.5">
                    ✅ অগ্রিম আদায় হয়েছে: <strong>{formatCurrency(selectedOrder.advanceDeliveryChargePaid)}</strong> ({selectedOrder.advancePaymentMethod || 'Online'}
                    {selectedOrder.advancePaymentTrxId ? ` • Trx: ${selectedOrder.advancePaymentTrxId}` : ''})
                  </p>
                ) : (
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    এখনও কোনো অগ্রিম ডেলিভারি চার্জ রেকর্ড করা হয়নি।
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdvanceFeeModalOpen(true)}
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              >
                {selectedOrder.advanceDeliveryChargePaid ? 'চার্জ সংশোধন' : '+ অগ্রিম চার্জ যোগ'}
              </Button>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-slate-800">
                অর্ডারকৃত পণ্যের তালিকা ({(selectedOrder.items || []).length} টি)
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">পণ্য</th>
                    <th className="py-2 px-3 text-center">পরিমাণ</th>
                    <th className="py-2 px-3 text-right">একক মূল্য</th>
                    <th className="py-2 px-3 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedOrder.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {it.productName}
                        {it.selectedUnit ? (
                          <span className="text-slate-400 text-[10px] ml-1">({it.selectedUnit})</span>
                        ) : null}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">{it.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Calculation */}
            <div className="flex justify-end pt-1">
              <div className="w-64 space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>সাবটোটাল:</span>
                  <span className="font-mono font-semibold">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>ডিসকাউন্ট:</span>
                    <span className="font-mono font-semibold">-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                {selectedOrder.deliveryCharge > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="font-mono font-semibold">{formatCurrency(selectedOrder.deliveryCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                  <span>সর্বমোট বিল:</span>
                  <span className="font-mono text-slate-900">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                {selectedOrder.advanceDeliveryChargePaid ? (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>অগ্রিম পরিশোধ:</span>
                    <span className="font-mono">-{formatCurrency(selectedOrder.advanceDeliveryChargePaid)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-black text-rose-700 text-sm pt-1 border-t border-slate-200">
                  <span>ক্যাশ অন ডেলিভারি (Due COD):</span>
                  <span className="font-mono">{formatCurrency(selectedOrder.dueAmount)}</span>
                </div>
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <History className="w-4 h-4 text-slate-600" />
                অডিট ট্রেইল ও টাইমলাইন হিস্ট্রি (Audit Log)
              </span>

              <div className="space-y-2 pt-1">
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 ? (
                  selectedOrder.timeline.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/80 text-[11px]"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{item.action}</span>
                          <span className="font-mono text-slate-400 text-[10px]">
                            {formatDateTime(item.timestamp)}
                          </span>
                        </div>
                        {item.user && (
                          <span className="text-[10px] text-slate-500 block">ব্যবহারকারী: {item.user}</span>
                        )}
                        {item.note && (
                          <span className="text-[10px] text-slate-600 block mt-0.5 italic">{item.note}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    অর্ডার তৈরি হয়েছে: {formatDateTime(selectedOrder.createdAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setIsInvoiceModalOpen(true);
                  }}
                >
                  ইনভয়েস প্রিন্ট
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Truck className="w-3.5 h-3.5 text-purple-600" />}
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setIsCourierModalOpen(true);
                  }}
                >
                  কুরিয়ার বুকিং
                </Button>
              </div>

              <Button variant="secondary" size="sm" onClick={() => setIsDetailsModalOpen(false)}>
                বন্ধ করুন
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------------- SINGLE COURIER ASSIGN MODAL ---------------- */}
      {selectedOrder && (
        <Modal
          isOpen={isCourierModalOpen}
          onClose={() => setIsCourierModalOpen(false)}
          title="কুরিয়ার পার্সেল বুকিং ও ট্র্যাকিং"
          subtitle={`অর্ডার #${selectedOrder.orderNumber} • গ্রাহক: ${selectedOrder.customerName}`}
          maxWidth="sm"
        >
          <form onSubmit={handleAssignCourier} className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex justify-between items-center">
              <div>
                <span className="text-purple-700 block text-[11px] font-semibold">ক্যাশ অন ডেলিভারি (COD)</span>
                <span className="font-mono text-base font-bold text-purple-900">
                  {formatCurrency(selectedOrder.dueAmount)}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-200 text-purple-800">
                {selectedOrder.customerAddress ? 'হোম ডেলিভারি' : 'কাউন্টার'}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                কুরিয়ার সার্ভিস নির্বাচন করুন *
              </label>
              <select
                value={courierProvider}
                onChange={(e) => setCourierProvider(e.target.value as CourierProvider)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Steadfast">Steadfast Courier (স্টেডফাস্ট)</option>
                <option value="Pathao">Pathao Courier (পাঠাও)</option>
                <option value="RedX">RedX Delivery (রেডএক্স)</option>
                <option value="Paperfly">Paperfly (পেপারফ্লাই)</option>
                <option value="Sundarban">সুন্দরবন কুরিয়ার সার্ভিস</option>
                <option value="eCourier">eCourier (ই-কুরিয়ার)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ট্র্যাকিং আইডি / কনসাইনমেন্ট কোড
              </label>
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="যেমন: STD-987654 (ফাঁকা রাখলে স্বয়ংক্রিয় তৈরি হবে)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCourierModalOpen(false)}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" size="sm">
                কুরিয়ারে অ্যাসাইন করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------- BULK COURIER ASSIGN MODAL ---------------- */}
      <Modal
        isOpen={isBulkCourierModalOpen}
        onClose={() => setIsBulkCourierModalOpen(false)}
        title="বাল্ক কুরিয়ার পার্সেল বুকিং"
        subtitle={`নির্বাচিত ${selectedOrderIds.length}টি অর্ডারে একসাথে কুরিয়ার ও স্বয়ংক্রিয় ট্র্যাকিং কোড যুক্ত হবে`}
        maxWidth="sm"
      >
        <form onSubmit={handleBulkAssignCourier} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              কুরিয়ার পার্টনার নির্বাচন করুন *
            </label>
            <select
              value={bulkCourierProvider}
              onChange={(e) => setBulkCourierProvider(e.target.value as CourierProvider)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Steadfast">Steadfast Courier (স্টেডফাস্ট)</option>
              <option value="Pathao">Pathao Courier (পাঠাও)</option>
              <option value="RedX">RedX Delivery (রেডএক্স)</option>
              <option value="Paperfly">Paperfly (পেপারফ্লাই)</option>
              <option value="Sundarban">সুন্দরবন কুরিয়ার</option>
              <option value="eCourier">eCourier (ই-কুরিয়ার)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              ⚡ স্বয়ংক্রিয় পার্সেল জেনারেশন:
            </p>
            <p className="text-[11px]">
              প্রতিটি অর্ডারে কুরিয়ার অনুযায়ী পৃথক কনসাইনমেন্ট আইডি (যেমন: STD-xxxxxx) তৈরি হবে এবং স্ট্যাটাস "কুরিয়ারে হস্তান্তর" এ পরিবর্তিত হবে।
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkCourierModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {selectedOrderIds.length}টি অর্ডার বুক করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---------------- ADVANCE COD FEE MODAL ---------------- */}
      <OrderAdvanceFeeModal
        isOpen={isAdvanceFeeModalOpen}
        onClose={() => setIsAdvanceFeeModalOpen(false)}
        order={selectedOrder}
        onSuccess={(updated) => {
          refreshOrders();
          setSelectedOrder(updated);
        }}
      />

      {/* ---------------- SINGLE INVOICE PRINT MODAL ---------------- */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={selectedOrder}
        shop={shop}
      />

      {/* ---------------- BATCH INVOICES & LABELS PRINT MODAL ---------------- */}
      <BatchInvoicesPrintModal
        isOpen={isBatchPrintModalOpen}
        onClose={() => setIsBatchPrintModalOpen(false)}
        orders={selectedOrdersList}
        shop={shop}
      />
    </div>
  );
};

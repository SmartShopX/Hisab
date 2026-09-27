import React, { useState, useEffect, useMemo } from 'react';
import { returnsApi, productApi, orderApi, inventoryApi } from '../../services/apiServices';
import {
  ReturnExchangeRecord,
  Product,
  Order,
  ReturnCondition,
  ReturnChannel,
  RefundPaymentMethod,
} from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ReturnReceiptModal } from '../../components/returns/ReturnReceiptModal';
import { SupplierExpiryReturnModal } from '../../components/returns/SupplierExpiryReturnModal';
import {
  RefreshCw,
  Plus,
  Search,
  RotateCcw,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Boxes,
  Truck,
  Ticket,
  Printer,
  Share2,
  Filter,
  Layers,
  PackageX,
  FileSpreadsheet,
} from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  const { showToast } = useToast();
  const [returns, setReturns] = useState<ReturnExchangeRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'return' | 'exchange' | 'courier_rto' | 'damaged'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [returnType, setReturnType] = useState<'Return' | 'Exchange'>('Return');
  const [returnChannel, setReturnChannel] = useState<ReturnChannel>('POS_Store');
  const [itemCondition, setItemCondition] = useState<ReturnCondition>('Resellable');
  const [refundMethod, setRefundMethod] = useState<RefundPaymentMethod>('Cash');

  // Courier RTO fields
  const [courierProvider, setCourierProvider] = useState('Steadfast Courier');
  const [courierTrackingCode, setCourierTrackingCode] = useState('');
  const [courierReturnFee, setCourierReturnFee] = useState<number | ''>(100);

  // Form Fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [returnedProductId, setReturnedProductId] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [exchangedProductId, setExchangedProductId] = useState('');
  const [exchangeQuantity, setExchangeQuantity] = useState(1);
  const [additionalCharge, setAdditionalCharge] = useState<number | ''>(0);
  const [reason, setReason] = useState('পণ্য পরিবর্তন বা সাইজ সমস্যা');
  const [notes, setNotes] = useState('');
  const [stockRestocked, setStockRestocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Modal State
  const [selectedRecordForReceipt, setSelectedRecordForReceipt] = useState<ReturnExchangeRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSupplierExpiryModalOpen, setIsSupplierExpiryModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [retList, prodList, orderList] = await Promise.all([
        returnsApi.getAll(),
        productApi.getAll(),
        orderApi.getAll(),
      ]);
      setReturns(Array.isArray(retList) ? retList : []);
      setProducts(Array.isArray(prodList) ? prodList : []);
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch {
      showToast('রিটার্ন ও এক্সচেঞ্জ ডেটা লোড করতে ত্রুটি হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Autofill from invoice reference
  const handleInvoiceLookup = (inv: string) => {
    setInvoiceNumber(inv);
    const matchedOrder = orders.find(
      (o) => o.orderNumber.toLowerCase() === inv.trim().toLowerCase()
    );
    if (matchedOrder) {
      setCustomerName(matchedOrder.customerName);
      setCustomerMobile(matchedOrder.customerMobile);

      // If order was via courier, auto-set RTO provider & tracking if available
      if (matchedOrder.courierProvider) {
        setCourierProvider(`${matchedOrder.courierProvider} Courier`);
      }
      if (matchedOrder.courierTrackingId || matchedOrder.courierTrackingCode) {
        setCourierTrackingCode(matchedOrder.courierTrackingId || matchedOrder.courierTrackingCode || '');
      }

      if (matchedOrder.items && matchedOrder.items.length > 0) {
        setReturnedProductId(matchedOrder.items[0].productId);
        setRefundAmount(matchedOrder.items[0].unitPrice);
      }
      showToast(`ইনভয়েস পাওয়া গেছে: গ্রাহক ${matchedOrder.customerName}`, 'info');
    }
  };

  const handleReturnedProductChange = (prodId: string) => {
    setReturnedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setRefundAmount(prod.sellingPrice * returnQuantity);
    }
  };

  // Sync refund amount if quantity changes
  const handleReturnQuantityChange = (qty: number) => {
    setReturnQuantity(qty);
    const prod = products.find((p) => p.id === returnedProductId);
    if (prod) {
      setRefundAmount(prod.sellingPrice * qty);
    }
  };

  // Auto-calculate difference when exchanging products
  const handleExchangedProductChange = (prodId: string) => {
    setExchangedProductId(prodId);
    const retProd = products.find((p) => p.id === returnedProductId);
    const exProd = products.find((p) => p.id === prodId);

    if (retProd && exProd) {
      const retValue = retProd.sellingPrice * returnQuantity;
      const exValue = exProd.sellingPrice * exchangeQuantity;
      if (exValue > retValue) {
        setAdditionalCharge(exValue - retValue);
        setRefundAmount(0);
      } else if (retValue > exValue) {
        setRefundAmount(retValue - exValue);
        setAdditionalCharge(0);
      } else {
        setRefundAmount(0);
        setAdditionalCharge(0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim() || !customerName.trim() || !returnedProductId) {
      showToast('প্রয়োজনীয় সকল তথ্য পূরণ করুন', 'warning');
      return;
    }

    const retProd = products.find((p) => p.id === returnedProductId);
    if (!retProd) return;

    setIsSubmitting(true);
    try {
      const returnedItems = [
        {
          productId: retProd.id,
          productName: retProd.name,
          quantity: returnQuantity,
          unitPrice: retProd.sellingPrice,
          refundAmount: Number(refundAmount) || retProd.sellingPrice * returnQuantity,
          condition: itemCondition,
        },
      ];

      let exchangedItems: any[] | undefined = undefined;
      if (returnType === 'Exchange' && exchangedProductId) {
        const exProd = products.find((p) => p.id === exchangedProductId);
        if (exProd) {
          exchangedItems = [
            {
              productId: exProd.id,
              productName: exProd.name,
              quantity: exchangeQuantity,
              unitPrice: exProd.sellingPrice,
            },
          ];
        }
      }

      // Generate store credit voucher code if store credit refund is selected
      const storeCreditCode =
        refundMethod === 'Store_Credit'
          ? `SC-${new Date().toISOString().slice(2, 7).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
          : undefined;

      const shouldRestock = stockRestocked && itemCondition === 'Resellable';

      const newRecord = await returnsApi.create({
        invoiceNumber: invoiceNumber.trim(),
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        type: returnType,
        channel: returnChannel,
        condition: itemCondition,
        refundMethod: returnType === 'Exchange' ? 'Adjust_With_Exchange' : refundMethod,
        storeCreditCode,
        courierProvider: returnChannel === 'Courier_RTO' ? courierProvider : undefined,
        courierTrackingCode: returnChannel === 'Courier_RTO' ? courierTrackingCode : undefined,
        courierReturnFee: returnChannel === 'Courier_RTO' ? Number(courierReturnFee) || 0 : undefined,
        returnedItems,
        exchangedItems,
        refundAmount: Number(refundAmount) || 0,
        additionalCharge: Number(additionalCharge) || 0,
        reason,
        notes: notes.trim() || undefined,
        stockRestocked: shouldRestock,
      });

      // Adjust stock in inventory if resellable & checked
      if (shouldRestock) {
        await inventoryApi.adjustStock(
          retProd.id,
          returnQuantity,
          'IN',
          `গ্রাহক পণ্য রিটার্ন রিস্টক: ${newRecord.returnNumber}`
        );
      }

      // If exchange, deduct replacement product from stock
      if (returnType === 'Exchange' && exchangedProductId) {
        const exProd = products.find((p) => p.id === exchangedProductId);
        if (exProd) {
          await inventoryApi.adjustStock(
            exProd.id,
            exchangeQuantity,
            'OUT',
            `গ্রাহক এক্সচেঞ্জ ডেলিভারি: ${newRecord.returnNumber}`
          );
        }
      }

      setReturns([newRecord, ...returns]);
      setIsModalOpen(false);

      // Reset form
      setInvoiceNumber('');
      setCustomerName('');
      setCustomerMobile('');
      setReturnedProductId('');
      setRefundAmount('');
      setExchangedProductId('');
      setAdditionalCharge(0);
      setNotes('');
      setCourierTrackingCode('');

      // Open receipt modal immediately so user can view/print
      setSelectedRecordForReceipt(newRecord);
      setIsReceiptModalOpen(true);

      showToast(
        `রিটার্ন সম্পন্ন! ${
          storeCreditCode
            ? `স্টোর ক্রেডিট কোড: ${storeCreditCode}`
            : shouldRestock
            ? 'ইনভেন্টরিতে স্টক সমন্বয় হয়েছে।'
            : 'ড্যামেজ হিসেবে লিপিবদ্ধ করা হয়েছে।'
        }`,
        'success'
      );
    } catch {
      showToast('রিটার্ন প্রক্রিয়ায় ত্রুটি হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered returns
  const filtered = useMemo(() => {
    return (returns || []).filter((r) => {
      // Tab filter
      if (activeTab === 'return' && r.type !== 'Return') return false;
      if (activeTab === 'exchange' && r.type !== 'Exchange') return false;
      if (activeTab === 'courier_rto' && r.channel !== 'Courier_RTO') return false;
      if (activeTab === 'damaged' && r.condition !== 'Damaged_Defective') return false;

      // Search term
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (r.returnNumber || '').toLowerCase().includes(q) ||
        (r.invoiceNumber || '').toLowerCase().includes(q) ||
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.customerMobile || '').includes(q) ||
        (r.storeCreditCode || '').toLowerCase().includes(q) ||
        (r.courierTrackingCode || '').toLowerCase().includes(q)
      );
    });
  }, [returns, activeTab, searchTerm]);

  // KPIs
  const totalRefundAmount = useMemo(() => {
    return (returns || []).reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);
  }, [returns]);

  const totalCourierLoss = useMemo(() => {
    return (returns || []).reduce((sum, r) => sum + (Number(r.courierReturnFee) || 0), 0);
  }, [returns]);

  const activeStoreCredits = useMemo(() => {
    return (returns || []).filter((r) => r.storeCreditCode);
  }, [returns]);

  const damagedReturns = useMemo(() => {
    return (returns || []).filter((r) => r.condition === 'Damaged_Defective');
  }, [returns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              পণ্য রিটার্ন ও এক্সচেঞ্জ (Return & Exchange Management)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              কুরিয়ার RTO ও স্টোর ক্রেডিট সহ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            পণ্য ফেরত, সাইজ বা কালার এক্সচেঞ্জ, ড্যামেজ ট্র্যাকিং, স্টোর ক্রেডিট ভাউচার ও ইনভেন্টরি স্টক সমন্বয়
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsSupplierExpiryModalOpen(true)}
            variant="outline"
            size="md"
            leftIcon={<PackageX className="w-4 h-4 text-rose-600" />}
            className="border-rose-300 text-rose-800 hover:bg-rose-50 font-bold"
          >
            + এক্সপায়ারি ও ড্যামেজ চালান
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            নতুন রিটার্ন / এক্সচেঞ্জ এন্ট্রি
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">মোট রিটার্ন ও এক্সচেঞ্জ</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <RefreshCw className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {(returns || []).length} টি
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
            <span>রিটার্ন: {(returns || []).filter((r) => r.type === 'Return').length}</span>
            <span>•</span>
            <span>এক্সচেঞ্জ: {(returns || []).filter((r) => r.type === 'Exchange').length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">গ্রাহক রিফান্ড প্রদান</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <RotateCcw className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600">
            {formatCurrency(totalRefundAmount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">নগদ ক্যাশ ও ডিজিটাল পেমেন্টে ফেরত</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">কুরিয়ার RTO ক্ষতি ও চার্জ</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">
            {formatCurrency(totalCourierLoss)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            পার্সেল রিটার্ন বাবদ কুরিয়ার চার্জ ক্ষতি
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">স্টোর ক্রেডিট ও ড্যামেজ</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Ticket className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-purple-700">
            {activeStoreCredits.length} টি ভাউচার
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ড্যামেজড আইটেম: <strong className="text-rose-600">{damagedReturns.length} টি</strong>
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Tabs & Search Header */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল রেকর্ড ({(returns || []).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('return')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'return'
                    ? 'bg-white text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                রিটার্ন ({(returns || []).filter((r) => r.type === 'Return').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('exchange')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'exchange'
                    ? 'bg-white text-purple-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                এক্সচেঞ্জ ({(returns || []).filter((r) => r.type === 'Exchange').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('courier_rto')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'courier_rto'
                    ? 'bg-white text-amber-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                কুরিয়ার RTO ({(returns || []).filter((r) => r.channel === 'Courier_RTO').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('damaged')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'damaged'
                    ? 'bg-white text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ড্যামেজড / নষ্ট ({(returns || []).filter((r) => r.condition === 'Damaged_Defective').length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="রিটার্ন নং, ইনভয়েস, মোবাইল, ভাউচার কোড..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">রিটার্ন ট্র্যাকিং নং</th>
                <th className="py-3 px-4 font-semibold">চালান ও তারিখ</th>
                <th className="py-3 px-4 font-semibold">গ্রাহক</th>
                <th className="py-3 px-4 font-semibold">ধরন ও মাধ্যম</th>
                <th className="py-3 px-4 font-semibold">ফেরত পণ্য ও অবস্থা</th>
                <th className="py-3 px-4 font-semibold">রিফান্ড / ব্যালেন্স</th>
                <th className="py-3 px-4 font-semibold">নিষ্পত্তি মাধ্যম</th>
                <th className="py-3 px-4 font-semibold">স্টক স্থিতি</th>
                <th className="py-3 px-4 font-semibold text-right">অ্যাকশনস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    <PackageX className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    কোনো রিটার্ন বা এক্সচেঞ্জ রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map((ret) => {
                  const isDamaged = ret.condition === 'Damaged_Defective';
                  return (
                    <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{ret.returnNumber}</span>
                        {ret.storeCreditCode && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 mt-0.5">
                            <Ticket className="w-3 h-3" /> {ret.storeCreditCode}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-emerald-700 block">
                          {ret.invoiceNumber}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {formatDate(ret.date)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ret.customerName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{ret.customerMobile || '—'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ret.type === 'Exchange'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ret.type === 'Exchange' ? 'এক্সচেঞ্জ' : 'রিটার্ন'}
                          </span>

                          {ret.channel === 'Courier_RTO' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
                              <Truck className="w-3 h-3" /> RTO ফেরত
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {(ret.returnedItems || []).map((item, idx) => (
                          <div key={idx} className="font-medium text-slate-800">
                            {item.productName} ({item.quantity} টি)
                          </div>
                        ))}
                        {ret.exchangedItems && ret.exchangedItems[0] && (
                          <div className="text-[11px] text-purple-700 mt-0.5">
                            বিনিময়ে: {ret.exchangedItems[0].productName}
                          </div>
                        )}
                        <div className="mt-1">
                          {isDamaged ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> ড্যামেজড / নষ্ট
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> ভালো পণ্য
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold">
                        {ret.refundAmount > 0 ? (
                          <span className="text-rose-600">-{formatCurrency(ret.refundAmount)}</span>
                        ) : ret.additionalCharge ? (
                          <span className="text-emerald-600">+{formatCurrency(ret.additionalCharge)}</span>
                        ) : (
                          '৳০'
                        )}
                        {ret.courierReturnFee !== undefined && ret.courierReturnFee > 0 && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            কুরিয়ার ক্ষতি: -৳{ret.courierReturnFee}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-700 font-medium block">
                          {ret.refundMethod === 'Store_Credit'
                            ? '🎟️ স্টোর ভাউচার'
                            : ret.refundMethod === 'bKash' || ret.refundMethod === 'Nagad'
                            ? `📱 ${ret.refundMethod}`
                            : ret.type === 'Exchange'
                            ? '🔄 এক্সচেঞ্জ সমন্বয়'
                            : '💵 ক্যাশ'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px]" title={ret.reason}>
                          {ret.reason}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {ret.stockRestocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> স্টকে রিস্টক
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            রিস্টক হয়নি
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecordForReceipt(ret);
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="রিটার্ন স্লিপ ও ক্রেডিট নোট প্রিভিউ / প্রিন্ট"
                        >
                          <Receipt className="w-3.5 h-3.5" /> স্লিপ / প্রিন্ট
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Return / Exchange Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="নতুন পণ্য রিটার্ন অথবা এক্সচেঞ্জ এন্ট্রি"
        subtitle="বিক্রয় চালান থেকে তথ্য লোড করে স্টোর ক্রেডিট, কুরিয়ার RTO ও স্টক অ্যাডজাস্টমেন্ট"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Main Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setReturnType('Return')}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                returnType === 'Return'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-4 h-4" /> পণ্য রিটার্ন ও রিফান্ড
            </button>
            <button
              type="button"
              onClick={() => setReturnType('Exchange')}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                returnType === 'Exchange'
                  ? 'bg-white text-purple-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" /> পণ্য এক্সচেঞ্জ (বিনিময়)
            </button>
          </div>

          {/* Return Channel Selection (POS vs Courier RTO) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setReturnChannel('POS_Store')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                returnChannel === 'POS_Store'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block font-bold">🏪 ইন-স্টোর / সরাসরি কাউন্টার রিটার্ন</span>
              <span className="text-[11px] text-slate-500 font-normal">গ্রাহক দোকানে এসে পণ্য ফেরত বা পরিবর্তন করেছেন</span>
            </button>

            <button
              type="button"
              onClick={() => setReturnChannel('Courier_RTO')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                returnChannel === 'Courier_RTO'
                  ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block font-bold">🚚 কুরিয়ার পার্সেল ফেরত (Courier RTO)</span>
              <span className="text-[11px] text-slate-500 font-normal">কাস্টমার গ্রহণ করেনি বা কুরিয়ার থেকে পার্সেল ফেরত</span>
            </button>
          </div>

          {/* Courier RTO Extra Fields */}
          {returnChannel === 'Courier_RTO' && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>কুরিয়ার আরটিও ও ক্ষতি ট্র্যাকিং তথ্য</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">কুরিয়ার কোম্পানি</label>
                  <select
                    value={courierProvider}
                    onChange={(e) => setCourierProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs"
                  >
                    <option value="Steadfast Courier">Steadfast Courier</option>
                    <option value="Pathao Courier">Pathao Courier</option>
                    <option value="RedX Logistics">RedX Logistics</option>
                    <option value="Paperfly">Paperfly</option>
                    <option value="eCourier">eCourier</option>
                    <option value="Sundarban Courier">Sundarban Courier</option>
                    <option value="Manual Delivery">নিজস্ব ডেলিভারি / অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">কুরিয়ার ট্র্যাকিং / কনসাইনমেন্ট আইডি</label>
                  <input
                    type="text"
                    value={courierTrackingCode}
                    onChange={(e) => setCourierTrackingCode(e.target.value)}
                    placeholder="যেমন: ST-882910"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">কুরিয়ার রিটার্ন ক্ষতি চার্জ (৳)</label>
                  <input
                    type="number"
                    value={courierReturnFee}
                    onChange={(e) => setCourierReturnFee(Number(e.target.value) || '')}
                    placeholder="100"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-mono font-bold text-rose-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Invoice and Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বিক্রয় চালান নং (Invoice No) *
              </label>
              <div className="relative">
                <Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => handleInvoiceLookup(e.target.value)}
                  placeholder="যেমন: SX-260308-01"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">চালান নং লিখলে কাস্টমার ও পণ্য তথ্য স্বয়ংক্রিয়ভাবে লোড হবে</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                গ্রাহকের নাম ও মোবাইল *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="গ্রাহকের নাম"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  required
                />
                <input
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="মোবাইল নং"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Returned Product Selection */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              ফেরত নেওয়া পণ্যের বিবরণ (Returned Product)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">পণ্য *</label>
                <select
                  value={returnedProductId}
                  onChange={(e) => handleReturnedProductChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  required
                >
                  <option value="">পণ্য নির্বাচন করুন</option>
                  {(products || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ৳{p.sellingPrice} (স্টক: {p.stock} টি)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">পরিমাণ</label>
                <input
                  type="number"
                  min="1"
                  value={returnQuantity}
                  onChange={(e) => handleReturnQuantityChange(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
                  required
                />
              </div>
            </div>

            {/* Item Condition: Resellable vs Damaged */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                পণ্যের শারীরিক অবস্থা (Item Physical Condition)
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setItemCondition('Resellable');
                    setStockRestocked(true);
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
                    itemCondition === 'Resellable'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block">ভালো ও পুনর্বিক্রয়যোগ্য (Good Condition)</span>
                    <span className="text-[10px] text-slate-500 font-normal">পুনরায় নিয়মিত বিক্রয় স্টকে যুক্ত হবে</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItemCondition('Damaged_Defective');
                    setStockRestocked(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
                    itemCondition === 'Damaged_Defective'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="block">ড্যামেজড / নষ্ট (Defective/Broken)</span>
                    <span className="text-[10px] text-slate-500 font-normal">বিক্রয় স্টকে যাবে না, আলাদা হিসেবে থাকবে</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Exchanged Product if Exchange */}
          {returnType === 'Exchange' && (
            <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
              <span className="text-xs font-bold text-purple-900 block">
                বিনিময়ে দেওয়া নতুন পণ্য (Exchanged Product)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                    নতুন পণ্য নির্বাচন করুন
                  </label>
                  <select
                    value={exchangedProductId}
                    onChange={(e) => handleExchangedProductChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs sm:text-sm bg-white"
                  >
                    <option value="">নতুন পণ্য পছন্দ করুন</option>
                    {(products || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ৳{p.sellingPrice} (স্টক: {p.stock} টি)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                    নতুন পণ্যের পরিমাণ
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={exchangeQuantity}
                    onChange={(e) => setExchangeQuantity(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                    অতিরিক্ত পাওনা/পেমেন্ট (৳)
                  </label>
                  <input
                    type="number"
                    value={additionalCharge}
                    onChange={(e) => setAdditionalCharge(Number(e.target.value) || '')}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs sm:text-sm font-mono font-bold text-purple-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                    গ্রাহককে রিফান্ড ফেরত (৳)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value) || '')}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs sm:text-sm font-mono font-bold text-rose-600 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Refund Settlement Method if Return */}
          {returnType === 'Return' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    রিফান্ড প্রদেয় টাকা (৳) *
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value) || '')}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold text-rose-600 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    রিফান্ড নিষ্পত্তির মাধ্যম (Settlement Channel)
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as RefundPaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-semibold"
                  >
                    <option value="Cash">💵 ক্যাশ ড্রয়ার রিফান্ড (Cash Refund)</option>
                    <option value="bKash">📱 বিকাশ (bKash Transfer)</option>
                    <option value="Nagad">📱 নগদ (Nagad Transfer)</option>
                    <option value="Bank">🏦 ব্যাংক ট্রান্সফার (Bank)</option>
                    <option value="Store_Credit">🎟️ স্টোর ক্রেডিট ভাউচার প্রদান (Store Credit Voucher)</option>
                  </select>
                </div>
              </div>

              {refundMethod === 'Store_Credit' && (
                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    ক্যাশ ফেরত দেওয়ার পরিবর্তে স্বয়ংক্রিয়ভাবে একটি ইউনিক <strong>স্টোর ক্রেডিট ভাউচার কোড</strong> তৈরি হবে, যা কাস্টমার ভবিষ্যতে কেনাকাটায় ব্যবহার করতে পারবেন।
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reason & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                রিটার্ন / পরিবর্তনের কারণ *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="যেমন: সাইজ ছোট/বড়, পণ্যে স্ক্র্যাচ, কাস্টমার মত পরিবর্তন"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                অভ্যন্তরীণ নোট (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="যেমন: সাপ্লায়ার ক্লেইম দরকার, বা কুরিয়ার ক্ষতিপূরণ দাবি"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Restock Checkbox */}
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="restock"
              checked={stockRestocked && itemCondition === 'Resellable'}
              disabled={itemCondition === 'Damaged_Defective'}
              onChange={(e) => setStockRestocked(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="restock" className="text-xs text-slate-700 font-medium cursor-pointer">
              {itemCondition === 'Damaged_Defective' ? (
                <span className="text-rose-600 font-semibold">
                  ⚠️ ড্যামেজড পণ্য সাধারণ সেলস স্টকে রিস্টক হবে না (লক করা আছে)
                </span>
              ) : (
                <span>ফেরত নেওয়া পণ্যটি পুনরায় দোকানের বিক্রয়যোগ্য ইনভেন্টরি স্টকে যুক্ত করুন (Auto Stock In)</span>
              )}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              রিটার্ন সংরক্ষণ ও স্লিপ তৈরি করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Return Receipt & Credit Note Modal */}
      <ReturnReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        record={selectedRecordForReceipt}
      />

      {/* Supplier Damage & Expiry Return Challan Modal */}
      <SupplierExpiryReturnModal
        isOpen={isSupplierExpiryModalOpen}
        onClose={() => setIsSupplierExpiryModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

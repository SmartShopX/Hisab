import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../services/dataStorage';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { facebookPixelService } from '../../services/facebookPixelService';
import { smsService } from '../../services/smsService';
import { OnlinePaymentModal, PaymentGatewayType } from '../../components/common/OnlinePaymentModal';
import { AiCustomerAssistant } from '../../components/ai/AiCustomerAssistant';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Phone,
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  Search,
  Star,
  RotateCcw,
  Headphones,
  Flame,
  BadgePercent,
  Sparkles,
  Heart,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const PublicStoreView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { shop: authShop } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const checkoutSectionRef = useRef<HTMLDivElement>(null);

  // Resolve shop by route slug or fallback to active context
  const shop = useMemo(() => {
    if (slug) {
      const match = DataStore.getBusinesses().find((b) => b.storeSlug === slug || b.id === slug);
      if (match) return DataStore.getShop(match.id);
    }
    return authShop;
  }, [slug, authShop]);

  // Tenant-scoped product catalog
  const products = useMemo(() => {
    return DataStore.getProducts(shop.id).filter((p) => p.onlineStoreVisible && p.isActive);
  }, [shop.id]);

  // Search & category filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<'inside' | 'outside'>('inside');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad' | 'SSLCommerz'>('COD');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedTrxId, setCompletedTrxId] = useState<string>('');
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string>('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Facebook Pixel PageView
  useEffect(() => {
    facebookPixelService.trackEvent('PageView', {
      contentName: `হোমপেজ: ${shop.name}`,
    });
  }, [shop.name]);

  const deliveryCharge =
    deliveryArea === 'inside'
      ? shop.deliveryChargeInside || 60
      : shop.deliveryChargeOutside || 120;

  const itemsSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.product.sellingPrice - item.product.discount;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  const totalAmount = itemsSubtotal > 0 ? itemsSubtotal + deliveryCharge : 0;

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    facebookPixelService.trackEvent('AddToCart', {
      contentName: product.name,
      contentId: product.id,
      value: product.sellingPrice - product.discount,
      currency: 'BDT',
    });

    showToast(`${product.name} কার্টে যোগ করা হয়েছে`, 'success');
  };

  const buyNow = (product: Product) => {
    addToCart(product);
    setTimeout(() => {
      checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('আপনার কার্ট খালি!', 'warning');
      return;
    }
    if (!customerName || !customerPhone || !customerAddress) {
      showToast('সকল তথ্য পূরণ করুন', 'warning');
      return;
    }

    const orderNumber = `SX-WEB-${Date.now().toString().slice(-4)}`;
    setCurrentOrderNumber(orderNumber);

    if (paymentMethod !== 'COD') {
      setIsPaymentModalOpen(true);
      return;
    }

    // Direct Cash on Delivery
    const newOrder: any = {
      id: `order_${Date.now()}`,
      orderNumber,
      customerId: `cust_${Date.now()}`,
      customerName,
      customerMobile: customerPhone,
      customerAddress,
      channel: 'Online Store' as const,
      orderSource: 'Online Store' as const,
      orderStatus: 'Pending' as const,
      paymentStatus: 'Pending' as const,
      paymentMethod: 'Cash' as const,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice - item.product.discount,
        total: (item.product.sellingPrice - item.product.discount) * item.quantity,
      })),
      subtotal: itemsSubtotal,
      deliveryCharge,
      discount: 0,
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      createdAt: new Date().toISOString(),
    };

    const existingOrders = DataStore.getOrders(shop.id);
    DataStore.setOrders([newOrder, ...existingOrders], shop.id);

    facebookPixelService.trackEvent('Purchase', {
      orderId: orderNumber,
      value: totalAmount,
      currency: 'BDT',
      customerMobile: customerPhone,
      numItems: cart.length,
      contentName: `অনলাইন অর্ডার (ক্যাশ অন ডেলিভারি): ${orderNumber}`,
    });

    smsService.triggerOrderSms(newOrder, 'CONFIRM');

    setCompletedTrxId('');
    setOrderSuccess(true);
    setCart([]);
  };

  const handleOnlinePaymentSuccess = (trxId: string, gateway: PaymentGatewayType) => {
    setIsPaymentModalOpen(false);
    setCompletedTrxId(trxId);

    const newOrder: any = {
      id: `order_${Date.now()}`,
      orderNumber: currentOrderNumber || `SX-WEB-${Date.now().toString().slice(-4)}`,
      customerId: `cust_${Date.now()}`,
      customerName,
      customerMobile: customerPhone,
      customerAddress,
      channel: 'Online Store' as const,
      orderSource: 'Online Store' as const,
      orderStatus: 'Confirmed' as const,
      paymentStatus: 'Paid' as const,
      paymentMethod: (gateway === 'bKash' ? 'bKash' : gateway === 'Nagad' ? 'Nagad' : 'Other') as any,
      transactionId: trxId,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice - item.product.discount,
        total: (item.product.sellingPrice - item.product.discount) * item.quantity,
      })),
      subtotal: itemsSubtotal,
      deliveryCharge,
      discount: 0,
      totalAmount,
      paidAmount: totalAmount,
      dueAmount: 0,
      stockAdjusted: true,
      createdAt: new Date().toISOString(),
    };

    // Synchronize inventory
    const currentProducts = DataStore.getProducts(shop.id);
    for (const item of newOrder.items || []) {
      const prodIdx = currentProducts.findIndex((p) => p.id === item.productId);
      if (prodIdx !== -1) {
        const prevStock = currentProducts[prodIdx].stock;
        const deductedStock = Math.max(0, prevStock - item.quantity);
        currentProducts[prodIdx] = {
          ...currentProducts[prodIdx],
          stock: deductedStock,
        };
      }
    }
    DataStore.setProducts(currentProducts, shop.id);

    const existingOrders = DataStore.getOrders(shop.id);
    DataStore.setOrders([newOrder, ...existingOrders], shop.id);

    const existingPayments = DataStore.getPayments(shop.id);
    DataStore.setPayments([
      {
        id: `pay_${Date.now()}`,
        transactionId: trxId,
        orderId: newOrder.id,
        customerOrSupplierName: customerName,
        type: 'Customer Payment',
        amount: totalAmount,
        method: newOrder.paymentMethod,
        status: 'Paid',
        date: new Date().toISOString().split('T')[0],
        notes: `অনলাইন স্টোর পেমেন্ট: ${newOrder.orderNumber} (${gateway})`,
      },
      ...existingPayments,
    ], shop.id);

    facebookPixelService.trackEvent('Purchase', {
      orderId: newOrder.orderNumber,
      value: totalAmount,
      currency: 'BDT',
      customerMobile: customerPhone,
      numItems: cart.length,
      contentName: `অনলাইন প্রিপেইড অর্ডার: ${newOrder.orderNumber}`,
    });

    smsService.triggerOrderSms(newOrder, 'CONFIRM');

    setOrderSuccess(true);
    setCart([]);
    showToast('পেমেন্ট ও অর্ডার সফলভাবে সম্পন্ন হয়েছে!', 'success');
  };

  if (shop.subscriptionStatus === 'Suspended' || shop.isSuspended) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{shop.name}</h2>
          <p className="text-sm text-slate-600">
            এই অনলাইন স্টোরটির সেবা সেন্ট্রাল অ্যাডমিন দ্বারা সাময়িকভাবে স্থগিত রাখা হয়েছে।
          </p>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            মূল ড্যাশবোর্ডে ফিরুন
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 text-emerald-300 text-xs py-2 px-4 border-b border-emerald-900/50">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
              <Truck className="w-3.5 h-3.5" />
              সারা দেশে ক্যাশ অন ডেলিভারি ও দ্রুত হোম ডেলিভারি!
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline text-slate-300 font-mono">হটলাইন: {shop.mobile || '01700-000000'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const url = window.location.href;
                window.open(`https://wa.me/?text=${encodeURIComponent(`${shop.name} এর অনলাইন স্টোর থেকে সেরা অফারে কেনাকাটা করুন: ${url}`)}`, '_blank');
              }}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              হোয়াটসঅ্যাপে শেয়ার
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => navigate('/marketplace')}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              <span>সকল শপের দারাজ মল</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt={shop.name}
              className="w-10 h-10 rounded-xl object-contain bg-slate-50 p-1 border border-slate-200 shadow-2xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base text-slate-950 tracking-tight leading-none">
                  {shop.name}
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ভেরিফাইড
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{shop.category}</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex items-center flex-1 max-w-xs relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Cart Button with scroll */}
            <button
              onClick={() => checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>কার্ট</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                {totalCartCount}
              </span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              title="দোকানের মালিকের ম্যানেজমেন্ট ড্যাশবোর্ডে প্রবেশ করুন"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">মার্চেন্ট প্যানেল</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white py-8 sm:py-12 px-4 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>স্মার্ট শপিং • সেরা কোয়ালিটি ও দ্রুত ডেলিভারি</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {shop.name}-এ আপনাকে স্বাগতম
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              সেরা মূল্যে আকর্ষণীয় ও প্রিমিয়াম কোয়ালিটির পণ্য কিনুন ঘরে বসেই। ক্যাশ অন ডেলিভারিতে পণ্য দেখে মূল্য পরিশোধের সুবিধা।
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById('products-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <span>অফার পণ্য দেখুন</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 text-xs text-slate-300">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white">৪.৯/৫</span>
                <span className="text-slate-400">(৫০০+ সন্তুষ্ট ক্রেতা)</span>
              </div>
            </div>
          </div>

          {/* Promo Card Highlight */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-3xl max-w-xs w-full text-center space-y-2.5 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center mx-auto">
              <Flame className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-300 block">
              আজকের স্পেশাল ডিল
            </span>
            <div className="text-xl font-black text-white">
              ১০% থেকে ৩০% ছাড়
            </div>
            <p className="text-[11px] text-slate-300">
              নির্বাচিত পণ্যে ফ্রি ডেলিভারি ও আকর্ষণীয় ক্যাশব্যাক অফার!
            </p>
          </div>
        </div>
      </section>

      {/* 4 Trust & Service Features Bar */}
      <section className="bg-white border-y border-slate-200 py-4 px-4 shadow-2xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">দ্রুত ক্যাশ অন ডেলিভারি</h4>
              <p className="text-[11px] text-slate-500">সারা দেশে ২-৩ দিনে ডেলিভারি</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">১০০% আসল পণ্য</h4>
              <p className="text-[11px] text-slate-500">গুণগত মানের সম্পূর্ণ নিশ্চয়তা</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">সহজ রিটার্ন পলিসি</h4>
              <p className="text-[11px] text-slate-500">ত্রুটি থাকলে ৭ দিনে পরিবর্তন</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">২৪/৭ কাস্টমার সাপোর্ট</h4>
              <p className="text-[11px] text-slate-500">কল ও হোয়াটসঅ্যাপে সার্বক্ষণিক সেবা</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Shopping Layout */}
      <main id="products-section" className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {orderSuccess ? (
          <div className="bg-white rounded-3xl p-8 max-w-md mx-auto text-center border border-emerald-200 shadow-xl space-y-4 my-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                অর্ডার নং: {currentOrderNumber}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">অর্ডার সফলভাবে সম্পন্ন হয়েছে!</h2>
            </div>

            {completedTrxId ? (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>অনলাইন পেমেন্ট নিশ্চিত হয়েছে</span>
                </div>
                <p className="text-slate-600">
                  লেনদেন ট্রানজেকশন আইডি: <span className="font-mono font-bold text-slate-900">{completedTrxId}</span>
                </p>
                <p className="text-slate-500 text-[11px]">
                  পেমেন্ট সফল হওয়ার নোটিফিকেশন এসএমএস আপনার মোবাইলে পাঠানো হয়েছে।
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনার ক্যাশ অন ডেলিভারি অর্ডারটি নিবন্ধিত হয়েছে। পার্সেল হাতে পেয়ে মূল্য পরিশোধ করবেন।
              </p>
            )}

            <Button onClick={() => setOrderSuccess(false)} variant="primary" size="md" className="w-full">
              আরো কেনাকাটা করুন
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Products Column */}
            <div className="lg:col-span-7 space-y-5">
              {/* Category Pills Header */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Flame className="w-4.5 h-4.5 text-rose-500" />
                    <span>উপলব্ধ পণ্যসমূহ ({filteredProducts.length})</span>
                  </h3>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-xs text-emerald-600 font-semibold hover:underline"
                    >
                      সার্চ রিসেট
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        selectedCategory === 'ALL'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      সকল ({products.length})
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-400 space-y-2">
                  <Search className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">কোনো পণ্য পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map((p) => {
                    const finalPrice = p.sellingPrice - p.discount;
                    const discountPercent =
                      p.discount > 0 ? Math.round((p.discount / p.sellingPrice) * 100) : 0;

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all group relative overflow-hidden"
                      >
                        {/* Discount Badge */}
                        {discountPercent > 0 && (
                          <div className="absolute top-3 left-3 z-10 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            -{discountPercent}% OFF
                          </div>
                        )}

                        <div>
                          {/* Image */}
                          <div className="aspect-square w-full rounded-xl bg-slate-100 overflow-hidden mb-2.5 relative">
                            <img
                              src={p.image || '/logo.png'}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            {p.stock > 0 ? (
                              <span className="absolute bottom-2 right-2 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                ইন-স্টক ({p.stock})
                              </span>
                            ) : (
                              <span className="absolute bottom-2 right-2 bg-rose-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                স্টক শেষ
                              </span>
                            )}
                          </div>

                          {/* Category and Rating */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>{p.category}</span>
                            <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>৪.৮</span>
                            </div>
                          </div>

                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                            {p.name}
                          </h3>
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="font-mono font-black text-slate-950 text-base">
                                {formatCurrency(finalPrice)}
                              </span>
                              {p.discount > 0 && (
                                <span className="text-[11px] text-slate-400 line-through ml-1.5 font-mono">
                                  {formatCurrency(p.sellingPrice)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => addToCart(p)}
                              className="py-2 px-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer text-center"
                            >
                              কার্টে যোগ
                            </button>
                            <button
                              type="button"
                              onClick={() => buyNow(p)}
                              className="py-2 px-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer text-center shadow-xs"
                            >
                              এখনই কিনুন
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart & Checkout Sticky Column */}
            <div
              ref={checkoutSectionRef}
              className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5 lg:sticky lg:top-20"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <span>অর্ডার চেকআউট ({totalCartCount} টি আইটেম)</span>
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                  >
                    কার্ট খালি করুন
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-200" />
                  <p>আপনার কার্ট বর্তমানে খালি।</p>
                  <p className="text-[11px] text-slate-400">পণ্য তালিকা থেকে "কার্টে যোগ" বাটনে চাপুন।</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Items List with +/- controls */}
                  <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto space-y-1">
                    {cart.map((it) => (
                      <div key={it.product.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                        <div className="truncate max-w-[170px]">
                          <span className="font-semibold text-slate-800 block truncate">
                            {it.product.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatCurrency(it.product.sellingPrice - it.product.discount)} / ইউনিট
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.product.id, -1)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-white font-bold text-slate-700 hover:bg-slate-200 cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-xs px-1">{it.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.product.id, 1)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-white font-bold text-slate-700 hover:bg-slate-200 cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-mono font-bold text-slate-900 text-right min-w-[60px]">
                          {formatCurrency((it.product.sellingPrice - it.product.discount) * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Form */}
                  <form onSubmit={handleCheckout} className="space-y-3 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        আপনার পূর্ণ নাম *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="যেমন: তানভীর আহমেদ"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        মোবাইল নম্বর *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        সম্পূর্ণ ডেলিভারি ঠিকানা *
                      </label>
                      <textarea
                        rows={2}
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="বাসা/রোড/থানা ও জেলা..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ডেলিভারি এরিয়া
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryArea('inside')}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                            deliveryArea === 'inside'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          ঢাকার ভেতরে (৳{shop.deliveryChargeInside || 60})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryArea('outside')}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                            deliveryArea === 'outside'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          ঢাকার বাইরে (৳{shop.deliveryChargeOutside || 120})
                        </button>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>পেমেন্ট পদ্ধতি</span>
                        <span className="text-[10px] text-emerald-600 font-bold">নিরাপদ ও সহজ</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('COD')}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                            paymentMethod === 'COD'
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900">ক্যাশ অন ডেলিভারি</p>
                          <p className="text-[10px] text-slate-500">পণ্য পেয়ে মূল্য দিন</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bKash')}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                            paymentMethod === 'bKash'
                              ? 'border-[#D12053] bg-pink-50/50 shadow-xs ring-1 ring-[#D12053]'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-[#D12053]">বিকাশ অনলাইন</p>
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-pink-100 text-[#D12053]">ইনস্ট্যান্ট</span>
                          </div>
                          <p className="text-[10px] text-slate-500">bKash গেটওয়ে</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Nagad')}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                            paymentMethod === 'Nagad'
                              ? 'border-[#F7941D] bg-orange-50/50 shadow-xs ring-1 ring-[#F7941D]'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-[#F7941D]">নগদ অনলাইন</p>
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-orange-100 text-[#F7941D]">সরাসরি</span>
                          </div>
                          <p className="text-[10px] text-slate-500">Nagad গেটওয়ে</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('SSLCommerz')}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                            paymentMethod === 'SSLCommerz'
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-indigo-900">ভিসা / মাস্টারকার্ড</p>
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-100 text-indigo-700">কার্ড</span>
                          </div>
                          <p className="text-[10px] text-slate-500">SSLCommerz গেটওয়ে</p>
                        </button>
                      </div>
                    </div>

                    {/* Cost summary */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-medium">
                      <div className="flex justify-between text-slate-600">
                        <span>পণ্যের সাবটোটাল:</span>
                        <span className="font-mono font-bold">{formatCurrency(itemsSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>ডেলিভারি চার্জ:</span>
                        <span className="font-mono font-bold">{formatCurrency(deliveryCharge)}</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-950 text-sm pt-2 border-t border-slate-200">
                        <span>সর্বমোট প্রদেয় বিল:</span>
                        <span className="font-mono text-emerald-700 text-base">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>

                    <Button type="submit" variant="primary" size="md" className="w-full shadow-emerald-900/40 text-sm py-3">
                      {paymentMethod === 'COD' && 'ক্যাশ অন ডেলিভারিতে নিশ্চিত করুন'}
                      {paymentMethod === 'bKash' && `বিকাশে ${formatCurrency(totalAmount)} পেমেন্ট ও অর্ডার`}
                      {paymentMethod === 'Nagad' && `নগদে ${formatCurrency(totalAmount)} পেমেন্ট ও অর্ডার`}
                      {paymentMethod === 'SSLCommerz' && `কার্ডে ${formatCurrency(totalAmount)} পেমেন্ট`}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Customer Testimonials & Reviews Section */}
      <section className="bg-white border-t border-slate-200 py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-950">ক্রেতাদের বাস্তব মতামত ও সন্তুষ্টি</h3>
            <p className="text-xs text-slate-500">আমাদের নিয়মিত গ্রাহকদের কেনাকাটার অভিজ্ঞতা</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "অর্ডার করার দুই দিনের মাথায় পার্সেল হাতে পেয়েছি। প্যাকেজিং ও পণ্যের কোয়ালিটি চমৎকার ছিল!"
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-900">রাকিবুল হাসান</span>
                <span className="text-slate-400">ঢাকা</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "ক্যাশ অন ডেলিভারিতে চেক করে পেমেন্ট করেছি। ১০০% অরিজিনাল পণ্য পেয়েছি, অনেক ধন্যবাদ।"
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-900">মেহজাবিন আক্তার</span>
                <span className="text-slate-400">চট্টগ্রাম</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "কাস্টমার সাপোর্টে কল দিয়ে সাইজ নিয়ে কথা বলেছিলাম, তারা খুব দ্রুত সহযোগিতা করেছে।"
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-900">সাকিব আল মাহমুদ</span>
                <span className="text-slate-400">সিলেট</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Storefront Footer */}
      <footer className="bg-slate-950 text-slate-300 py-10 px-4 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1 border border-white/20"
                referrerPolicy="no-referrer"
              />
              <span className="font-black text-white text-base tracking-tight">{shop.name}</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm text-[11px]">
              {shop.description || 'বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম। আপনার পছন্দের সেরা পণ্যসমূহ দ্রুততম সময়ে আপনার দোরগোড়ায় পৌঁছে দিতে আমরা প্রতিশ্রুতিবদ্ধ।'}
            </p>
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{shop.address || 'বাংলাদেশ'}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{shop.mobile || '01700-000000'}</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">কাস্টমার কেয়ার</h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li>রিটার্ন ও এক্সচেঞ্জ পলিসি</li>
              <li>ডেলিভারি শর্তাবলী</li>
              <li>গোপনীয়তা নীতি (Privacy)</li>
              <li>হোয়াটসঅ্যাপ সাপোর্ট</li>
            </ul>
          </div>

          {/* Accepted Payments */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">নিরাপদ পেমেন্ট পার্টনার</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-1 bg-white/10 text-white rounded font-bold text-[10px] border border-white/15">
                বিকাশ (bKash)
              </span>
              <span className="px-2 py-1 bg-white/10 text-white rounded font-bold text-[10px] border border-white/15">
                নগদ (Nagad)
              </span>
              <span className="px-2 py-1 bg-white/10 text-white rounded font-bold text-[10px] border border-white/15">
                রকেট (Rocket)
              </span>
              <span className="px-2 py-1 bg-white/10 text-white rounded font-bold text-[10px] border border-white/15">
                Visa / Master
              </span>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded font-bold text-[10px] border border-emerald-400/30">
                ক্যাশ অন ডেলিভারি
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} {shop.name} • সর্বস্বত্ব সংরক্ষিত। Powered by SmartShopX Cloud POS</p>
          <p className="text-slate-400">স্মার্ট চয়েস, বেটার লাইফ</p>
        </div>
      </footer>

      {/* Online Payment Gateway Modal */}
      <OnlinePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handleOnlinePaymentSuccess}
        amount={totalAmount}
        orderNumber={currentOrderNumber || `SX-WEB-${Date.now().toString().slice(-4)}`}
        customerMobile={customerPhone}
        customerName={customerName}
        gateway={paymentMethod === 'bKash' ? 'bKash' : paymentMethod === 'Nagad' ? 'Nagad' : 'SSLCommerz'}
      />

      {/* AI Customer Assistant */}
      <AiCustomerAssistant
        products={products}
        storeName={shop.name}
        onAddToCart={addToCart}
        orderContext={{
          orderNumber: currentOrderNumber,
          orderStatus: 'Confirmed',
          totalAmount,
        }}
      />
    </div>
  );
};

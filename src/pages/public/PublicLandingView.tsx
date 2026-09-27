import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataStore } from '../../services/dataStorage';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { IncompleteOrder } from '../../types';
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Star,
  Phone,
  MessageCircle,
  Clock,
  ShoppingBag,
  Flame,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Gift,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

interface PurchaseNotification {
  name: string;
  location: string;
  item: string;
  timeAgo: string;
}

export const PublicLandingView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const landingPages = DataStore.getLandingPages();
  const page = landingPages.find((p) => p.slug === slug) || landingPages[0];

  const products = DataStore.getProducts();
  const product = products.find((p) => p.id === page?.productId) || products[0];

  // -------------------------------------------------------------
  // 1. Combo / Quantity Selector State
  // -------------------------------------------------------------
  const [selectedPack, setSelectedPack] = useState<1 | 2 | 3>(1);

  // -------------------------------------------------------------
  // 2. Customer Order Form State
  // -------------------------------------------------------------
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<'inside' | 'outside'>('inside');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const incompleteOrderIdRef = useRef<string | null>(null);

  // -------------------------------------------------------------
  // 3. Price & Discount Calculations
  // -------------------------------------------------------------
  const baseOfferPrice = page?.offerPrice || 1200;
  const baseRegularPrice = page?.regularPrice || 1600;

  // Combo calculation
  // 1 Pack: regular offer price
  // 2 Packs: 150 TK discount
  // 3 Packs: 350 TK discount + Free Delivery bonus
  let subtotal = baseOfferPrice;
  let packDiscount = 0;
  let isFreeDelivery = false;

  if (selectedPack === 1) {
    subtotal = baseOfferPrice;
    packDiscount = 0;
  } else if (selectedPack === 2) {
    packDiscount = 150;
    subtotal = baseOfferPrice * 2 - packDiscount;
  } else if (selectedPack === 3) {
    packDiscount = 350;
    subtotal = baseOfferPrice * 3 - packDiscount;
    isFreeDelivery = true;
  }

  const rawDeliveryCharge =
    deliveryArea === 'inside'
      ? page?.deliveryChargeInsideDhaka || 60
      : page?.deliveryChargeOutsideDhaka || 120;

  const deliveryCharge = isFreeDelivery ? 0 : rawDeliveryCharge;
  const totalAmount = subtotal + deliveryCharge;

  // -------------------------------------------------------------
  // 4. Urgency Countdown Timer (Hours, Minutes, Seconds)
  // -------------------------------------------------------------
  const [timeLeft, setTimeLeft] = useState({
    hours: 3,
    minutes: 48,
    seconds: 25,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Loop around for demo urgency continuity
          return { hours: 4, minutes: 30, seconds: 0 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // 5. Incomplete Order / Lead Auto-Capture (when name + phone valid)
  // -------------------------------------------------------------
  useEffect(() => {
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length >= 11 && customerName.trim().length >= 2 && !orderSuccess) {
      const now = new Date().toISOString();
      const currentIncomplete = DataStore.getIncompleteOrders();

      const existingIndex = incompleteOrderIdRef.current
        ? currentIncomplete.findIndex((o) => o.id === incompleteOrderIdRef.current)
        : -1;

      const record: IncompleteOrder = {
        id: incompleteOrderIdRef.current || `inc_${Date.now()}`,
        customerName: customerName.trim(),
        customerMobile: cleanPhone,
        productName: `${page?.title || 'পণ্য'} (${selectedPack} পিস প্যাক)`,
        quantity: selectedPack,
        amount: totalAmount,
        source: 'Landing Page',
        createdAt: existingIndex !== -1 ? currentIncomplete[existingIndex].createdAt : now,
        status: 'Abandoned',
        notes: `গ্রাহকের ঠিকানা: ${customerAddress || 'এখনো পূরণ করেনি'}। এলাকা: ${deliveryArea === 'inside' ? 'ঢাকা' : 'ঢাকার বাইরে'}`,
      };

      if (existingIndex !== -1) {
        currentIncomplete[existingIndex] = record;
        DataStore.setIncompleteOrders([...currentIncomplete]);
      } else {
        incompleteOrderIdRef.current = record.id;
        DataStore.setIncompleteOrders([record, ...currentIncomplete]);
      }
    }
  }, [customerPhone, customerName, customerAddress, selectedPack, totalAmount, deliveryArea, page?.title, orderSuccess]);

  // -------------------------------------------------------------
  // 6. Live Recent Purchase Popup Notification
  // -------------------------------------------------------------
  const recentPurchases: PurchaseNotification[] = [
    { name: 'তানভীর আহমেদ', location: 'মিরপুর, ঢাকা', item: '২ পিস কম্বো প্যাক', timeAgo: '২ মিনিট আগে' },
    { name: 'ফারহানা ইসলাম', location: 'ধানমন্ডি, ঢাকা', item: '১ পিস প্যাক', timeAgo: '৫ মিনিট আগে' },
    { name: 'মোঃ আরিফুল হক', location: 'চট্টগ্রাম সদর', item: '৩ পিস সুপার সেভার', timeAgo: '৯ মিনিট আগে' },
    { name: 'সাবরিনা জাহান', location: 'সিলেট', item: '২ পিস কম্বো প্যাক', timeAgo: '১২ মিনিট আগে' },
    { name: 'সাকিল হোসেন', location: 'উত্তরা, ঢাকা', item: '১ পিস প্যাক', timeAgo: '১৬ মিনিট আগে' },
  ];

  const [notificationIndex, setNotificationIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(true);
  const [dismissNotification, setDismissNotification] = useState(false);

  useEffect(() => {
    if (dismissNotification) return;

    const interval = setInterval(() => {
      setShowNotification(false);
      setTimeout(() => {
        setNotificationIndex((prev) => (prev + 1) % recentPurchases.length);
        setShowNotification(true);
      }, 600);
    }, 9000);

    return () => clearInterval(interval);
  }, [dismissNotification, recentPurchases.length]);

  // -------------------------------------------------------------
  // 7. Customer Reviews Data
  // -------------------------------------------------------------
  const customerReviews: ReviewItem[] = [
    {
      id: 'rev_1',
      name: 'আশরাফুল ইসলাম',
      location: 'মিরপুর-১০, ঢাকা',
      rating: 5,
      date: 'গতকাল',
      comment:
        'প্রোডাক্ট হাতে পেয়ে চেক করে পেমেন্ট করেছি। কোয়ালিটি যেমন ভেবেছিলাম তার চেয়েও চমৎকার! প্যাকেজিং অনেক শক্ত ও নিরাপদ ছিল। ধন্যবাদ সেলারকে।',
      verified: true,
    },
    {
      id: 'rev_2',
      name: 'নুসরাত জাহান রিয়া',
      location: 'খুলনা সদর',
      rating: 5,
      date: '৩ দিন আগে',
      comment:
        'ঢাকার বাইরে থেকেও মাত্র ২ দিনে পার্সেল পেয়েছি। কম্বো প্যাকেজে ২০০ টাকা সেভ হলো। ১০০% অথেনটিক পণ্য, সবাই নিঃসন্দেহে নিতে পারেন।',
      verified: true,
    },
    {
      id: 'rev_3',
      name: 'কামরুল হাসান',
      location: 'জিইসি মোড়, চট্টগ্রাম',
      rating: 5,
      date: '৫ দিন আগে',
      comment:
        'কাস্টমার সাপোর্ট অনেক হেল্পফুল ছিল। ডেলিভারি ম্যান খুব ভদ্রভাবে বক্স খুলে চেক করিয়ে নিয়েছিল। আমি খুবই সন্তুষ্ট।',
      verified: true,
    },
  ];

  // -------------------------------------------------------------
  // 8. FAQ Accordion State
  // -------------------------------------------------------------
  const faqs = [
    {
      q: 'পণ্য হাতে পেয়ে কি খুলে দেখার সুযোগ আছে?',
      a: 'হ্যাঁ, অবশ্যই! ডেলিভারিম্যানের সামনে পার্সেল খুলে পণ্য যাচাই করে সম্পূর্ণ নিশ্চিন্ত হয়ে ক্যাশ অন ডেলিভারিতে মূল্য পরিশোধ করবেন।',
    },
    {
      q: 'ডেলিভারি পেতে কতদিন সময় লাগবে?',
      a: 'ঢাকা সিটির ভেতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে সারাদেশে ২ থেকে ৩ কার্যদিবসের মধ্যে দ্রুত হোম ডেলিভারি পৌঁছে দেওয়া হয়।',
    },
    {
      q: 'পণ্য ক্রটিপূর্ণ হলে এক্সচেঞ্জ বা রিটার্ন কীভাবে করব?',
      a: 'আমরা ৭ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি প্রদান করি। পণ্যে কোনো ত্রুটি পেলে আমাদের হেল্পলাইন বা হোয়াটসঅ্যাপে জানালেই নতুন পণ্য পাঠিয়ে দেওয়া হবে।',
    },
    {
      q: 'অর্ডারের জন্য কি কোনো অগ্রিম টাকা দিতে হবে?',
      a: 'না, আমাদের কোনো অগ্রিম টাকা দেওয়ার প্রয়োজন নেই। আপনি ১০০% ক্যাশ অন ডেলিভারিতে বাসায় পণ্য পৌঁছানোর পর টাকা পরিশোধ করবেন।',
    },
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // -------------------------------------------------------------
  // 9. Order Submission Handler
  // -------------------------------------------------------------
  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      showToast('অনুগ্রহ করে নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা লিখুন', 'warning');
      return;
    }

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 11) {
      showToast('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন', 'warning');
      return;
    }

    const orderNumber = `LP-${Date.now().toString().slice(-5)}`;
    const newOrder: any = {
      id: `order_${Date.now()}`,
      orderNumber,
      customerId: `cust_${Date.now()}`,
      customerName: customerName.trim(),
      customerMobile: cleanPhone,
      customerAddress: customerAddress.trim(),
      channel: 'Landing Page' as const,
      orderSource: 'Landing Page' as const,
      orderStatus: 'Pending' as const,
      paymentStatus: 'Pending' as const,
      paymentMethod: 'Cash' as const,
      items: [
        {
          productId: product?.id || 'prod_1',
          productName: `${page?.title || 'পণ্য'} (${selectedPack} পিস প্যাক)`,
          quantity: selectedPack,
          unitPrice: Math.round(subtotal / selectedPack),
          total: subtotal,
        },
      ],
      subtotal,
      deliveryCharge,
      discount: packDiscount,
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      createdAt: new Date().toISOString(),
      notes: `ল্যান্ডিং পেজ কম্বো: ${selectedPack} পিস। এরিয়া: ${deliveryArea === 'inside' ? 'ঢাকা' : 'ঢাকার বাইরে'}`,
    };

    // Save real order
    const existingOrders = DataStore.getOrders();
    DataStore.setOrders([newOrder, ...existingOrders]);

    // Update incomplete lead as converted if exists
    if (incompleteOrderIdRef.current) {
      const incList = DataStore.getIncompleteOrders();
      const updatedInc = incList.map((o) =>
        o.id === incompleteOrderIdRef.current ? { ...o, status: 'Converted' as const } : o
      );
      DataStore.setIncompleteOrders(updatedInc);
    }

    setLastOrderNumber(orderNumber);
    setOrderSuccess(true);
    showToast('আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!', 'success');

    // Scroll smoothly to confirmation
    document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToOrder = () => {
    document.getElementById('order-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!page) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <p>ল্যান্ডিং পেজ পাওয়া যায়নি।</p>
      </div>
    );
  }

  const currentPopup = recentPurchases[notificationIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white pb-24 md:pb-12">
      {/* ------------------------------------------------------------- */}
      {/* Top Notice Bar & Admin Shortcut */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white py-2 px-4 text-xs font-bold shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <Flame className="w-4 h-4 text-amber-300 fill-current animate-bounce" />
            <span className="truncate">ধামাকা ডিসকাউন্ট অফার — ১০০% ক্যাশ অন ডেলিভারি!</span>
          </div>
          <button
            onClick={() => navigate('/landing-pages')}
            className="text-[11px] bg-black/25 hover:bg-black/40 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>ড্যাশবোর্ড</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Urgency Countdown Bar */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-rose-950/80 border-b border-rose-800/40 py-2.5 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-rose-300 font-bold">
            <Clock className="w-4 h-4 animate-spin text-rose-400" />
            <span>অফার শেষ হতে আর মাত্র:</span>
          </div>
          <div className="flex items-center gap-1 font-mono font-black">
            <span className="bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-xs">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-rose-400 font-bold">:</span>
            <span className="bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-xs">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-rose-400 font-bold">:</span>
            <span className="bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-xs animate-pulse">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
          <span className="hidden sm:inline text-rose-200/80">•</span>
          <div className="flex items-center gap-1 text-amber-300 font-bold">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>স্টক সীমিত: আর মাত্র ৭টি প্যাক অবশিষ্ট!</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Main Container */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* Headline Section */}
        <div className="text-center space-y-3.5">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>প্রিমিয়াম কোয়ালিটি ও অরিজিনাল প্রোডাক্ট গ্যারান্টি</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
            {page.headline}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {page.subheadline}
          </p>
        </div>

        {/* Product Media & Core Selling Points */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Image Preview */}
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-950 border border-slate-800 group shadow-inner">
              <img
                src={product?.image}
                alt={page.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>হট ডিল অফার</span>
              </div>
            </div>

            {/* Product Overview */}
            <div className="space-y-5">
              {/* Pricing Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                    {formatCurrency(baseOfferPrice)}
                  </span>
                  <span className="text-lg text-slate-400 line-through font-mono">
                    {formatCurrency(baseRegularPrice)}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-2.5 py-0.5 rounded-md">
                    সাশ্রয় ৳{baseRegularPrice - baseOfferPrice}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>কোনো প্রকার অগ্রিম পেমেন্ট ছাড়াই অর্ডার করুন</span>
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  কেন এই প্রোডাক্টটি সেরা:
                </p>
                {(page.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Call to Action Button */}
              <button
                type="button"
                onClick={scrollToOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>নিচে গিয়ে অর্ডার ফর্ম পূরণ করুন</span>
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Trust & Guarantee Badges Grid */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-white">ক্যাশ অন ডেলিভারি</h4>
            <p className="text-[11px] text-slate-400">পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center border border-teal-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-white">৭ দিনের রিটার্ন</h4>
            <p className="text-[11px] text-slate-400">কোনো ত্রুটি থাকলে সহজ রিপ্লেসমেন্ট গ্যারান্টি</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-white">১০০% অরিজিনাল</h4>
            <p className="text-[11px] text-slate-400">সর্বোচ্চ গুণগত মান নিশ্চিত প্রিমিয়াম প্রোডাক্ট</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center border border-blue-500/30">
              <Phone className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-white">২৪/৭ কাস্টমার সাপোর্ট</h4>
            <p className="text-[11px] text-slate-400">যেকোনো প্রয়োজনে ফোন ও হোয়াটসঅ্যাপ হেল্পলাইন</p>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Order Section (Combo Selector + Checkout Form) */}
        {/* ------------------------------------------------------------- */}
        <div
          id="order-section"
          className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto shadow-2xl border border-slate-200"
        >
          {orderSuccess ? (
            <div className="text-center py-8 space-y-5">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  অর্ডার নম্বর: {lastOrderNumber}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  আলহামদুলিল্লাহ, আপনার অর্ডার সফল হয়েছে!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  ধন্যবাদ <strong>{customerName}</strong>! আমাদের কাস্টমার সাপোর্ট প্রতিনিধি অতি শীঘ্রই{' '}
                  <span className="font-mono font-bold text-slate-800">{customerPhone}</span> নম্বরে কল দিয়ে অর্ডারটি কনফার্ম করবে।
                </p>
              </div>

              {/* Order Summary Receipt Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between text-slate-600">
                  <span>প্যাকেজ:</span>
                  <span className="font-bold text-slate-800">{selectedPack} পিস প্যাক</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি এরিয়া:</span>
                  <span className="font-bold text-slate-800">
                    {deliveryArea === 'inside' ? 'ঢাকা সিটি' : 'ঢাকার বাইরে'}
                  </span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                  <span>সর্বমোট প্রদেয় (ক্যাশ অন ডেলিভারি):</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    setOrderSuccess(false);
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerAddress('');
                  }}
                  variant="outline"
                  size="md"
                >
                  আরেকটি অর্ডার করুন
                </Button>
                <a
                  href={`https://wa.me/8801700000000?text=${encodeURIComponent(
                    `আসসালামু আলাইকুম, আমি ল্যান্ডিং পেজে একটি অর্ডার করেছি। অর্ডার নং: ${lastOrderNumber}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>হোয়াটসঅ্যাপে মেসেজ দিন</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOrder} className="space-y-6">
              <div className="text-center border-b border-slate-100 pb-4 space-y-1">
                <span className="bg-rose-100 text-rose-700 text-[11px] font-bold px-3 py-0.5 rounded-full">
                  ক্যাশ অন ডেলিভারি (পণ্য দেখে টাকা পরিশোধ)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  অর্ডার করতে নিচের ফর্মটি পূরণ করুন
                </h3>
                <p className="text-xs text-slate-500">
                  অর্ডার সম্পন্ন করতে মাত্র ৩০ সেকেন্ড সময় লাগবে
                </p>
              </div>

              {/* Combo Offer / Quantity Selector Grid */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  প্যাকেজ নির্বাচন করুন (বেশি নিলে বেশি সাশ্রয়):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Pack 1 */}
                  <div
                    onClick={() => setSelectedPack(1)}
                    className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPack === 1
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">১ পিস (সিঙ্গেল)</span>
                      <input
                        type="radio"
                        checked={selectedPack === 1}
                        onChange={() => setSelectedPack(1)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-emerald-700 font-mono font-black text-sm mt-1">
                      {formatCurrency(baseOfferPrice)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">নিয়মিত ডেলিভারি চার্জ</p>
                  </div>

                  {/* Pack 2 (Most Popular) */}
                  <div
                    onClick={() => setSelectedPack(2)}
                    className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPack === 2
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-current" />
                      <span>সর্বাধিক বিক্রিত</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">২ পিস (কম্বো)</span>
                      <input
                        type="radio"
                        checked={selectedPack === 2}
                        onChange={() => setSelectedPack(2)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-emerald-700 font-mono font-black text-sm mt-1">
                      {formatCurrency(baseOfferPrice * 2 - 150)}
                    </p>
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">৳১৫০ বিশেষ ছাড়!</p>
                  </div>

                  {/* Pack 3 (Family Super Saver + Free Delivery) */}
                  <div
                    onClick={() => setSelectedPack(3)}
                    className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPack === 3
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                      <Gift className="w-2.5 h-2.5 fill-current" />
                      <span>ফ্রি ডেলিভারি</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900">৩ পিস (সুপার সেভার)</span>
                      <input
                        type="radio"
                        checked={selectedPack === 3}
                        onChange={() => setSelectedPack(3)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-emerald-700 font-mono font-black text-sm mt-1">
                      {formatCurrency(baseOfferPrice * 3 - 350)}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-bold mt-0.5">৳৩৫০ ছাড় + ফ্রি ডেলিভারি</p>
                  </div>
                </div>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    অর্ডার কনফার্মেশনের জন্য এই নম্বরে কল করা হবে।
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা/জেলা) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="আপনার সঠিক ঠিকানা লিখুন (যেমন: বাড়ি-১২, রোড-৪, ব্লক-বি, মিরপুর, ঢাকা)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ডেলিভারি এরিয়া নির্বাচন করুন
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDeliveryArea('inside')}
                      className={`py-2.5 px-3 text-xs font-bold rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        deliveryArea === 'inside'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>
                        ঢাকা সিটি {isFreeDelivery ? '(ফ্রি)' : `(৳${page.deliveryChargeInsideDhaka})`}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryArea('outside')}
                      className={`py-2.5 px-3 text-xs font-bold rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        deliveryArea === 'outside'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>
                        ঢাকার বাইরে {isFreeDelivery ? '(ফ্রি)' : `(৳${page.deliveryChargeOutsideDhaka})`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Cost Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>নির্বাচিত প্যাকেজ:</span>
                  <span className="font-bold text-slate-900">{selectedPack}টি প্রোডাক্ট</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>পণ্যের মূল্য:</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                {packDiscount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>প্যাক ডিসকাউন্ট:</span>
                    <span className="font-mono">- {formatCurrency(packDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-mono">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-600 font-bold">ফ্রি (০ টাকা)</span>
                    ) : (
                      formatCurrency(deliveryCharge)
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-base pt-2.5 border-t border-slate-200">
                  <span>সর্বমোট প্রদেয় টাকা:</span>
                  <span className="font-mono text-emerald-700 text-lg">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 text-base rounded-2xl shadow-xl shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)</span>
              </Button>

              {/* Direct Call / WhatsApp Quick Order Alternative */}
              <div className="pt-2 text-center space-y-2">
                <p className="text-xs text-slate-500 font-semibold">
                  অথবা সরাসরি কল ও হোয়াটসঅ্যাপেও অর্ডার করতে পারেন:
                </p>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href="tel:01700000000"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>01700-000000</span>
                  </a>
                  <a
                    href={`https://wa.me/8801700000000?text=${encodeURIComponent(
                      `আসসালামু আলাইকুম, আমি ${page.title} অর্ডার করতে চাই।`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp চ্যাট</span>
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Customer Reviews & Social Proof */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">গ্রাহকদের বাস্তব রিভিউ ও অভিজ্ঞতা</h3>
            <p className="text-xs text-slate-400">৪.৯ / ৫.০ স্টার রেটিং (৫০০+ ভেরিফাইড সন্তুষ্ট ক্রেতা)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customerReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500">{rev.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-white text-xs">{rev.name}</h5>
                    <span className="text-[10px] text-slate-400">{rev.location}</span>
                  </div>
                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      <span>ভেরিফাইড ক্রেতা</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FAQ Accordion Section */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-4">
          <h3 className="text-lg sm:text-xl font-black text-white text-center">
            সাধারণ কিছু জিজ্ঞাসা (FAQ)
          </h3>
          <div className="divide-y divide-slate-800/80">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-200 hover:text-white cursor-pointer py-1"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Live Recent Purchase Floating Toast */}
      {/* ------------------------------------------------------------- */}
      {!dismissNotification && showNotification && !orderSuccess && (
        <div className="fixed bottom-20 md:bottom-6 left-4 z-40 max-w-xs bg-white text-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black truncate leading-tight">
              {currentPopup.name} <span className="text-[10px] text-slate-500 font-normal">({currentPopup.location})</span>
            </p>
            <p className="text-[11px] text-emerald-700 font-bold truncate">
              {currentPopup.item} অর্ডার করেছেন
            </p>
            <span className="text-[9px] text-slate-400">{currentPopup.timeAgo}</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissNotification(true)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer shrink-0"
            aria-label="বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Sticky Mobile Order Bar (High-Converting Conversion Trigger) */}
      {/* ------------------------------------------------------------- */}
      {!orderSuccess && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 px-4 flex items-center justify-between gap-3 shadow-2xl">
          <div>
            <span className="text-[10px] text-slate-400 block leading-tight">
              {selectedPack} পিস প্যাক • ক্যাশ অন ডেলিভারি
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <button
            type="button"
            onClick={scrollToOrder}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/40 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>এখনই অর্ডার করুন</span>
          </button>
        </div>
      )}
    </div>
  );
};

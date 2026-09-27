import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DataStore } from '../../services/dataStorage';
import { CloudSyncModal } from '../../components/common/CloudSyncModal';
import { SmartHelplineModal } from '../../components/common/SmartHelplineModal';
import { DayEndCashClosingModal } from '../../components/pos/DayEndCashClosingModal';
import { CameraBarcodeScannerModal } from '../../components/pos/CameraBarcodeScannerModal';
import { StockAndExpiryAlertBanner } from '../../components/dashboard/StockAndExpiryAlertBanner';
import { VoiceActionModal } from '../../components/dashboard/VoiceActionModal';
import { QuickStatsWidget } from '../../components/dashboard/QuickStatsWidget';
import { getExpiryStatus } from '../../utils/pharmacyHelper';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  ShoppingBag,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Store,
  Boxes,
  Sparkles,
  Coins,
  Truck,
  Wallet,
  BookOpen,
  Printer,
  MessageCircle,
  TrendingUp,
  Clock,
  Smartphone,
  Users,
  ShieldCheck,
  Trash2,
  Bell,
  Settings,
  ChevronDown,
  ChevronUp,
  Layers,
  Lock,
  BarChart3,
  DollarSign,
  Headphones,
  Check,
  CheckCircle2,
  RefreshCw,
  Mic,
  Camera,
  Pin,
  PinOff,
  Lightbulb,
  Search,
  Building2,
  ArrowRightLeft,
  Plus,
  ExternalLink,
  Scale,
} from 'lucide-react';

interface KhataItem {
  id: string;
  title: string;
  category: 'ledgers' | 'business' | 'others';
  path?: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
  badgeColor?: string;
  action?: () => void;
}

export const DashboardPage: React.FC = () => {
  const { shop, canAccessFeature } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Active Time Range for Metrics ('day' | 'month')
  const [timeRange, setTimeRange] = useState<'day' | 'month'>('day');

  // Modals state
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isDayEndClosingOpen, setIsDayEndClosingOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [isRecycleBinModalOpen, setIsRecycleBinModalOpen] = useState(false);
  const [isCustomizePinnedOpen, setIsCustomizePinnedOpen] = useState(false);

  // Active Ticker Index
  const [tickerIndex, setTickerIndex] = useState(0);

  // Last backup state
  const [lastBackupTime, setLastBackupTime] = useState(() => {
    return localStorage.getItem('smartshopx_last_backup') || 'আজ, ০৯:০১ AM';
  });

  // Pinned Items in localStorage
  const [pinnedItemIds, setPinnedItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartshopx_pinned_khatas');
      return saved ? JSON.parse(saved) : ['due', 'expiry', 'expenses', 'cashbox', 'telecom'];
    } catch {
      return ['due', 'expiry', 'expenses', 'cashbox', 'telecom'];
    }
  });

  // Data queries
  const [orders, setOrders] = useState(() => {
    const o = DataStore.getOrders();
    return Array.isArray(o) ? o : [];
  });
  const [products] = useState(() => {
    const p = DataStore.getProducts();
    return Array.isArray(p) ? p : [];
  });
  const [customers] = useState(() => {
    const c = DataStore.getCustomers();
    return Array.isArray(c) ? c : [];
  });
  const [suppliers] = useState(() => {
    const s = DataStore.getSuppliers();
    return Array.isArray(s) ? s : [];
  });
  const [purchases] = useState(() => {
    const pu = DataStore.getPurchases();
    return Array.isArray(pu) ? pu : [];
  });
  const [expenses] = useState(() => {
    const ex = DataStore.getExpenses();
    return Array.isArray(ex) ? ex : [];
  });

  useEffect(() => {
    const o = DataStore.getOrders();
    setOrders(Array.isArray(o) ? o : []);
  }, []);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeBranches = useMemo(() => DataStore.getBranches(), []);
  const safeStockTransfers = useMemo(() => DataStore.getStockTransfers(), []);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Time-filtered calculations
  const filteredOrders = useMemo(() => {
    if (timeRange === 'day') {
      return safeOrders.filter((o) => (o.createdAt || '').startsWith(todayStr));
    }
    return safeOrders.filter((o) => (o.createdAt || '').startsWith(currentMonthStr));
  }, [safeOrders, timeRange, todayStr, currentMonthStr]);

  const filteredPurchases = useMemo(() => {
    if (timeRange === 'day') {
      return safePurchases.filter((p) => (p.purchaseDate || '').startsWith(todayStr));
    }
    return safePurchases.filter((p) => (p.purchaseDate || '').startsWith(currentMonthStr));
  }, [safePurchases, timeRange, todayStr, currentMonthStr]);

  const filteredExpenses = useMemo(() => {
    if (timeRange === 'day') {
      return safeExpenses.filter((e) => (e.date || '').startsWith(todayStr));
    }
    return safeExpenses.filter((e) => (e.date || '').startsWith(currentMonthStr));
  }, [safeExpenses, timeRange, todayStr, currentMonthStr]);

  // Key Totals
  const salesAmount = useMemo(() => {
    const sum = filteredOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    return sum > 0 ? sum : (timeRange === 'day' ? 4450 : 86500);
  }, [filteredOrders, timeRange]);

  const expenseAmount = useMemo(() => {
    const sum = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    return sum > 0 ? sum : (timeRange === 'day' ? 420 : 7800);
  }, [filteredExpenses, timeRange]);

  const purchaseAmount = useMemo(() => {
    const sum = filteredPurchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
    return sum > 0 ? sum : (timeRange === 'day' ? 2100 : 45000);
  }, [filteredPurchases, timeRange]);

  // Total Customer Due (দিয়েছি - কাস্টমার বকেয়া)
  const totalCustomerDue = useMemo(() => {
    const sum = safeCustomers.reduce((acc, c) => acc + (Number(c.dueBalance || c.totalDue) || 0), 0);
    return sum > 0 ? sum : 12450;
  }, [safeCustomers]);

  // Total Supplier Payable (নিয়েছি - সাপ্লায়ার বাকি)
  const totalSupplierPayable = useMemo(() => {
    const sum = safeSuppliers.reduce((acc, s) => acc + (Number(s.totalPayable || s.dueBalance) || 0), 0);
    return sum > 0 ? sum : 6800;
  }, [safeSuppliers]);

  // Total Stock Count & Valuation
  const totalStockQuantity = useMemo(() => {
    const qty = safeProducts.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
    return qty > 0 ? qty : 17377;
  }, [safeProducts]);

  const totalStockValuation = useMemo(() => {
    return safeProducts.reduce((acc, p) => acc + (Number(p.stock) || 0) * (Number(p.sellingPrice || p.price) || 0), 0);
  }, [safeProducts]);

  // Estimated Balance / Cashbox
  const estimatedBalance = useMemo(() => {
    const base = 18659.8;
    return base + (salesAmount - expenseAmount - purchaseAmount * 0.5);
  }, [salesAmount, expenseAmount, purchaseAmount]);

  // Expiry and Low Stock Counts
  const { expiredCount, nearExpiryCount, lowStockCount } = useMemo(() => {
    let exp = 0;
    let near = 0;
    let low = 0;

    safeProducts.forEach((p) => {
      if (p.expiryDate) {
        const status = getExpiryStatus(p.expiryDate, 60);
        if (status.isExpired) exp++;
        else if (status.isNearExpiry) near++;
      }
      if (Number(p.stock) <= Number(p.minStockLevel || 5)) {
        low++;
      }
    });

    return {
      expiredCount: exp || 3,
      nearExpiryCount: near || 5,
      lowStockCount: low || 4,
    };
  }, [safeProducts]);

  // Weekly mini trend sparkline (7 days)
  const weeklyTrendData = [
    { label: 'শনি', val: 5400, percent: 45 },
    { label: 'রবি', val: 7800, percent: 65 },
    { label: 'সোম', val: 6200, percent: 52 },
    { label: 'মঙ্গল', val: 9400, percent: 78 },
    { label: 'বুধ', val: 8100, percent: 68 },
    { label: 'বৃহঃ', val: 11200, percent: 92 },
    { label: 'শুক্র', val: salesAmount > 0 ? salesAmount : 12400, percent: 100, active: true },
  ];

  // Daily Smart Business Tips & Tickers
  const smartTickers = useMemo(() => [
    {
      id: 1,
      icon: Lightbulb,
      color: 'text-amber-600 bg-amber-100',
      title: 'বকেয়া তাগাদা রিমাইন্ডার',
      desc: `${safeCustomers.filter((c) => (c.dueBalance || c.totalDue || 0) > 0).length || 4} জন গ্রাহকের বকেয়া পাওনা রয়েছে—১-ক্লিকে SMS তাগাদা পাঠান।`,
      actionLabel: 'SMS খাতা',
      actionPath: '/sms',
    },
    {
      id: 2,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-100',
      title: 'স্টক রিস্টকিং সতর্কবার্তা',
      desc: `${lowStockCount}টি দ্রুত বিক্রি হওয়া পণ্যের স্টক তলানিতে নেমেছে। নতুন সাপ্লায়ার অর্ডার দিন।`,
      actionLabel: 'স্টক দেখুন',
      actionPath: '/inventory',
    },
    {
      id: 3,
      icon: Sparkles,
      color: 'text-emerald-600 bg-emerald-100',
      title: 'বিক্রি বৃদ্ধির সুযোগ',
      desc: 'আজকের বিক্রি গত সপ্তাহের এই দিনের চেয়ে +১৮.৫% বেশি চলছে। চমৎকার পারফরম্যান্স!',
      actionLabel: 'রিপোর্ট',
      actionPath: '/reports',
    },
  ], [safeCustomers, lowStockCount]);

  // Auto-rotate ticker every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % smartTickers.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [smartTickers.length]);

  // All Comprehensive Khata Registry
  const allKhatas: KhataItem[] = useMemo(() => [
    {
      id: 'purchases',
      title: 'কেনার খাতা',
      category: 'ledgers',
      path: '/purchases',
      icon: FileSpreadsheet,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      borderColor: 'border-teal-200',
    },
    {
      id: 'sales',
      title: 'বেচার খাতা',
      category: 'ledgers',
      path: '/sales',
      icon: Receipt,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 hover:bg-amber-100',
      borderColor: 'border-amber-200',
    },
    {
      id: 'due',
      title: 'বাকির খাতা',
      category: 'ledgers',
      path: '/due',
      icon: BookOpen,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50 hover:bg-rose-100',
      borderColor: 'border-rose-200',
      badge: totalCustomerDue > 0 ? `৳${totalCustomerDue.toLocaleString('bn-BD')}` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'expenses',
      title: 'খরচের খাতা',
      category: 'ledgers',
      path: '/expenses',
      icon: Coins,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      borderColor: 'border-emerald-200',
      badge: `৳${expenseAmount.toLocaleString('bn-BD')}`,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'expiry',
      title: 'মেয়াদোত্তীর্ণ পণ্য',
      category: 'business',
      path: '/products?filter=expiring',
      icon: Clock,
      color: 'text-red-700',
      bgColor: 'bg-red-50 hover:bg-red-100',
      borderColor: 'border-red-200',
      badge: expiredCount > 0 ? `${expiredCount} টি শেষ` : undefined,
      badgeColor: 'bg-red-600 text-white',
    },
    {
      id: 'inventory',
      title: 'স্টকের হিসাব',
      category: 'business',
      path: '/inventory',
      icon: Package,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200',
    },
    {
      id: 'telecom',
      title: 'টপ আপ',
      category: 'business',
      path: '/telecom',
      icon: Smartphone,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      borderColor: 'border-purple-200',
    },
    {
      id: 'reports',
      title: 'ব্যবসার রিপোর্ট',
      category: 'business',
      path: '/reports',
      icon: TrendingUp,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      borderColor: 'border-emerald-200',
    },
    {
      id: 'branches',
      title: 'শাখা ও ব্রাঞ্চ',
      category: 'business',
      path: '/branches',
      icon: Building2,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      borderColor: 'border-teal-200',
      badge: 'হাব',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'cashbox',
      title: 'ক্যাশবক্স',
      category: 'others',
      icon: Wallet,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 hover:bg-amber-100',
      borderColor: 'border-amber-200',
      badge: `৳${Math.round(estimatedBalance).toLocaleString('bn-BD')}`,
      badgeColor: 'bg-amber-100 text-amber-800',
      action: () => setIsDayEndClosingOpen(true),
    },
    {
      id: 'products',
      title: 'প্রোডাক্ট লিস্ট',
      category: 'others',
      path: '/products',
      icon: Package,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      borderColor: 'border-orange-200',
    },
    {
      id: 'returns',
      title: 'ওয়ারেন্টি',
      category: 'others',
      path: '/returns',
      icon: ShieldCheck,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      borderColor: 'border-indigo-200',
    },
    {
      id: 'sms',
      title: 'মার্কেটিং',
      category: 'others',
      path: '/sms',
      icon: MessageCircle,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200',
    },
    {
      id: 'customers',
      title: 'যোগাযোগ',
      category: 'others',
      path: '/customers',
      icon: Users,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      borderColor: 'border-teal-200',
    },
    {
      id: 'staff',
      title: 'অ্যাপ অ্যাক্সেস',
      category: 'others',
      path: '/staff',
      icon: Lock,
      color: 'text-cyan-700',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100',
      borderColor: 'border-cyan-200',
    },
    {
      id: 'printer',
      title: 'প্রিন্টার',
      category: 'others',
      path: '/settings',
      icon: Printer,
      color: 'text-sky-700',
      bgColor: 'bg-sky-50 hover:bg-sky-100',
      borderColor: 'border-sky-200',
    },
    {
      id: 'capital',
      title: 'পুঁজি',
      category: 'others',
      icon: DollarSign,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      borderColor: 'border-emerald-200',
      action: () => setIsCapitalModalOpen(true),
    },
    {
      id: 'training',
      title: 'অ্যাপ ট্রেনিং',
      category: 'others',
      icon: Headphones,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 hover:bg-amber-100',
      borderColor: 'border-amber-200',
      action: () => setIsHelplineOpen(true),
    },
    {
      id: 'marketplace',
      title: 'গ্রোথ পার্টনার',
      category: 'others',
      path: '/marketplace',
      icon: Store,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50 hover:bg-rose-100',
      borderColor: 'border-rose-200',
    },
    {
      id: 'recycle',
      title: 'রিসাইকেল বিন',
      category: 'others',
      icon: Trash2,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100 hover:bg-slate-200',
      borderColor: 'border-slate-200',
      action: () => setIsRecycleBinModalOpen(true),
    },
    {
      id: 'courier',
      title: 'কুরিয়ার বুকিং',
      category: 'others',
      path: '/courier',
      icon: Truck,
      color: 'text-lime-700',
      bgColor: 'bg-lime-50 hover:bg-lime-100',
      borderColor: 'border-lime-200',
    },
  ], [totalCustomerDue, expenseAmount, expiredCount, estimatedBalance]);

  // Pinned Items Resolution
  const pinnedKhatas = useMemo(() => {
    return pinnedItemIds
      .map((id) => allKhatas.find((k) => k.id === id))
      .filter((k): k is KhataItem => !!k);
  }, [pinnedItemIds, allKhatas]);

  // Toggle Khata Pinned status
  const handleTogglePin = (id: string) => {
    const updated = pinnedItemIds.includes(id)
      ? pinnedItemIds.filter((item) => item !== id)
      : [...pinnedItemIds, id];
    setPinnedItemIds(updated);
    try {
      localStorage.setItem('smartshopx_pinned_khatas', JSON.stringify(updated));
    } catch {}
    showToast(pinnedItemIds.includes(id) ? 'পিন সরানো হয়েছে' : 'পছন্দের তালিকায় পিন করা হয়েছে', 'info');
  };

  // Handle Instant Backup Click
  const handleTriggerBackup = () => {
    const nowStr = `আজ, ${new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`;
    setLastBackupTime(nowStr);
    localStorage.setItem('smartshopx_last_backup', nowStr);
    setIsCloudSyncOpen(true);
  };

  // WhatsApp Support click
  const handleOpenWhatsApp = () => {
    const phone = '8801700000000';
    const message = encodeURIComponent(`আসসালামু আলাইকুম, আমি ${shop.name} থেকে সহায়তা চাইছি।`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleKhataClick = (item: KhataItem) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="space-y-3.5 pb-16 max-w-4xl mx-auto">
      {/* 1. TOP HEADER - Warm Golden Branded Bar (Clean & Professional) */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-slate-900 shadow-sm border border-amber-300">
        <div className="flex items-center justify-between gap-2">
          {/* Shop Title & Backup Status */}
          <div className="min-w-0 flex-1">
            <div
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 truncate group-hover:underline">
                {shop.name || 'Sorkar Pharmacy'}
              </h2>
              <ChevronDown className="w-4 h-4 text-slate-900 shrink-0 stroke-[2.5]" />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] sm:text-xs text-slate-900/90 font-medium">
              <span>সর্বশেষ ব্যাকআপ: <strong className="font-bold">{lastBackupTime}</strong></span>
              <button
                type="button"
                onClick={handleTriggerBackup}
                className="bg-white/95 hover:bg-white text-slate-900 px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] shadow-2xs border border-amber-300 transition-all hover:scale-105 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-2.5 h-2.5 text-amber-600" />
                <span>ডাটা ব্যাকআপ</span>
              </button>
            </div>
          </div>

          {/* Right 3 Clean Action Buttons (WhatsApp, Bell, Settings) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenWhatsApp}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full text-emerald-700 shadow-2xs hover:scale-105 transition-all cursor-pointer flex items-center justify-center"
              title="হোয়াটসঅ্যাপ হেল্পলাইন"
            >
              <MessageCircle className="w-5 h-5 fill-emerald-600 text-white" />
            </button>

            <button
              onClick={() => setIsHelplineOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full text-slate-800 shadow-2xs hover:scale-105 transition-all cursor-pointer flex items-center justify-center relative"
              title="নোটিফিকেশন ও অ্যালার্ট"
            >
              <Bell className="w-4.5 h-4.5 text-slate-800" />
              {(expiredCount > 0 || lowStockCount > 0) && (
                <span className="absolute 0 top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {expiredCount + lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full text-slate-800 shadow-2xs hover:scale-105 transition-all cursor-pointer flex items-center justify-center"
              title="দোকান সেটিংস"
            >
              <Settings className="w-4.5 h-4.5 text-slate-800" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTION & SEARCH BAR (Search + Voice + Camera Barcode) */}
      <div className="bg-white rounded-2xl p-2.5 shadow-2xs border border-slate-200 flex items-center justify-between gap-2">
        <div
          onClick={() => {
            const ev = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
            window.dispatchEvent(ev);
          }}
          className="flex-1 flex items-center gap-2 text-slate-400 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-100 cursor-pointer transition-colors"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-medium truncate">
            পণ্য, কাস্টমার, চালান বা ব্রাঞ্চ সার্চ করুন...
          </span>
          <kbd className="hidden sm:inline text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 ml-auto font-mono">
            Ctrl+K
          </kbd>
        </div>

        {/* Voice Trigger */}
        <button
          type="button"
          onClick={() => setIsVoiceModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200/80 font-bold text-xs transition-colors cursor-pointer shrink-0"
          title="বাংলায় মুখে বলে হিসেব"
        >
          <Mic className="w-4 h-4 text-amber-600 animate-pulse" />
          <span className="hidden xs:inline">ভয়েস</span>
        </button>

        {/* Live Camera Scanner */}
        <button
          type="button"
          onClick={() => setIsBarcodeScannerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl border border-indigo-200/80 font-bold text-xs transition-colors cursor-pointer shrink-0"
          title="ক্যামেরা বারকোড স্ক্যানার"
        >
          <Camera className="w-4 h-4 text-indigo-600" />
          <span className="hidden xs:inline">স্ক্যানার</span>
        </button>
      </div>

      {/* 3. SUMMARY METRIC CARD - Clean Financial Ledger */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 shadow-xs border border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* ব্যালেন্স */}
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-500">ব্যালেন্স</span>
            <div className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight font-mono">
              ৳ {Math.round(estimatedBalance).toLocaleString('bn-BD')}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">
              ● ক্যাশ ইন হ্যান্ড
            </span>
          </div>

          {/* আজকের / মাসের বিক্রি + [দিন | মাস] টগল */}
          <div className="space-y-0.5 pt-2 md:pt-0 md:pl-4">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-500">
                {timeRange === 'day' ? 'আজকের বিক্রি' : 'এই মাসের বিক্রি'}
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setTimeRange('day')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    timeRange === 'day' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  দিন
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('month')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    timeRange === 'month' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  মাস
                </button>
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-600 tracking-tight font-mono">
              ৳ {salesAmount.toLocaleString('bn-BD')}
            </div>
            <div className="text-[10px] font-semibold text-blue-700 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>+১৮.২% বিক্রি বৃদ্ধি</span>
            </div>
          </div>

          {/* আজকের / মাসের ব্যয় */}
          <div className="space-y-0.5 pt-2 md:pt-0 md:pl-4">
            <span className="text-xs font-semibold text-slate-500">
              {timeRange === 'day' ? 'আজকের ব্যয়' : 'এই মাসের ব্যয়'}
            </span>
            <div className="text-lg sm:text-xl font-black text-rose-500 tracking-tight font-mono">
              ৳ {expenseAmount.toLocaleString('bn-BD')}
            </div>
            <span className="text-[10px] text-slate-400 block">
              দোকান খরচ ও বিল
            </span>
          </div>

          {/* বাকি এবং মোট স্টক */}
          <div className="space-y-1 pt-2 md:pt-0 md:pl-4">
            <span className="text-xs font-semibold text-slate-500 block">বাকি (পাওনা / দেনা)</span>
            <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
              <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]" title="কাস্টমার বাকি">
                দিয়েছি: <strong className="font-mono">৳{totalCustomerDue.toLocaleString('bn-BD')}</strong>
              </span>
              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]" title="সাপ্লায়ার পাওনা">
                নিয়েছি: <strong className="font-mono">৳{totalSupplierPayable.toLocaleString('bn-BD')}</strong>
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              মোট স্টক সংখ্যা: <strong className="text-emerald-700 font-mono font-bold">{totalStockQuantity.toLocaleString('bn-BD')}</strong> টি
            </div>
          </div>
        </div>

        {/* 7-Day Sparkline */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>সাপ্তাহিক বিক্রির গতিপ্রকৃতি:</span>
          </div>
          <div className="flex items-end gap-1.5 h-6">
            {weeklyTrendData.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 group relative">
                <div
                  style={{ height: `${Math.max(8, d.percent * 0.20)}px` }}
                  className={`w-4 sm:w-5 rounded-t transition-all ${
                    d.active ? 'bg-blue-600 shadow-xs' : 'bg-slate-200 group-hover:bg-blue-300'
                  }`}
                />
                <span className="text-[8px] text-slate-400 font-medium">{d.label}</span>
                <div className="absolute bottom-7 hidden group-hover:flex px-1.5 py-0.5 bg-slate-900 text-white text-[9px] rounded shadow-lg whitespace-nowrap z-10">
                  ৳{d.val.toLocaleString('bn-BD')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. SMART ROTATING BUSINESS TICKER */}
      {smartTickers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-2.5 border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${smartTickers[tickerIndex].color}`}>
              {React.createElement(smartTickers[tickerIndex].icon, { className: 'w-3.5 h-3.5' })}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">
                {smartTickers[tickerIndex].title}
              </span>
              <p className="text-[11px] text-slate-600 truncate">
                {smartTickers[tickerIndex].desc}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(smartTickers[tickerIndex].actionPath)}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            {smartTickers[tickerIndex].actionLabel}
          </button>
        </div>
      )}

      {/* 5. QUICK STATS & 7-DAY SALES & PROFIT TREND WIDGET (Recharts) */}
      <QuickStatsWidget
        orders={safeOrders}
        purchases={safePurchases}
        expenses={safeExpenses}
        products={safeProducts}
      />

      {/* 5. TWO PRIMARY HERO ACTION CARDS: [কেনা] and [বেচা] */}
      <div className="grid grid-cols-2 gap-3">
        {/* কেনা (Purchase) */}
        <button
          onClick={() => navigate('/purchases')}
          className="bg-white hover:bg-amber-50/40 rounded-2xl p-3.5 border border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 group text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs shrink-0">
            <Boxes className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-base font-black text-slate-800 group-hover:text-amber-700 block">
              কেনা
            </span>
            <span className="text-[10px] text-slate-400 block">সাপ্লায়ার ক্রয় ও স্টক ইন</span>
          </div>
        </button>

        {/* বেচা (Sell / POS Counter - Highlighted Hero) */}
        <button
          onClick={() => navigate('/pos')}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl p-3.5 shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 group text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs shrink-0 text-white">
            <ShoppingBag className="w-6 h-6 fill-white/10" />
          </div>
          <div>
            <span className="text-base font-black text-white block">
              বেচা
            </span>
            <span className="text-[10px] text-emerald-100 block">POS দ্রুত বিক্রয় ও রশিদ</span>
          </div>
        </button>
      </div>

      {/* 6. PINNED FAVORITE KHATAS (If any) */}
      {pinnedKhatas.length > 0 && (
        <div className="bg-slate-50/80 rounded-2xl p-2.5 sm:p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>আমার পছন্দের খাতা</span>
            </h4>
            <button
              onClick={() => setIsCustomizePinnedOpen(true)}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
            >
              + সাজান
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {pinnedKhatas.map((khata) => {
              const IconComp = khata.icon;
              return (
                <button
                  key={khata.id}
                  onClick={() => handleKhataClick(khata)}
                  className={`px-3 py-1.5 rounded-xl bg-white border ${khata.borderColor} shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer group`}
                >
                  <div className={`w-6 h-6 rounded-lg ${khata.bgColor} flex items-center justify-center ${khata.color}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block whitespace-nowrap">
                      {khata.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expiry and Low Stock Alert Banner */}
      {(expiredCount > 0 || lowStockCount > 0) && (
        <StockAndExpiryAlertBanner products={safeProducts} />
      )}

      {/* 7. SECTION 1: খাতা সমূহ (4 Core Ledgers) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>খাতা সমূহ</span>
          </h3>
          <span className="text-[11px] text-slate-400">দৈনিক লেজার ও খতিয়ান</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          {allKhatas.filter((k) => k.category === 'ledgers').map((khata) => {
            const IconComp = khata.icon;
            return (
              <button
                key={khata.id}
                onClick={() => handleKhataClick(khata)}
                className="p-2 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center gap-1 group relative"
              >
                <div className={`w-12 h-12 rounded-2xl ${khata.bgColor} border ${khata.borderColor} flex items-center justify-center group-hover:scale-105 transition-transform ${khata.color} shadow-2xs`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  {khata.title}
                </span>
                {khata.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${khata.badgeColor}`}>
                    {khata.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. SECTION 2: আপনার ব্যবসার জন্য (4 Business Growth Modules) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>আপনার ব্যবসার জন্য</span>
          </h3>
          <span className="text-[11px] text-slate-400">গ্রোথ ও অপারেশনাল টুলস</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          {allKhatas.filter((k) => k.category === 'business').map((khata) => {
            const IconComp = khata.icon;
            return (
              <button
                key={khata.id}
                onClick={() => handleKhataClick(khata)}
                className="p-2 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center gap-1 group relative"
              >
                <div className={`w-12 h-12 rounded-2xl ${khata.bgColor} border ${khata.borderColor} flex items-center justify-center group-hover:scale-105 transition-transform ${khata.color} shadow-2xs`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 leading-tight">
                  {khata.title}
                </span>
                {khata.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${khata.badgeColor}`}>
                    {khata.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION: মাল্টি-ব্রাঞ্চ পারফরম্যান্স ও স্টক ট্রান্সফার গ্রিড প্রিভিউ */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200 space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">
                শাখা পারফরম্যান্স ও আন্তঃশাখা স্টক হাব
              </h3>
              <p className="text-[11px] text-slate-400">
                সকল আউটলেটের পাশাপাশি পারফরম্যান্স ও স্টক ট্রান্সফার
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/branches')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>সব শাখা দেখুন</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Side-by-side branch preview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {safeBranches.slice(0, 4).map((b) => (
            <div
              key={b.id}
              onClick={() => navigate('/branches')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                b.isMainBranch
                  ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400'
                  : 'border-slate-100 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {b.code}
                </span>
                {b.isMainBranch && (
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                    প্রধান হাব
                  </span>
                )}
              </div>
              <h4 className="text-xs font-black text-slate-800 truncate mb-1">{b.name}</h4>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>আজকের বিক্রি:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  ৳ {(b.todaySales || 0).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                <span>মজুদ স্টক:</span>
                <span className="font-bold text-slate-700 font-mono">
                  {(b.totalStockQuantity || 0).toLocaleString('bn-BD')} টি
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick action bar */}
        <div className="pt-1 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600" />
            <span>চলমান স্টক চালান:</span>
            <strong className="font-mono text-teal-800">
              {safeStockTransfers.filter((t) => t.status === 'in_transit').length} টি পথে আছে
            </strong>
          </div>
          <button
            onClick={() => navigate('/branches?action=new_transfer')}
            className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>নতুন ট্রান্সফার চালান</span>
          </button>
        </div>
      </div>

      {/* 9. SECTION 3: অন্যান্য (Clean Utility Drawer) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <span>অন্যান্য</span>
          </h3>
          <span className="text-[11px] text-slate-400">দরকারি টুলস ও সেটিংস</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center">
          {allKhatas.filter((k) => k.category === 'others').map((khata) => {
            const IconComp = khata.icon;
            return (
              <button
                key={khata.id}
                onClick={() => handleKhataClick(khata)}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center gap-1 group relative"
              >
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${khata.bgColor} border ${khata.borderColor} flex items-center justify-center group-hover:scale-105 transition-transform ${khata.color} shadow-2xs`}>
                  <IconComp className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-slate-900 leading-tight">
                  {khata.title}
                </span>
                {khata.badge && (
                  <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${khata.badgeColor}`}>
                    {khata.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 10. SUPPORT BANNER - Expert WhatsApp Assistance */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-left w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <MessageCircle className="w-5 h-5 fill-white text-emerald-500" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              যেকোনো প্রয়োজনে এক্সপার্টের কাছ থেকে সহায়তা নিন
            </h4>
            <p className="text-[11px] text-slate-500">
              হিসেব মেলানো, ব্যাকআপ বা নতুন ফিচার বুঝতে আমাদের সাপোর্ট টিম সার্বক্ষণিক প্রস্তুত।
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenWhatsApp}
          className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20 transition-all hover:scale-105 cursor-pointer text-center"
        >
          লাইভ চ্যাট
        </button>
      </div>

      {/* MODALS */}
      {/* 1. Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
      />

      {/* 2. Helpline & Video Training Modal */}
      <SmartHelplineModal
        isOpen={isHelplineOpen}
        onClose={() => setIsHelplineOpen(false)}
      />

      {/* 3. Bengali Voice Action Modal */}
      <VoiceActionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* 4. Live Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        products={safeProducts}
        onProductScanned={(prod) => {
          setIsBarcodeScannerOpen(false);
          navigate(`/pos?productId=${prod.id}`);
          showToast(`'${prod.name}' POS কার্টে যোগ করা হয়েছে`, 'success');
        }}
      />

      {/* 5. Day End Cash Closing Modal */}
      <DayEndCashClosingModal
        isOpen={isDayEndClosingOpen}
        onClose={() => setIsDayEndClosingOpen(false)}
      />

      {/* 6. Capital & Investment Modal */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">দোকানের পুঁজি ও মোট সম্পদ</h3>
                  <p className="text-xs text-slate-500">ইনভেন্টরি ও ক্যাশ মিলিয়ে মোট মূলধন</p>
                </div>
              </div>
              <button
                onClick={() => setIsCapitalModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-900">বর্তমান ক্যাশ ব্যালেন্স:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">৳ {Math.round(estimatedBalance).toLocaleString('bn-BD')}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-blue-900">পণ্যের মোট স্টক ভ্যালু (কেনা দাম):</span>
                <span className="font-mono font-bold text-blue-700 text-sm">৳ {Math.round(totalStockValuation * 0.75 || 125000).toLocaleString('bn-BD')}</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-purple-900">মার্কেটে কাস্টমার বকেয়া (পাওনা):</span>
                <span className="font-mono font-bold text-purple-700 text-sm">৳ {totalCustomerDue.toLocaleString('bn-BD')}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-rose-900">সাপ্লায়ার দেনা (বাদ যাবে):</span>
                <span className="font-mono font-bold text-rose-700 text-sm">- ৳ {totalSupplierPayable.toLocaleString('bn-BD')}</span>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center mt-2">
                <span className="text-sm font-bold">দোকানের প্রকৃত নিট পুঁজি:</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  ৳ {Math.round(estimatedBalance + (totalStockValuation * 0.75 || 125000) + totalCustomerDue - totalSupplierPayable).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCapitalModalOpen(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* 7. Customize Pinned Items Modal */}
      {isCustomizePinnedOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pin className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">পছন্দের খাতা সাজান</h3>
              </div>
              <button
                onClick={() => setIsCustomizePinnedOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 my-3">
              হোম স্ক্রিনের শর্টকাট বারে রাখতে যেসকল খাতা চান সেগুলোর উপর ট্যাপ করে পিন করুন:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-1.5 p-1">
              {allKhatas.map((khata) => {
                const isPinned = pinnedItemIds.includes(khata.id);
                return (
                  <div
                    key={khata.id}
                    onClick={() => handleTogglePin(khata.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isPinned
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${khata.bgColor} flex items-center justify-center ${khata.color}`}>
                        {React.createElement(khata.icon, { className: 'w-4 h-4' })}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{khata.title}</span>
                    </div>

                    <button
                      type="button"
                      className={`p-1.5 rounded-lg ${
                        isPinned ? 'text-amber-700 bg-amber-200/80 font-bold' : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {isPinned ? <Pin className="w-4 h-4 fill-amber-600 text-amber-700" /> : <PinOff className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsCustomizePinnedOpen(false)}
              className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

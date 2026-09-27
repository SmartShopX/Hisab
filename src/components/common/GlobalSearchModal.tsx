import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Package,
  Users,
  ShoppingBag,
  Store,
  Building2,
  ArrowRight,
  ExternalLink,
  Phone,
  Clock,
  Sparkles,
  Filter,
  Check,
  Layers,
  FileText,
  Plus,
  X,
  CornerDownLeft,
  DollarSign,
  AlertTriangle,
  Send,
  Navigation,
  ChevronRight,
  TrendingUp,
  Tag,
  Shield,
  Truck,
  CreditCard,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DataStore } from '../../services/dataStorage';
import { Product, Customer, Order, AccountBusiness } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'products' | 'customers' | 'orders' | 'branches' | 'pages';

interface SearchResultItem {
  id: string;
  type: 'product' | 'customer' | 'order' | 'branch' | 'page';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  branchId: string;
  branchName: string;
  isCurrentBranch: boolean;
  metadata?: {
    price?: number;
    stock?: number;
    mobile?: number | string;
    totalAmount?: number;
    status?: string;
    due?: number;
    category?: string;
    path?: string;
    imageUrl?: string;
  };
  actionLabel?: string;
}

const QUICK_PAGES = [
  { title: 'দ্রুত বিক্রয় (POS Counter)', path: '/pos', icon: ShoppingBag, category: 'Sales', desc: 'ক্যাশ ও ডিজিটাল পেমেন্টে তাৎক্ষণিক বিলিং' },
  { title: 'পণ্য তালিকা ও ইনভেন্টরি', path: '/products', icon: Package, category: 'Inventory', desc: 'স্টক, বারকোড ও মূল্য ব্যবস্থাপনা' },
  { title: 'কাস্টমার ও বাকি খাতা', path: '/customers', icon: Users, category: 'CRM', desc: 'গ্রাহক প্রোফাইল, বকেয়া ও হিসেব' },
  { title: 'অর্ডার ও ডেলিভারি তালিকা', path: '/orders', icon: FileText, category: 'Orders', desc: 'অনলাইন ও অফলাইন সকল অর্ডার ট্র্যাকিং' },
  { title: 'দারাজ মেগা মার্কেটপ্লেস', path: '/marketplace', icon: Store, category: 'Marketplace', desc: 'কেন্দ্রীয় ক্যাটালগ ও ফ্ল্যাশ ডিলস' },
  { title: 'কুরিয়ার ও ফ্রড চেকার', path: '/courier', icon: Truck, category: 'Logistics', desc: 'Steadfast ও Pathao ১-ক্লিক পার্সেল বুকিং' },
  { title: 'বিক্রয় ও লাভ-ক্ষতি রিপোর্ট', path: '/reports', icon: TrendingUp, category: 'Analytics', desc: 'দৈনিক ও মাসিক আর্থিক প্রতিবেদন' },
  { title: 'দোকান সেটিংস ও ব্রাঞ্চ', path: '/settings', icon: Settings, category: 'Settings', desc: 'দোকানের ঠিকানা, ট্যাক্স ও টার্মস' },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { businesses, activeBusinessId, switchToBusiness, shop } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartshopx_recent_searches');
      return saved ? JSON.parse(saved) : ['পণ্য', 'অর্ডার', 'কাস্টমার'];
    } catch {
      return ['পণ্য', 'অর্ডার', 'কাস্টমার'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Aggregate search index across ALL businesses/branches
  const aggregatedData = useMemo(() => {
    const safeBusinesses = Array.isArray(businesses) && businesses.length > 0
      ? businesses
      : [{ id: activeBusinessId || 'shop_101', name: shop?.name || 'প্রধান শাখা', category: shop?.category || 'General & Trading' } as AccountBusiness];

    const allProducts: (Product & { branchId: string; branchName: string })[] = [];
    const allCustomers: (Customer & { branchId: string; branchName: string })[] = [];
    const allOrders: (Order & { branchId: string; branchName: string })[] = [];

    safeBusinesses.forEach((biz) => {
      // Products for this business
      try {
        const pList = DataStore.getProducts(biz.id);
        if (Array.isArray(pList)) {
          pList.forEach((p) => {
            allProducts.push({
              ...p,
              branchId: biz.id,
              branchName: biz.name,
            });
          });
        }
      } catch (e) {
        console.error('Failed to load products for branch', biz.id, e);
      }

      // Customers for this business
      try {
        const cList = DataStore.getCustomers(biz.id);
        if (Array.isArray(cList)) {
          cList.forEach((c) => {
            allCustomers.push({
              ...c,
              branchId: biz.id,
              branchName: biz.name,
            });
          });
        }
      } catch (e) {
        console.error('Failed to load customers for branch', biz.id, e);
      }

      // Orders for this business
      try {
        const oList = DataStore.getOrders(biz.id);
        if (Array.isArray(oList)) {
          oList.forEach((o) => {
            allOrders.push({
              ...o,
              branchId: biz.id,
              branchName: biz.name,
            });
          });
        }
      } catch (e) {
        console.error('Failed to load orders for branch', biz.id, e);
      }
    });

    return {
      businesses: safeBusinesses,
      products: allProducts,
      customers: allCustomers,
      orders: allOrders,
    };
  }, [businesses, activeBusinessId, shop]);

  // Search Results filtering logic
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    const matchesBranch = (itemBranchId: string) => {
      if (selectedBranchFilter === 'all') return true;
      return itemBranchId === selectedBranchFilter;
    };

    // If query is empty, provide popular quick navigation items & branch list
    if (!q) {
      if (selectedCategory === 'all' || selectedCategory === 'pages') {
        QUICK_PAGES.forEach((page) => {
          results.push({
            id: `page_${page.path}`,
            type: 'page',
            title: page.title,
            subtitle: page.desc,
            badge: page.category,
            badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            branchId: activeBusinessId,
            branchName: shop.name,
            isCurrentBranch: true,
            metadata: {
              path: page.path,
            },
            actionLabel: 'পেজে যান',
          });
        });
      }

      if (selectedCategory === 'all' || selectedCategory === 'branches') {
        aggregatedData.businesses.forEach((biz) => {
          const isCurrent = biz.id === activeBusinessId;
          results.push({
            id: `branch_${biz.id}`,
            type: 'branch',
            title: biz.name,
            subtitle: `${biz.category || 'General'} • ${biz.template || 'Standard'} (ID: ${biz.id})`,
            badge: isCurrent ? 'বর্তমান সক্রিয় শাখা' : 'সুইচ করুন',
            badgeColor: isCurrent ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
            branchId: biz.id,
            branchName: biz.name,
            isCurrentBranch: isCurrent,
            metadata: {
              category: biz.category,
            },
            actionLabel: isCurrent ? 'বর্তমান শাখা' : 'শাখায় সুইচ করুন',
          });
        });
      }

      return results;
    }

    // 1. SEARCH PRODUCTS
    if (selectedCategory === 'all' || selectedCategory === 'products') {
      aggregatedData.products.forEach((p) => {
        if (!matchesBranch(p.branchId)) return;

        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const nameBnMatch = ((p as any).nameBn || '').toLowerCase().includes(q);
        const barcodeMatch = (p.barcode || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const brandMatch = ((p as any).brand || '').toLowerCase().includes(q);
        const genericMatch = ((p as any).genericName || '').toLowerCase().includes(q);

        if (nameMatch || nameBnMatch || barcodeMatch || skuMatch || catMatch || brandMatch || genericMatch) {
          const isCurrent = p.branchId === activeBusinessId;
          const stockStatus = p.stock <= 0 ? 'স্টক শেষ' : p.stock <= 5 ? `কম স্টক (${p.stock})` : `স্টক: ${p.stock}`;
          const stockBadgeColor = p.stock <= 0
            ? 'bg-rose-100 text-rose-800 border-rose-200'
            : p.stock <= 5
            ? 'bg-amber-100 text-amber-800 border-amber-200'
            : 'bg-emerald-100 text-emerald-800 border-emerald-200';

          results.push({
            id: `prod_${p.id}_${p.branchId}`,
            type: 'product',
            title: p.name,
            subtitle: `${p.category || 'প্রোডাক্ট'} ${p.barcode ? `• কোড: ${p.barcode}` : ''} ${p.sku ? `• SKU: ${p.sku}` : ''}`,
            badge: stockStatus,
            badgeColor: stockBadgeColor,
            branchId: p.branchId,
            branchName: p.branchName,
            isCurrentBranch: isCurrent,
            metadata: {
              price: p.sellingPrice || p.price,
              stock: p.stock,
              category: p.category,
              imageUrl: (p as any).image || (p as any).imageUrl,
              path: `/pos?productId=${p.id}`,
            },
            actionLabel: 'POS-এ বিক্রয়',
          });
        }
      });
    }

    // 2. SEARCH CUSTOMERS
    if (selectedCategory === 'all' || selectedCategory === 'customers') {
      aggregatedData.customers.forEach((c) => {
        if (!matchesBranch(c.branchId)) return;

        const nameMatch = (c.name || '').toLowerCase().includes(q);
        const mobileMatch = (c.mobile || '').toLowerCase().includes(q);
        const emailMatch = (c.email || '').toLowerCase().includes(q);
        const addressMatch = (c.address || '').toLowerCase().includes(q);

        if (nameMatch || mobileMatch || emailMatch || addressMatch) {
          const isCurrent = c.branchId === activeBusinessId;
          const dueAmount = c.dueBalance || c.totalDue || 0;
          const dueBadge = dueAmount > 0 ? `বাকি: ৳${dueAmount.toLocaleString('bn-BD')}` : 'পরিশোধিত';
          const dueBadgeColor = dueAmount > 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200';

          results.push({
            id: `cust_${c.id}_${c.branchId}`,
            type: 'customer',
            title: c.name,
            subtitle: `মোবাইল: ${c.mobile || 'N/A'} ${c.address ? `• ঠিকানা: ${c.address}` : ''} ${c.totalOrders ? `• মোট অর্ডার: ${c.totalOrders}` : ''}`,
            badge: dueBadge,
            badgeColor: dueBadgeColor,
            branchId: c.branchId,
            branchName: c.branchName,
            isCurrentBranch: isCurrent,
            metadata: {
              mobile: c.mobile,
              due: dueAmount,
              path: `/customers?search=${encodeURIComponent(c.mobile || c.name)}`,
            },
            actionLabel: 'খাতা দেখুন',
          });
        }
      });
    }

    // 3. SEARCH ORDERS
    if (selectedCategory === 'all' || selectedCategory === 'orders') {
      aggregatedData.orders.forEach((o) => {
        if (!matchesBranch(o.branchId)) return;

        const idMatch = (o.id || '').toLowerCase().includes(q);
        const numMatch = ((o as any).orderNumber || '').toLowerCase().includes(q);
        const custNameMatch = (o.customerName || '').toLowerCase().includes(q);
        const custMobileMatch = (o.customerMobile || '').toLowerCase().includes(q);
        const trackMatch = ((o as any).courierTrackingId || (o as any).trackingCode || '').toLowerCase().includes(q);
        const channelMatch = ((o as any).channel || '').toLowerCase().includes(q);

        if (idMatch || numMatch || custNameMatch || custMobileMatch || trackMatch || channelMatch) {
          const isCurrent = o.branchId === activeBusinessId;
          const statusColors: Record<string, string> = {
            Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            Processing: 'bg-amber-100 text-amber-800 border-amber-200',
            Pending: 'bg-slate-100 text-slate-800 border-slate-200',
            Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
            Returned: 'bg-purple-100 text-purple-800 border-purple-200',
          };

          results.push({
            id: `ord_${o.id}_${o.branchId}`,
            type: 'order',
            title: `অর্ডার #${(o as any).orderNumber || o.id} (${o.customerName || 'কাস্টমার'})`,
            subtitle: `তারিখ: ${new Date(o.createdAt).toLocaleDateString('bn-BD')} • মোবাইল: ${o.customerMobile || 'N/A'} • পরিমাণ: ${o.items?.length || 1} টি আইটেম`,
            badge: o.status,
            badgeColor: statusColors[o.status] || 'bg-slate-100 text-slate-700',
            branchId: o.branchId,
            branchName: o.branchName,
            isCurrentBranch: isCurrent,
            metadata: {
              totalAmount: o.totalAmount || (o as any).total,
              status: o.status,
              path: `/orders?search=${encodeURIComponent(o.id)}`,
            },
            actionLabel: 'ইনভয়েস/অর্ডার',
          });
        }
      });
    }

    // 4. SEARCH BRANCHES
    if (selectedCategory === 'all' || selectedCategory === 'branches') {
      aggregatedData.businesses.forEach((biz) => {
        const nameMatch = (biz.name || '').toLowerCase().includes(q);
        const catMatch = (biz.category || '').toLowerCase().includes(q);
        const tplMatch = (biz.template || '').toLowerCase().includes(q);
        const idMatch = (biz.id || '').toLowerCase().includes(q);

        if (nameMatch || catMatch || tplMatch || idMatch) {
          const isCurrent = biz.id === activeBusinessId;
          results.push({
            id: `branch_${biz.id}`,
            type: 'branch',
            title: biz.name,
            subtitle: `${biz.category || 'General'} • ${biz.template || 'Standard'} (শাখা কোড: ${biz.id})`,
            badge: isCurrent ? 'বর্তমান শাখা' : 'সুইচ করুন',
            badgeColor: isCurrent ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
            branchId: biz.id,
            branchName: biz.name,
            isCurrentBranch: isCurrent,
            metadata: {
              category: biz.category,
            },
            actionLabel: isCurrent ? 'বর্তমান শাখা' : 'শাখায় সুইচ করুন',
          });
        }
      });
    }

    // 5. SEARCH QUICK PAGES
    if (selectedCategory === 'all' || selectedCategory === 'pages') {
      QUICK_PAGES.forEach((page) => {
        const titleMatch = page.title.toLowerCase().includes(q);
        const descMatch = page.desc.toLowerCase().includes(q);
        const catMatch = page.category.toLowerCase().includes(q);

        if (titleMatch || descMatch || catMatch) {
          results.push({
            id: `page_${page.path}`,
            type: 'page',
            title: page.title,
            subtitle: page.desc,
            badge: page.category,
            badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            branchId: activeBusinessId,
            branchName: shop.name,
            isCurrentBranch: true,
            metadata: {
              path: page.path,
            },
            actionLabel: 'পেজে যান',
          });
        }
      });
    }

    return results;
  }, [query, selectedCategory, selectedBranchFilter, aggregatedData, activeBusinessId, shop]);

  // Handle Result Item Selection
  const handleSelectItem = (item: SearchResultItem) => {
    // Save to recent searches if typed
    if (query.trim()) {
      const updatedRecents = [query.trim(), ...recentSearches.filter((s) => s !== query.trim())].slice(0, 5);
      setRecentSearches(updatedRecents);
      try {
        localStorage.setItem('smartshopx_recent_searches', JSON.stringify(updatedRecents));
      } catch {}
    }

    // Switch branch if result belongs to another branch
    if (!item.isCurrentBranch && item.branchId) {
      switchToBusiness(item.branchId);
      showToast(`'${item.branchName}' শাখায় সফলভাবে সুইচ করা হয়েছে`, 'success');
    }

    onClose();

    // Navigate to target view
    if (item.type === 'product') {
      if (item.metadata?.path) {
        navigate(item.metadata.path);
      } else {
        navigate('/products');
      }
    } else if (item.type === 'customer') {
      if (item.metadata?.path) {
        navigate(item.metadata.path);
      } else {
        navigate('/customers');
      }
    } else if (item.type === 'order') {
      if (item.metadata?.path) {
        navigate(item.metadata.path);
      } else {
        navigate('/orders');
      }
    } else if (item.type === 'branch') {
      // already switched
    } else if (item.type === 'page' && item.metadata?.path) {
      navigate(item.metadata.path);
    }
  };

  // Keyboard Navigation (Arrow Up, Arrow Down, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectItem(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Counts for Category Tabs
  const counts = useMemo(() => {
    if (!query.trim()) {
      return {
        all: searchResults.length,
        products: aggregatedData.products.length,
        customers: aggregatedData.customers.length,
        orders: aggregatedData.orders.length,
        branches: aggregatedData.businesses.length,
        pages: QUICK_PAGES.length,
      };
    }
    const q = query.trim().toLowerCase();
    const prodCount = aggregatedData.products.filter(
      (p) => (p.name || '').toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q)
    ).length;
    const custCount = aggregatedData.customers.filter(
      (c) => (c.name || '').toLowerCase().includes(q) || (c.mobile || '').toLowerCase().includes(q)
    ).length;
    const ordCount = aggregatedData.orders.filter(
      (o) => (o.id || '').toLowerCase().includes(q) || (o.customerName || '').toLowerCase().includes(q) || (o.customerMobile || '').toLowerCase().includes(q)
    ).length;
    const branchCount = aggregatedData.businesses.filter(
      (b) => (b.name || '').toLowerCase().includes(q)
    ).length;
    const pageCount = QUICK_PAGES.filter(
      (p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    ).length;

    return {
      all: prodCount + custCount + ordCount + branchCount + pageCount,
      products: prodCount,
      customers: custCount,
      orders: ordCount,
      branches: branchCount,
      pages: pageCount,
    };
  }, [query, aggregatedData, searchResults.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 sm:pt-14">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Search Modal Box */}
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-white sticky top-0 z-20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="পণ্য, কাস্টমার, অর্ডার বা সব শাখায় দ্রুত খুঁজুন... (নাম, মোবাইল, কোড)"
              className="w-full text-sm sm:text-base font-medium text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none focus:ring-0 pr-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title="বন্ধ করুন (Esc)"
          >
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-md shadow-2xs">
              ESC
            </kbd>
            <X className="w-5 h-5 sm:hidden" />
          </button>
        </div>

        {/* Filter Controls: Branch Filter & Category Tabs */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'সকল', count: counts.all },
              { id: 'products', label: 'পণ্য', count: counts.products },
              { id: 'customers', label: 'কাস্টমার', count: counts.customers },
              { id: 'orders', label: 'অর্ডার', count: counts.orders },
              { id: 'branches', label: 'শাখা', count: counts.branches },
              { id: 'pages', label: 'পেজ/মেনু', count: counts.pages },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as SearchCategory);
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat.id ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Branch Scope Filter Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <span className="text-slate-400 font-medium text-[11px] hidden md:inline">শাখা ফিল্টার:</span>
            <div className="relative">
              <select
                value={selectedBranchFilter}
                onChange={(e) => {
                  setSelectedBranchFilter(e.target.value);
                  setSelectedIndex(0);
                }}
                className="bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg px-2.5 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="all">🌐 সকল শাখা ({aggregatedData.businesses.length})</option>
                {aggregatedData.businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.id === activeBusinessId ? '(বর্তমান)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Results / Content Body */}
        <div ref={resultsContainerRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">কোনো ফলাফল পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                '{query}' এর সাথে মিল রেখে কোনো পণ্য, কাস্টমার, অর্ডার বা শাখা পাওয়া যায়নি। সঠিক বানান বা মোবাইল নম্বর দিয়ে পুনরায় চেষ্টা করুন।
              </p>
              {selectedBranchFilter !== 'all' && (
                <button
                  onClick={() => setSelectedBranchFilter('all')}
                  className="mt-3 text-xs text-emerald-700 font-bold underline cursor-pointer hover:text-emerald-800"
                >
                  সকল শাখায় পুনরায় খুঁজুন
                </button>
              )}
            </div>
          ) : (
            searchResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-emerald-50/80 border border-emerald-200 shadow-2xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {/* Left Icon / Avatar */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        item.type === 'product'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : item.type === 'customer'
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : item.type === 'order'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : item.type === 'branch'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.type === 'product' && <Package className="w-5 h-5" />}
                      {item.type === 'customer' && <Users className="w-5 h-5" />}
                      {item.type === 'order' && <ShoppingBag className="w-5 h-5" />}
                      {item.type === 'branch' && <Store className="w-5 h-5" />}
                      {item.type === 'page' && <Navigation className="w-5 h-5" />}
                    </div>

                    {/* Middle Info Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{item.title}</h4>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>

                      {/* Branch & Multi-Shop Tag */}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            item.isCurrentBranch
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold'
                          }`}
                        >
                          <Store className="w-2.5 h-2.5" />
                          <span>শাখা: {item.branchName}</span>
                          {!item.isCurrentBranch && (
                            <span className="text-[9px] bg-indigo-600 text-white px-1 py-0.1 rounded ml-0.5">
                              ক্লিকে সুইচ হবে
                            </span>
                          )}
                        </span>

                        {item.metadata?.price !== undefined && (
                          <span className="text-[11px] font-bold text-slate-800 font-mono">
                            ৳{item.metadata.price.toLocaleString('bn-BD')}
                          </span>
                        )}

                        {item.metadata?.totalAmount !== undefined && (
                          <span className="text-[11px] font-bold text-slate-800 font-mono">
                            মোট: ৳{item.metadata.totalAmount.toLocaleString('bn-BD')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Hint */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900'
                      }`}
                    >
                      <span>{item.actionLabel || 'খুলুন'}</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Keyboard Shortcuts & Status */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-700 shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-700 shadow-2xs">
                ↓
              </kbd>
              <span>ন্যাভিগেট</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-700 shadow-2xs">
                ENTER
              </kbd>
              <span>সিলেক্ট</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-700 shadow-2xs">
                ESC
              </kbd>
              <span>বন্ধ করুন</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>সকল শাখার ইনভেন্টরি, গ্রাহক ও সেলস ডাটা কেন্দ্রীয়ভাবে ইনডেক্সড</span>
          </div>
        </div>
      </div>
    </div>
  );
};

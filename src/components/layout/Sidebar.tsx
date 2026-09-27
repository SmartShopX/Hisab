import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  Truck,
  FileSpreadsheet,
  CreditCard,
  Scale,
  Store,
  Compass,
  Send,
  ShieldAlert,
  BarChart3,
  Settings,
  Sparkles,
  HelpCircle,
  X,
  XCircle,
  FileText,
  RotateCcw,
  Zap,
  Wallet,
  PiggyBank,
  PhoneCall,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { BusinessSwitcher } from '../common/BusinessSwitcher';
import { LanguageToggle } from '../common/LanguageToggle';
import { ThemeToggle } from '../common/ThemeToggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHelpline?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenHelpline }) => {
  const { shop, hasPermission, canAccessFeature, activeAccountMode, activeBusinessId, switchToBusiness } = useAuth();
  const { t, isEn } = useLanguage();

  const businessNavItems = [
    {
      to: '/',
      label: t('nav.dashboard', 'ড্যাশবোর্ড'),
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      to: '/pos',
      label: t('nav.pos', 'পিওএস (POS)'),
      icon: ShoppingCart,
      badge: isEn ? 'POS' : 'সেলস',
      badgeColor: 'bg-emerald-500 text-white',
      allowed: hasPermission('canCreateSale') && canAccessFeature('pos'),
    },
    {
      to: '/sales',
      label: t('nav.sales_history', 'বিক্রয় হিস্ট্রি'),
      icon: Receipt,
      allowed: hasPermission('canViewSales') && canAccessFeature('sales'),
    },
    {
      to: '/orders',
      label: t('nav.orders', 'অর্ডারসমূহ'),
      icon: ShoppingBag,
      allowed: hasPermission('canManageOrders') && canAccessFeature('orders'),
    },
    {
      to: '/incomplete-orders',
      label: t('nav.incomplete_orders', 'অসম্পূর্ণ অর্ডার'),
      icon: XCircle,
      allowed: hasPermission('canManageOrders') && canAccessFeature('orders'),
    },
    {
      to: '/invoices',
      label: t('nav.invoices', 'চালান ও ইনভয়েস'),
      icon: FileText,
      allowed: canAccessFeature('invoices'),
    },
    {
      to: '/returns',
      label: t('nav.returns', 'রিটার্ন ও এক্সচেঞ্জ'),
      icon: RotateCcw,
      allowed: canAccessFeature('returns'),
    },
    {
      to: '/telecom',
      label: t('nav.telecom', 'টেলিকম ও রিচার্জ'),
      icon: Zap,
      badge: isEn ? 'Mobile' : 'মোবাইল',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      allowed: canAccessFeature('telecom'),
    },
    {
      to: '/products',
      label: t('nav.products', 'পণ্য ব্যবস্থাপনা'),
      icon: Package,
      allowed: hasPermission('canManageProducts') && canAccessFeature('products'),
    },
    {
      to: '/inventory',
      label: t('nav.inventory', 'ইনভেন্টরি ও স্টক'),
      icon: Boxes,
      allowed: hasPermission('canManageProducts') && canAccessFeature('inventory'),
    },
    {
      to: '/branches',
      label: isEn ? 'Branches & Multi-Stock' : 'শাখা ও ব্রাঞ্চ ম্যানেজমেন্ট',
      icon: Building2,
      badge: isEn ? 'Hub' : 'হাব',
      badgeColor: 'bg-emerald-500 text-white',
      allowed: canAccessFeature('branches'),
    },
    {
      to: '/customers',
      label: t('nav.customers', 'গ্রাহক তালিকা'),
      icon: Users,
      allowed: hasPermission('canManageCustomers') && canAccessFeature('customers'),
    },
    {
      to: '/suppliers',
      label: t('nav.suppliers', 'সরবরাহকারী'),
      icon: Truck,
      allowed: canAccessFeature('suppliers'),
    },
    {
      to: '/purchases',
      label: t('nav.purchases', 'ক্রয় চালান'),
      icon: FileSpreadsheet,
      allowed: canAccessFeature('purchases'),
    },
    {
      to: '/payments',
      label: t('nav.payments', 'পেমেন্ট ও ক্যাশ খাতা'),
      icon: CreditCard,
      allowed: hasPermission('canManagePayments') && canAccessFeature('payments'),
    },
    {
      to: '/due',
      label: t('nav.due_collection', 'বকেয়া ও দেনা-পাওনা'),
      icon: Scale,
      allowed: hasPermission('canManagePayments') && canAccessFeature('due'),
    },
    {
      to: '/expenses',
      label: isEn ? 'Business Expenses' : 'ব্যবসার খরচ (Expenses)',
      icon: Wallet,
      allowed: canAccessFeature('expenses'),
    },
    {
      to: '/staff',
      label: isEn ? 'Staff & Roles' : 'কর্মী ও পারমিশন',
      icon: Users,
      allowed: canAccessFeature('staff'),
    },
    {
      to: '/voice-calls',
      label: isEn ? 'AI Voice Calls & Dues' : 'এআই ভয়েস কল ও তাগাদা',
      icon: PhoneCall,
      badge: isEn ? 'Auto Call' : 'অটো কল',
      badgeColor: 'bg-emerald-500 text-white',
      allowed: hasPermission('canManageCustomers') && canAccessFeature('voice_calls'),
    },
    {
      to: '/online-store',
      label: t('nav.online_store', 'অনলাইন স্টোর'),
      icon: Store,
      badge: shop.storePublished ? (isEn ? 'Live' : 'লাইভ') : (isEn ? 'Draft' : 'ড্রাফট'),
      badgeColor: shop.storePublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700',
      allowed: canAccessFeature('online_store'),
    },
    {
      to: '/marketplace',
      label: isEn ? 'SmartShopX.bd' : 'SmartShopX.bd মার্কেটপ্লেস',
      icon: ShoppingBag,
      badge: isEn ? 'BD' : 'মার্কেট',
      badgeColor: 'bg-orange-500 text-white font-bold',
      allowed: canAccessFeature('marketplace'),
    },
    {
      to: '/landing-pages',
      label: t('nav.landing_builder', 'ল্যান্ডিং পেজ'),
      icon: Compass,
      allowed: canAccessFeature('landing_pages'),
    },
    {
      to: '/courier',
      label: t('nav.courier', 'কুরিয়ার ট্র্যাকিং'),
      icon: Send,
      allowed: canAccessFeature('courier'),
    },
    {
      to: '/risk-analysis',
      label: t('nav.customer_risk', 'কাস্টমার রিস্ক ও ফ্রড'),
      icon: ShieldAlert,
      allowed: canAccessFeature('risk_analysis'),
    },
    {
      to: '/personal',
      label: isEn ? 'Personal Finances' : 'ব্যক্তিগত হিসাব',
      icon: Wallet,
      badge: isEn ? 'Personal' : 'ব্যক্তিগত',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      allowed: canAccessFeature('personal'),
    },
    {
      to: '/reports',
      label: t('nav.reports', 'রিপোর্ট ও অ্যানালিটিক্স'),
      icon: BarChart3,
      allowed: hasPermission('canViewReports') && canAccessFeature('reports'),
    },
    {
      to: '/settings',
      label: t('nav.settings', 'ব্যবসার সেটিংস'),
      icon: Settings,
      allowed: canAccessFeature('settings'),
    },
    {
      to: '/subscription',
      label: t('nav.subscription', 'সাবস্ক্রিপশন প্ল্যান'),
      icon: Sparkles,
      badge: shop.subscriptionPlan,
      badgeColor: 'bg-indigo-100 text-indigo-800 font-semibold',
      allowed: true,
    },
  ];

  const personalNavItems = [
    {
      to: '/personal',
      label: isEn ? 'Personal Dashboard' : 'ব্যক্তিগত ড্যাশবোর্ড',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      to: '/personal?tab=transactions',
      label: isEn ? 'Income & Expenses' : 'আয় ও ব্যয় তালিকা',
      icon: Wallet,
      badge: isEn ? 'Cash' : 'ক্যাশ',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      allowed: true,
    },
    {
      to: '/personal?tab=savings',
      label: isEn ? 'DPS & Savings Ledger' : 'ডিপিএস ও সঞ্চয় খাতা',
      icon: PiggyBank,
      badge: isEn ? 'Savings' : 'সঞ্চয়',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
      allowed: true,
    },
    {
      to: '/personal?tab=budgets',
      label: isEn ? 'Monthly Budget Planner' : 'মাসিক বাজেট প্ল্যানার',
      icon: FileSpreadsheet,
      badge: isEn ? 'Budget' : 'বাজেট',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
      allowed: true,
    },
    {
      to: '/personal?tab=due',
      label: isEn ? 'Personal Loans & Dues' : 'ব্যক্তিগত ধার ও ঋণ',
      icon: Scale,
      badge: isEn ? 'Loans' : 'দেনা-পাওনা',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      allowed: true,
    },
    {
      to: '/personal?tab=reports',
      label: isEn ? 'Personal Financial Report' : 'ব্যক্তিগত আর্থিক রিপোর্ট',
      icon: BarChart3,
      allowed: true,
    },
  ];

  const navItems = activeAccountMode === 'personal' ? personalNavItems : businessNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Smart Hisab Logo"
              className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shadow-sm shrink-0 border border-slate-700"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">Smart Hisab</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                  Client
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                {activeAccountMode === 'personal' ? 'ব্যক্তিগত খাতা' : shop.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business & Account Switcher in Sidebar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <BusinessSwitcher variant="sidebar" />
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {navItems
            .filter((item) => item.allowed)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 shrink-0 opacity-90" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

          {activeAccountMode === 'personal' && (
            <div className="p-3 mt-4 bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-800/80 rounded-xl text-center">
              <p className="text-xs text-emerald-300 font-semibold mb-1.5">দোকান পরিচালনা করবেন?</p>
              <button
                onClick={() => {
                  switchToBusiness(activeBusinessId || 'shop_101');
                  onClose();
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                🏢 ব্যবসা মোডে ফিরুন
              </button>
            </div>
          )}
        </nav>

        {/* Footer Support Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <ThemeToggle variant="sidebar" />

          <PWAInstallButton variant="sidebar" />

          <button
            type="button"
            onClick={() => {
              if (onOpenHelpline) {
                onOpenHelpline();
                onClose();
              }
            }}
            className="w-full text-left bg-slate-800/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-700/80 text-xs transition-all cursor-pointer group shadow-xs block"
          >
            <div className="flex items-center justify-between text-slate-200 font-semibold mb-1">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400 group-hover:animate-bounce" />
                <span className="group-hover:text-emerald-300 transition-colors">স্মার্ট হেল্পলাইন</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">২৪/৭ কাস্টমার ও টেকনিক্যাল সাপোর্ট</p>
            <p className="font-mono text-emerald-400 text-xs mt-1 font-semibold flex items-center justify-between">
              <span>01836-686869</span>
              <span className="text-[10px] text-slate-400 group-hover:text-white underline">সহায়তা নিন &rarr;</span>
            </p>
          </button>
        </div>
      </aside>
    </>
  );
};

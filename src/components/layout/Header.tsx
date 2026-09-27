import React, { useState, useEffect } from 'react';
import {
  Menu,
  ShoppingCart,
  Globe,
  UserCheck,
  LogOut,
  ExternalLink,
  ChevronDown,
  Bell,
  Sparkles,
  Cloud,
  Shield,
  Wifi,
  WifiOff,
  RefreshCw,
  Headset,
  HelpCircle,
  Search,
  Command,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { CloudSyncModal } from '../common/CloudSyncModal';
import { BusinessSwitcher } from '../common/BusinessSwitcher';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { LanguageToggle } from '../common/LanguageToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { offlineSyncService } from '../../services/offlineSyncService';
import { UserRole } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenHelpline?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenHelpline }) => {
  const { user, shop, role, switchRole, logout } = useAuth();
  const { t, isEn } = useLanguage();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const roleLabels: Record<UserRole, { label: string; badge: string }> = {
    owner: { label: isEn ? 'Owner (Admin)' : 'মালিক (Owner)', badge: 'bg-emerald-100 text-emerald-800' },
    manager: { label: isEn ? 'Manager' : 'ম্যানেজার (Manager)', badge: 'bg-indigo-100 text-indigo-800' },
    cashier: { label: isEn ? 'Cashier' : 'ক্যাশিয়ার (Cashier)', badge: 'bg-amber-100 text-amber-800' },
    stock_keeper: { label: isEn ? 'Stock Keeper' : 'স্টক কিপার (Stock)', badge: 'bg-purple-100 text-purple-800' },
    staff: { label: isEn ? 'Staff' : 'স্টাফ (Staff)', badge: 'bg-slate-100 text-slate-800' },
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shadow-2xs transition-colors">
        {/* Left section: Hamburger & Store / Account Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-1 sm:-ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors lg:hidden cursor-pointer"
            title="মেনু খুলুন"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Business & Personal Account Switcher */}
          <BusinessSwitcher variant="header" />

          <div className="hidden 2xl:flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {shop.category}
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <a
              href={`#/online-store`}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
              title="আপনার অনলাইন স্টোর লিংক"
            >
              <span>smartshopx.store/{shop.storeSlug}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <a
              href={`#/marketplace`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800/60 flex items-center gap-1 transition-colors"
              title="সেন্ট্রাল মেগা মার্কেটপ্লেস ভিজিট করুন (SmartShopX.bd)"
            >
              <ShoppingCart className="w-3 h-3" />
              <span>SmartShopX.bd</span>
            </a>
          </div>
        </div>

        {/* Middle section: Global Search Bar across all branches */}
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs transition-all cursor-pointer group shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-500/50"
            title={isEn ? 'Global Search (Ctrl + K)' : 'গ্লোবাল সার্চ (Ctrl + K)'}
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
              <span className="truncate">{t('header.search_placeholder', 'পণ্য, কাস্টমার, অর্ডার বা সব শাখায় খুঁজুন...')}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 ml-2">
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs group-hover:border-emerald-200 dark:group-hover:border-emerald-700">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </span>
          </button>
        </div>

        {/* Right section: Mobile Search Icon, Quick POS, Role Switcher, Language & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile / Tablet Search Button */}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors md:hidden cursor-pointer border border-slate-200 dark:border-slate-700"
            title={isEn ? 'Search' : 'গ্লোবাল সার্চ'}
          >
            <Search className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Visual Cloud Sync / Offline Status Indicator */}
          <SyncStatusIndicator onOpenCloudModal={() => setCloudModalOpen(true)} />

          {/* PWA Install Button */}
          <PWAInstallButton compact={true} />

          {/* Smart Helpline Button */}
          <button
            type="button"
            onClick={onOpenHelpline}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
            title={isEn ? '24/7 Helpline & Support' : '২৪/৭ স্মার্ট হেল্পলাইন ও সাপোর্ট সেন্টার'}
          >
            <span className="relative flex items-center justify-center">
              <Headset className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span className="hidden lg:inline">{isEn ? 'Helpline' : 'হেল্পলাইন'}</span>
          </button>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Global Dark Mode Switcher */}
          <ThemeToggle variant="header" />

          {/* Quick POS action */}
          <Button
            onClick={() => navigate('/pos')}
            variant="primary"
            size="sm"
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            className="hidden sm:inline-flex shadow-emerald-100 dark:shadow-none"
          >
            <span>{isEn ? 'Quick POS' : 'দ্রুত বিক্রয়'}</span>
          </Button>

          {/* Role Preview Switcher Dropdown */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-1.5" />
            <select
              value={role}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold text-xs border-none focus:outline-none cursor-pointer py-0.5 pr-2"
              title={isEn ? 'Switch role' : 'ভূমিকা বা রোল পরিবর্তন করুন'}
            >
              <option value="owner" className="dark:bg-slate-900 dark:text-white">{isEn ? 'Owner (Full Access)' : 'মালিক (Full Access)'}</option>
              <option value="manager" className="dark:bg-slate-900 dark:text-white">{isEn ? 'Manager' : 'ম্যানেজার (Manager)'}</option>
              <option value="cashier" className="dark:bg-slate-900 dark:text-white">{isEn ? 'Cashier (Sales POS)' : 'ক্যাশিয়ার (Sales POS)'}</option>
              <option value="stock_keeper" className="dark:bg-slate-900 dark:text-white">{isEn ? 'Stock Keeper' : 'স্টক কিপার (Inventory)'}</option>
            </select>
          </div>

          {/* Modern Language switch */}
          <LanguageToggle variant="compact" />

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{roleLabels[role]?.label || 'রোল'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-30 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{user?.mobile}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>প্ল্যান: {shop.subscriptionPlan}</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${roleLabels[role]?.badge}`}>
                        {role}
                      </span>
                    </div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setSearchModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>গ্লোবাল সার্চ (সকল শাখা)</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        if (onOpenHelpline) onOpenHelpline();
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Headset className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>স্মার্ট হেল্পলাইন ও সাপোর্ট</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setCloudModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>ক্লাউড সিঙ্ক ও ব্যাকআপ</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span>দোকান প্রোফাইল ও সেটিংস</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/subscription');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>প্যাকেজ ও সাবস্ক্রিপশন</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1 p-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>লগ আউট</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Role Notice Banner when role !== 'owner' */}
      {role !== 'owner' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between sticky top-16 z-20 shadow-2xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              আপনি বর্তমানে <strong>{roleLabels[role]?.label}</strong> রোলে আছেন। এই রোলের নির্ধারিত সীমিত অ্যাক্সেস সক্রিয় রয়েছে।
            </span>
          </div>
          <button
            onClick={() => switchRole('owner')}
            className="text-[11px] font-bold text-amber-900 underline hover:text-amber-700 ml-2 shrink-0 cursor-pointer"
          >
            মালিক রোলে ফিরুন
          </button>
        </div>
      )}

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
      />
    </>
  );
};

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface MobileBottomNavProps {
  onToggleSidebar?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onToggleSidebar }) => {
  const { hasPermission, canAccessFeature } = useAuth();
  const { isEn } = useLanguage();
  const location = useLocation();

  const isPos = location.pathname === '/pos';

  return (
    <nav
      aria-label={isEn ? 'Mobile Navigation Bar' : 'মোবাইল নেভিগেশন বার'}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-2 transition-colors"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. ড্যাশবোর্ড / হোম */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all select-none min-h-[44px] ${
              isActive
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : ''
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 font-medium leading-none tracking-tight">
                {isEn ? 'Home' : 'হোম'}
              </span>
            </>
          )}
        </NavLink>

        {/* 2. পণ্য ও স্টক */}
        {canAccessFeature('products') && (
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all select-none min-h-[44px] ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : ''
                  }`}
                >
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 font-medium leading-none tracking-tight">
                  {isEn ? 'Products' : 'পণ্য'}
                </span>
              </>
            )}
          </NavLink>
        )}

        {/* 3. সেন্টার পিওএস (Elevated Quick POS Button) */}
        {hasPermission('canCreateSale') && canAccessFeature('pos') && (
          <div className="flex-1 flex flex-col items-center justify-center -mt-5">
            <NavLink
              to="/pos"
              className={`w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-lg flex items-center justify-center border-3 border-white dark:border-slate-900 transition-all transform active:scale-95 ${
                isPos
                  ? 'ring-2 ring-emerald-600 dark:ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-emerald-600/40'
                  : 'shadow-emerald-600/30 hover:scale-105'
              }`}
              title={isEn ? 'Create POS Receipt' : 'নতুন বিক্রয় রসিদ তৈরি করুন'}
            >
              <ShoppingCart className="w-5 h-5 text-white" />
            </NavLink>
            <span
              className={`text-[10px] mt-1 font-bold leading-none ${
                isPos ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {isEn ? 'POS Sale' : 'বিক্রি (POS)'}
            </span>
          </div>
        )}

        {/* 4. বাকি খাতা (Due Khata) */}
        {hasPermission('canManagePayments') && canAccessFeature('due') && (
          <NavLink
            to="/due"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all select-none min-h-[44px] ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : ''
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 font-medium leading-none tracking-tight">
                  {isEn ? 'Due Khata' : 'বাকি খাতা'}
                </span>
              </>
            )}
          </NavLink>
        )}

        {/* 5. মেনু ও অন্যান্য (Full Sidebar Drawer Trigger) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all select-none min-h-[44px] cursor-pointer"
          title={isEn ? 'All features & settings menu' : 'দোকানের সকল ফিচার ও সেটিংস মেনু'}
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-none tracking-tight">
            {isEn ? 'Menu' : 'মেনু'}
          </span>
        </button>
      </div>
    </nav>
  );
};


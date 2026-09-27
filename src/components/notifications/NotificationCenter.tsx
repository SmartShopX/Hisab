import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  Package,
  DollarSign,
  Clock,
  Sparkles,
  ChevronRight,
  Check,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
  Send,
  Calendar,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { DataStore } from '../../services/dataStorage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { smsService } from '../../services/smsService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Product, Customer } from '../../types';

export type NotificationType = 'stock' | 'due' | 'subscription' | 'general';
export type NotificationPriority = 'critical' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionUrl?: string;
  product?: Product;
  customer?: Customer;
  extraMeta?: string;
}

export const NotificationCenter: React.FC = () => {
  const { shop } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stock' | 'due' | 'subscription'>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartshopx_dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartshopx_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Generate dynamic live alerts
  const notifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = [];
    const now = new Date();

    // 1. Low Stock & Out of Stock Alerts
    const products = DataStore.getProducts();
    const lowStockProducts = products.filter(
      (p) => p.isActive !== false && p.stock <= (p.minStock || 5)
    );

    lowStockProducts.forEach((p) => {
      const isZero = p.stock <= 0;
      list.push({
        id: `stock_${p.id}`,
        type: 'stock',
        priority: isZero ? 'critical' : 'warning',
        title: isZero ? `স্টক আউট: ${p.name}` : `কম স্টক অ্যালার্ট: ${p.name}`,
        message: isZero
          ? `পণ্যটির স্টক ০ হয়ে গেছে! দ্রুত নতুন চালান যোগ করুন।`
          : `বর্তমানে মাত্র ${p.stock} ${p.unit || 'টি'} স্টকে রয়েছে (নূন্যতম সীমা: ${p.minStock || 5})।`,
        timestamp: 'লাইভ ইনভেন্টরি',
        isRead: readIds.includes(`stock_${p.id}`),
        actionLabel: '+ স্টক যোগ করুন',
        actionUrl: `/products?search=${encodeURIComponent(p.name)}`,
        product: p,
      });
    });

    // 2. Upcoming Due Payments from Customers
    const customers = DataStore.getCustomers();
    const dueCustomers = customers.filter((c) => (c.totalDue || 0) > 0);

    dueCustomers.forEach((c) => {
      const isHighDue = c.totalDue >= 5000 || (c.oldestDueDays && c.oldestDueDays > 15);
      const daysText = c.oldestDueDays ? `${c.oldestDueDays} দিন ধরে বাকি` : 'বকেয়া পাওনা';
      list.push({
        id: `due_${c.id}`,
        type: 'due',
        priority: isHighDue ? 'critical' : 'warning',
        title: `বাকি পাওনা তাগাদা: ${c.name}`,
        message: `মোট পাওনা ${formatCurrency(c.totalDue)} (${daysText})। মোবাইল: ${c.mobile}`,
        timestamp: c.dueDate ? `পাওনার তারিখ: ${c.dueDate}` : 'চলমান বকেয়া',
        isRead: readIds.includes(`due_${c.id}`),
        actionLabel: 'SMS তাগাদা পাঠান',
        actionUrl: `/customers?search=${encodeURIComponent(c.mobile || c.name)}`,
        customer: c,
      });
    });

    // 3. Subscription Renewal Alerts
    if (shop.subscriptionExpiry) {
      const expiryDate = new Date(shop.subscriptionExpiry);
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 15) {
        const isExpired = diffDays <= 0;
        list.push({
          id: `sub_renewal_${shop.id}`,
          type: 'subscription',
          priority: isExpired ? 'critical' : 'warning',
          title: isExpired
            ? 'সাবস্ক্রিপশন মেয়াদোত্তীর্ণ হয়েছে!'
            : `সাবস্ক্রিপশন রিনিউয়াল নোটিশ (${diffDays} দিন বাকি)`,
          message: isExpired
            ? `আপনার ${shop.subscriptionPlan} প্যাকেজের মেয়াদ শেষ হয়ে গেছে। সফটওয়্যার নিরবচ্ছিন্ন রাখতে রিনিউ করুন।`
            : `আপনার ${shop.subscriptionPlan} প্যাকেজের মেয়াদ আগামী ${formatDate(shop.subscriptionExpiry)} তারিখে শেষ হবে।`,
          timestamp: formatDate(shop.subscriptionExpiry),
          isRead: readIds.includes(`sub_renewal_${shop.id}`),
          actionLabel: 'প্ল্যান রিনিউ / আপগ্রেড',
          actionUrl: '/settings?tab=subscription',
          extraMeta: `${shop.subscriptionPlan} Plan`,
        });
      } else {
        // Standard Plan Active Notice
        list.push({
          id: `sub_active_${shop.id}`,
          type: 'subscription',
          priority: 'info',
          title: `সাবস্ক্রিপশন সক্রিয় (${shop.subscriptionPlan})`,
          message: `আপনার প্ল্যানের মেয়াদ আছে ${formatDate(shop.subscriptionExpiry)} পর্যন্ত (${diffDays} দিন বাকি)।`,
          timestamp: 'সক্রিয় প্ল্যান',
          isRead: readIds.includes(`sub_active_${shop.id}`),
          actionLabel: 'প্ল্যান বিবরণ দেখুন',
          actionUrl: '/settings?tab=subscription',
        });
      }
    }

    return list.filter((item) => !dismissedIds.includes(item.id));
  }, [shop, dismissedIds, readIds, isOpen]);

  // Unread badge count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Critical alerts count
  const criticalCount = useMemo(() => {
    return notifications.filter((n) => n.priority === 'critical').length;
  }, [notifications]);

  // Filtered list by active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter((n) => n.type === activeTab);
  }, [notifications, activeTab]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem('smartshopx_read_notifications', JSON.stringify(updated));
    } catch {}
    showToast('সকল নোটিফিকেশন পড়া হিসেবে চিহ্নিত হয়েছে', 'info');
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem('smartshopx_read_notifications', JSON.stringify(updated));
      } catch {}
    }
  };

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('smartshopx_dismissed_notifications', JSON.stringify(updated));
    } catch {}
    showToast('নোটিফিকেশন সরানো হয়েছে', 'info');
  };

  const handleSendDueSms = async (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    if (!customer.mobile) {
      showToast('গ্রাহকের মোবাইল নম্বর নেই', 'warning');
      return;
    }
    const success = smsService.sendDueReminder(customer.name, customer.mobile, customer.totalDue);
    if (success) {
      showToast(`${customer.name} কে বাকি তাগাদা SMS পাঠানো হয়েছে!`, 'success');
    } else {
      showToast('SMS গেটওয়ে সেটিংসে Due Reminder ট্রিগার সক্রিয় করুন', 'info');
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : unreadCount > 0
            ? 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 text-slate-700 hover:text-emerald-700'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
        }`}
        title="নোটিফিকেশন সেন্টার (স্টক, বাকি তাগাদা, সাবস্ক্রিপশন)"
      >
        <Bell className="w-4 h-4 transition-transform active:scale-95" />

        {/* Dynamic Badge Counter */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-mono font-bold flex items-center justify-center text-white shadow-xs ${
              criticalCount > 0
                ? 'bg-rose-600 animate-pulse'
                : 'bg-emerald-600'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Notification Center Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">নোটিফিকেশন সেন্টার</h3>
                <p className="text-[10px] text-slate-300 leading-tight">
                  {unreadCount} টি নতুন অ্যালার্ট ও সতর্কতা
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-emerald-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
                title="সবগুলো পড়া হিসেবে চিহ্নিত করুন"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>সব পড়া হয়েছে</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center border-b border-slate-100 bg-slate-50 px-2 py-1.5 gap-1 overflow-x-auto no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              সবগুলো ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'stock'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-3 h-3 text-amber-600" />
              <span>কম স্টক</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('due')}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'due'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-3 h-3 text-rose-600" />
              <span>বাকি তাগাদা</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'subscription'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>প্ল্যান</span>
            </button>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-semibold text-slate-700">কোনো জরুরি সতর্কতা নেই!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">সবকিছু ঠিকঠাক এবং স্বাভাবিক গতিতে চলছে।</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isStock = notif.type === 'stock';
                const isDue = notif.type === 'due';
                const isSub = notif.type === 'subscription';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 rounded-xl transition-all cursor-pointer relative group flex items-start gap-2.5 ${
                      !notif.isRead
                        ? 'bg-slate-50/80 hover:bg-slate-100/90'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Unread Indicator Dot */}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                    )}

                    {/* Icon Badge */}
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        notif.priority === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : notif.priority === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isStock ? (
                        <Package className="w-4 h-4" />
                      ) : isDue ? (
                        <DollarSign className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>

                    {/* Notification Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            notif.priority === 'critical' ? 'text-rose-900' : 'text-slate-900'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => dismissNotification(e, notif.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity rounded-md"
                          title="নোটিফিকেশন মুছুন"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action Button & Metadata */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100/80 text-[10px]">
                        <span className="text-slate-400 font-medium">
                          {notif.timestamp}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isDue && notif.customer && (
                            <button
                              type="button"
                              onClick={(e) => handleSendDueSms(e, notif.customer!)}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 transition-colors"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>SMS তাগাদা</span>
                            </button>
                          )}

                          {notif.actionLabel && (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5 group-hover:underline">
                              <span>{notif.actionLabel}</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/products?filter=low_stock');
              }}
              className="text-slate-600 hover:text-emerald-700 font-semibold"
            >
              📦 কম স্টক তালিকা
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/settings?tab=subscription');
              }}
              className="text-slate-600 hover:text-indigo-700 font-semibold"
            >
              ⭐ সাবস্ক্রিপশন সেটিংস
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

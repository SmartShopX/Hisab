import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import { SmartHelplineModal } from '../common/SmartHelplineModal';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);
  const { shop } = useAuth();
  const isSuspended = shop.subscriptionStatus === 'Suspended' || shop.isSuspended;

  // Listen to global open_smart_helpline events
  useEffect(() => {
    const handleOpenHelplineEvent = () => setIsHelplineOpen(true);
    window.addEventListener('open_smart_helpline', handleOpenHelplineEvent);
    return () => {
      window.removeEventListener('open_smart_helpline', handleOpenHelplineEvent);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-x-hidden transition-colors duration-200">
      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenHelpline={() => setIsHelplineOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {isSuspended && (
          <div className="bg-rose-600 text-white px-4 py-2 text-xs sm:text-sm font-medium text-center flex items-center justify-center gap-2 shadow-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              সতর্কতা: এই দোকানের কার্যক্রম সাময়িকভাবে স্থগিত (Suspended) রয়েছে। অনুগ্রহ করে সেন্ট্রাল অ্যাডমিন বা সাপোর্টের সাথে যোগাযোগ করুন।
            </span>
          </div>
        )}
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenHelpline={() => setIsHelplineOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <MobileBottomNav onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Global Smart Helpline Modal */}
        <SmartHelplineModal
          isOpen={isHelplineOpen}
          onClose={() => setIsHelplineOpen(false)}
        />
      </div>
    </div>
  );
};

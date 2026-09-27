import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  ArrowUpRight,
  Sparkles,
  Zap,
  Info,
  ShieldCheck,
  Play,
  RotateCcw,
  Check,
  Trash2,
  ListOrdered,
} from 'lucide-react';
import { offlineSyncService, SyncState, QueuedSale } from '../../services/offlineSyncService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

interface SyncStatusIndicatorProps {
  onOpenCloudModal?: () => void;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  onOpenCloudModal,
  className = '',
}) => {
  const { isEn } = useLanguage();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => offlineSyncService.isOnline());
  const [syncState, setSyncState] = useState<SyncState>(() => offlineSyncService.getSyncState());
  const [pendingCount, setPendingCount] = useState(() => offlineSyncService.getPendingCount());
  const [pendingAmount, setPendingAmount] = useState(() => offlineSyncService.getPendingTotalAmount());
  const [progress, setProgress] = useState(() => offlineSyncService.getSyncProgress());
  const [lastSyncTime, setLastSyncTime] = useState(() => offlineSyncService.getLastSyncTime());
  const [queue, setQueue] = useState<QueuedSale[]>(() => offlineSyncService.getQueue());
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(() =>
    offlineSyncService.isSimulatingOffline()
  );
  const [justSyncedFlash, setJustSyncedFlash] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const prevSyncStateRef = useRef<SyncState>(syncState);

  // Subscribe to offline sync events
  useEffect(() => {
    const update = () => {
      const online = offlineSyncService.isOnline();
      const state = offlineSyncService.getSyncState();
      const count = offlineSyncService.getPendingCount();
      const amount = offlineSyncService.getPendingTotalAmount();
      const prog = offlineSyncService.getSyncProgress();
      const lastTime = offlineSyncService.getLastSyncTime();
      const currentQueue = offlineSyncService.getQueue();
      const sim = offlineSyncService.isSimulatingOffline();

      // Check if transitioned from syncing to synced -> trigger success flash
      if (prevSyncStateRef.current === 'syncing' && state === 'synced') {
        setJustSyncedFlash(true);
        setTimeout(() => setJustSyncedFlash(false), 4500);
      }
      prevSyncStateRef.current = state;

      setIsOnline(online);
      setSyncState(state);
      setPendingCount(count);
      setPendingAmount(amount);
      setProgress(prog);
      setLastSyncTime(lastTime);
      setQueue(currentQueue);
      setIsSimulatingOffline(sim);
    };

    const unsubscribe = offlineSyncService.subscribe(update);
    update();

    return unsubscribe;
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Manual Sync Now
  const handleManualSync = async () => {
    if (!isOnline) {
      showToast(
        isEn
          ? 'Device is offline. Cannot sync until connected.'
          : 'ডিভাইসটি বর্তমানে অফলাইনে আছে। ইন্টারনেট সংযোগ পাওয়ার পর সিঙ্ক হবে।',
        'warning'
      );
      return;
    }
    const count = offlineSyncService.getPendingCount();
    if (count === 0) {
      // Small trigger to update last sync time and give visual feedback
      offlineSyncService.setLastSyncTime();
      setJustSyncedFlash(true);
      setTimeout(() => setJustSyncedFlash(false), 3500);
      showToast(
        isEn
          ? 'All POS data is completely in sync with cloud!'
          : 'সব পিওএস ডাটা ক্লাউড ডাটাবেজের সাথে সম্পূর্ণ সিঙ্কড আছে!',
        'success'
      );
      return;
    }

    try {
      const res = await offlineSyncService.syncAllPending();
      if (res.synced > 0) {
        showToast(
          isEn
            ? `Successfully synced ${res.synced} offline transaction(s) to cloud!`
            : `${res.synced} টি অফলাইন বিক্রয় সফলভাবে ক্লাউডে সিঙ্ক হয়েছে!`,
          'success'
        );
      }
    } catch {
      showToast(isEn ? 'Sync encountered an error.' : 'সিঙ্ক করার সময় ত্রুটি হয়েছে।', 'error');
    }
  };

  // Toggle offline simulation for testing
  const handleToggleSimulation = () => {
    const newState = offlineSyncService.toggleOfflineSimulation();
    setIsSimulatingOffline(newState);
    if (newState) {
      showToast(
        isEn
          ? 'Offline Simulation Mode Enabled. POS will now store bills locally.'
          : 'অফলাইন টেস্ট মোড সক্রিয়! এখন পিওএস বিক্রয় ডিভাইসে সংরক্ষিত হবে।',
        'info'
      );
    } else {
      showToast(
        isEn
          ? 'Offline Simulation Disabled. Connected back online & syncing...'
          : 'অফলাইন টেস্ট বন্ধ করা হয়েছে! অনলাইন সংযোগ ফিরে এসেছে এবং সিঙ্ক শুরু হচ্ছে...',
        'success'
      );
    }
  };

  // Generate a sample offline transaction to test
  const handleAddSampleOfflineSale = () => {
    const item = offlineSyncService.enqueueSampleOfflineSale();
    showToast(
      isEn
        ? `Added sample offline sale (${item.customerName}, ৳${item.totalAmount}) to queue!`
        : `নমুনা অফলাইন বিক্রয় (${item.customerName}, ৳${item.totalAmount}) কিউতে যোগ করা হয়েছে!`,
      'info'
    );
  };

  // Clear synced queue history
  const handleClearSynced = () => {
    offlineSyncService.clearSynced();
    showToast(isEn ? 'Cleared synced history' : 'সিঙ্ককৃত হিস্ট্রি মুছে ফেলা হয়েছে', 'info');
  };

  // Compute sync progress percentage
  const syncPercent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 100;

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Visual Header Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none shadow-2xs ${
          !isOnline
            ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300'
            : syncState === 'syncing'
            ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 shadow-md shadow-indigo-100/50 dark:shadow-none animate-pulse'
            : justSyncedFlash
            ? 'border-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/50 scale-[1.02]'
            : syncState === 'error'
            ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
            : pendingCount > 0
            ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300'
            : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
        }`}
        title={
          !isOnline
            ? isEn
              ? `Offline Mode: ${pendingCount} pending local changes`
              : `ইন্টারনেট অফলাইন: ${pendingCount} টি লোকাল ডাটা অপেক্ষমান`
            : syncState === 'syncing'
            ? isEn
              ? `Syncing ${progress.current}/${progress.total} items to cloud...`
              : `ক্লাউডে সিঙ্ক হচ্ছে: ${progress.current}/${progress.total}...`
            : justSyncedFlash
            ? isEn
              ? 'Sync Complete!'
              : 'সিঙ্ক সফল হয়েছে!'
            : isEn
            ? 'Cloud Safe & Synced'
            : 'ক্লাউড সিঙ্কড ও নিরাপদ'
        }
      >
        {/* Dynamic Status Icon */}
        {!isOnline ? (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline font-bold">
              {isEn ? 'Offline' : 'অফলাইন'}
              {pendingCount > 0 ? ` (${pendingCount})` : ''}
            </span>
            {pendingCount > 0 && (
              <span className="md:hidden px-1.5 py-0.2 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-[10px] rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </div>
        ) : syncState === 'syncing' ? (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span className="hidden md:inline font-bold">
              {isEn
                ? `Syncing (${progress.current}/${progress.total || pendingCount})`
                : `সিঙ্ক হচ্ছে (${progress.current}/${progress.total || pendingCount})`}
            </span>
            <span className="md:hidden text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              {progress.current}/{progress.total || pendingCount}
            </span>
          </div>
        ) : justSyncedFlash ? (
          <div className="flex items-center gap-1.5 animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline font-bold">
              {isEn ? 'Synced!' : 'সিঙ্ক সম্পন্ন!'}
            </span>
          </div>
        ) : syncState === 'error' ? (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden md:inline font-bold">
              {isEn ? 'Sync Error' : 'সিঙ্ক ত্রুটি'}
            </span>
          </div>
        ) : pendingCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">
              {isEn ? `Sync (${pendingCount})` : `সিঙ্ক (${pendingCount})`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">{isEn ? 'Cloud' : 'ক্লাউড'}</span>
          </div>
        )}

        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 hidden sm:inline-block ${
            isOpen ? 'rotate-180 text-slate-700 dark:text-slate-200' : ''
          }`}
        />

        {/* Mini progress bar if syncing */}
        {syncState === 'syncing' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-indigo-200 dark:bg-indigo-900 rounded-b-xl overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
              style={{ width: `${syncPercent}%` }}
            />
          </div>
        )}
      </button>

      {/* Popover / Sync Status Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-xs transition-all animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header Banner */}
          <div
            className={`p-3.5 border-b flex items-center justify-between ${
              !isOnline
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
                : syncState === 'syncing'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60'
                : syncState === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
                  !isOnline
                    ? 'bg-amber-500 text-white'
                    : syncState === 'syncing'
                    ? 'bg-indigo-600 text-white animate-spin'
                    : syncState === 'error'
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {!isOnline ? (
                  <WifiOff className="w-4 h-4" />
                ) : syncState === 'syncing' ? (
                  <RefreshCw className="w-4 h-4" />
                ) : syncState === 'error' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                  {!isOnline
                    ? isEn
                      ? 'Offline Mode Active'
                      : 'অফলাইন মোড সক্রিয়'
                    : syncState === 'syncing'
                    ? isEn
                      ? 'Synchronizing POS Data...'
                      : 'পিওএস ডাটা সিঙ্ক হচ্ছে...'
                    : syncState === 'error'
                    ? isEn
                      ? 'Sync Alert'
                      : 'সিঙ্কে সতর্কতা'
                    : isEn
                    ? 'Cloud Connected & Synced'
                    : 'ক্লাউড ডাটাবেজ সিঙ্কড'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {!isOnline
                    ? isEn
                      ? 'POS sales are securely buffered locally'
                      : 'বিক্রয় ডাটা ব্রাউজার মেমোরিতে সংরক্ষিত হচ্ছে'
                    : syncState === 'syncing'
                    ? isEn
                      ? `Uploading ${progress.current} of ${progress.total || pendingCount} items`
                      : `ক্লাউডে আপলোড হচ্ছে (${progress.current}/${progress.total || pendingCount})`
                    : isEn
                    ? `Last updated: ${lastSyncTime}`
                    : `সর্বশেষ আপডেট: ${lastSyncTime}`}
                </p>
              </div>
            </div>

            {/* Connection badge */}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                isOnline
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
            >
              {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              {isOnline ? (isEn ? 'ONLINE' : 'অনলাইন') : (isEn ? 'OFFLINE' : 'অফলাইন')}
            </span>
          </div>

          {/* Sync Progress Bar if actively syncing */}
          {syncState === 'syncing' && (
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium text-indigo-900 dark:text-indigo-200">
                <span>{progress.currentItemName || 'আইটেম সিঙ্ক হচ্ছে...'}</span>
                <span>{syncPercent}%</span>
              </div>
              <div className="w-full bg-indigo-100 dark:bg-indigo-900/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${syncPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  {isEn ? 'Pending Queue' : 'অপেক্ষমান কিউ'}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {pendingCount} {isEn ? 'sales' : 'টি বিক্রয়'}
                  {pendingAmount > 0 ? ` (৳${pendingAmount})` : ''}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  {isEn ? 'Last Sync' : 'সর্বশেষ সিঙ্ক'}
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-[100px]">
                  {lastSyncTime}
                </p>
              </div>
            </div>
          </div>

          {/* Pending / Recent Queue Items Inspection */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-slate-400" />
                <span>{isEn ? 'POS Offline Queue' : 'অফলাইন পিওএস কিউ ট্র্যাকার'}</span>
              </span>
              {queue.some((q) => q.status === 'SYNCED') && (
                <button
                  type="button"
                  onClick={handleClearSynced}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5 cursor-pointer"
                  title="সিঙ্ক হওয়া তালিকা ক্লিয়ার করুন"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isEn ? 'Clear' : 'মুছুন'}</span>
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="py-4 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/50">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500/80" />
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {isEn ? 'No pending offline sales' : 'কোনো অফলাইন বিক্রয় কিউতে জমা নেই'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isEn
                    ? 'All transactions synced to cloud'
                    : 'সকল লেনদেন সুরক্ষিত ক্লাউডে আপ-টু-ডেট'}
                </p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {queue.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.customerName || 'কাস্টমার'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{item.itemCount || 1} টি পণ্য</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          ৳{item.totalAmount || 0}
                        </span>
                      </p>
                    </div>

                    <div className="shrink-0 ml-2">
                      {item.status === 'PENDING' ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {isEn ? 'Pending' : 'অপেক্ষমান'}
                        </span>
                      ) : item.status === 'FAILED' ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {isEn ? 'Failed' : 'ব্যর্থ'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          {isEn ? 'Synced' : 'সিঙ্কড'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons & Simulation Tools */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncState === 'syncing' || !isOnline}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${syncState === 'syncing' ? 'animate-spin' : ''}`}
                />
                <span>
                  {syncState === 'syncing'
                    ? isEn
                      ? 'Syncing Now...'
                      : 'সিঙ্ক হচ্ছে...'
                    : isEn
                    ? 'Sync Cloud Now'
                    : 'এখনই সিঙ্ক করুন'}
                </span>
              </button>

              {onOpenCloudModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCloudModal();
                  }}
                  className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="সম্পূর্ণ ব্যাকআপ ও ডাটা ভল্ট খুলুন"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isEn ? 'Vault' : 'ভল্ট'}</span>
                </button>
              )}
            </div>

            {/* Simulation / Testing Toolkit for Offline Demo */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={handleToggleSimulation}
                className={`font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  isSimulatingOffline
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="অফলাইন মোড টেস্ট করতে নেটওয়ার্ক বিচ্ছিন্নতার সিমুলেশন করুন"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>
                  {isSimulatingOffline
                    ? isEn
                      ? 'Exit Offline Test'
                      : 'অফলাইন টেস্ট বন্ধ'
                    : isEn
                    ? 'Test Offline Mode'
                    : 'অফলাইন মোড টেস্ট'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleAddSampleOfflineSale}
                className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="কিউতে একটি নমুনা বিক্রয় যোগ করুন"
              >
                <Play className="w-2.5 h-2.5" />
                <span>{isEn ? '+ Sample Sale' : '+ নমুনা সেল'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;

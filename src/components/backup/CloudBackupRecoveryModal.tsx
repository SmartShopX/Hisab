import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  Download,
  Upload,
  Database,
  ShieldCheck,
  Server,
  X,
  CheckCircle2,
  HardDrive,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Package,
  Users,
  Building2,
  Trash2,
  AlertTriangle,
  History,
  Lock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Printer,
  HelpCircle,
} from 'lucide-react';
import { DataStore } from '../../services/dataStorage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { csvHelper } from '../../utils/csvHelper';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { backupService, BackupSnapshotItem, BackupDryRunResult } from '../../services/backupService';
import { Button } from '../common/Button';

interface CloudBackupRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'sync' | 'csv' | 'pdf' | 'restore' | 'reset';
}

export const CloudBackupRecoveryModal: React.FC<CloudBackupRecoveryModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'sync',
}) => {
  const { shop } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sync' | 'csv' | 'pdf' | 'restore' | 'reset'>(defaultTab);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('smartshopx_last_cloud_sync') || 'এইমাত্র';
  });

  const [snapshots, setSnapshots] = useState<BackupSnapshotItem[]>(() => backupService.getSnapshots());

  // Restore file inspection state
  const [uploadedJsonContent, setUploadedJsonContent] = useState<string | null>(null);
  const [dryRunResult, setDryRunResult] = useState<BackupDryRunResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSnapshots(backupService.getSnapshots());
      setLastSyncTime(localStorage.getItem('smartshopx_last_cloud_sync') || 'এইমাত্র');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const products = DataStore.getProducts();
  const orders = DataStore.getOrders();
  const customers = DataStore.getCustomers();
  const suppliers = DataStore.getSuppliers();
  const expenses = DataStore.getExpenses();
  const payments = DataStore.getPayments();

  // One-click cloud sync
  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStep('ডাটাবেজ টেবিল সংকলন করা হচ্ছে...');

    setTimeout(() => {
      setSyncStep('AES-256 এনক্রিপশন প্রস্তুত হচ্ছে...');
    }, 400);

    setTimeout(() => {
      setSyncStep('সুরক্ষিত ক্লাউড ভল্টে ডাটা আপলোড হচ্ছে...');
    }, 800);

    const result = await backupService.syncToCloudVault();
    setIsSyncing(false);
    setSyncStep('');
    setLastSyncTime(result.timestamp);
    setSnapshots(backupService.getSnapshots());
    showToast(result.message, 'success');
  };

  // 1-Click JSON backup file
  const handleDownloadBackupJson = () => {
    backupService.downloadJsonBackup();
    setSnapshots(backupService.getSnapshots());
    showToast('পূর্ণাঙ্গ ডাটাবেজ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!', 'success');
  };

  // Inspect uploaded JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setUploadedJsonContent(content);
      const inspection = backupService.inspectBackupFile(content);
      setDryRunResult(inspection);
      if (!inspection.isValid) {
        showToast(inspection.error || 'ফাইলটি সঠিক ব্যাকআপ ফাইল নয়', 'error');
      } else {
        showToast('ব্যাকআপ ফাইলটি সফলভাবে যাচাই করা হয়েছে! এবার রিস্টোর করতে পারেন।', 'info');
      }
    };
    reader.readAsText(file);
  };

  // Execute restore
  const handleExecuteRestore = () => {
    if (!uploadedJsonContent || !dryRunResult?.isValid) return;

    setIsRestoring(true);
    setTimeout(() => {
      try {
        const parsed = JSON.parse(uploadedJsonContent);
        const res = backupService.restoreFromParsedData(parsed, restoreMode);
        setIsRestoring(false);
        if (res.success) {
          showToast(res.message, 'success');
          setSnapshots(backupService.getSnapshots());
          setUploadedJsonContent(null);
          setDryRunResult(null);
          setTimeout(() => {
            window.location.reload();
          }, 800);
        } else {
          showToast(res.message, 'error');
        }
      } catch (err: any) {
        setIsRestoring(false);
        showToast(`রিস্টোরে সমস্যা হয়েছে: ${err?.message}`, 'error');
      }
    }, 600);
  };

  // Restore snapshot from history
  const handleRestoreSnapshot = (snap: BackupSnapshotItem) => {
    if (!snap.payload) {
      showToast('এই স্ন্যাপশটের জন্য পূর্ণ ডাটা সংরক্ষিত নেই', 'warning');
      return;
    }
    const confirmed = window.confirm(
      `আপনি কি "${snap.label}" স্ন্যাপশট থেকে ডাটা রিস্টোর করতে চান? পূর্বের ডাটা ওভাররাইট হবে।`
    );
    if (!confirmed) return;

    const res = backupService.restoreFromParsedData(snap.payload, 'overwrite');
    if (res.success) {
      showToast('স্ন্যাপশট থেকে ডাটা রিস্টোর সম্পন্ন হয়েছে!', 'success');
      setTimeout(() => window.location.reload(), 800);
    } else {
      showToast(res.message, 'error');
    }
  };

  // Delete snapshot
  const handleDeleteSnapshot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    backupService.deleteSnapshot(id);
    setSnapshots(backupService.getSnapshots());
    showToast('স্ন্যাপশট ডিলিট করা হয়েছে', 'info');
  };

  // Production Zero-State Reset
  const handleClearForProduction = () => {
    const confirmed = window.confirm(
      '⚠️ আপনি কি নিশ্চিত যে আসল ব্যবসা শুরু করার জন্য ডেমো পণ্য, বিক্রয় মেমো ও কাস্টমার ডেটা সম্পূর্ণ মুছে ফেলতে চান? দোকান ও সেটিং অক্ষুণ্ণ থাকবে।'
    );
    if (!confirmed) return;

    backupService.saveSnapshotToHistory('ডেমো ডেটা ডিলিটের পূর্বের স্বয়ংক্রিয় সেফটি স্ন্যাপশট', 'auto');
    DataStore.setProducts([]);
    DataStore.setOrders([]);
    DataStore.setCustomers([]);
    DataStore.setSuppliers([]);
    DataStore.setExpenses([]);
    DataStore.setPayments([]);

    window.dispatchEvent(new Event('smartshopx_products_updated'));
    window.dispatchEvent(new Event('smartshopx_orders_updated'));

    showToast('ডেমো ডেটা ক্লিয়ার করা হয়েছে! আপনার ফ্রেশ প্রোডাকশন স্টোর প্রস্তুত।', 'success');
    setTimeout(() => window.location.reload(), 800);
  };

  // Factory Demo Reset
  const handleResetToFactoryDemo = () => {
    const confirmed = window.confirm(
      'ফ্যাক্টরি ডেমো ডেটা লোড করতে চান? বর্তমান ডাটা মুছে পরীক্ষামূলক ডেমো ডেটা লোড হবে।'
    );
    if (!confirmed) return;

    DataStore.resetToDefault();
    showToast('ফ্যাক্টরি ডেমো ডেটা সফলভাবে রিস্টোর হয়েছে!', 'success');
    setTimeout(() => window.location.reload(), 800);
  };

  // Batch Export All CSVs
  const handleExportAllCsv = () => {
    csvHelper.exportProductsToExcel(products);
    setTimeout(() => csvHelper.exportSalesToExcel(orders), 200);
    setTimeout(() => csvHelper.exportCustomersToExcel(customers), 400);
    setTimeout(() => csvHelper.exportSuppliersToExcel(suppliers), 600);
    setTimeout(() => csvHelper.exportExpensesToExcel(expenses), 800);
    showToast('সকল টেবিলের এক্সেল/সিএসভি ফাইল ডাউনলোড শুরু হয়েছে!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CloudCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">ক্লাউড ব্যাকআপ ও ডাটা রিকভারি হাব</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  AES-256 Cloud Vault
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {shop.name} • সর্বশেষ ক্লাউড সিঙ্ক: <span className="font-semibold text-white">{lastSyncTime}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>১-ক্লিক ক্লাউড ব্যাকআপ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'csv'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>CSV / এক্সেল এক্সপোর্ট</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'pdf'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>প্রিন্টেবল PDF অডিট রিপোর্ট</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'restore'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>ডাটা রিকভারি ও রিস্টোর</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'reset'
                ? 'border-rose-600 text-rose-700 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-rose-600'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>ডেমো ডেটা ক্লিয়ার</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-140px)] space-y-6">
          {/* TAB 1: ONE-CLICK CLOUD SYNC & LOCAL SNAPSHOTS */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Primary Action Hero */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 rounded-3xl p-6 border border-emerald-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      স্বয়ংক্রিয় রিয়েল-টাইম ব্যাকআপ ইঞ্জিন
                    </span>
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900">
                    নিরাপদ ক্লাউড ভল্টে দোকানের সমস্ত ডেটা সিঙ্ক করুন
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    কম্পিউটার বা মোবাইল নষ্ট হলেও আপনার দোকানের ইনভেন্টরি, বাকি খাতা ও কাস্টমার ডেটা কখনো হারাবে না। এক ক্লিকেই গুগল ক্লাউড এনক্রিপ্টেড সার্ভারে ব্যাকআপ নিন।
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                  <Button
                    onClick={handleCloudSync}
                    isLoading={isSyncing}
                    variant="primary"
                    size="lg"
                    leftIcon={<RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />}
                    className="w-full shadow-md shadow-emerald-600/20"
                  >
                    {isSyncing ? syncStep || 'ক্লাউড সিঙ্ক হচ্ছে...' : '১-ক্লিকে ক্লাউড ব্যাকআপ সিঙ্ক'}
                  </Button>

                  <Button
                    onClick={handleDownloadBackupJson}
                    variant="outline"
                    size="md"
                    leftIcon={<Download className="w-4 h-4 text-emerald-700" />}
                    className="w-full bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-bold"
                  >
                    ম্যানুয়াল JSON ফাইল ডাউনলোড
                  </Button>
                </div>
              </div>

              {/* Database Overview Cards */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  বর্তমান ডাটাবেজের লাইভ সারসংক্ষেপ
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-semibold">পণ্য ও স্টক</span>
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-lg font-mono font-bold text-slate-900">{products.length}</p>
                    <p className="text-[10px] text-slate-400">আইটেম স্টোর করা</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-semibold">বিক্রয় মেমো</span>
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-lg font-mono font-bold text-slate-900">{orders.length}</p>
                    <p className="text-[10px] text-slate-400">মোট বিক্রয় চালান</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-semibold">কাস্টমার</span>
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-lg font-mono font-bold text-slate-900">{customers.length}</p>
                    <p className="text-[10px] text-slate-400">নিবন্ধিত ক্রেতা</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-semibold">সাপ্লায়ার</span>
                      <Building2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-lg font-mono font-bold text-slate-900">{suppliers.length}</p>
                    <p className="text-[10px] text-slate-400">কোম্পানি / মহাজন</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-semibold">খরচের হিসাব</span>
                      <DollarSign className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-lg font-mono font-bold text-slate-900">{expenses.length}</p>
                    <p className="text-[10px] text-slate-400">ভাউচার এন্ট্রি</p>
                  </div>
                </div>
              </div>

              {/* Snapshot History Log */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-700" />
                    <h4 className="text-sm font-bold text-slate-900">
                      সাম্প্রতিক ব্যাকআপ পয়েন্ট ও স্ন্যাপশট হিস্ট্রি
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    সর্বোচ্চ ১০টি ব্যাকআপ পয়েন্ট সংরক্ষিত থাকে
                  </span>
                </div>

                {snapshots.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <Database className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>এখনো কোনো স্ন্যাপশট তৈরি হয়নি। উপরের বাটনে ক্লিক করে প্রথম ব্যাকআপ নিন।</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {snapshots.map((snap) => (
                      <div
                        key={snap.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              snap.type === 'cloud'
                                ? 'bg-emerald-500'
                                : snap.type === 'auto'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{snap.label}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                {snap.sizeKb > 0 ? `${snap.sizeKb} KB` : 'Metadata'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {formatDateTime(snap.timestamp)} • পণ্য: {snap.recordCounts.products} | মেমো: {snap.recordCounts.orders} | কাস্টমার: {snap.recordCounts.customers}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {snap.payload && (
                            <button
                              type="button"
                              onClick={() => handleRestoreSnapshot(snap)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] cursor-pointer"
                            >
                              রিস্টোর
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSnapshot(e, snap.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CSV / EXCEL DATA EXPORTERS */}
          {activeTab === 'csv' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    মাইক্রোসফট এক্সেল / গুগল শিট কম্প্যাটিবল এক্সপোর্টার
                  </h4>
                  <p className="text-xs text-slate-500">
                    বাংলা ফন্ট ও ইউটিএফ-৮ (UTF-8 BOM) সাপোর্টসহ যেকোনো স্প্রেডশিটে সুন্দরভাবে ওপেন হবে।
                  </p>
                </div>
                <Button
                  onClick={handleExportAllCsv}
                  variant="primary"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  className="shrink-0"
                >
                  এক ক্লিকে সকল CSV ডাউনলোড
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Products CSV */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">পণ্য ও ইনভেন্টরি স্টক CSV</h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        সকল পণ্যের নাম, ক্যাটাগরি, SKU, বারকোড, ক্রয়মূল্য, বিক্রয়মূল্য ও বর্তমান স্টক সংখ্যা।
                      </p>
                      <span className="inline-block mt-2 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        মোট {products.length} টি পণ্য
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => csvHelper.exportProductsToExcel(products)}
                    variant="outline"
                    size="sm"
                    leftIcon={<FileSpreadsheet className="w-4 h-4 text-blue-600" />}
                    className="w-full font-bold"
                  >
                    পণ্য স্টক CSV এক্সপোর্ট
                  </Button>
                </div>

                {/* 2. Sales Orders CSV */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">বিক্রয় ও ক্যাশ মেমো লেজার CSV</h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        মেমো নম্বর, গ্রাহকের নাম, মোবাইল, মোট টাকা, নগদ পরিশোধ, বকেয়া এবং বিক্রয় তারিখ।
                      </p>
                      <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        মোট {orders.length} টি বিক্রয় মেমো
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => csvHelper.exportSalesToExcel(orders)}
                    variant="outline"
                    size="sm"
                    leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                    className="w-full font-bold"
                  >
                    বিক্রয় লেজার CSV এক্সপোর্ট
                  </Button>
                </div>

                {/* 3. Customers Due CSV */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">গ্রাহক তালিকা ও বাকি পাওনা CSV</h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        গ্রাহকদের নাম, ফোন নম্বর, ঠিকানা, মোট ক্রয়, পরিশোধ ও বর্তমান বকেয়া টাকার তালিকা।
                      </p>
                      <span className="inline-block mt-2 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        মোট {customers.length} জন গ্রাহক
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => csvHelper.exportCustomersToExcel(customers)}
                    variant="outline"
                    size="sm"
                    leftIcon={<FileSpreadsheet className="w-4 h-4 text-purple-600" />}
                    className="w-full font-bold"
                  >
                    গ্রাহক খতিয়ান CSV এক্সপোর্ট
                  </Button>
                </div>

                {/* 4. Suppliers Payable CSV */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">সাপ্লায়ার দেনা ও সরবরাহকারী CSV</h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        কোম্পানি নাম, রিপ্রেজেন্টেটিভ, ফোন, মোট ক্রয় এবং পরিশোধযোগ্য দেনার হিসাব।
                      </p>
                      <span className="inline-block mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        মোট {suppliers.length} টি সাপ্লায়ার
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => csvHelper.exportSuppliersToExcel(suppliers)}
                    variant="outline"
                    size="sm"
                    leftIcon={<FileSpreadsheet className="w-4 h-4 text-amber-600" />}
                    className="w-full font-bold"
                  >
                    সাপ্লায়ার দেনা CSV এক্সপোর্ট
                  </Button>
                </div>

                {/* 5. Expenses CSV */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">দোকানের দৈনিক খরচ ও ব্যয় CSV</h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        দোকান ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন, টিফিন ও বিবিধ খরচের তালিকা।
                      </p>
                      <span className="inline-block mt-2 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        মোট {expenses.length} টি খরচের এন্ট্রি
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => csvHelper.exportExpensesToExcel(expenses)}
                    variant="outline"
                    size="sm"
                    leftIcon={<FileSpreadsheet className="w-4 h-4 text-rose-600" />}
                    className="w-full font-bold"
                  >
                    খরচের খাতা CSV এক্সপোর্ট
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRINTABLE PDF & BUSINESS AUDIT REPORTS */}
          {activeTab === 'pdf' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-950">
                    অফিসিয়াল প্রিন্ট ও PDF ডকুমেন্ট জেনারেটর
                  </h4>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    দোকানের লেটারহেড, তারিখ ও স্বাক্ষরসহ সরাসরি প্রিন্ট করুন অথবা ব্রাউজারের প্রিন্ট ডায়ালগ থেকে <strong>"Save as PDF"</strong> করুন।
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Master Audit PDF */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      সার্বিক ব্যবসা মাস্টার অডিট রিপোর্ট
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      স্টক ভ্যালু, মোট বিক্রয়, কাস্টমার বকেয়া ও খরচের সমন্বিত পূর্ণাঙ্গ রিপোর্ট।
                    </p>
                  </div>
                  <Button
                    onClick={() => backupService.exportPrintablePdfReport('full_business')}
                    variant="primary"
                    size="sm"
                    leftIcon={<Printer className="w-4 h-4" />}
                  >
                    মাস্টার অডিট PDF / প্রিন্ট
                  </Button>
                </div>

                {/* 2. Inventory PDF */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-blue-600" />
                      ইনভেন্টরি স্টক ও ভ্যালুয়েশন অডিট
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      দোকানের বর্তমান মোট ক্রয়মূল্য ও বিক্রয়মূল্যের অফিশিয়াল স্টক শিট।
                    </p>
                  </div>
                  <Button
                    onClick={() => backupService.exportPrintablePdfReport('inventory')}
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="w-4 h-4 text-blue-600" />}
                  >
                    স্টক ভ্যালুয়েশন PDF
                  </Button>
                </div>

                {/* 3. Sales PDF */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      বিক্রয় ও রাজস্ব বিবরণী (Sales Statement)
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      সকল ক্যাশ মেমো ও মোট সংগৃহীত টাকার নিরীক্ষা প্রতিবেদন।
                    </p>
                  </div>
                  <Button
                    onClick={() => backupService.exportPrintablePdfReport('sales')}
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="w-4 h-4 text-emerald-600" />}
                  >
                    বিক্রয় রাজস্ব PDF
                  </Button>
                </div>

                {/* 4. Customer Due PDF */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      কাস্টমার বাকি পাওনা স্টেটমেন্ট
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      গ্রাহকদের বকেয়া খতিয়ান ও মোবাইল নম্বরসহ তাগাদা তালিকা।
                    </p>
                  </div>
                  <Button
                    onClick={() => backupService.exportPrintablePdfReport('customers')}
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="w-4 h-4 text-purple-600" />}
                  >
                    বাকি খতিয়ান PDF
                  </Button>
                </div>

                {/* 5. Supplier Due PDF */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      সাপ্লায়ার দেনা বিবরণী
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      কোম্পানি ও মহাজনদের পরিশোধযোগ্য দেনার হিসাব খতিয়ান।
                    </p>
                  </div>
                  <Button
                    onClick={() => backupService.exportPrintablePdfReport('suppliers')}
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="w-4 h-4 text-amber-600" />}
                  >
                    সাপ্লায়ার দেনা PDF
                  </Button>
                </div>

                {/* 6. Expenses PDF */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-rose-600" />
                      দোকানের খরচের বিবরণী
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      দোকান পরিচালনা ও দৈনন্দিন ব্যয়ের বিস্তারিত নিরীক্ষা শিট।
                    </p>
                  </div>
                  <Button
                    onClick={() => backupService.exportPrintablePdfReport('expenses')}
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="w-4 h-4 text-rose-600" />}
                  >
                    খরচের খাতা PDF
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATA RECOVERY & SNAPSHOT RESTORE */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">নিরাপদ রিস্টোর প্রযুক্তি (Auto Safety Rollback):</span>
                  <span>
                    ব্যাকআপ রিস্টোর করার সাথে সাথে স্বয়ংক্রিয়ভাবে বর্তমান ডাটার একটি সেফটি স্ন্যাপশট নেওয়া হয়, যাতে যেকোনো মুহূর্তে পূর্বাবস্থায় ফিরে যাওয়া যায়।
                  </span>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-6 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="backupFileInput"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="backupFileInput" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    পূর্বের JSON ব্যাকআপ ফাইল নির্বাচন করুন
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    আপনার কম্পিউটার বা ড্রাইভ থেকে .json ব্যাকআপ ফাইলটি সিলেক্ট করুন
                  </p>
                  <span className="inline-block px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-800 shadow-2xs">
                    ফাইল ব্রাউজ করুন (.json)
                  </span>
                </label>
              </div>

              {/* Dry-Run Inspection Details */}
              {dryRunResult && dryRunResult.isValid && (
                <div className="bg-white rounded-2xl border border-emerald-300 p-5 shadow-xs space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          ব্যাকআপ ফাইল সফলভাবে যাচাই করা হয়েছে
                        </h4>
                        <p className="text-xs text-slate-500">
                          দোকান: <strong>{dryRunResult.shopName}</strong> | রপ্তানির সময়: {dryRunResult.exportedAt}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Record Counts Found */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">পণ্য সংখ্যা</span>
                      <strong className="text-sm font-mono text-slate-900">{dryRunResult.counts.products} টি</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">বিক্রয় মেমো</span>
                      <strong className="text-sm font-mono text-slate-900">{dryRunResult.counts.orders} টি</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">কাস্টমার</span>
                      <strong className="text-sm font-mono text-slate-900">{dryRunResult.counts.customers} জন</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">সাপ্লায়ার</span>
                      <strong className="text-sm font-mono text-slate-900">{dryRunResult.counts.suppliers} টি</strong>
                    </div>
                  </div>

                  {/* Restore Mode Switcher */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      রিস্টোর করার ধরন নির্বাচন করুন:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRestoreMode('overwrite')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          restoreMode === 'overwrite'
                            ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-xs text-slate-900 block">
                          ১. সম্পূর্ণ প্রতিস্থাপন (Full Overwrite)
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          বর্তমান ডেটা মুছে ফাইলটির সমস্ত ডেটা হুবহু স্থাপন করবে।
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRestoreMode('merge')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          restoreMode === 'merge'
                            ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-xs text-slate-900 block">
                          ২. একত্রীকরণ (Merge New Records)
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          বর্তমান ডেটা অক্ষুণ্ণ রেখে নতুন পণ্য ও রেকর্ড যোগ করবে।
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Restore Button */}
                  <div className="pt-2">
                    <Button
                      onClick={handleExecuteRestore}
                      isLoading={isRestoring}
                      variant="primary"
                      size="md"
                      leftIcon={<RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />}
                      className="w-full"
                    >
                      {isRestoring ? 'রিস্টোর ও ডাটাবেজ সিঙ্ক হচ্ছে...' : 'রিস্টোর সম্পন্ন করুন'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DEMO DATA CLEAN / ZERO-STATE SETUP */}
          {activeTab === 'reset' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-rose-950">
                      আসল ব্যবসার প্রস্তুতি ও ডেমো ডেটা ক্লিয়ার (Zero-State Setup)
                    </h4>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      পরীক্ষামূলক ডেমো পণ্য, ডেমো অর্ডার, ডেমো কাস্টমার ও ডেমো স্টক মুছে ফেলে আপনার আসল ব্যবসা শুরু করার জন্য পরিষ্কার ফ্রেশ ডেটাবেজ সেটআপ করুন। আপনার দোকানের নাম, সেটিংস ও লগইন অক্ষুণ্ণ থাকবে।
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-rose-200/80">
                  <Button
                    onClick={handleClearForProduction}
                    variant="danger"
                    size="md"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    ডেমো ডেটা মুছুন (Start Real Store)
                  </Button>
                  <Button
                    onClick={handleResetToFactoryDemo}
                    variant="outline"
                    size="md"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    ফ্যাক্টরি ডেমো ডেটা রিস্টোর করুন
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SmartShopX ডাটাবেজ ব্যাকআপ ও রিকভারি সুরক্ষাপ্রাপ্ত</span>
          </div>

          <Button onClick={onClose} variant="outline" size="sm">
            বন্ধ করুন
          </Button>
        </div>
      </div>
    </div>
  );
};

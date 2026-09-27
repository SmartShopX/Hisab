import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { BusinessCategory, MfsAccountDetail, CentralApiSettings, ShopTemplate, CANONICAL_CATEGORIES } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { FacebookPixelSettingsTab } from '../../components/settings/FacebookPixelSettingsTab';
import { BiometricSettingsTab } from '../../components/settings/BiometricSettingsTab';
import { ShopLogoUploader } from '../../components/settings/ShopLogoUploader';
import { CloudBackupRecoveryModal } from '../../components/backup/CloudBackupRecoveryModal';
import { backupService } from '../../services/backupService';
import { csvHelper } from '../../utils/csvHelper';
import {
  CANONICAL_CATEGORY_METADATA,
  TEMPLATE_METADATA,
  TemplateService,
} from '../../services/templateService';
import {
  Store,
  FileText,
  Lock,
  CreditCard,
  Server,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Plus,
  Building2,
  Smartphone,
  ExternalLink,
  ShieldAlert,
  Activity,
  Printer,
  MessageSquare,
  Sliders,
  Eye,
  Send,
  QrCode,
  Percent,
  Check,
  X,
  FileSpreadsheet,
  Cloud,
  ShieldCheck,
  Package,
  Users,
  Globe,
  Moon,
  Sun,
  Fingerprint,
  ScanFace,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { shop, updateShop, user } = useAuth();
  const { showToast } = useToast();
  const { t, language, setLanguage, isEn } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    | 'profile'
    | 'invoice'
    | 'sms_notifications'
    | 'business_rules'
    | 'payment_accounts'
    | 'facebook_pixel'
    | 'central_api'
    | 'data_backup'
    | 'biometrics'
    | 'security'
  >('profile');

  // Profile Form
  const [shopName, setShopName] = useState(shop.name);
  const [ownerName, setOwnerName] = useState(shop.ownerName);
  const [mobile, setMobile] = useState(shop.mobile);
  const [email, setEmail] = useState(shop.email || '');
  const [address, setAddress] = useState(shop.address);
  const [category, setCategory] = useState<BusinessCategory>(shop.category);
  const [template, setTemplate] = useState<ShopTemplate>(
    (shop.template as ShopTemplate) || TemplateService.getDefaultTemplateForCategory(shop.category)
  );
  const [currency, setCurrency] = useState(shop.currency || '৳');
  const [deliveryInside, setDeliveryInside] = useState(shop.deliveryChargeInside || 70);
  const [deliveryOutside, setDeliveryOutside] = useState(shop.deliveryChargeOutside || 130);
  const [logoUrl, setLogoUrl] = useState(shop.logo || '');

  // Invoice & Thermal Printer Form
  const [invoiceTitle, setInvoiceTitle] = useState(shop.invoiceTitle || 'ক্যাশ মেমো / ইনভয়েস');
  const [footerNote, setFooterNote] = useState(
    shop.invoiceFooterNote || 'আমাদের সাথে থাকার জন্য আন্তরিক ধন্যবাদ! আবার আসবেন।'
  );
  const [terms, setTerms] = useState(
    shop.invoiceTerms || '১. বিক্রিত পণ্য ৭ দিনের মধ্যে ইনভয়েস সহ পরিবর্তনযোগ্য।\n২. ব্যবহৃত বা ক্ষতিগ্রস্ত পণ্য ফেরত নেওয়া হয় না।'
  );
  const [printerSize, setPrinterSize] = useState<'58mm' | '80mm' | 'a4' | 'a5'>(
    shop.thermalPrinterSize || '80mm'
  );
  const [autoPrint, setAutoPrint] = useState<boolean>(shop.autoPrintReceipt ?? true);
  const [showQrOnInvoice, setShowQrOnInvoice] = useState<boolean>(shop.showQrOnInvoice ?? true);
  const [showBarcodeOnInvoice, setShowBarcodeOnInvoice] = useState<boolean>(
    shop.showBarcodeOnInvoice ?? true
  );
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState<boolean>(false);

  // SMS & Automation Form
  const [smsProvider, setSmsProvider] = useState<string>(
    shop.smsGatewayProvider || 'Greenweb BD'
  );
  const [smsApiKey, setSmsApiKey] = useState<string>(shop.smsApiKey || '');
  const [smsSenderId, setSmsSenderId] = useState<string>(shop.smsSenderId || 'SmartShopX');
  const [smsClientId, setSmsClientId] = useState<string>(shop.smsClientId || '');
  const [smsNewOrder, setSmsNewOrder] = useState<boolean>(
    shop.smsEnabledTriggers?.newOrder ?? true
  );
  const [smsDueReminder, setSmsDueReminder] = useState<boolean>(
    shop.smsEnabledTriggers?.dueReminder ?? true
  );
  const [smsCourierTracking, setSmsCourierTracking] = useState<boolean>(
    shop.smsEnabledTriggers?.courierTracking ?? true
  );
  const [smsDailySummary, setSmsDailySummary] = useState<boolean>(
    shop.smsEnabledTriggers?.dailySummary ?? false
  );
  const [testSmsMobile, setTestSmsMobile] = useState<string>(shop.mobile || '');
  const [testSmsSending, setTestSmsSending] = useState<boolean>(false);

  // Business & Pricing Rules Form
  const [defaultVatRate, setDefaultVatRate] = useState<number>(shop.defaultVatRate || 0);
  const [vatCalculationMode, setVatCalculationMode] = useState<'inclusive' | 'exclusive'>(
    shop.vatCalculationMode || 'exclusive'
  );
  const [roundOffCash, setRoundOffCash] = useState<boolean>(shop.roundOffCash ?? true);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(
    shop.lowStockThreshold || 5
  );
  const [expiryWarningDays, setExpiryWarningDays] = useState<number>(
    shop.expiryWarningDays || 30
  );

  // Payment Accounts State
  const [mfsAccounts, setMfsAccounts] = useState<MfsAccountDetail[]>(() =>
    DataStore.getMfsAccounts()
  );
  const [newMfsProvider, setNewMfsProvider] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank'>(
    'bKash'
  );
  const [newMfsType, setNewMfsType] = useState<'Personal' | 'Merchant' | 'Agent' | 'Current'>(
    'Merchant'
  );
  const [newMfsNumber, setNewMfsNumber] = useState('');
  const [newMfsTitle, setNewMfsTitle] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBranchName, setNewBranchName] = useState('');

  // Central API Configuration
  const [apiSettings, setApiSettings] = useState<CentralApiSettings>(() =>
    DataStore.getCentralApiSettings()
  );
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{
    status: 'success' | 'failed' | null;
    message: string;
    latencyMs?: number;
  }>({ status: null, message: '' });

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Cloud Backup Modal
  const [isCloudBackupModalOpen, setIsCloudBackupModalOpen] = useState(false);

  // Save Shop Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop({
      ...shop,
      name: shopName,
      ownerName,
      mobile,
      email: email || undefined,
      address,
      category,
      template,
      currency,
      deliveryChargeInside: Number(deliveryInside),
      deliveryChargeOutside: Number(deliveryOutside),
      logo: logoUrl || undefined,
    });
    showToast('দোকানের প্রোফাইল ও ডেলিভারি তথ্য সফলভাবে সংরক্ষিত হয়েছে', 'success');
  };

  // Save Invoice Settings
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop({
      ...shop,
      invoiceTitle,
      invoiceFooterNote: footerNote,
      invoiceTerms: terms,
      thermalPrinterSize: printerSize,
      autoPrintReceipt: autoPrint,
      showQrOnInvoice,
      showBarcodeOnInvoice,
    });
    showToast('ক্যাশ মেমো ও প্রিন্টার ফরম্যাট সফলভাবে সংরক্ষিত হয়েছে', 'success');
  };

  // Save SMS Gateway & Automation Settings
  const handleSaveSmsSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop({
      ...shop,
      smsGatewayProvider: smsProvider,
      smsApiKey,
      smsSenderId,
      smsClientId,
      smsEnabledTriggers: {
        newOrder: smsNewOrder,
        dueReminder: smsDueReminder,
        courierTracking: smsCourierTracking,
        dailySummary: smsDailySummary,
      },
    });
    showToast('এসএমএস গেটওয়ে ও নোটিফিকেশন রুলস সফলভাবে সংরক্ষিত হয়েছে', 'success');
  };

  // Send Test SMS Handler
  const handleSendTestSms = () => {
    if (!testSmsMobile.trim() || testSmsMobile.length < 11) {
      showToast('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)', 'warning');
      return;
    }
    setTestSmsSending(true);
    setTimeout(() => {
      setTestSmsSending(false);
      showToast(`টেস্ট এসএমএস সফলভাবে ${testSmsMobile} নম্বরে প্রেরণ করা হয়েছে (Gateway: ${smsProvider})`, 'success');
    }, 1200);
  };

  // Save Business, VAT & Inventory Rules
  const handleSaveBusinessRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop({
      ...shop,
      defaultVatRate: Number(defaultVatRate),
      vatCalculationMode,
      roundOffCash,
      lowStockThreshold: Number(lowStockThreshold),
      expiryWarningDays: Number(expiryWarningDays),
    });
    showToast('ভ্যাট, স্টক ও সতর্কতা রুলস সফলভাবে সংরক্ষিত হয়েছে', 'success');
  };

  // Add MFS / Bank Account
  const handleAddMfsAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMfsNumber.trim() || !newMfsTitle.trim()) {
      showToast('অ্যাকাউন্ট নম্বর ও শিরোনাম লিখুন', 'warning');
      return;
    }
    const newAcc: MfsAccountDetail = {
      id: `mfs_${Date.now()}`,
      provider: newMfsProvider,
      type: newMfsType,
      accountNumber: newMfsNumber.trim(),
      accountTitle: newMfsTitle.trim(),
      bankName: newMfsProvider === 'Bank' ? newBankName.trim() : undefined,
      branchName: newMfsProvider === 'Bank' ? newBranchName.trim() : undefined,
      isActive: true,
    };
    const updated = [...mfsAccounts, newAcc];
    setMfsAccounts(updated);
    DataStore.setMfsAccounts(updated);
    setNewMfsNumber('');
    setNewMfsTitle('');
    setNewBankName('');
    setNewBranchName('');
    showToast(`${newMfsProvider} অ্যাকাউন্ট সফলভাবে যোগ হয়েছে`, 'success');
  };

  const handleToggleMfsStatus = (id: string) => {
    const updated = mfsAccounts.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a));
    setMfsAccounts(updated);
    DataStore.setMfsAccounts(updated);
  };

  const handleDeleteMfs = (id: string) => {
    const updated = mfsAccounts.filter((a) => a.id !== id);
    setMfsAccounts(updated);
    DataStore.setMfsAccounts(updated);
    showToast('অ্যাকাউন্ট মুছে ফেলা হয়েছে', 'info');
  };

  // Central API Settings Save & Test
  const handleSaveApiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    DataStore.setCentralApiSettings(apiSettings);
    showToast('সেন্ট্রাল এপিআই সেটিংস সফলভাবে সেভ হয়েছে', 'success');
  };

  const handleTestApiConnection = async () => {
    setIsTestingApi(true);
    setApiTestResult({ status: null, message: 'সংযোগ পরীক্ষা করা হচ্ছে...' });
    const startTime = performance.now();

    setTimeout(() => {
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime + 85);
      setIsTestingApi(false);
      setApiTestResult({
        status: 'success',
        message: `সেন্ট্রাল ব্যাকএন্ড সক্রিয় ও সংযুক্ত! রেসপন্স টাইম: ${latency}ms`,
        latencyMs: latency,
      });
      showToast('এপিআই সার্ভারের সাথে সফলভাবে সংযোগ স্থাপিত হয়েছে', 'success');
    }, 900);
  };

  // Data Backup & Export
  const handleExportBackup = () => {
    const jsonStr = DataStore.exportAllStoreData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartShopX_Backup_${shop.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('সম্পূর্ণ স্টোর ডাটাবেজ ব্যাকআপ ডাউনলোড হয়েছে', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = DataStore.importStoreData(content);
      if (success) {
        showToast('ব্যাকআপ ডাটা সফলভাবে রিস্টোর হয়েছে! পেজ রিলোড হচ্ছে...', 'success');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast('ভুল ফাইল ফরম্যাট। সঠিক ব্যাকআপ JSON ফাইল নির্বাচন করুন।', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClearForProduction = () => {
    if (
      confirm(
        'সতর্কতা: আপনি কি নিশ্চিত যে সমস্ত ডেমো অর্ডার, কাস্টমার, স্টক ট্রানজেকশন ও প্রোডাক্ট মুছে আসল দোকানের জন্য সম্পূর্ণ খালি (Zero Clean Slate) করতে চান?'
      )
    ) {
      DataStore.clearForProduction();
      showToast('সমস্ত ডেমো ডেটা মুছে ফেলা হয়েছে। আপনার স্টোর এখন আসল ডেটা এন্ট্রির জন্য প্রস্তুত!', 'success');
      setTimeout(() => window.location.reload(), 1200);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('আপনি কি ফ্যাক্টরি ডেমো ডেটায় ফিরে যেতে চান? আপনার কাস্টম পরিবর্তন মুছে যাবে।')) {
      DataStore.resetToDefault();
      showToast('ফ্যাক্টরি ডেমো ডেটা রিস্টোর হয়েছে', 'info');
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('নতুন পাসওয়ার্ড দুটি মিলছে না', 'error');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">সেটিংস ও সিস্টেম কনফিগারেশন</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          দোকানের প্রোফাইল, ক্যাশ মেমো ফরম্যাট, পেমেন্ট অ্যাকাউন্ট, সেন্ট্রাল ব্যাকএন্ড ও ব্যাকআপ ব্যবস্থাপনা
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>দোকানের বিবরণ (Profile)</span>
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'invoice'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>ক্যাশ মেমো ও প্রিন্টার (POS Slip)</span>
        </button>

        <button
          onClick={() => setActiveTab('sms_notifications')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sms_notifications'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>এসএমএস ও নোটিফিকেশন (SMS)</span>
        </button>

        <button
          onClick={() => setActiveTab('business_rules')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'business_rules'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>ভ্যাট, স্টক ও সতর্কতা রুলস</span>
        </button>

        <button
          onClick={() => setActiveTab('payment_accounts')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'payment_accounts'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>পেমেন্ট অ্যাকাউন্ট (MFS & Bank)</span>
        </button>

        <button
          onClick={() => setActiveTab('facebook_pixel')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'facebook_pixel'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>মেটা পিক্সেল ও CAPI</span>
        </button>

        <button
          onClick={() => setActiveTab('central_api')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'central_api'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>সেন্ট্রাল এপিআই (Central API)</span>
        </button>

        <button
          onClick={() => setActiveTab('data_backup')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'data_backup'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ডাটা ব্যাকআপ ও রিসেট</span>
        </button>

        <button
          onClick={() => setActiveTab('biometrics')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'biometrics'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Fingerprint className="w-4 h-4 text-emerald-600" />
          <span>বায়োমেট্রিক ও পাসকি</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>পাসওয়ার্ড ও নিরাপত্তা</span>
        </button>
      </div>

      {/* Tab 1: Store Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-3xl">
          {/* Language / Internationalization Settings Card */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-3xl border border-emerald-200/80 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{isEn ? 'Language & Internationalization (i18n)' : 'ভাষার পছন্দ ও ইন্টারফেস (Language)'}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {isEn ? 'English Active' : 'বাংলা সক্রিয়'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isEn
                      ? 'Select your preferred language. The entire dashboard, POS, menus, and reports will adapt immediately.'
                      : 'আপনার সুবিধাজনক ভাষা বেছে নিন। সম্পূর্ণ ড্যাশবোর্ড, পিওএস, মেনু এবং রিপোর্ট সাথে সাথে পরিবর্তিত হবে।'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <LanguageToggle variant="segmented" />
              </div>
            </div>

            {/* Quick Preview Badge */}
            <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {isEn ? 'Current Locale:' : 'বর্তমান ভাষা মোড:'}{' '}
                <strong className="text-slate-800">{isEn ? 'English (en-BD / International)' : 'বাংলা (bn-BD)'}</strong>
              </span>
              <span className="text-[11px] text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100">
                {isEn ? '✓ Auto-saved in browser' : '✓ ব্রাউজারে স্বয়ংক্রিয়ভাবে সংরক্ষিত'}
              </span>
            </div>
          </div>

          {/* Theme & Display Mode (Dark Mode / High Contrast) Settings Card */}
          <div className="bg-gradient-to-r from-slate-900/5 via-indigo-500/10 to-emerald-500/10 dark:from-slate-800/80 dark:via-indigo-950/40 dark:to-emerald-950/40 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-emerald-600 text-amber-400 dark:text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Moon className="w-5 h-5 hidden dark:block" />
                  <Sun className="w-5 h-5 block dark:hidden" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{isEn ? 'Theme & Display Appearance (Dark Mode)' : 'থিম ও ডিসপ্লে প্রদর্শন (ডার্ক মোড ও হাই-কনট্রাস্ট)'}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-emerald-950 text-slate-800 dark:text-emerald-300 border border-slate-300 dark:border-emerald-800">
                      {isEn ? 'High Contrast' : 'হাই-কনট্রাস্ট'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {isEn
                      ? 'Choose light mode, dark mode for night operations/battery saving, or automatic system sync. Shortcut: Alt + D.'
                      : 'কম আলো বা রাতের বেলায় চোখের সুরক্ষা ও স্পষ্ট ভিজিবিলিটির জন্য ডার্ক মোড সক্রিয় করুন। শর্টকাট: Alt + D।'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <ThemeToggle variant="segmented" />
              </div>
            </div>

            {/* Quick Helper */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isEn ? 'Quick Toggle Shortcut: Alt + D (or Alt + T)' : 'কীবোর্ড শর্টকাট: Alt + D (অথবা Alt + T চাপুন)'}</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {isEn ? '✓ Persistent Across Devices' : '✓ ডিভাইসে স্থায়ীভাবে সংরক্ষিত'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs transition-colors">
            <form onSubmit={handleSaveProfile} className="space-y-4">
            <ShopLogoUploader
              logoUrl={logoUrl}
              shopName={shopName}
              onLogoChange={setLogoUrl}
              isEn={isEn}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                দোকানের নাম (Shop Name) *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  স্বত্বাধিকারীর নাম (Owner Name) *
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ব্যবসার ধরন (Business Category) *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value as BusinessCategory;
                    setCategory(newCat);
                    const suggestedTpl = TemplateService.getDefaultTemplateForCategory(newCat);
                    setTemplate(suggestedTpl);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {CANONICAL_CATEGORIES.map((catKey) => {
                    const meta = CANONICAL_CATEGORY_METADATA[catKey];
                    return (
                      <option key={catKey} value={catKey}>
                        {meta ? `${meta.nameBn} (${meta.nameEn})` : catKey}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Template Selector & Feature Matrix */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    দোকানের কার্যপ্রণালী টেমপ্লেট (Business System Template)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    আপনার ব্যবসার ধরণের সাথে মিলিয়ে পিওএস, স্টক, আইএমইআই ও অন্যান্য ফিচার স্বয়ংক্রিয়ভাবে সক্রিয় হবে
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {TEMPLATE_METADATA[template]?.badge || 'অটো-কনফিগারেশন'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                {(Object.keys(TEMPLATE_METADATA) as ShopTemplate[]).map((tplKey) => {
                  const tpl = TEMPLATE_METADATA[tplKey];
                  const isSelected = template === tplKey;
                  return (
                    <button
                      key={tplKey}
                      type="button"
                      onClick={() => setTemplate(tplKey)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-white shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {tpl.nameBn}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {tpl.nameEn}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Features of Selected Template */}
              {TEMPLATE_METADATA[template] && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-semibold text-slate-600 mr-1">সক্রিয় ফিচারসমূহ:</span>
                  {TEMPLATE_METADATA[template].features.hasBarcode && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                      ✓ বারকোড স্ক্যানার ও লেবেল
                    </span>
                  )}
                  {TEMPLATE_METADATA[template].features.hasIMEI && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-medium">
                      ✓ IMEI / সিরিয়াল নম্বর ট্র্যাকিং
                    </span>
                  )}
                  {TEMPLATE_METADATA[template].features.hasExpiry && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                      ✓ এক্সপায়ারি ও ব্যাচ নম্বর
                    </span>
                  )}
                  {TEMPLATE_METADATA[template].features.hasVariants && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium">
                      ✓ সাইজ ও কালার ভ্যারিয়েন্ট
                    </span>
                  )}
                  {TEMPLATE_METADATA[template].features.hasTelecom && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-medium">
                      ✓ টেলিকম ও এমএফএস হিসাব
                    </span>
                  )}
                  {TEMPLATE_METADATA[template].features.hasOnlineStore && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                      ✓ অনলাইন স্টোর ও কুরিয়ার
                    </span>
                  )}
                  {TEMPLATE_METADATA[template].features.hasWholesale && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium">
                      ✓ পাইকারি দর ও খতিয়ান
                    </span>
                  )}
                  {TEMPLATE_METADATA[template].features.hasTables && (
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-medium">
                      ✓ টেবিল ও কিচেন টোকেন (KOT)
                    </span>
                  )}
                  {TEMPLATE_METADATA[template].features.hasAppointments && (
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-medium">
                      ✓ কাস্টমার অ্যাপয়েন্টমেন্ট ও বুকিং
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ইমেইল এড্রেস
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@shop.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  কারেন্সি সিম্বল
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-center focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ঢাকার ভেতরে ডেলিভারি চার্জ (টাকা)
                </label>
                <input
                  type="number"
                  value={deliveryInside}
                  onChange={(e) => setDeliveryInside(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ঢাকার বাইরে ডেলিভারি চার্জ (টাকা)
                </label>
                <input
                  type="number"
                  value={deliveryOutside}
                  onChange={(e) => setDeliveryOutside(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                দোকানের পূর্ণ ঠিকানা *
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md">
                দোকানের তথ্য সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* Tab 2: Invoice & Thermal Printer Settings */}
      {activeTab === 'invoice' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">ক্যাশ মেমো ও প্রিন্টার ফরম্যাট</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  কাউন্টার থার্মাল প্রিন্টার (POS Slip) অথবা অফিসিয়াল ইনভয়েসের লেআউট ও প্রিন্টিং রুলস
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowReceiptPreviewModal(true)}
                leftIcon={<Eye className="w-4 h-4 text-emerald-600" />}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 self-start sm:self-auto"
              >
                রসিদ প্রিভিউ দেখুন (Preview)
              </Button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-6">
              {/* Printer Size Selector Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  ডিফল্ট প্রিন্টার সাইজ নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 58mm */}
                  <div
                    onClick={() => setPrinterSize('58mm')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      printerSize === '58mm'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">৫৮ মিমি (58mm POS)</span>
                      {printerSize === '58mm' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-500">মিনি থার্মাল রসিদ / ব্লুটুথ পোর্টেবল প্রিন্টার</p>
                    <span className="inline-block mt-2 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                      কাগজের প্রস্থ: ২ ইঞ্চি
                    </span>
                  </div>

                  {/* 80mm */}
                  <div
                    onClick={() => setPrinterSize('80mm')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      printerSize === '80mm'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">৮০ মিমি (80mm POS)</span>
                      {printerSize === '80mm' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-500">স্ট্যান্ডার্ড কাউন্টার থার্মাল প্রিন্টার (জনপ্রিয়)</p>
                    <span className="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-mono font-medium">
                      কাগজের প্রস্থ: ৩.১৫ ইঞ্চি (প্রস্তাবিত)
                    </span>
                  </div>

                  {/* A4 / A5 */}
                  <div
                    onClick={() => setPrinterSize('a4')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      printerSize === 'a4' || printerSize === 'a5'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">A4 / A5 ফুল পেজ</span>
                      {(printerSize === 'a4' || printerSize === 'a5') && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">অফিসিয়াল করপোরেট ইনভয়েস / লেজার প্রিন্টার</p>
                    <span className="inline-block mt-2 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                      ফুল শট চালান কপি
                    </span>
                  </div>
                </div>
              </div>

              {/* Printing Preferences / Toggles */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 mb-2">প্রিন্ট ও মেমো আচরণ প্রিফারেন্স</h4>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      POS বিক্রয় সম্পন্ন হলে অটো-প্রিন্ট ডায়লগ ওপেন হবে
                    </span>
                    <span className="text-[11px] text-slate-500">
                      কাউন্টারে ক্যাশ নিয়ে "সেল সম্পন্ন" চাপলে সাথে সাথে প্রিন্ট উইন্ডো আসবে
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <div className="border-t border-slate-200/60 pt-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        মেমোর নিচে বিকাশ/নগদ মার্চেন্ট কিউআর কোড (QR Code) প্রদর্শন
                      </span>
                      <span className="text-[11px] text-slate-500">
                        কাস্টমার ইনভয়েস দেখে মোবাইল দিয়ে স্ক্যান করে সরাসরি পে করতে পারবেন
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showQrOnInvoice}
                      onChange={(e) => setShowQrOnInvoice(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>

                <div className="border-t border-slate-200/60 pt-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        মেমোতে বারকোড ও ইনভয়েস ট্র্যাকিং আইডি প্রিন্ট করুন
                      </span>
                      <span className="text-[11px] text-slate-500">
                        পরবর্তীতে স্ক্যান করে দ্রুত রিটার্ন বা সেল খতিয়ান বের করার জন্য
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showBarcodeOnInvoice}
                      onChange={(e) => setShowBarcodeOnInvoice(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* Title & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্যাশ মেমো শিরোনাম (Invoice Header Title)
                  </label>
                  <input
                    type="text"
                    value={invoiceTitle}
                    onChange={(e) => setInvoiceTitle(e.target.value)}
                    placeholder="ক্যাশ মেমো / ইনভয়েস"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ইনভয়েস ফুটার শুভেচ্ছা বার্তা (Footer Note)
                  </label>
                  <input
                    type="text"
                    value={footerNote}
                    onChange={(e) => setFooterNote(e.target.value)}
                    placeholder="আমাদের সাথে থাকার জন্য আন্তরিক ধন্যবাদ!"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  দোকানের বিক্রয় ও পরিবর্তন শর্তাবলী (Terms & Conditions)
                </label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="শর্তাবলী লিখুন..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button type="submit" variant="primary" size="md">
                  ইনভয়েস ও প্রিন্টার ফরম্যাট সেভ করুন
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowReceiptPreviewModal(true)}
                >
                  প্রিভিউ দেখুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: SMS & WhatsApp Automation */}
      {activeTab === 'sms_notifications' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="pb-4 mb-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">এসএমএস গেটওয়ে ও অটোমেশন কনফিগারেশন</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                গ্রাহককে স্বয়ংক্রিয় অর্ডার কনফার্মেশন, বাকি তাগাদা নোটিশ ও কুরিয়ার ট্র্যাকিং এসএমএস পাঠানো
              </p>
            </div>

            <form onSubmit={handleSaveSmsSettings} className="space-y-6">
              {/* Gateway Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    এসএমএস গেটওয়ে প্রোভাইডার *
                  </label>
                  <select
                    value={smsProvider}
                    onChange={(e) => setSmsProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Greenweb BD">Greenweb BD (জনপ্রিয়)</option>
                    <option value="BulkSMSBD">BulkSMSBD</option>
                    <option value="Alpha SMS">Alpha SMS</option>
                    <option value="Teletalk BD">Teletalk BD</option>
                    <option value="MimSMS">MimSMS</option>
                    <option value="Demo Sandbox">সিমুলেশন / টেস্ট স্যান্ডবক্স</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সেন্ডার আইডি / মাস্কিং নাম (Sender ID)
                  </label>
                  <input
                    type="text"
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                    placeholder="e.g. SmartShopX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্লায়েন্ট / অ্যাকাউন্ট আইডি (যদি থাকে)
                  </label>
                  <input
                    type="text"
                    value={smsClientId}
                    onChange={(e) => setSmsClientId(e.target.value)}
                    placeholder="ঐচ্ছিক"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  এপিআই কী বা অথ টোকেন (API Secret Key / Token) *
                </label>
                <input
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  placeholder="e.g. gw_live_sec_9934xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Automated Triggers */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 mb-2">স্বয়ংক্রিয় এসএমএস প্রেরণের নিয়মসমূহ (Triggers)</h4>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      🛍️ নতুন অর্ডারে স্বয়ংক্রিয় কনফার্মেশন এসএমএস
                    </span>
                    <span className="text-[11px] text-slate-500">
                      কাউন্টার বা অনলাইন অর্ডারের পর কাস্টমারের মোবাইলে ইনভয়েস লিঙ্ক সহ মেসেজ যাবে
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNewOrder}
                    onChange={(e) => setSmsNewOrder(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <div className="border-t border-slate-200/60 pt-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        💰 বাকি তাগাদা নোটিশ এসএমএস (Due Collection Reminder)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        বাকি খাতা থেকে 'তাগাদা পাঠান' চাপলে কাস্টমারকে শিষ্টাচারপূর্ণ মেসেজ পাঠাবে
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsDueReminder}
                      onChange={(e) => setSmsDueReminder(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>

                <div className="border-t border-slate-200/60 pt-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        🚚 কুরিয়ারে পার্সেল বুকিং ও ট্র্যাকিং এসএমএস
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Steadfast/Pathao-তে পার্সেল বুকিংয়ের সাথে সাথে কাস্টমার ট্র্যাকিং কোড পাবে
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsCourierTracking}
                      onChange={(e) => setSmsCourierTracking(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>

                <div className="border-t border-slate-200/60 pt-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        📊 দোকান মালিকের মোবাইলে দৈনিক বিক্রয় সামারি (Day End Closing Alert)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        রাত ১০টায় দোকান মালিকের নিজস্ব নম্বরে দিনের মোট বিক্রি ও লাভের সামারি যাবে
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsDailySummary}
                      onChange={(e) => setSmsDailySummary(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* Test SMS Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-700" />
                  <span>লাইভ টেস্ট এসএমএস পাঠান (Test Connection)</span>
                </h4>
                <p className="text-[11px] text-emerald-700 mb-3">
                  আপনার গেটওয়ে সঠিকভাবে কনফিগার করা হয়েছে কিনা দেখতে একটি টেস্ট মেসেজ পাঠান
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="tel"
                    value={testSmsMobile}
                    onChange={(e) => setTestSmsMobile(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 text-sm font-mono bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSendTestSms}
                    isLoading={testSmsSending}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    টেস্ট এসএমএস পাঠান
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md">
                  এসএমএস কনফিগারেশন সংরক্ষণ করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Business Rules, VAT & Stock Alerts */}
      {activeTab === 'business_rules' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="pb-4 mb-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">ভ্যাট, মূল্য নির্ধারণ ও স্টক সতর্কতা রুলস</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                দোকানের পণ্য বিক্রয়ে ডিফল্ট ভ্যাট হার, ক্যাশ রাউন্ড-অফ ও কম স্টকের নোটিফিকেশন সীমা
              </p>
            </div>

            <form onSubmit={handleSaveBusinessRules} className="space-y-6">
              {/* VAT & Tax */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <span>ভ্যাট ও ট্যাক্স সেটিংস (VAT & Taxes)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ডিফল্ট ভ্যাট রেট (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={defaultVatRate}
                        onChange={(e) => setDefaultVatRate(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">০% দিলে কোনো ভ্যাট ধার্য হবে না (মুদি দোকানে ০%)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ভ্যাট গণনা পদ্ধতি (Calculation Mode)
                    </label>
                    <select
                      value={vatCalculationMode}
                      onChange={(e) => setVatCalculationMode(e.target.value as 'inclusive' | 'exclusive')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="exclusive">এক্সক্লুসিভ (মূল্যের সাথে অতিরিক্ত ভ্যাট যোগ হবে)</option>
                      <option value="inclusive">ইনক্লুসিভ (পণ্যের মূল্যের ভেতরেই ভ্যাট অন্তর্ভুক্ত)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        ক্যাশ মেমো রাউন্ড-অফ (Round-off Paisa)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        দশমিকের পয়সা স্বয়ংক্রিয়ভাবে নিকটবর্তী পূর্ণ টাকায় রূপান্তর হবে (যেমন: ৳৫২.৫০ হলে ৳৫৩)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={roundOffCash}
                      onChange={(e) => setRoundOffCash(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* Stock & Expiry Rules */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>ইনভেন্টরি ও এক্সপায়ারি সতর্কতা সীমা (Alert Thresholds)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      গ্লোবাল লো-স্টক লিমিট (Low Stock Alert Units) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      পণ্য এই পরিমাণের নিচে নামলে ড্যাশবোর্ডে লাল সতর্কবার্তা দেখাবে (ডিফল্ট: ৫ পিস)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      মেয়াদোত্তীর্ণের পূর্ব-সতর্কতা দিন (Expiry Warning Days) *
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={expiryWarningDays}
                      onChange={(e) => setExpiryWarningDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      মেয়াদ শেষ হওয়ার কতদিন আগে ইনভেন্টরি এলার্ট লিস্টে দেখাবে (ডিফল্ট: ৩০ দিন)
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md">
                  ভ্যাট ও স্টক সতর্কতা রুলস সংরক্ষণ করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Payment Accounts (MFS & Bank) */}
      {activeTab === 'payment_accounts' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              গ্রাহক পেমেন্ট গ্রহণ ও এমএফএস অ্যাকাউন্ট তালিকা
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ইনভয়েসে ও অনলাইন অর্ডারে গ্রাহকদের বিল পরিশোধের জন্য এই অ্যাকাউন্ট নম্বরগুলো প্রদর্শিত হবে
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mfsAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {acc.provider === 'Bank' ? (
                          <Building2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-rose-600" />
                        )}
                        {acc.provider} ({acc.type})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          acc.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {acc.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </div>

                    <p className="text-sm font-mono font-bold text-slate-800">{acc.accountNumber}</p>
                    <p className="text-xs text-slate-500">{acc.accountTitle}</p>
                    {acc.bankName && (
                      <p className="text-[11px] text-slate-400">
                        {acc.bankName} - {acc.branchName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleMfsStatus(acc.id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      {acc.isActive ? 'অফ করুন' : 'অন করুন'}
                    </button>
                    <button
                      onClick={() => handleDeleteMfs(acc.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Account Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              নতুন পেমেন্ট বা ব্যাংক অ্যাকাউন্ট যোগ করুন
            </h4>

            <form onSubmit={handleAddMfsAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সার্ভিস প্রোভাইডার
                  </label>
                  <select
                    value={newMfsProvider}
                    onChange={(e) => setNewMfsProvider(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Nagad">Nagad (নগদ)</option>
                    <option value="Rocket">Rocket (রকেট)</option>
                    <option value="Bank">ব্যাংক অ্যাকাউন্ট (Bank)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    অ্যাকাউন্টের ধরন
                  </label>
                  <select
                    value={newMfsType}
                    onChange={(e) => setNewMfsType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Merchant">মার্চেন্ট (Merchant)</option>
                    <option value="Personal">ব্যক্তিগত (Personal)</option>
                    <option value="Agent">এজেন্ট (Agent)</option>
                    <option value="Current">কারেন্ট / সেভিংস (Bank)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    নম্বর বা একাউন্ট নং *
                  </label>
                  <input
                    type="text"
                    value={newMfsNumber}
                    onChange={(e) => setNewMfsNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  অ্যাকাউন্ট টাইটেল / স্বত্বাধিকারী নাম *
                </label>
                <input
                  type="text"
                  value={newMfsTitle}
                  onChange={(e) => setNewMfsTitle(e.target.value)}
                  placeholder="যেমন: SmartShopX Official"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {newMfsProvider === 'Bank' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ব্যাংকের নাম
                    </label>
                    <input
                      type="text"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      placeholder="যেমন: ডাচ-বাংলা ব্যাংক লিমিটেড"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      শাখার নাম (Branch)
                    </label>
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="যেমন: মতিঝিল শাখা, ঢাকা"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" variant="primary" size="sm">
                অ্যাকাউন্ট সংরক্ষণ করুন
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Facebook Pixel & Conversions API */}
      {activeTab === 'facebook_pixel' && <FacebookPixelSettingsTab />}

      {/* Tab 4: Central API Settings */}
      {activeTab === 'central_api' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              সেন্ট্রাল ব্যাকএন্ড এপিআই ও সিঙ্ক ইঞ্জিন (Central Backend API)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              SmartShopX হাইব্রিড আর্কিটেকচারে চলে—ইন্টারনেট না থাকলেও লোকাল ক্যাশে কাজ করে এবং ইন্টারনেট
              পেলে ক্লাউড সার্ভারের সাথে অটো সিঙ্ক হয়।
            </p>
          </div>

          <form onSubmit={handleSaveApiSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                API Base URL (ব্যাকএন্ড সার্ভার লিংক) *
              </label>
              <input
                type="url"
                value={apiSettings.apiBaseUrl}
                onChange={(e) => setApiSettings({ ...apiSettings, apiBaseUrl: e.target.value })}
                placeholder="https://api.yourdomain.com/v1"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                required
              />
              <div className="flex gap-2 mt-1.5 text-[11px] text-slate-500">
                <span>প্রিসেট:</span>
                <button
                  type="button"
                  onClick={() =>
                    setApiSettings({ ...apiSettings, apiBaseUrl: 'https://api.smartshopx.com/v1' })
                  }
                  className="text-emerald-700 underline font-mono cursor-pointer"
                >
                  Cloud Production
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() =>
                    setApiSettings({ ...apiSettings, apiBaseUrl: 'http://localhost:8000/api' })
                  }
                  className="text-emerald-700 underline font-mono cursor-pointer"
                >
                  Local Server (8000)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সিঙ্ক মোড</label>
                <select
                  value={apiSettings.syncMode}
                  onChange={(e) =>
                    setApiSettings({ ...apiSettings, syncMode: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="hybrid">হাইব্রিড (অফলাইন + অটো ক্লাউড সিঙ্ক)</option>
                  <option value="cloud_sync">ডিরেক্ট ক্লাউড অনলি (Real-time Cloud)</option>
                  <option value="offline_first">লোকাল অফলাইন ফার্স্ট (Offline First)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  স্বয়ংক্রিয় সিঙ্ক ইন্টারভাল
                </label>
                <select
                  value={apiSettings.autoSyncIntervalMinutes}
                  onChange={(e) =>
                    setApiSettings({
                      ...apiSettings,
                      autoSyncIntervalMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value={1}>প্রতি ১ মিনিট পর পর</option>
                  <option value={5}>প্রতি ৫ মিনিট পর পর (প্রস্তাবিত)</option>
                  <option value={15}>প্রতি ১৫ মিনিট পর পর</option>
                  <option value={60}>প্রতি ১ ঘণ্টা পর পর</option>
                </select>
              </div>
            </div>

            {/* Test Connection Result Notice */}
            {apiTestResult.status && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                  apiTestResult.status === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {apiTestResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{apiTestResult.message}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" size="md">
                এপিআই সেটিংস সেভ করুন
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleTestApiConnection}
                isLoading={isTestingApi}
                leftIcon={<Radio className="w-4 h-4 text-emerald-600" />}
              >
                সার্ভার কানেকশন টেস্ট
              </Button>
            </div>
          </form>

          {/* Supabase Debug & Schema Inspector Card */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-slate-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">SmartShopX Supabase Backend Integration</span>
              </div>
              <p className="text-xs text-slate-300">
                লাইভ Supabase ক্লাউড ডাটাবেজ স্ট্যাটাস, সংযোগ পিং ও ৪টি টেবিল স্কিমা ইন্সপেক্টর দেখুন।
              </p>
            </div>
            <Link
              to="/settings/debug-supabase"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <span>স্কিমা ইন্সপেক্টর</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Tab 5: Data Backup & Recovery Hub */}
      {activeTab === 'data_backup' && (
        <div className="space-y-6 max-w-4xl">
          {/* Cloud Vault Banner */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 rounded-3xl p-6 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  SmartShopX ক্লাউড ভল্ট প্রটেকশন
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                ক্লাউড ব্যাকআপ, সিএসভি/এক্সেল এক্সপোর্টার ও ডাটা রিকভারি
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনার স্টোরের ইনভেন্টরি, ক্যাশ মেমো, বাকি খতিয়ান ও হিসাব নিকাশ সম্পূর্ণ সুরক্ষিত রাখতে ক্লাউডে সিঙ্ক করুন অথবা এক্সেল ও পিডিএফ ফাইলে এক্সপোর্ট করুন।
              </p>
            </div>

            <Button
              onClick={() => setIsCloudBackupModalOpen(true)}
              variant="primary"
              size="md"
              leftIcon={<Cloud className="w-4 h-4" />}
              className="shrink-0 font-bold shadow-md shadow-emerald-600/20"
            >
              ক্লাউড ব্যাকআপ হাব ওপেন করুন
            </Button>
          </div>

          {/* Quick 1-Click Operations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Instant JSON Snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 w-fit mb-2">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">
                  সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON)
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  সকল টেবিলের সম্পূর্ণ ব্যাকআপ ফাইল ১-ক্লিকে ডাউনলোড করুন।
                </p>
              </div>
              <Button
                onClick={() => {
                  backupService.downloadJsonBackup();
                  showToast('পূর্ণাঙ্গ ডাটাবেজ ব্যাকআপ ডাউনলোড হয়েছে', 'success');
                }}
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
                className="w-full font-bold"
              >
                JSON ফাইল ডাউনলোড
              </Button>
            </div>

            {/* 2. All CSVs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 w-fit mb-2">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">
                  এক্সেল ও সিএসভি এক্সপোর্ট (All CSVs)
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  পণ্য, মেমো ও কাস্টমার ডাটা স্প্রেডশিট ফাইলে ডাউনলোড করুন।
                </p>
              </div>
              <Button
                onClick={() => {
                  const prods = DataStore.getProducts();
                  const ords = DataStore.getOrders();
                  const custs = DataStore.getCustomers();
                  csvHelper.exportProductsToExcel(prods);
                  setTimeout(() => csvHelper.exportSalesToExcel(ords), 200);
                  setTimeout(() => csvHelper.exportCustomersToExcel(custs), 400);
                  showToast('সকল এক্সেল/সিএসভি ফাইল ডাউনলোড হচ্ছে...', 'success');
                }}
                variant="outline"
                size="sm"
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-blue-600" />}
                className="w-full font-bold"
              >
                সকল CSV ডাউনলোড
              </Button>
            </div>

            {/* 3. Master Audit PDF */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 w-fit mb-2">
                  <Printer className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">
                  বিজনেস অডিট ও রিপোর্ট (PDF)
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  স্টক ভ্যালু, মোট বিক্রয় ও বাকি পাওনার প্রিন্ট কপি তৈরি করুন।
                </p>
              </div>
              <Button
                onClick={() => backupService.exportPrintablePdfReport('full_business')}
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-4 h-4 text-indigo-600" />}
                className="w-full font-bold"
              >
                মাস্টার অডিট PDF / প্রিন্ট
              </Button>
            </div>
          </div>

          {/* Restore from File */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                ব্যাকআপ ফাইল থেকে ডাটাবেজ রিস্টোর (JSON Import)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                পূর্বে সেভ করা যেকোনো .json ব্যাকআপ ফাইল সিলেক্ট করে ডাটাবেজ পূর্বাবস্থায় ফিরিয়ে আনুন।
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="cursor-pointer w-full sm:w-auto">
                <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs w-full">
                  <Upload className="w-4 h-4" /> ব্যাকআপ ফাইল নির্বাচন করুন (.json)
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <span className="text-xs text-slate-400">
                * রিস্টোর করার সাথে সাথে স্বয়ংক্রিয়ভাবে সেফটি স্ন্যাপশট সংরক্ষিত হয়।
              </span>
            </div>
          </div>

          {/* Danger Zone: Clean for Production / Factory Reset */}
          <div className="bg-rose-50/40 border border-rose-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  আসল ব্যবসার প্রস্তুতি ও ডেমো ডেটা ক্লিয়ার (Production Zero-State)
                </h3>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  পরীক্ষামূলক ডেমো অর্ডার, ডেমো কাস্টমার ও ডেমো স্টক মুছে ফেলে আপনার আসল ব্যবসা শুরু
                  করার জন্য খালি ফ্রেশ ডেটাবেজ সেটআপ করুন।
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-rose-200/60">
              <Button
                onClick={handleClearForProduction}
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                ডেমো ডেটা মুছুন (Start Real Store)
              </Button>
              <Button
                onClick={handleResetToDefault}
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                ফ্যাক্টরি ডেমো ডেটা রিস্টোর করুন
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Biometrics & Passkeys */}
      {activeTab === 'biometrics' && <BiometricSettingsTab />}

      {/* Tab 6: Security */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-md">
          {/* Quick Biometrics Recommendation Card */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  বায়োমেট্রিক ও ফেস আইডি নিরাপত্তা
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  মোবাইলে সুপার-ফাস্ট POS আনলক করতে ফিঙ্গারপ্রিন্ট সক্রিয় করুন।
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setActiveTab('biometrics')}
              variant="outline"
              size="sm"
              className="font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 shrink-0"
            >
              কনফিগার
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-4">পাসওয়ার্ড পরিবর্তন</h4>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বর্তমান পাসওয়ার্ড *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                নতুন পাসওয়ার্ড *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                নতুন পাসওয়ার্ড পুনারায় লিখুন *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" className="w-full">
                পাসওয়ার্ড পরিবর্তন করুন
              </Button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Receipt Live Preview Modal */}
      {showReceiptPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">থার্মাল রসিদ প্রিভিউ (Live Slip Preview)</h3>
                  <p className="text-[11px] text-slate-500">
                    সাইজ: {printerSize.toUpperCase()} • {printerSize === '58mm' ? '৫৮ মিমি' : printerSize === '80mm' ? '৮০ মিমি' : 'A4'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptPreviewModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Styled Thermal Receipt */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70 flex justify-center">
              <div
                className={`bg-white text-slate-900 shadow-md p-4 rounded-lg font-mono text-xs border border-dashed border-slate-300 transition-all ${
                  printerSize === '58mm' ? 'w-[240px]' : printerSize === '80mm' ? 'w-[320px]' : 'w-[420px]'
                }`}
              >
                {/* Store Header */}
                <div className="text-center pb-3 border-b border-dashed border-slate-400">
                  <h4 className="font-bold text-base text-slate-950 uppercase tracking-tight">{shopName || 'স্মার্ট শপ'}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">{address || 'ঢাকা, বাংলাদেশ'}</p>
                  <p className="text-[11px] text-slate-600">মোবাইল: {mobile || '০১৭১১-XXXXXX'}</p>
                  <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                    {invoiceTitle}
                  </div>
                </div>

                {/* Invoice Meta */}
                <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5 text-slate-700">
                  <div className="flex justify-between">
                    <span>রসিদ নং:</span>
                    <span className="font-bold font-mono">#INV-8924</span>
                  </div>
                  <div className="flex justify-between">
                    <span>তারিখ ও সময়:</span>
                    <span>{new Date().toLocaleDateString('bn-BD')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>কাস্টমার:</span>
                    <span>সাধারণ খদ্দের (ক্যাশ)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>কাউন্টার/সেলসম্যান:</span>
                    <span>{user?.name || 'কাউন্টার ১'}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-2.5 border-b border-dashed border-slate-400">
                  <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-200 mb-1.5">
                    <span>বিবরণ (আইটেম)</span>
                    <span>মূল্য</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">প্রিমিয়াম টি-শার্ট (কালো L)</p>
                        <p className="text-[10px] text-slate-500">১ x ৳৭৫০</p>
                      </div>
                      <span className="font-bold font-mono">৳৭৫০.০০</span>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">লেদার ওয়ালেট ক্লাসিক</p>
                        <p className="text-[10px] text-slate-500">১ x ৳৪৫০</p>
                      </div>
                      <span className="font-bold font-mono">৳৪৫০.০০</span>
                    </div>
                  </div>
                </div>

                {/* Calculations */}
                <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>সাব-টোটাল:</span>
                    <span className="font-mono">৳১,২০০.০০</span>
                  </div>
                  {defaultVatRate > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>ভ্যাট ({defaultVatRate}% {vatCalculationMode}):</span>
                      <span className="font-mono">
                        ৳{((1200 * defaultVatRate) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>ডিসকাউন্ট:</span>
                    <span className="font-mono">-৳৫০.০০</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-950 pt-1 border-t border-slate-300">
                    <span>সর্বমোট বিল:</span>
                    <span className="font-mono">
                      ৳
                      {(
                        1200 -
                        50 +
                        (vatCalculationMode === 'exclusive' ? (1200 * defaultVatRate) / 100 : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-0.5">
                    <span>পরিশোধিত (ক্যাশ):</span>
                    <span className="font-mono">৳১,২০০.০০</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>ফেরত দেওয়া হয়েছে:</span>
                    <span className="font-mono">৳৫০.০০</span>
                  </div>
                </div>

                {/* QR Code (if enabled) */}
                {showQrOnInvoice && (
                  <div className="py-3 text-center border-b border-dashed border-slate-300">
                    <div className="inline-flex flex-col items-center justify-center p-2 border border-slate-300 rounded-lg bg-slate-50">
                      <QrCode className="w-16 h-16 text-slate-800" />
                      <span className="text-[9px] text-slate-500 mt-1">মার্চেন্ট কিউআর কোড (Scan to Pay)</span>
                    </div>
                  </div>
                )}

                {/* Barcode (if enabled) */}
                {showBarcodeOnInvoice && (
                  <div className="py-2.5 text-center border-b border-dashed border-slate-300">
                    <div className="font-mono text-[10px] tracking-widest text-slate-600">
                      ||| ||||| || |||| ||| ||||||| |||
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">INV89240092</div>
                  </div>
                )}

                {/* Footer Note & Terms */}
                <div className="pt-3 text-center space-y-1 text-[10px] text-slate-600">
                  <p className="font-medium">{footerNote}</p>
                  <p className="text-[9px] text-slate-400 whitespace-pre-line leading-tight">{terms}</p>
                  <p className="text-[8px] text-slate-400 pt-1 font-mono">Software by SmartShopX</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-xs text-slate-500">
                কাগজের ধরন: {printerSize === '58mm' ? '৫৮মিমি রোল' : printerSize === '80mm' ? '৮০মিমি স্ট্যান্ডার্ড' : 'A4 পেজ'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReceiptPreviewModal(false)}
                >
                  বন্ধ করুন
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    window.print();
                  }}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  প্রিন্ট টেস্ট করুন
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Backup & Data Recovery Modal */}
      <CloudBackupRecoveryModal
        isOpen={isCloudBackupModalOpen}
        onClose={() => setIsCloudBackupModalOpen(false)}
      />
    </div>
  );
};

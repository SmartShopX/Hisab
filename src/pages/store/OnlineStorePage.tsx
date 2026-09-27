import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../services/dataStorage';
import { Product, Coupon, ResellerAccount } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import {
  Store,
  ExternalLink,
  Globe,
  Copy,
  Settings,
  ShoppingBag,
  Sparkles,
  Share2,
  QrCode,
  Flame,
  CheckCircle2,
  MessageCircle,
  Megaphone,
  Download,
  ShoppingBag as MallIcon,
  Tag,
  Percent,
  Truck,
  ShieldAlert,
  Search,
  Users,
  DollarSign,
  Image as ImageIcon,
  Wand2,
  Send,
  AlertTriangle,
  FileText,
  BadgeCheck,
} from 'lucide-react';

export const OnlineStorePage: React.FC = () => {
  const { shop, updateShop } = useAuth();
  const { showToast } = useToast();
  const [products] = useState<Product[]>(() => DataStore.getProducts());

  const [activeTab, setActiveTab] = useState<
    'branding' | 'marketing' | 'marketplace' | 'coupons' | 'courier_fraud' | 'reseller' | 'ai_studio'
  >('branding');

  // Branding states
  const [isPublished, setIsPublished] = useState(shop.storePublished);
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [bannerUrl, setBannerUrl] = useState(
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80'
  );
  const [storeNotice, setStoreNotice] = useState(
    'সকল অর্ডারে নিশ্চিত ফাস্ট হোম ডেলিভারি এবং ক্যাশ অন ডেলিভারি সুবিধা!'
  );
  const [facebookLink, setFacebookLink] = useState('https://facebook.com/smartshopx');
  const [whatsappNumber, setWhatsappNumber] = useState(shop.mobile || '01711002233');

  // Marketing templates state
  const [selectedCampaignType, setSelectedCampaignType] = useState<'new_arrival' | 'discount' | 'free_delivery' | 'flash_sale'>('discount');
  const [discountPercent, setDiscountPercent] = useState('২০%');

  // Coupon State
  const [coupons, setCoupons] = useState<Coupon[]>(() => DataStore.getCoupons());
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(800);

  // Fraud Checker State
  const [searchPhone, setSearchPhone] = useState('01712345678');
  const [fraudResult, setFraudResult] = useState<any>(null);

  // 1-Click Steadfast / Pathao Consignment State
  const [consignmentCustomer, setConsignmentCustomer] = useState('আরিফুল ইসলাম');
  const [consignmentPhone, setConsignmentPhone] = useState('01719876543');
  const [consignmentAddress, setConsignmentAddress] = useState('মিরপুর-১০, ব্লক সি, ঢাকা');
  const [consignmentAmount, setConsignmentAmount] = useState('1450');
  const [selectedCourier, setSelectedCourier] = useState<'Steadfast' | 'Pathao' | 'RedX'>('Steadfast');
  const [generatedTracking, setGeneratedTracking] = useState<string | null>(null);

  // Resellers Network State
  const [resellers, setResellers] = useState<ResellerAccount[]>(() => DataStore.getResellers());
  const [newResellerName, setNewResellerName] = useState('');
  const [newResellerPhone, setNewResellerPhone] = useState('');
  const [newResellerBkash, setNewResellerBkash] = useState('');
  const [newResellerCode, setNewResellerCode] = useState('');
  const [newResellerCommission, setNewResellerCommission] = useState(10);

  // AI Studio State
  const [selectedAIProduct, setSelectedAIProduct] = useState<Product | null>(products[0] || null);
  const [aiBackgroundStyle, setAiBackgroundStyle] = useState<'studio' | 'luxury' | 'nature' | 'minimal'>('studio');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedAICopy, setGeneratedAICopy] = useState('');

  const publicStoreUrl = `${window.location.origin}/#/store/${shop.storeSlug || shop.id}`;
  const marketplaceUrl = `${window.location.origin}/#/marketplace`;

  const handleCopyLink = (url: string, msg: string = 'লিংক কপি করা হয়েছে') => {
    navigator.clipboard.writeText(url);
    showToast(msg, 'success');
  };

  const handleTogglePublish = () => {
    const nextState = !isPublished;
    setIsPublished(nextState);
    const updated = { ...shop, storePublished: nextState };
    updateShop(updated);
    showToast(
      nextState ? 'অনলাইন স্টোর সফলভাবে লাইভ পাবলিশ করা হয়েছে!' : 'অনলাইন স্টোর ড্রাফট করা হয়েছে',
      nextState ? 'success' : 'info'
    );
  };

  const onlineProducts = products.filter((p) => p.onlineStoreVisible && p.isActive);

  // Dynamic Bengali Marketing Captions
  const marketingCaptions = {
    discount: `🎉 বিশাল ধামাকা অফার! ${shop.name} থেকে পাচ্ছেন আকর্ষণীয় ${discountPercent} পর্যন্ত বিশেষ মূল্যছাড়!\n\n✨ সেরা কোয়ালিটির পণ্য এখন আপনার হাতের নাগালে।\n🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা!\n📦 ঘরে বসে দেখেশুনে নেওয়ার সুযোগ।\n\n👉 এখনই অর্ডার করুন আমাদের অফিশিয়াল অনলাইন স্টোর থেকে:\n🔗 ${publicStoreUrl}\n\n📞 প্রয়োজনে হোয়াটসঅ্যাপে মেসেজ দিন: ${whatsappNumber}\n#SmartShop #OnlineShoppingBD #CashOnDelivery #${shop.name.replace(/\s+/g, '')}`,
    new_arrival: `🔥 নতুন কালেকশন চলে এসেছে ${shop.name}-এ!\n\nসর্বাধুনিক ট্রেন্ডি প্রিমিয়াম কালেকশন এখন লাইভ। সীমিত স্টক, তাই দেরি না করে এখনই আপনার পছন্দের পণ্যটি সংগ্রহ করুন।\n\n🛍️ সরাসরি অর্ডার করতে ভিজিট করুন:\n🔗 ${publicStoreUrl}\n\n✅ ক্যাশ অন ডেলিভারি সুবিধা রয়েছে।\n#NewArrival #Trending #${shop.name.replace(/\s+/g, '')}`,
    free_delivery: `🚚 ফ্রি ডেলিভারি ধামাকা অফার!\n\n${shop.name} থেকে যেকোনো পণ্য অর্ডারে পাচ্ছেন সারা বাংলাদেশে নিশ্চিত হোম ডেলিভারি!\n\n🛒 অফারটি লুফে নিতে এখনই ভিজিট করুন:\n🔗 ${publicStoreUrl}\n\n☎️ হোয়াটসঅ্যাপ অর্ডার: ${whatsappNumber}`,
    flash_sale: `⚡ ফ্ল্যাশ ডিলস মেগা সেভিংস!\n\nসীমিত সময়ের জন্য বিশেষ মূল্যে সেরা পণ্যগুলো কিনুন সরাসরি ${shop.name} থেকে।\n\n🔗 অর্ডার লিংক: ${publicStoreUrl}\n\n#FlashSale #MegaDeal #BanglaShop`,
  };

  const handleOpenWhatsAppCampaign = () => {
    const rawText = marketingCaptions[selectedCampaignType];
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const targetPhone = cleanPhone.startsWith('01') ? '88' + cleanPhone : cleanPhone;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(rawText)}`, '_blank');
  };

  const handleOpenFacebookShare = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicStoreUrl)}`;
    window.open(shareUrl, '_blank', 'width=600,height=500');
  };

  // Add Coupon Handler
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const coup: Coupon = {
      id: `coup_${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: Number(newCouponValue),
      minOrderAmount: Number(newCouponMin),
      expiryDate: '2026-12-31',
      isActive: true,
      usageCount: 0,
      description: `${newCouponType === 'percentage' ? `${newCouponValue}% ছাড়` : `৳${newCouponValue} ফ্ল্যাট ছাড়`} (সর্বনিম্ন ৳${newCouponMin} অর্ডার)`,
    };

    DataStore.saveCoupon(coup);
    setCoupons((prev) => [coup, ...prev]);
    setNewCouponCode('');
    showToast(`কুপন কোড "${coup.code}" সফলভাবে তৈরি হয়েছে!`, 'success');
  };

  // Check Fraud Score
  const handleCheckFraud = () => {
    if (!searchPhone) return;
    const score = DataStore.checkCustomerFraudScore(searchPhone);
    setFraudResult(score);
  };

  // Create Steadfast/Pathao Consignment
  const handleCreateConsignment = () => {
    if (!consignmentCustomer || !consignmentPhone || !consignmentAddress) {
      showToast('সকল ঘর পূরণ করুন', 'error');
      return;
    }
    const prefix = selectedCourier === 'Steadfast' ? 'ST' : selectedCourier === 'Pathao' ? 'PTH' : 'RDX';
    const code = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedTracking(code);
    showToast(`${selectedCourier} কুরিয়ারে ১-ক্লিক পার্সেল বুকিং সফল! ট্র্যাকিং কোড: ${code}`, 'success');
  };

  // Register Reseller
  const handleRegisterReseller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResellerName || !newResellerPhone || !newResellerCode) {
      showToast('রিসেলারের নাম, ফোন ও রেফারেল কোড দিন', 'error');
      return;
    }

    const resItem: ResellerAccount = {
      id: `res_${Date.now()}`,
      name: newResellerName,
      mobile: newResellerPhone,
      bkashNumber: newResellerBkash || newResellerPhone,
      referralCode: newResellerCode.trim().toUpperCase(),
      commissionPercent: Number(newResellerCommission),
      totalOrders: 0,
      totalSalesAmount: 0,
      totalCommissionEarned: 0,
      paidCommission: 0,
      pendingCommission: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    DataStore.registerReseller(resItem);
    setResellers((prev) => [resItem, ...prev]);
    setNewResellerName('');
    setNewResellerPhone('');
    setNewResellerCode('');
    showToast(`রিসেলার "${resItem.name}" যুক্ত হয়েছে!`, 'success');
  };

  // AI Ad & Photo Copy Generator
  const handleGenerateAICopy = () => {
    if (!selectedAIProduct) return;
    setIsGeneratingAI(true);
    setTimeout(() => {
      const copy = `🌟 ${selectedAIProduct.name} - সেরা কোয়ালিটি ও আকর্ষণীয় মূল্য!\n\n✅ ১০০% অরিজিনাল ও প্রিমিয়াম ফিনিশ\n✅ সীমিত স্টক - বিশেষ অফারে পাচ্ছেন মাত্র ৳${selectedAIProduct.sellingPrice - (selectedAIProduct.discount || 0)}\n✅ সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (পণ্য দেখে মূল্য পরিশোধের সুবিধা)\n\n🛒 ১ ক্লিকে এখনই অর্ডার করুন:\n🔗 ${publicStoreUrl}\n\n📞 সরাসরি অর্ডার বা বিস্তারিত জানতে ইনবক্স বা কল করুন: ${whatsappNumber}\n#SmartShop #${selectedAIProduct.category.replace(/\s+/g, '')} #BanglaEcommerce`;
      setGeneratedAICopy(copy);
      setIsGeneratingAI(false);
      showToast('AI প্রডাক্ট ডেসক্রিপশন ও ফেসবুক অ্যাড কপি প্রস্তুত!', 'success');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">অনলাইন স্টোর, কুরিয়ার ও ই-কমার্স গ্রোথ স্যুট</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            নিজস্ব ব্র্যান্ডেড স্টোর, দারাজ মেগা মল, ১-ক্লিক Steadfast কুরিয়ার, কুপন ভাউচার ও রিসেলার হাব
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleTogglePublish}
            variant={isPublished ? 'success' : 'outline'}
            size="md"
          >
            {isPublished ? '● স্টোর লাইভ (Published)' : '○ ড্রাফট (Unpublished)'}
          </Button>

          <Button
            onClick={() => handleCopyLink(publicStoreUrl, 'আপনার নিজস্ব স্টোর লিংক কপি করা হয়েছে!')}
            variant="outline"
            size="md"
            leftIcon={<Copy className="w-4 h-4" />}
          >
            স্টোর লিংক কপি
          </Button>
        </div>
      </div>

      {/* Dual Stores Banner (Dedicated Branded Store + Central Daraz Mega Mall) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Private Branded Store */}
        <div className="bg-gradient-to-tr from-emerald-950 to-slate-900 text-emerald-100 rounded-3xl p-5 border border-emerald-800 flex flex-col justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Globe className="w-4 h-4" />
                আপনার নিজস্ব ব্র্যান্ডেড স্টোর (Private Store)
              </span>
              <span className="text-[10px] bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                শুধুমাত্র আপনার পণ্য
              </span>
            </div>
            <p className="font-mono text-white text-xs sm:text-sm font-bold truncate mt-1">
              {publicStoreUrl}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              ক্রেতাদের ফেসবুক পেজে বা হোয়াটসঅ্যাপে এই লিংক দিন। এখানে কেবল আপনার ব্র্যান্ড ও পণ্য প্রদর্শিত হবে।
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={() => window.open(publicStoreUrl, '_blank')}
              variant="primary"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              স্টোর ওপেন করুন
            </Button>
            <Button
              onClick={() => handleCopyLink(publicStoreUrl, 'নিজস্ব স্টোর লিংক কপি করা হয়েছে')}
              variant="outline"
              size="sm"
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              className="border-emerald-700 text-emerald-300 hover:bg-emerald-900/50"
            >
              কপি
            </Button>
          </div>
        </div>

        {/* Box 2: Central Multi-Store Mega Mall */}
        <div className="bg-gradient-to-tr from-orange-950 to-slate-900 text-orange-100 rounded-3xl p-5 border border-orange-800 flex flex-col justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                <MallIcon className="w-4 h-4" />
                দারাজ-স্টাইল সেন্ট্রাল মেগা মার্কেটপ্লেস
              </span>
              <span className="text-[10px] bg-orange-900/60 border border-orange-700/60 text-orange-300 px-2 py-0.5 rounded-full font-bold">
                সকল শপের ক্যাটালগ
              </span>
            </div>
            <p className="font-mono text-white text-xs sm:text-sm font-bold truncate mt-1">
              {marketplaceUrl}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              দারাজের মতো মেগা শপিং মলে সকল রেজিস্টার্ড শপের প্রোডাক্ট একত্রিত থাকে।
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={() => window.open(marketplaceUrl, '_blank')}
              variant="primary"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              className="bg-orange-600 hover:bg-orange-700"
            >
              মার্কেটপ্লেস দেখুন
            </Button>
            <Button
              onClick={() => handleCopyLink(marketplaceUrl, 'সেন্ট্রাল মার্কেটপ্লেস লিংক কপি করা হয়েছে')}
              variant="outline"
              size="sm"
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              className="border-orange-700 text-orange-300 hover:bg-orange-900/50"
            >
              কপি
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          <span>ব্র্যান্ডিং ও প্রিভিউ</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'coupons'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4 text-pink-400" />
          <span>কুপন ও ডিসকাউন্ট ভাউচার</span>
        </button>

        <button
          onClick={() => setActiveTab('courier_fraud')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'courier_fraud'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4 text-amber-400" />
          <span>Steadfast কুরিয়ার ও ফ্রড চেকার</span>
        </button>

        <button
          onClick={() => setActiveTab('reseller')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'reseller'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>রিসেলার ও ড্রপশিপিং নেটওয়ার্ক</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_studio')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ai_studio'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wand2 className="w-4 h-4 text-purple-400" />
          <span>AI প্রোডাক্ট স্টুডিও ও কপিরাইটিং</span>
        </button>

        <button
          onClick={() => setActiveTab('marketing')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'marketing'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4 text-orange-400" />
          <span>ফেসবুক ও সোশ্যাল মার্কেটিং</span>
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'marketplace'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4 text-indigo-400" />
          <span>দারাজ মল ভেন্ডর সেটিংস</span>
        </button>
      </div>

      {/* Tab 1: Branding & Live Preview */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Settings Form */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>স্টোর ব্র্যান্ডিং ও কাস্টমাইজেশন</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                হিরো ব্যানার ইমেজ লিংক (Banner Image URL)
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                স্টোর ঘোষণা / অফার টেক্সট (Notice Bar)
              </label>
              <input
                type="text"
                value={storeNotice}
                onChange={(e) => setStoreNotice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  থিম কালার (Primary Brand Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                  />
                  <span className="font-mono text-xs text-slate-600">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  হোয়াটসঅ্যাপ অর্ডার নম্বর
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ফেসবুক পেজ লিংক (Facebook Page Link)
              </label>
              <input
                type="url"
                value={facebookLink}
                onChange={(e) => setFacebookLink(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={() => showToast('অনলাইন স্টোর সেটিংস সফলভাবে সেভ করা হয়েছে!', 'success')}
                variant="primary"
                size="md"
                className="w-full"
              >
                সেটিংস সেভ করুন
              </Button>
            </div>
          </div>

          {/* Live Device Preview */}
          <div className="lg:col-span-6 bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">গ্রাহক লাইভ প্রিভিউ (Customer View)</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">লাইভ ভিউ</span>
            </div>

            {/* Embedded Store Frame */}
            <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 max-w-sm mx-auto">
              <div
                style={{ backgroundColor: primaryColor }}
                className="py-1 px-2 text-[10px] text-white text-center font-medium truncate"
              >
                {storeNotice}
              </div>

              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: primaryColor }}
                    className="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs"
                  >
                    SX
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-tight">{shop.name}</h4>
                    <p className="text-[10px] text-slate-400">{shop.category}</p>
                  </div>
                </div>
                <ShoppingBag className="w-4 h-4 text-slate-600" />
              </div>

              <div className="relative h-28 bg-slate-100">
                <img
                  src={bannerUrl}
                  alt="Banner"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                  <span className="text-white text-xs font-bold">সেরা অফার ও নতুন কালেকশন</span>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">পণ্য তালিকা ({onlineProducts.length})</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">সকল পণ্য</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {onlineProducts.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="border border-slate-100 rounded-xl p-1.5 flex flex-col justify-between"
                    >
                      <div className="aspect-square rounded-lg bg-slate-50 overflow-hidden mb-1">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[11px] font-mono font-black text-emerald-700 mt-0.5">
                        {formatCurrency(p.sellingPrice - p.discount)}
                      </p>
                      <button
                        style={{ backgroundColor: primaryColor }}
                        className="mt-1 w-full py-1 text-[10px] text-white font-semibold rounded-md"
                      >
                        অর্ডার করুন
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Coupons & Promo Vouchers */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-pink-600" />
              <span>নতুন কুপন / ডিসকাউন্ট কোড তৈরি করুন</span>
            </h3>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">কুপন কোড (যেমন: EID2026, SUMMER20) *</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="যেমন: SPECIAL50"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ছাড়ের ধরন</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="percentage">শতাংশ (%) ছাড়</option>
                    <option value="fixed">টাকা (৳) ফ্ল্যাট ছাড়</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ছাড়ের পরিমাণ ({newCouponType === 'percentage' ? '%' : '৳'})
                  </label>
                  <input
                    type="number"
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">সর্বনিম্ন অর্ডার মূল্য (৳)</label>
                <input
                  type="number"
                  required
                  value={newCouponMin}
                  onChange={(e) => setNewCouponMin(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <Button type="submit" variant="primary" size="md" className="w-full bg-pink-600 hover:bg-pink-700">
                কুপন সক্রিয় করুন
              </Button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">সক্রিয় কুপন ও প্রমো কোড তালিকা ({coupons.length})</h3>
              <span className="text-[10px] bg-pink-100 text-pink-800 px-2.5 py-0.5 rounded-full font-bold">
                অনলাইন ও দারাজ মল
              </span>
            </div>

            <div className="space-y-2.5">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-pink-600 text-white font-mono text-xs font-black tracking-wider">
                        {c.code}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {c.discountType === 'percentage' ? `${c.discountValue}% ডিসকাউন্ট` : `৳${c.discountValue} ফ্ল্যাট ছাড়`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      সর্বনিম্ন অর্ডার: <b>৳{c.minOrderAmount}</b> • মেয়াদ: {c.expiryDate}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700 block font-mono">
                      {c.usageCount} বার ব্যবহৃত
                    </span>
                    <button
                      onClick={() => handleCopyLink(c.code, 'কুপন কোড কপি করা হয়েছে')}
                      className="text-[10px] text-pink-600 font-bold hover:underline"
                    >
                      কোড কপি
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Steadfast / Pathao Courier 1-Click & Fraud Checker */}
      {activeTab === 'courier_fraud' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-amber-950 text-white rounded-3xl p-6 border border-amber-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  অটোমেটেড কুরিয়ার ও কাস্টমার ফ্রড প্রিভেনশন ইঞ্জিন
                </span>
              </div>
              <h2 className="text-xl font-black">Steadfast ও Pathao ১-ক্লিক পার্সেল বুকিং</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                পার্সেল পাঠানোর পূর্বে কাস্টমারের পূর্বের রিটার্ন হিস্ট্রি এবং ডেলিভারি সাকসেস স্কোর যাচাই করুন।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: 1-Click Consignment Booking */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>১-ক্লিক কুরিয়ার পার্সেল বুকিং ফর্ম</span>
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {(['Steadfast', 'Pathao', 'RedX'] as const).map((courier) => (
                  <button
                    key={courier}
                    type="button"
                    onClick={() => setSelectedCourier(courier)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      selectedCourier === courier
                        ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {courier}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">গ্রাহকের নাম</label>
                    <input
                      type="text"
                      value={consignmentCustomer}
                      onChange={(e) => setConsignmentCustomer(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      value={consignmentPhone}
                      onChange={(e) => setConsignmentPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ডেলিভারি ঠিকানা</label>
                  <input
                    type="text"
                    value={consignmentAddress}
                    onChange={(e) => setConsignmentAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">কালেকশন অ্যামাউন্ট (COD ৳)</label>
                  <input
                    type="number"
                    value={consignmentAmount}
                    onChange={(e) => setConsignmentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <Button
                  onClick={handleCreateConsignment}
                  variant="primary"
                  size="md"
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  ১-ক্লিকে {selectedCourier}-এ পার্সেল তৈরি করুন
                </Button>

                {generatedTracking && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1 text-emerald-900">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>পার্সেল সফলভাবে তৈরি হয়েছে!</span>
                    </div>
                    <p className="font-mono text-xs font-bold">
                      কুরিয়ার ট্র্যাকিং নম্বর: <b>{generatedTracking}</b>
                    </p>
                    <button
                      onClick={() => window.print()}
                      className="text-[11px] text-emerald-700 font-bold hover:underline"
                    >
                      প্রিন্ট স্লিপ / চালান লেবেল ডাউনলোড
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Phone Fraud Checker */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>কাস্টমার ফ্রড ও রিটার্ন রিস্ক চেকার</span>
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">কাস্টমারের ফোন নম্বর দিন:</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-rose-500"
                  />
                  <Button
                    onClick={handleCheckFraud}
                    variant="primary"
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    যাচাই করুন
                  </Button>
                </div>
              </div>

              {fraudResult && (
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  fraudResult.riskLevel === 'High Risk'
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : fraudResult.riskLevel === 'Moderate'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">ডেলিভারি সাকসেস রেট:</span>
                    <span className="text-lg font-black font-mono">{fraudResult.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>পূর্বে সফল ডেলিভারি: {fraudResult.deliveredCount} টি</span>
                    <span>রিটার্ন / বাতিল: {fraudResult.returnedCount} টি</span>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed pt-1 border-t border-slate-200/50">
                    {fraudResult.summary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Reseller & Dropshipping Network */}
      {activeTab === 'reseller' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span>নতুন রিসেলার / অ্যাফিলিয়েট নিবন্ধন</span>
            </h3>

            <form onSubmit={handleRegisterReseller} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">রিসেলারের নাম *</label>
                <input
                  type="text"
                  required
                  value={newResellerName}
                  onChange={(e) => setNewResellerName(e.target.value)}
                  placeholder="যেমন: সুমন চৌধুরী"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={newResellerPhone}
                    onChange={(e) => setNewResellerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">বিকাশ নম্বর</label>
                  <input
                    type="tel"
                    value={newResellerBkash}
                    onChange={(e) => setNewResellerBkash(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">রেফারেল কোড *</label>
                  <input
                    type="text"
                    required
                    value={newResellerCode}
                    onChange={(e) => setNewResellerCode(e.target.value.toUpperCase())}
                    placeholder="যেমন: SUMON10"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">কমিশন রেট (%)</label>
                  <input
                    type="number"
                    value={newResellerCommission}
                    onChange={(e) => setNewResellerCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" size="md" className="w-full bg-sky-600 hover:bg-sky-700">
                রিসেলার অ্যাকাউন্ট খুলুন
              </Button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">নিবন্ধিত রিসেলার ও কমিশন হিসাব ({resellers.length})</h3>
              <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-bold">
                ড্রপশিপিং একটিভ
              </span>
            </div>

            <div className="space-y-3">
              {resellers.map((r) => (
                <div key={r.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{r.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        রেফারেল লিংক: {marketplaceUrl}?ref={r.referralCode}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 text-xs font-bold font-mono">
                      {r.commissionPercent}% কমিশন
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">মোট সেলস</span>
                      <span className="font-mono font-bold">{formatCurrency(r.totalSalesAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">অর্জিত কমিশন</span>
                      <span className="font-mono font-bold text-emerald-600">{formatCurrency(r.totalCommissionEarned)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">বকেয়া প্রদেয়</span>
                      <span className="font-mono font-bold text-amber-600">{formatCurrency(r.pendingCommission)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: AI Product Studio & Bengali Copywriting Engine */}
      {activeTab === 'ai_studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-600" />
              <span>AI স্টুডিও ফটো ও হাই-কনভার্টিং বাংলা ক্যাপশন</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">প্রোডাক্ট নির্বাচন করুন</label>
              <select
                value={selectedAIProduct?.id || ''}
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  if (p) setSelectedAIProduct(p);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (৳{p.sellingPrice})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">AI ফটো স্টুডিও ব্যাকগ্রাউন্ড স্টাইল</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'studio', label: 'হোয়াইট স্টুডিও' },
                  { id: 'luxury', label: 'লাক্সারি উডেন' },
                  { id: 'nature', label: 'ন্যাচারাল ডেলাইট' },
                  { id: 'minimal', label: 'মিনিমাল শ্যাডো' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setAiBackgroundStyle(s.id as any)}
                    className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                      aiBackgroundStyle === s.id
                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateAICopy}
              disabled={isGeneratingAI}
              variant="primary"
              size="md"
              className="w-full bg-purple-600 hover:bg-purple-700"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {isGeneratingAI ? 'AI ক্যাপশন তৈরি হচ্ছে...' : 'AI বাংলা সেলস কপি তৈরি করুন'}
            </Button>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">AI জেনারেটেড ফেসবুক / বিজ্ঞাপন পোস্ট কপি</h3>

            {generatedAICopy ? (
              <div className="space-y-3">
                <textarea
                  rows={9}
                  readOnly
                  value={generatedAICopy}
                  className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-300 text-xs font-sans text-slate-800 leading-relaxed focus:outline-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopyLink(generatedAICopy, 'AI কপি টেক্সট কপি করা হয়েছে!')}
                    variant="primary"
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    leftIcon={<Copy className="w-3.5 h-3.5" />}
                  >
                    কপি করুন
                  </Button>
                  <Button
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generatedAICopy)}`, '_blank')}
                    variant="success"
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                  >
                    হোয়াটসঅ্যাপে পাঠান
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <span>বাম পাশ থেকে যেকোনো পণ্য নির্বাচন করে বাটন চাপুন</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Social Media Marketing & Ads Studio */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 border border-blue-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="w-5 h-5 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  সোশ্যাল মিডিয়া ও অ্যাডস মার্কেটিং ইঞ্জিন
                </span>
              </div>
              <h2 className="text-xl font-black">ফেসবুক পেজ, হোয়াটসঅ্যাপ ও বুস্টিং ক্যাম্পেইন টুলস</h2>
              <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
                এক ক্লিকে সোশ্যাল পোস্ট তৈরি করুন, আকর্ষক বাংলা ক্যাপশন কপি করুন এবং আপনার স্টোরের জন্য প্রিন্টযোগ্য QR কোড ডাউনলোড করুন।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleOpenFacebookShare}
                variant="primary"
                size="md"
                leftIcon={<Share2 className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-700"
              >
                ফেসবুকে শেয়ার
              </Button>
              <Button
                onClick={handleOpenWhatsAppCampaign}
                variant="success"
                size="md"
                leftIcon={<MessageCircle className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                হোয়াটসঅ্যাপে পাঠান
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    রেডিমেড সোশ্যাল পোস্ট ও ফেসবুক অ্যাডস ক্যাপশন
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  AI কন্টেন্ট
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ক্যাম্পেইনের ধরন নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'discount', label: 'মেগা ডিসকাউন্ট', icon: Percent },
                    { id: 'new_arrival', label: 'নতুন কালেকশন', icon: Sparkles },
                    { id: 'free_delivery', label: 'ফ্রি ডেলিভারি', icon: Globe },
                    { id: 'flash_sale', label: 'ফ্ল্যাশ সেল', icon: Flame },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedCampaignType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        selectedCampaignType === t.id
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রস্তুতকৃত ফেসবুক পোস্ট ও ক্যাপশন:
                </label>
                <div className="relative">
                  <textarea
                    rows={8}
                    readOnly
                    value={marketingCaptions[selectedCampaignType]}
                    className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-300 text-xs font-sans text-slate-800 leading-relaxed focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyLink(marketingCaptions[selectedCampaignType], 'পোস্ট ক্যাপশন কপি করা হয়েছে!')}
                    className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 shadow-xs text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি করুন</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 text-center space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    দোকানের প্রিন্টযোগ্য QR কোড
                  </h4>
                  <span className="text-[10px] text-slate-400">স্ক্যান করে সরাসরি অর্ডার</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 inline-block mx-auto">
                  <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-xs flex flex-col items-center justify-center border border-slate-200">
                    <QrCode className="w-28 h-28 text-slate-900" />
                    <span className="text-[9px] font-bold text-slate-500 font-mono mt-1">
                      {shop.storeSlug || 'smart-shop'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  এই QR কোডটি প্রিন্ট করে আপনার দোকানের ক্যাশ কাউন্টারে, পার্সেল প্যাকেজিংয়ে বা ব্যানারে ব্যবহার করতে পারবেন।
                </p>

                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  QR কোড প্রিন্ট / ডাউনলোড করুন
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Daraz Mega Mall Vendor Settings */}
      {activeTab === 'marketplace' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MallIcon className="w-5 h-5 text-orange-600" />
                দারাজ-স্টাইল সেন্ট্রাল মার্কেটপ্লেসে অংশগ্রহণ (Vendor Settings)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                আপনার সক্রিয় অনলাইন প্রোডাক্টগুলো স্বয়ংক্রিয়ভাবে কেন্দ্রীয় দারাজ মলে সকল ক্রেতার কাছে প্রদর্শিত হবে
              </p>
            </div>

            <Button
              onClick={() => window.open(marketplaceUrl, '_blank')}
              variant="primary"
              size="md"
              leftIcon={<ExternalLink className="w-4 h-4" />}
              className="bg-orange-600 hover:bg-orange-700"
            >
              সেন্ট্রাল মল ওপেন করুন
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-1">
              <span className="text-xs font-semibold text-orange-700">মার্কেটপ্লেসে আপনার লাইভ পণ্য</span>
              <p className="text-2xl font-black text-orange-950 font-mono">{onlineProducts.length} টি</p>
              <span className="text-[11px] text-orange-600">সবগুলো সেন্ট্রাল মলে দৃশ্যমান</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-xs font-semibold text-emerald-700">মার্চেন্ট ভেরিফিকেশন স্ট্যাটাস</span>
              <p className="text-lg font-black text-emerald-950 flex items-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>ভেরিফাইড অফিসিয়াল স্টোর</span>
              </p>
              <span className="text-[11px] text-emerald-600">ক্রেতাদের কাছে ট্রাস্টেড ব্যাজ দেখাবে</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
              <span className="text-xs font-semibold text-blue-700">অর্ডার রাউটিং ও কালেকশন</span>
              <p className="text-sm font-bold text-blue-950">সরাসরি আপনার ব্যাকঅফিসে</p>
              <span className="text-[11px] text-blue-600">মার্কেটপ্লেস অর্ডারে DM ট্যাগ থাকবে</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

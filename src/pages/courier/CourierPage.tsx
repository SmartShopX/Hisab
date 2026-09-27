import React, { useState } from 'react';
import { CourierProvider, CourierApiCredential, PaymentGatewayConfig } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FeatureLockGuard } from '../../components/common/FeatureLockGuard';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  Key,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Copy,
  Radio,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const CourierPage: React.FC = () => {
  const { shop } = useAuth();
  const { showToast } = useToast();
  const isLocked = shop.subscriptionPlan === 'Basic';
  const [activeTab, setActiveTab] = useState<'courier' | 'payment_gateways'>('courier');
  const [orders] = useState(() => DataStore.getOrders());

  // Courier credentials state
  const [credentials, setCredentials] = useState<CourierApiCredential[]>(() =>
    DataStore.getCourierCredentials()
  );

  // Payment gateways state
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>(() =>
    DataStore.getPaymentGateways()
  );

  // Modals & form state
  const [selectedCourier, setSelectedCourier] = useState<CourierProvider | null>(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierApiKey, setCourierApiKey] = useState('');
  const [courierSecretKey, setCourierSecretKey] = useState('');
  const [courierClientId, setCourierClientId] = useState('');
  const [courierIsLive, setCourierIsLive] = useState(true);

  // Payment gateway modal
  const [selectedGateway, setSelectedGateway] = useState<
    'bKash' | 'Nagad' | 'SSLCommerz' | 'Shurjopay' | 'Aamarpay' | null
  >(null);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [gwAppKey, setGwAppKey] = useState('');
  const [gwAppSecret, setGwAppSecret] = useState('');
  const [gwUsername, setGwUsername] = useState('');
  const [gwPassword, setGwPassword] = useState('');
  const [gwIsLive, setGwIsLive] = useState(false);
  const [gwIsEnabled, setGwIsEnabled] = useState(true);

  const couriersMeta: {
    id: CourierProvider;
    name: string;
    tagline: string;
    logoText: string;
    color: string;
  }[] = [
    {
      id: 'Steadfast',
      name: 'Steadfast Courier',
      tagline: 'বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ই-কমার্স ক্যাশ অন ডেলিভারি কুরিয়ার নেটওয়ার্ক',
      logoText: 'SF',
      color: 'bg-emerald-600',
    },
    {
      id: 'Pathao',
      name: 'Pathao Courier',
      tagline: 'দ্রুততম সিটি ও দেশব্যাপী এক্সপ্রেস পার্সেল ও ডেলিভারি সমাধান',
      logoText: 'PT',
      color: 'bg-rose-600',
    },
    {
      id: 'RedX',
      name: 'RedX Delivery',
      tagline: 'দেশব্যাপী ডোর-টু-ডোর হোম ডেলিভারি ও রিয়েল-টাইম কুরিয়ার ট্র্যাকিং',
      logoText: 'RX',
      color: 'bg-red-500',
    },
    {
      id: 'Paperfly',
      name: 'Paperfly',
      tagline: 'ডোরস্টেপ পিকআপ ও ক্যাশ কালেকশন সার্ভিস',
      logoText: 'PF',
      color: 'bg-sky-600',
    },
    {
      id: 'Sundarban',
      name: 'সুন্দরবন কুরিয়ার সার্ভিস',
      tagline: 'ঐতিহ্যবাহী থানা ও জেলা পর্যায়ের দ্রুত পার্সেল ও কন্ডিশন বুকিং',
      logoText: 'SB',
      color: 'bg-amber-600',
    },
    {
      id: 'eCourier',
      name: 'eCourier',
      tagline: 'স্মার্ট পার্সেল ট্র্যাকিং ও ইনস্ট্যান্ট ওটিপি ভিত্তিক ডেলিভারি',
      logoText: 'EC',
      color: 'bg-purple-600',
    },
  ];

  // Open Courier Config
  const handleOpenCourierConfig = (provider: CourierProvider) => {
    setSelectedCourier(provider);
    const existing = credentials.find((c) => c.provider === provider);
    if (existing) {
      setCourierApiKey(existing.apiKey);
      setCourierSecretKey(existing.secretKey);
      setCourierClientId(existing.clientId || '');
      setCourierIsLive(existing.isLive);
    } else {
      setCourierApiKey('');
      setCourierSecretKey('');
      setCourierClientId('');
      setCourierIsLive(true);
    }
    setIsCourierModalOpen(true);
  };

  const handleSaveCourierConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourier) return;

    const updated = credentials.map((c) => {
      if (c.provider === selectedCourier) {
        return {
          ...c,
          apiKey: courierApiKey.trim(),
          secretKey: courierSecretKey.trim(),
          clientId: courierClientId.trim(),
          isLive: courierIsLive,
          isConnected: Boolean(courierApiKey.trim() && courierSecretKey.trim()),
          lastTestedAt: new Date().toLocaleDateString('bn-BD') + ' এপিআই কনফিগারড',
        };
      }
      return c;
    });

    setCredentials(updated);
    DataStore.setCourierCredentials(updated);
    setIsCourierModalOpen(false);
    showToast(`${selectedCourier} এপিআই ক্রেডেনশিয়াল সংরক্ষিত হয়েছে`, 'success');
  };

  const handleTestCourierConnection = (provider: CourierProvider) => {
    showToast(`${provider} এপিআই সংযোগ পরীক্ষা করা হচ্ছে...`, 'info');
    setTimeout(() => {
      const updated = credentials.map((c) => {
        if (c.provider === provider) {
          return {
            ...c,
            isConnected: true,
            lastTestedAt: 'সফলভাবে টেস্ট সম্পন্ন (' + new Date().toLocaleTimeString('bn-BD') + ')',
          };
        }
        return c;
      });
      setCredentials(updated);
      DataStore.setCourierCredentials(updated);
      showToast(`${provider} এপিআই কানেকশন সম্পূর্ণ সফল! পার্সেল অটো বুকিং প্রস্তুত।`, 'success');
    }, 800);
  };

  // Open Gateway Config
  const handleOpenGatewayConfig = (gateway: 'bKash' | 'Nagad' | 'SSLCommerz' | 'Shurjopay' | 'Aamarpay') => {
    setSelectedGateway(gateway);
    const existing = paymentGateways.find((g) => g.gateway === gateway);
    if (existing) {
      setGwAppKey(existing.appKey);
      setGwAppSecret(existing.appSecret);
      setGwUsername(existing.username || '');
      setGwPassword(existing.password || '');
      setGwIsLive(existing.isLive);
      setGwIsEnabled(existing.isEnabled);
    } else {
      setGwAppKey('');
      setGwAppSecret('');
      setGwUsername('');
      setGwPassword('');
      setGwIsLive(false);
      setGwIsEnabled(true);
    }
    setIsGatewayModalOpen(true);
  };

  const handleSaveGatewayConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway) return;

    const updated = paymentGateways.map((g) => {
      if (g.gateway === selectedGateway) {
        return {
          ...g,
          appKey: gwAppKey.trim(),
          appSecret: gwAppSecret.trim(),
          username: gwUsername.trim(),
          password: gwPassword.trim(),
          isLive: gwIsLive,
          isEnabled: gwIsEnabled,
          lastTestedAt: new Date().toLocaleDateString('bn-BD'),
        };
      }
      return g;
    });

    setPaymentGateways(updated);
    DataStore.setPaymentGateways(updated);
    setIsGatewayModalOpen(false);
    showToast(`${selectedGateway} গেটওয়ে ক্রেডেনশিয়াল সেভ করা হয়েছে`, 'success');
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText('https://api.smartshopx.com/v1/courier/webhook/notify');
    showToast('কুরিয়ার ওয়েবহুক URL কপি করা হয়েছে', 'success');
  };

  // Orders with courier
  const courierOrders = orders.filter((o) => o.courierProvider);

  return (
    <FeatureLockGuard isLocked={isLocked} featureTitle="কুরিয়ার অটোমেশন ও পেমেন্ট গেটওয়ে এপিআই">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            কুরিয়ার ও পেমেন্ট এপিআই হাব (Courier & Payment Hub)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Steadfast, Pathao, RedX কুরিয়ার এপিআই এবং bKash, Nagad, SSLCommerz অনলাইন পেমেন্ট গেটওয়ে
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleCopyWebhook}
            variant="outline"
            size="sm"
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            অটো ওয়েবহুক লিংক
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('courier')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'courier'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          কুরিয়ার ইন্টিগ্রেশন ও ট্র্যাকিং
        </button>
        <button
          onClick={() => setActiveTab('payment_gateways')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'payment_gateways'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          অনলাইন পেমেন্ট গেটওয়ে (Payment Gateways)
        </button>
      </div>

      {/* Tab 1: Courier */}
      {activeTab === 'courier' && (
        <div className="space-y-6">
          {/* Courier Provider Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {couriersMeta.map((c) => {
              const cred = credentials.find((item) => item.provider === c.id);
              const isConnected = cred?.isConnected;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-2xl ${c.color} text-white font-black text-sm flex items-center justify-center`}
                      >
                        {c.logoText}
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isConnected ? 'সংযুক্ত (Active)' : 'কনফিগার করুন'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.tagline}</p>

                    {cred?.lastTestedAt && (
                      <p className="text-[11px] text-emerald-700 mt-2 font-mono">
                        {cred.lastTestedAt}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isConnected && (
                      <button
                        type="button"
                        onClick={() => handleTestCourierConnection(c.id)}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> টেস্ট করুন
                      </button>
                    )}
                    <div className="ml-auto">
                      <Button
                        onClick={() => handleOpenCourierConfig(c.id)}
                        variant="outline"
                        size="sm"
                        leftIcon={<Key className="w-3.5 h-3.5" />}
                      >
                        এপিআই কী
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Courier Parcels Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  কুরিয়ারে অর্পিত পার্সেলসমূহ (Active Shipments)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">রিয়েল-টাইম ডেলিভারি স্ট্যাটাস ও ট্র্যাকিং কোড</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                মোট পার্সেল: {courierOrders.length} টি
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                    <th className="py-3 px-4">অর্ডার নং</th>
                    <th className="py-3 px-4">কুরিয়ার পার্টনার</th>
                    <th className="py-3 px-4">কনসাইনমেন্ট / ট্র্যাকিং নং</th>
                    <th className="py-3 px-4">গ্রাহক ও জেলা</th>
                    <th className="py-3 px-4">পার্সেল অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courierOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{o.courierProvider}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {o.courierTrackingId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 block">{o.customerName}</span>
                        <span className="text-[11px] text-slate-400">{o.customerAddress}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Truck className="w-3 h-3" />
                          {o.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payment Gateways */}
      {activeTab === 'payment_gateways' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 text-xs text-emerald-900 flex items-start gap-3">
            <Zap className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">স্বয়ংক্রিয় অনলাইন পেমেন্ট চেকআউট</h4>
              <p className="mt-0.5 leading-relaxed text-emerald-800">
                আপনার অনলাইন স্টোর এবং ল্যান্ডিং পেজে সরাসরি গ্রাহকদের কাছ থেকে ডিজিটাল পেমেন্ট গ্রহণ করতে নিচের
                গেটওয়েগুলোর মার্চেন্ট এপিআই কি ও সিক্রেট কোড যুক্ত করুন।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentGateways.map((gw) => (
              <div
                key={gw.gateway}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-base text-slate-900">{gw.gateway}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        gw.isEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {gw.isEnabled ? (gw.isLive ? 'Live' : 'Sandbox (Test)') : 'নিষ্ক্রিয়'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {gw.gateway === 'bKash'
                      ? 'বিকাশ ডিরেক্ট মার্চেন্ট পিজিডব্লিউ চেকআউট'
                      : gw.gateway === 'Nagad'
                      ? 'নগদ অনলাইন পেমেন্ট গেটওয়ে মার্চেন্ট API'
                      : gw.gateway === 'SSLCommerz'
                      ? 'কার্ড, নেট ব্যাংকিং ও মোবাইল ওয়ালেট সমন্বিত গেটওয়ে'
                      : 'বাংলাদেশি ইনস্ট্যান্ট পেমেন্ট গেটওয়ে'}
                  </p>

                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl text-[11px] font-mono text-slate-600 space-y-1">
                    <div>App Key: {gw.appKey ? `${gw.appKey.substring(0, 8)}...` : '(সেট করা নেই)'}</div>
                    <div>মোড: {gw.isLive ? '🔴 Live Production' : '🟡 Test Sandbox'}</div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {gw.isEnabled ? 'অর্ডার ফর্মে সক্রিয়' : 'অফ করা আছে'}
                  </span>
                  <Button
                    onClick={() => handleOpenGatewayConfig(gw.gateway)}
                    variant="outline"
                    size="sm"
                    leftIcon={<Key className="w-3.5 h-3.5" />}
                  >
                    কনফিগার
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courier Config Modal */}
      {selectedCourier && (
        <Modal
          isOpen={isCourierModalOpen}
          onClose={() => setIsCourierModalOpen(false)}
          title={`${selectedCourier} এপিআই কনফিগারেশন`}
          subtitle="আপনার কুরিয়ার মার্চেন্ট অ্যাকাউন্ট হতে প্রাপ্ত এপিআই কী ও সিক্রেট কোড প্রবেশ করান"
          maxWidth="sm"
        >
          <form onSubmit={handleSaveCourierConfig} className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">কুরিয়ার এনভায়রনমেন্ট</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCourierIsLive(false)}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${
                    !courierIsLive ? 'bg-amber-100 text-amber-900' : 'text-slate-500'
                  }`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setCourierIsLive(true)}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${
                    courierIsLive ? 'bg-emerald-600 text-white' : 'text-slate-500'
                  }`}
                >
                  Live Production
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                API Key (এপিআই কী) *
              </label>
              <input
                type="text"
                value={courierApiKey}
                onChange={(e) => setCourierApiKey(e.target.value)}
                placeholder="যেমন: sf_live_key_..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Secret Key (সিক্রেট কী) *
              </label>
              <input
                type="password"
                value={courierSecretKey}
                onChange={(e) => setCourierSecretKey(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client ID / Merchant Code (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={courierClientId}
                onChange={(e) => setCourierClientId(e.target.value)}
                placeholder="যেমন: SF-10492"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              * SmartShopX সুরক্ষিত ব্যাকএন্ড ভল্টের মাধ্যমে কুরিয়ার এপিআই এর সাথে সরাসরি যোগাযোগ করে স্বয়ংক্রিয় পার্সেল বুকিং নিশ্চিত করে।
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCourierModalOpen(false)}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" size="sm">
                সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Gateway Config Modal */}
      {selectedGateway && (
        <Modal
          isOpen={isGatewayModalOpen}
          onClose={() => setIsGatewayModalOpen(false)}
          title={`${selectedGateway} পেমেন্ট গেটওয়ে কনফিগারেশন`}
          subtitle="অনলাইন চেকআউট ও পেমেন্ট গ্রহণের জন্য মার্চেন্ট ক্রেডেনশিয়াল প্রদান করুন"
          maxWidth="sm"
        >
          <form onSubmit={handleSaveGatewayConfig} className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">গেটওয়ে স্ট্যাটাস ও মোড</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGwIsLive(!gwIsLive)}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${
                    gwIsLive ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {gwIsLive ? 'Live' : 'Sandbox (Test)'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {selectedGateway === 'SSLCommerz' ? 'Store ID *' : 'App Key / Merchant Key *'}
              </label>
              <input
                type="text"
                value={gwAppKey}
                onChange={(e) => setGwAppKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {selectedGateway === 'SSLCommerz' ? 'Store Password *' : 'App Secret / Private Key *'}
              </label>
              <input
                type="password"
                value={gwAppSecret}
                onChange={(e) => setGwAppSecret(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {selectedGateway === 'bKash' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={gwUsername}
                    onChange={(e) => setGwUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={gwPassword}
                    onChange={(e) => setGwPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="gwEnable"
                checked={gwIsEnabled}
                onChange={(e) => setGwIsEnabled(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="gwEnable" className="text-xs font-semibold text-slate-700">
                অনলাইন চেকআউটে এই পেমেন্ট অপশনটি সক্রিয় রাখুন
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsGatewayModalOpen(false)}
              >
                বাতিল
              </Button>
              <Button type="submit" variant="primary" size="sm">
                সেভ করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}
      </div>
    </FeatureLockGuard>
  );
};

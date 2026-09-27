import React, { useState, useEffect } from 'react';
import { telecomApi, productApi } from '../../services/apiServices';
import {
  TelecomTransaction,
  TelecomBalance,
  Product,
  MobileRepairTicket,
  DrivePackOffer,
  TelecomDailyClosing,
} from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { isValidBdMobile } from '../../utils/validation';
import { DeviceServicingView } from './DeviceServicingView';
import { DrivePacksView } from './DrivePacksView';
import { TelecomReconciliationView } from './TelecomReconciliationView';
import {
  Smartphone,
  PhoneCall,
  CreditCard,
  Zap,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Settings,
  Layers,
  Search,
  KeyRound,
  ShieldCheck,
  Wrench,
  Flame,
  Calculator,
} from 'lucide-react';

export const TelecomPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'recharge_mfs' | 'servicing' | 'drive_packs' | 'reconciliation' | 'accessories' | 'balances' | 'api_gateway'
  >('recharge_mfs');
  const [transactions, setTransactions] = useState<TelecomTransaction[]>([]);
  const [balances, setBalances] = useState<TelecomBalance[]>([]);
  const [accessories, setAccessories] = useState<Product[]>([]);
  const [tickets, setTickets] = useState<MobileRepairTicket[]>([]);
  const [drivePacks, setDrivePacks] = useState<DrivePackOffer[]>([]);
  const [closings, setClosings] = useState<TelecomDailyClosing[]>([]);
  const [loading, setLoading] = useState(true);

  // New Transaction Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'RECHARGE' | 'MFS_CASH_IN' | 'MFS_CASH_OUT' | 'SIM_SALE'>('RECHARGE');
  const [provider, setProvider] = useState<string>('Grameenphone');
  const [recipientNumber, setRecipientNumber] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [commission, setCommission] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [txList, balList, prodList, ticketList, packList, closingList] = await Promise.all([
        telecomApi.getTransactions(),
        telecomApi.getBalances(),
        productApi.getAll(),
        telecomApi.getRepairTickets(),
        telecomApi.getDrivePacks(),
        telecomApi.getDailyClosings(),
      ]);
      setTransactions(txList);
      setBalances(balList);
      setTickets(ticketList);
      setDrivePacks(packList);
      setClosings(closingList);
      // Filter mobile accessories & gadgets
      setAccessories(
        prodList.filter(
          (p) =>
            p.category.toLowerCase().includes('mobile') ||
            p.category.toLowerCase().includes('accessories') ||
            p.category.toLowerCase().includes('electronics') ||
            p.name.toLowerCase().includes('charger') ||
            p.name.toLowerCase().includes('phone') ||
            p.name.toLowerCase().includes('sim') ||
            p.name.toLowerCase().includes('cable') ||
            p.name.toLowerCase().includes('power bank')
        )
      );
    } catch {
      showToast('টেলিকম ও এক্সেসরিজ ডেটা লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidBdMobile(recipientNumber)) {
      showToast('সঠিক ১১ ডিজিটের গ্রাহক মোবাইল নম্বর দিন', 'warning');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast('সঠিক টাকার পরিমাণ লিখুন', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const commCalc = commission ? Number(commission) : Math.round(Number(amount) * 0.027 * 10) / 10;
      const newTx = await telecomApi.recordTransaction({
        type: txType,
        provider: provider as any,
        recipientNumber,
        amount: Number(amount),
        commission: commCalc,
        status: 'Success',
        transactionId: `TRX-${provider.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: notes.trim() || undefined,
      });

      setTransactions([newTx, ...transactions]);
      setIsModalOpen(false);
      setRecipientNumber('');
      setAmount('');
      setCommission('');
      setNotes('');
      showToast('টেলিকম/এমএফএস লেনদেন সফলভাবে রেকর্ড করা হয়েছে', 'success');
    } catch {
      showToast('লেনদেন সম্পন্ন করা যায়নি', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Repair Ticket Handlers
  const handleCreateTicket = async (
    ticketData: Omit<MobileRepairTicket, 'id' | 'ticketNumber' | 'receivedDate'>
  ) => {
    const newTicket = await telecomApi.createRepairTicket(ticketData);
    setTickets((prev) => [newTicket, ...prev]);
    // If advance paid > 0, record in telecom transaction
    if (ticketData.advancePaid && ticketData.advancePaid > 0) {
      const advTx = await telecomApi.recordTransaction({
        type: 'SERVICING_BILL',
        provider: 'Device Repair',
        recipientNumber: ticketData.customerMobile,
        amount: ticketData.advancePaid,
        commission: 0,
        status: 'Success',
        transactionId: `ADV-${newTicket.ticketNumber}`,
        notes: `সার্ভিসিং অগ্রিম জমা: ${newTicket.deviceModel} (${newTicket.ticketNumber})`,
      });
      setTransactions((prev) => [advTx, ...prev]);
    }
  };

  const handleUpdateTicket = async (ticket: MobileRepairTicket) => {
    const previous = tickets.find((t) => t.id === ticket.id);
    const updated = await telecomApi.updateRepairTicket(ticket);
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));

    // If ticket was just marked as Delivered and has due paid, record billing
    if (previous && previous.status !== 'Delivered' && ticket.status === 'Delivered') {
      const remainingDue = (ticket.estimatedCost || 0) - (ticket.advancePaid || 0);
      if (remainingDue > 0) {
        const dueTx = await telecomApi.recordTransaction({
          type: 'SERVICING_BILL',
          provider: 'Device Repair',
          recipientNumber: ticket.customerMobile,
          amount: remainingDue,
          commission: ticket.serviceCharge || 0,
          status: 'Success',
          transactionId: `DLV-${ticket.ticketNumber}`,
          notes: `সার্ভিসিং ডেলিভারি বিল পরিশোধ: ${ticket.deviceModel} (${ticket.ticketNumber})`,
        });
        setTransactions((prev) => [dueTx, ...prev]);
      }
    }
  };

  const handleDeleteTicket = async (id: string) => {
    await telecomApi.deleteRepairTicket(id);
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  // Drive Pack Handlers
  const handleSaveDrivePack = async (pack: DrivePackOffer) => {
    await telecomApi.saveDrivePack(pack);
    setDrivePacks((prev) => {
      const idx = prev.findIndex((p) => p.id === pack.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = pack;
        return copy;
      }
      return [pack, ...prev];
    });
  };

  const handleDeleteDrivePack = async (id: string) => {
    await telecomApi.deleteDrivePack(id);
    setDrivePacks((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRecordDriveSale = async (txData: Omit<TelecomTransaction, 'id' | 'date'>) => {
    const newTx = await telecomApi.recordTransaction(txData);
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Daily Closing Handlers
  const handleSaveClosing = async (closingData: Omit<TelecomDailyClosing, 'id' | 'createdAt'>) => {
    const saved = await telecomApi.saveDailyClosing(closingData);
    setClosings((prev) => [saved, ...prev.filter((c) => c.date !== saved.date)]);
  };

  const handleDeleteClosing = async (id: string) => {
    await telecomApi.deleteDailyClosing(id);
    setClosings((prev) => prev.filter((c) => c.id !== id));
  };

  // Provider options based on type
  const telecomProviders = ['Grameenphone', 'Banglalink', 'Robi', 'Airtel', 'Teletalk'];
  const mfsProviders = ['bKash', 'Nagad', 'Rocket', 'Upay'];

  const filteredTx = transactions.filter((t) => {
    if (!searchTerm) return true;
    return (
      t.recipientNumber.includes(searchTerm) ||
      t.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.transactionId && t.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalRechargeSales = transactions
    .filter((t) => t.type === 'RECHARGE' || t.type === 'DRIVE_PACK')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMfsVolume = transactions
    .filter((t) => t.type === 'MFS_CASH_IN' || t.type === 'MFS_CASH_OUT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCommission = transactions.reduce((sum, t) => sum + t.commission, 0);

  const activeRepairsCount = tickets.filter(
    (t) => t.status === 'Received' || t.status === 'In Repair' || t.status === 'Ready'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              টেলিকম ও মোবাইল অ্যাক্সেসরিজ (Telecom & Mobile Hub)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              সম্পূর্ণ অল-ইন-ওয়ান
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            মোবাইল রিচার্জ, এমএফএস, ড্রাইভ প্যাক, মোবাইল সার্ভিসিং ও গ্যাজেট ইনভেন্টরি
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setActiveTab('servicing')}
            variant="outline"
            size="sm"
            leftIcon={<Wrench className="w-3.5 h-3.5 text-blue-600" />}
          >
            সার্ভিসিং জব শিট
          </Button>

          <Button
            onClick={() => setActiveTab('drive_packs')}
            variant="outline"
            size="sm"
            leftIcon={<Flame className="w-3.5 h-3.5 text-amber-500" />}
          >
            ড্রাইভ প্যাক
          </Button>

          <Button
            onClick={() => {
              setTxType('RECHARGE');
              setProvider('Grameenphone');
              setIsModalOpen(true);
            }}
            variant="primary"
            size="sm"
            leftIcon={<Zap className="w-4 h-4" />}
            className="shadow-sm"
          >
            ফাস্ট রিচার্জ / ক্যাশ-ইন
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">মোট রিচার্জ ও ড্রাইভ</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">
            {formatCurrency(totalRechargeSales)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">জিপি, রবি, বাংলালিংক, এয়ারটেল</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">এমএফএস ট্রানজ্যাকশন</span>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">
            {formatCurrency(totalMfsVolume)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">বিকাশ, নগদ, রকেট ক্যাশ-ইন/আউট</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">অর্জিত কমিশন ও লাভ</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600">
            {formatCurrency(totalCommission)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">টেলিকম, ড্রাইভ ও সার্ভিসিং ফি</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">চলতি মেরামত ডিভাইস</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-indigo-600">
            {activeRepairsCount} টি সচল
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ল্যাবে সার্ভিসিং এর অপেক্ষায়</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-1.5 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('recharge_mfs')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'recharge_mfs'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          রিচার্জ ও এমএফএস খতিয়ান
        </button>

        <button
          onClick={() => setActiveTab('servicing')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'servicing'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          সার্ভিসিং জব শিট ({tickets.length})
        </button>

        <button
          onClick={() => setActiveTab('drive_packs')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'drive_packs'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500" />
          ড্রাইভ প্যাক ও অফার ({drivePacks.length})
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reconciliation'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4 text-purple-600" />
          ব্যালেন্স ক্লোজিং
        </button>

        <button
          onClick={() => setActiveTab('accessories')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'accessories'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          অ্যাক্সেসরিজ ইনভেন্টরি ({accessories.length})
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'balances'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          সিম ও ওয়ালেট ব্যালেন্স
        </button>

        <button
          onClick={() => setActiveTab('api_gateway')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'api_gateway'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          এপিআই ও গেটওয়ে
        </button>
      </div>

      {/* Tab 1: Recharge & MFS Log */}
      {activeTab === 'recharge_mfs' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="নম্বর বা TrxID দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="text-xs text-slate-500">
              মোট রেকর্ড: <span className="font-bold text-slate-800">{filteredTx.length} টি</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">তারিখ ও সময়</th>
                  <th className="py-3 px-4 font-semibold">ধরন</th>
                  <th className="py-3 px-4 font-semibold">অপারেটর/প্রোভাইডার</th>
                  <th className="py-3 px-4 font-semibold">গ্রাহকের নম্বর</th>
                  <th className="py-3 px-4 font-semibold">টাকার পরিমাণ</th>
                  <th className="py-3 px-4 font-semibold">কমিশন</th>
                  <th className="py-3 px-4 font-semibold">ট্রানজ্যাকশন আইডি</th>
                  <th className="py-3 px-4 font-semibold">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      কোনো লেনদেন পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'RECHARGE'
                              ? 'bg-blue-50 text-blue-700'
                              : tx.type === 'DRIVE_PACK'
                              ? 'bg-purple-50 text-purple-700'
                              : tx.type === 'SERVICING_BILL'
                              ? 'bg-indigo-50 text-indigo-700'
                              : tx.type === 'SIM_SALE'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {tx.type === 'RECHARGE'
                            ? 'রিচার্জ'
                            : tx.type === 'DRIVE_PACK'
                            ? 'ড্রাইভ প্যাক'
                            : tx.type === 'SERVICING_BILL'
                            ? 'সার্ভিসিং বিল'
                            : tx.type === 'MFS_CASH_IN'
                            ? 'ক্যাশ ইন'
                            : tx.type === 'MFS_CASH_OUT'
                            ? 'ক্যাশ আউট'
                            : 'সিম বিক্রয়'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tx.provider}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {tx.recipientNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        +{formatCurrency(tx.commission)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{tx.transactionId || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Servicing Job Sheets */}
      {activeTab === 'servicing' && (
        <DeviceServicingView
          tickets={tickets}
          onAddTicket={handleCreateTicket}
          onUpdateTicket={handleUpdateTicket}
          onDeleteTicket={handleDeleteTicket}
        />
      )}

      {/* Tab: Drive Packs & Offers */}
      {activeTab === 'drive_packs' && (
        <DrivePacksView
          packs={drivePacks}
          onSavePack={handleSaveDrivePack}
          onDeletePack={handleDeleteDrivePack}
          onRecordSale={handleRecordDriveSale}
        />
      )}

      {/* Tab: Daily Closing & Multi-SIM Reconciliation */}
      {activeTab === 'reconciliation' && (
        <TelecomReconciliationView
          balances={balances}
          closings={closings}
          onSaveClosing={handleSaveClosing}
          onDeleteClosing={handleDeleteClosing}
        />
      )}

      {/* Tab 2: Accessories Inventory */}
      {activeTab === 'accessories' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              মোবাইল ও গ্যাজেট অ্যাক্সেসরিজ স্টক তালিকা
            </h3>
            <span className="text-xs text-slate-500">
              ইনভেন্টরি থেকে সমন্বিত ({accessories.length} টি পণ্য)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessories.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 flex gap-3 items-center hover:border-emerald-500 transition-all"
              >
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=120'}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {formatCurrency(item.sellingPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400">স্টক: {item.stock} {item.unit}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 mt-1 inline-block">
                    {item.brand || 'Accessories'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Sim & Wallet Balances */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200/80 shadow-xs p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              অপারেটর ইজিলোড ও এমএফএস ওয়ালেট ব্যালেন্স
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              দোকানের নিজস্ব রিচার্জ ও এজেন্ট সিমগুলোর বর্তমান রিমেনিং ব্যালেন্স
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">{b.provider}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      b.category === 'RECHARGE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {b.category}
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-slate-900 mb-1">
                  {formatCurrency(b.balance)}
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>সিম: {b.simNumber}</span>
                  <span>আপডেট: {b.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: API & Gateway Integration */}
      {activeTab === 'api_gateway' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200/80 shadow-xs p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                টেলিকম ও এমএফএস এগ্রিগেটর এপিআই ইন্টারফেস (Provider API Config)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              সরাসরি সেন্ট্রালাইজড এপিআই বা টেলিকম এগ্রিগেটর গেটওয়ে (যেমন: bKash PGW, Nagad Merchant, Bulk Recharge API) সংযোগ করুন।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">সতর্কবার্তা ও সিকিউরিটি পলিসি:</span>
              <p className="mt-0.5 leading-relaxed">
                SmartShopX কোনো ফেক বা সিমুলেটেড পেমেন্ট প্রসেসিং করে না। সকল রিয়েল রিচার্জ ও এমএফএস ক্যাশ-ইন আপনার অনুমোদিত টেলিকম পার্টনার এবং ব্যাংক এগ্রিগেটরের সিকিউর এপিআই দ্বারা ক্লাউড ব্যাকএন্ডের মাধ্যমে সম্পাদিত হয়।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">bKash Merchant / Agent API</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  API-Ready
                </span>
              </div>
              <input
                type="text"
                placeholder="Merchant App Key (e.g. bkash_prod_key_***)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                defaultValue="bkash_merchant_live_884920"
              />
              <p className="text-[11px] text-slate-400">সিক্রেট কী সরাসরি সেন্ট্রাল ব্যাকএন্ডে সংরক্ষিত থাকে</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">টপআপ / রিচার্জ এগ্রিগেটর গেটওয়ে</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  API-Ready
                </span>
              </div>
              <input
                type="text"
                placeholder="Aggregator Client ID"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                defaultValue="aggregator_ssl_topup_client_09"
              />
              <p className="text-[11px] text-slate-400">অটোমেটিক ইজিলোড ডেসপ্যাচার ব্যাকএন্ড</p>
            </div>
          </div>
        </div>
      )}

      {/* Fast Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="নতুন টেলিকম / এমএফএস লেনদেন এন্ট্রি"
        subtitle="মোবাইল রিচার্জ, ক্যাশ-ইন অথবা সিম সেল রেকর্ড করুন"
        maxWidth="md"
      >
        <form onSubmit={handleTransactionSubmit} className="space-y-4 py-2">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTxType('RECHARGE');
                setProvider('Grameenphone');
              }}
              className={`py-1.5 rounded-lg transition-all ${
                txType === 'RECHARGE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              ফাস্ট রিচার্জ
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('MFS_CASH_IN');
                setProvider('bKash');
              }}
              className={`py-1.5 rounded-lg transition-all ${
                txType === 'MFS_CASH_IN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              MFS ক্যাশ ইন
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('MFS_CASH_OUT');
                setProvider('bKash');
              }}
              className={`py-1.5 rounded-lg transition-all ${
                txType === 'MFS_CASH_OUT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              MFS ক্যাশ আউট
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('SIM_SALE');
                setProvider('Grameenphone');
              }}
              className={`py-1.5 rounded-lg transition-all ${
                txType === 'SIM_SALE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              সিম বিক্রয়
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রোভাইডার / অপারেটর *
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {(txType === 'RECHARGE' || txType === 'SIM_SALE'
                  ? telecomProviders
                  : mfsProviders
                ).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                গ্রাহকের মোবাইল নম্বর *
              </label>
              <input
                type="tel"
                value={recipientNumber}
                onChange={(e) => setRecipientNumber(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                টাকার পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || '')}
                placeholder="100"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                দোকানের কমিশন (৳ - ঐচ্ছিক)
              </label>
              <input
                type="number"
                step="0.1"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value) || '')}
                placeholder="অটো হিসাব (২.৭%)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">নোট বা রেফারেন্স</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: মিনিট প্যাক / ক্যাশ ইন স্লিপ"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              লেনদেন নিশ্চিত করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

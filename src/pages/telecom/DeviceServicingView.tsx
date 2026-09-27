import React, { useState } from 'react';
import { MobileRepairTicket } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Smartphone,
  Phone,
  DollarSign,
  Printer,
  Copy,
  User,
  Shield,
  FileText,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DeviceServicingViewProps {
  tickets: MobileRepairTicket[];
  onAddTicket: (ticket: Omit<MobileRepairTicket, 'id' | 'ticketNumber' | 'receivedDate'>) => Promise<void>;
  onUpdateTicket: (ticket: MobileRepairTicket) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

export const DeviceServicingView: React.FC<DeviceServicingViewProps> = ({
  tickets,
  onAddTicket,
  onUpdateTicket,
  onDeleteTicket,
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'READY' | 'DELIVERED'>('ALL');
  
  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState<MobileRepairTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New ticket form state
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('Samsung');
  const [deviceModel, setDeviceModel] = useState('');
  const [imeiOrSerial, setImeiOrSerial] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [securityLock, setSecurityLock] = useState('No Lock');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>('');
  const [advancePaid, setAdvancePaid] = useState<number | ''>(0);
  const [partsCost, setPartsCost] = useState<number | ''>('');
  const [technicianName, setTechnicianName] = useState('মোবারক');
  const [warrantyDays, setWarrantyDays] = useState<number>(30);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Brand quick list
  const brandList = ['Samsung', 'Xiaomi', 'Vivo', 'Realme', 'Oppo', 'iPhone', 'Infinix', 'Tecno', 'Symphony', 'Walton', 'Other'];
  
  // Common issue presets
  const commonIssues = [
    'ডিসপ্লে ভাঙা / কম্বো চেঞ্জ',
    'চার্জিং পিন / লুজ কানেকশন',
    'ব্যাটারি ব্যাকআপ নেই / ড্রেইন',
    'টাচ কাজ করছে না',
    'স্পিকার / মাউথপিস সমস্যা',
    'নেটওয়ার্ক / নো সার্ভিস',
    'সফটওয়্যার ডেড / ফ্ল্যাশ',
  ];

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerMobile.includes(searchTerm) ||
      t.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.deviceBrand.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTIVE') {
      return t.status === 'Received' || t.status === 'In Repair';
    }
    if (statusFilter === 'READY') {
      return t.status === 'Ready';
    }
    if (statusFilter === 'DELIVERED') {
      return t.status === 'Delivered';
    }
    return true;
  });

  // KPI calculations
  const totalTicketsCount = tickets.length;
  const activeRepairsCount = tickets.filter((t) => t.status === 'Received' || t.status === 'In Repair').length;
  const readyRepairsCount = tickets.filter((t) => t.status === 'Ready').length;
  const totalServiceProfit = tickets
    .filter((t) => t.status === 'Delivered')
    .reduce((sum, t) => sum + (t.serviceCharge || (t.estimatedCost - (t.partsCost || 0))), 0);

  const resetForm = () => {
    setCustomerName('');
    setCustomerMobile('');
    setDeviceBrand('Samsung');
    setDeviceModel('');
    setImeiOrSerial('');
    setIssueDescription('');
    setSecurityLock('No Lock');
    setEstimatedCost('');
    setAdvancePaid(0);
    setPartsCost('');
    setTechnicianName('মোবারক');
    setWarrantyDays(30);
    setExpectedDeliveryDate('');
    setNotes('');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerMobile.trim()) {
      showToast('গ্রাহকের নাম ও মোবাইল নম্বর আবশ্যক', 'warning');
      return;
    }
    if (!deviceModel.trim()) {
      showToast('ডিভাইসের মডেল লিখুন', 'warning');
      return;
    }
    if (!issueDescription.trim()) {
      showToast('সমস্যার বিবরণ লিখুন', 'warning');
      return;
    }
    if (!estimatedCost || Number(estimatedCost) <= 0) {
      showToast('সম্ভাব্য বিলের পরিমাণ লিখুন', 'warning');
      return;
    }

    const est = Number(estimatedCost);
    const adv = Number(advancePaid) || 0;
    const parts = Number(partsCost) || 0;
    const serviceCharge = Math.max(0, est - parts);

    setIsSubmitting(true);
    try {
      await onAddTicket({
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        deviceBrand,
        deviceModel: deviceModel.trim(),
        imeiOrSerial: imeiOrSerial.trim() || undefined,
        issueDescription: issueDescription.trim(),
        securityLock: securityLock.trim() || undefined,
        estimatedCost: est,
        advancePaid: adv,
        partsCost: parts,
        serviceCharge,
        status: 'Received',
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        technicianName: technicianName.trim() || undefined,
        warrantyDays: Number(warrantyDays) || 0,
        notes: notes.trim() || undefined,
      });

      setIsNewModalOpen(false);
      resetForm();
      showToast('মোবাইল সার্ভিসিং জব স্লিপ সফলভাবে তৈরি হয়েছে', 'success');
    } catch {
      showToast('টিকিট তৈরি করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticket: MobileRepairTicket, newStatus: MobileRepairTicket['status']) => {
    try {
      const updated: MobileRepairTicket = {
        ...ticket,
        status: newStatus,
        deliveredDate: newStatus === 'Delivered' ? new Date().toISOString().split('T')[0] : ticket.deliveredDate,
        advancePaid: newStatus === 'Delivered' ? ticket.estimatedCost : ticket.advancePaid,
      };
      await onUpdateTicket(updated);
      showToast(`স্ট্যাটাস পরিবর্তন: ${getStatusBangla(newStatus)}`, 'success');
    } catch {
      showToast('স্ট্যাটাস আপডেট করা যায়নি', 'error');
    }
  };

  const getStatusBangla = (status: MobileRepairTicket['status']) => {
    switch (status) {
      case 'Received':
        return 'রিসিভড (অপেক্ষমাণ)';
      case 'In Repair':
        return 'মেরামত চলছে';
      case 'Ready':
        return 'ডেলিভারির জন্য রেডি';
      case 'Delivered':
        return 'ডেলিভারি সম্পন্ন';
      case 'Returned_Unrepaired':
        return 'মেরামত ছাড়াই ফেরত';
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: MobileRepairTicket['status']) => {
    switch (status) {
      case 'Received':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'In Repair':
        return 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
      case 'Ready':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'Returned_Unrepaired':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const copyCustomerSms = (ticket: MobileRepairTicket) => {
    const due = Math.max(0, ticket.estimatedCost - ticket.advancePaid);
    const sms = `সম্মানিত ${ticket.customerName}, আপনার ${ticket.deviceBrand} ${ticket.deviceModel} মোবাইলটির মেরামত সম্পন্ন হয়েছে। সার্ভিসিং স্লিপ নং: ${ticket.ticketNumber}। বাকি বিল: ৳${due}। দ্রুত শপ থেকে গ্রহণ করুন। ধন্যবাদ - SmartShopX Telecom।`;
    navigator.clipboard.writeText(sms);
    showToast('কাস্টমার এসএমএস টেক্সট ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Sub Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              মোবাইল সার্ভিসিং ও রিপেয়ারিং খাতা (Device Job Sheets)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              সার্ভিস স্লিপ ও মেমো
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ডিসপ্লে, ব্যাটারি, চার্জিং পোর্ট ও মাদারবোর্ড মেরামত স্লিপ, পার্টস খরচ ও সার্ভিস চার্জ হিসাব
          </p>
        </div>

        <Button
          onClick={() => setIsNewModalOpen(true)}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          নতুন সার্ভিসিং স্লিপ গ্রহণ
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">মোট সার্ভিসিং ডিভাইস</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            {totalTicketsCount} টি
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-blue-700">বর্তমানে মেরামতাধীন</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-0.5">
            {activeRepairsCount} টি
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-purple-200 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-purple-700">ডেলিভারির জন্য প্রস্তুত</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-700 mt-0.5">
            {readyRepairsCount} টি
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-700">সার্ভিসিং নিট মজুরি আয়</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
            {formatCurrency(totalServiceProfit)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="স্লিপ নং, কাস্টমার, মোবাইল বা মডেল..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              সব ({tickets.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              মেরামত চলছে ({activeRepairsCount})
            </button>
            <button
              onClick={() => setStatusFilter('READY')}
              className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'READY' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              রেডি ({readyRepairsCount})
            </button>
            <button
              onClick={() => setStatusFilter('DELIVERED')}
              className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'DELIVERED' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              ডেলিভার্ড
            </button>
          </div>
        </div>

        {/* Tickets Table / List */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">স্লিপ নং ও তারিখ</th>
                <th className="py-2.5 px-3 font-semibold">গ্রাহক ও মোবাইল</th>
                <th className="py-2.5 px-3 font-semibold">ডিভাইস ও সমস্যা</th>
                <th className="py-2.5 px-3 font-semibold">বিল ও অগ্রিম</th>
                <th className="py-2.5 px-3 font-semibold">পার্টস ও লাভ</th>
                <th className="py-2.5 px-3 font-semibold">স্ট্যাটাস</th>
                <th className="py-2.5 px-3 font-semibold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    কোনো সার্ভিসিং টিকিট পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const remainingDue = Math.max(0, t.estimatedCost - t.advancePaid);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1">
                          <span>{t.ticketNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          গ্রহণ: {t.receivedDate}
                        </div>
                        {t.expectedDeliveryDate && (
                          <div className="text-[10px] text-blue-600 font-mono">
                            সম্ভাব্য: {t.expectedDeliveryDate}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{t.customerName}</div>
                        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a href={`tel:${t.customerMobile}`} className="hover:underline text-emerald-700">
                            {t.customerMobile}
                          </a>
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t.deviceBrand} {t.deviceModel}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                          {t.issueDescription}
                        </p>
                        {t.securityLock && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-1 inline-block">
                            লক: {t.securityLock}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono">
                        <div className="font-bold text-slate-900">
                          মোট: {formatCurrency(t.estimatedCost)}
                        </div>
                        <div className="text-[11px] text-emerald-600">
                          জমা: {formatCurrency(t.advancePaid)}
                        </div>
                        {remainingDue > 0 ? (
                          <div className="text-[11px] font-bold text-rose-600">
                            বাকি: {formatCurrency(remainingDue)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold">
                            পরিশোধিত ✓
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono">
                        <div className="text-slate-500 text-[11px]">
                          পার্টস: {formatCurrency(t.partsCost || 0)}
                        </div>
                        <div className="font-bold text-emerald-600">
                          মজুরি: +{formatCurrency(t.serviceCharge || (t.estimatedCost - (t.partsCost || 0)))}
                        </div>
                        {t.warrantyDays ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 inline-block mt-0.5">
                            {t.warrantyDays} দিন ওয়ারেন্টি
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] border ${getStatusBadgeClass(
                              t.status
                            )}`}
                          >
                            {getStatusBangla(t.status)}
                          </span>

                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t, e.target.value as any)}
                            className="block w-full text-[10px] py-0.5 px-1 rounded border border-slate-200 bg-white text-slate-700 cursor-pointer"
                          >
                            <option value="Received">রিসিভড</option>
                            <option value="In Repair">মেরামত চলছে</option>
                            <option value="Ready">রেডি ফর পিকআপ</option>
                            <option value="Delivered">ডেলিভারি সম্পন্ন</option>
                            <option value="Returned_Unrepaired">মেরামত ছাড়া ফেরত</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedTicketForPrint(t)}
                            title="জব স্লিপ / রসিদ দেখুন"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyCustomerSms(t)}
                            title="কাস্টমারকে এসএমএস পাঠানোর টেক্সট কপি করুন"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Servicing Ticket Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="নতুন মোবাইল সার্ভিসিং স্লিপ (Device Job Sheet)"
        subtitle="গ্রাহকের মোবাইল মেরামত সংক্রান্ত সকল তথ্য ও আনুমানিক বিল এন্ট্রি করুন"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
          {/* Customer info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              গ্রাহকের তথ্য
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  গ্রাহকের নাম *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: মোঃ রাশেদ চৌধুরী"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  গ্রাহকের মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              ডিভাইস ও সমস্যার বিবরণ
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ব্র্যান্ড *
                </label>
                <select
                  value={deviceBrand}
                  onChange={(e) => setDeviceBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {brandList.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মডেল নাম/নম্বর *
                </label>
                <input
                  type="text"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="যেমন: Galaxy A52 বা Redmi 10"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্যাটার্ন / পিন লক
                </label>
                <input
                  type="text"
                  value={securityLock}
                  onChange={(e) => setSecurityLock(e.target.value)}
                  placeholder="যেমন: PIN: 1234 বা No Lock"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সমস্যা ও প্রয়োজনীয় কাজ *
              </label>
              <input
                type="text"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="যেমন: ডিসপ্লে ভাঙা, চার্জ হয় না, ব্যাটারি ড্রেইন..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />

              {/* Quick issue chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {commonIssues.map((issue) => (
                  <button
                    key={issue}
                    type="button"
                    onClick={() => setIssueDescription(issue)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
                  >
                    + {issue}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IMEI বা সিরিয়াল নং (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={imeiOrSerial}
                  onChange={(e) => setImeiOrSerial(e.target.value)}
                  placeholder="358920..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সম্ভাব্য ডেলিভারির তারিখ
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Estimation */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              বিল ও খরচের হিসাব
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোট আনুমানিক বিল (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value) || '')}
                  placeholder="1200"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  অগ্রিম জমা (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-emerald-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পার্টস কেনার খরচ (৳ - আনুমানিক)
                </label>
                <input
                  type="number"
                  min="0"
                  value={partsCost}
                  onChange={(e) => setPartsCost(Number(e.target.value) || '')}
                  placeholder="700"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 font-mono">
              <span className="text-slate-600">
                বাকি বিল: <strong className="text-rose-600">{formatCurrency(Math.max(0, Number(estimatedCost || 0) - Number(advancePaid || 0)))}</strong>
              </span>
              <span className="text-slate-600">
                আনুমানিক সার্ভিস লাভ (মজুরি): <strong className="text-emerald-700">+{formatCurrency(Math.max(0, Number(estimatedCost || 0) - Number(partsCost || 0)))}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  দায়িত্বপ্রাপ্ত টেকনিশিয়ান / মেকানিক
                </label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="মেকানিকের নাম"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সার্ভিসিং রিপ্লেসমেন্ট ওয়ারেন্টি
                </label>
                <select
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value={0}>কোনো ওয়ারেন্টি নেই</option>
                  <option value={7}>৭ দিন ওয়ারেন্টি</option>
                  <option value={15}>১৫ দিন ওয়ারেন্টি</option>
                  <option value={30}>৩০ দিন (১ মাস) ওয়ারেন্টি</option>
                  <option value={90}>৯০ দিন (৩ মাস) ওয়ারেন্টি</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              জব স্লিপ সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Print Slip / Receipt Modal */}
      {selectedTicketForPrint && (
        <Modal
          isOpen={!!selectedTicketForPrint}
          onClose={() => setSelectedTicketForPrint(null)}
          title="সার্ভিসিং জব স্লিপ ও কাস্টমার কপি"
          subtitle={`টিকিট নং: ${selectedTicketForPrint.ticketNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 py-2">
            <div className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl font-mono text-xs space-y-3">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-bold text-base text-slate-900 font-sans">
                  SmartShopX Telecom & Servicing Hub
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  মোবাইল বিক্রয়, ফ্লেক্সিলোড, পার্টস ও এক্সপার্ট সার্ভিসিং
                </p>
                <div className="mt-1 font-bold text-slate-800 text-xs">
                  জব স্লিপ নং: {selectedTicketForPrint.ticketNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-slate-100 pb-2">
                <div>
                  <span className="text-slate-400">তারিখ: </span>
                  {selectedTicketForPrint.receivedDate}
                </div>
                <div>
                  <span className="text-slate-400">ডেলিভারি: </span>
                  {selectedTicketForPrint.expectedDeliveryDate || 'অপেক্ষমাণ'}
                </div>
                <div>
                  <span className="text-slate-400">গ্রাহক: </span>
                  <strong>{selectedTicketForPrint.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400">মোবাইল: </span>
                  {selectedTicketForPrint.customerMobile}
                </div>
              </div>

              <div className="border-b border-slate-100 pb-2 space-y-1">
                <div>
                  <span className="text-slate-400">ডিভাইস: </span>
                  <strong>{selectedTicketForPrint.deviceBrand} {selectedTicketForPrint.deviceModel}</strong>
                </div>
                <div>
                  <span className="text-slate-400">সমস্যা: </span>
                  {selectedTicketForPrint.issueDescription}
                </div>
                {selectedTicketForPrint.securityLock && (
                  <div>
                    <span className="text-slate-400">লক: </span>
                    {selectedTicketForPrint.securityLock}
                  </div>
                )}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>মোট নির্ধারিত বিল:</span>
                  <span>{formatCurrency(selectedTicketForPrint.estimatedCost)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>অগ্রিম জমা:</span>
                  <span>{formatCurrency(selectedTicketForPrint.advancePaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 pt-1 text-xs">
                  <span>বাকি বিল (ডেলিভারির সময় প্রদেয়):</span>
                  <span>{formatCurrency(Math.max(0, selectedTicketForPrint.estimatedCost - selectedTicketForPrint.advancePaid))}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 text-center font-sans">
                * ডেলিভারির সময় অনুগ্রহ করে এই স্লিপটি সাথে রাখুন। ওয়ারেন্টি: {selectedTicketForPrint.warrantyDays || 0} দিন।
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyCustomerSms(selectedTicketForPrint)}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                এসএমএস টেক্সট কপি
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.print();
                  showToast('প্রিন্ট কমান্ড প্রেরণ করা হয়েছে', 'success');
                }}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                স্লিপ প্রিন্ট করুন
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

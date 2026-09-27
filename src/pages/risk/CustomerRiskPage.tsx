import React, { useState, useMemo, useEffect } from 'react';
import { Customer, BlockedEntity } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { settingsApi } from '../../services/apiServices';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Info,
  Ban,
  Plus,
  Trash2,
  ShieldCheck,
  Globe,
  Smartphone,
} from 'lucide-react';

export const CustomerRiskPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'risk_analysis' | 'blocked_entities'>('risk_analysis');
  const [customers] = useState<Customer[]>(() => DataStore.getCustomers());
  const [blockedList, setBlockedList] = useState<BlockedEntity[]>([]);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  // Blocked Entity Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [blockType, setBlockType] = useState<'Mobile' | 'IP'>('Mobile');
  const [blockValue, setBlockValue] = useState('');
  const [blockReason, setBlockReason] = useState('ফেক অর্ডার ও পার্সেল রিটার্ন ফ্রড');

  useEffect(() => {
    const list = DataStore.getBlockedEntities();
    setBlockedList(list);
  }, []);

  const handleAddBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockValue.trim()) {
      showToast('ব্লক করার মোবাইল নম্বর বা আইপি অ্যাড্রেস দিন', 'warning');
      return;
    }

    try {
      const added = await settingsApi.addBlockedEntity({
        type: blockType,
        value: blockValue.trim(),
        reason: blockReason.trim(),
        addedBy: 'Admin / Security Engine',
      });
      setBlockedList([added, ...blockedList]);
      setIsAddModalOpen(false);
      setBlockValue('');
      showToast(`${blockType} সফলভাবে ব্লক তালিকায় যোগ করা হয়েছে`, 'success');
    } catch {
      showToast('ব্লক তালিকায় যুক্ত করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleRemoveBlocked = async (id: string) => {
    if (!confirm('আপনি কি এই এনটিটি আনব্লক করতে চান?')) return;
    try {
      await settingsApi.removeBlockedEntity(id);
      setBlockedList(blockedList.filter((b) => b.id !== id));
      showToast('এনটিটি সফলভাবে আনব্লক করা হয়েছে', 'info');
    } catch {
      showToast('আনব্লক করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (filterRisk !== 'all' && c.riskLevel !== filterRisk) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.mobile.includes(q);
      }
      return true;
    });
  }, [customers, search, filterRisk]);

  const highRiskCustomers = customers.filter((c) => c.riskLevel === 'High');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            কাস্টমার রিস্ক ও ফ্রড প্রতিরোধ (Risk & Fraud Analysis)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ডেলিভারি রিটার্ন রেট, বাতিল অর্ডার এনালাইসিস এবং ক্ষতিকর নম্বর/আইপি ব্লকিং সিস্টেম
          </p>
        </div>

        {activeTab === 'blocked_entities' && (
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="danger"
            size="md"
            leftIcon={<Ban className="w-4 h-4" />}
            className="shadow-sm"
          >
            নতুন নম্বর / আইপি ব্লক করুন
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('risk_analysis')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'risk_analysis'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          ক্রেতার ঝুঁকি বিশ্লেষণ (Customer Risk)
        </button>
        <button
          onClick={() => setActiveTab('blocked_entities')}
          className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'blocked_entities'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ban className="w-4 h-4" />
          ব্লক তালিকা (Blocked Entities - {blockedList.length})
        </button>
      </div>

      {activeTab === 'risk_analysis' && (
        <div className="space-y-5">
          {/* High Risk Alert Notice */}
          {highRiskCustomers.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex items-start gap-3.5 text-xs text-rose-900">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-rose-900">সতর্কতা: উচ্চ ঝুঁকিপূর্ণ গ্রাহক চিহ্নিত</h4>
                <p className="text-rose-700 mt-0.5 leading-relaxed">
                  আপনার তালিকায় {highRiskCustomers.length} জন গ্রাহকের অর্ডার রিটার্ন বা বাতিলের হার
                  অস্বাভাবিক বেশি। পার্সেল পাঠানোর পূর্বে অবশ্যই অগ্রিম কুরিয়ার চার্জ গ্রহণ অথবা ফোন কলে
                  অর্ডার নিশ্চিত করার পরামর্শ দেওয়া হচ্ছে।
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="গ্রাহকের নাম বা মোবাইল দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            >
              <option value="all">সকল ঝুঁকি স্তর</option>
              <option value="High">উচ্চ ঝুঁকি (High)</option>
              <option value="Medium">মাঝারি ঝুঁকি (Medium)</option>
              <option value="Low">কম ঝুঁকি (Low)</option>
            </select>
          </div>

          {/* Risk Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                    <th className="py-3 px-4">গ্রাহকের নাম ও যোগাযোগ</th>
                    <th className="py-3 px-4">ডেলিভারি সাফল্য হার</th>
                    <th className="py-3 px-4">ডেলিভার্ড অর্ডার</th>
                    <th className="py-3 px-4">বাতিল অর্ডার</th>
                    <th className="py-3 px-4">রিটার্ন অর্ডার</th>
                    <th className="py-3 px-4">ঝুঁকি স্তর (Risk Level)</th>
                    <th className="py-3 px-4 text-center">পরামর্শ / ব্যবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{c.mobile}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              style={{ width: `${c.deliverySuccessRate}%` }}
                              className={`h-full rounded-full ${
                                c.deliverySuccessRate >= 80
                                  ? 'bg-emerald-500'
                                  : c.deliverySuccessRate >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800">
                            {c.deliverySuccessRate}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {c.ordersDelivered} টি
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                        {c.ordersCancelled} টি
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                        {c.ordersReturned} টি
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.riskLevel} type="risk" />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {c.riskLevel === 'High' ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 inline-block">
                            অগ্রিম ডেলিভারি ফি বাধ্যতামূলক
                          </span>
                        ) : c.riskLevel === 'Medium' ? (
                          <span className="text-[11px] text-amber-700 font-medium">
                            ফোনে কনফার্মেশন নিন
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            স্বাভাবিক ক্যাশ অন ডেলিভারি
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'blocked_entities' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              ব্লক করা মোবাইল নম্বর বা আইপি থেকে অনলাইন স্টোর ও ল্যান্ডিং পেজে অর্ডার স্বয়ংক্রিয়ভাবে বাতিল করা হয়।
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">ধরন</th>
                  <th className="py-3 px-4 font-semibold">নম্বর / আইপি ভ্যালু</th>
                  <th className="py-3 px-4 font-semibold">ব্লক করার কারণ</th>
                  <th className="py-3 px-4 font-semibold">যুক্তকারী</th>
                  <th className="py-3 px-4 font-semibold">তারিখ</th>
                  <th className="py-3 px-4 font-semibold">স্ট্যাটাস</th>
                  <th className="py-3 px-4 font-semibold text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blockedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      কোনো নম্বর বা আইপি ব্লক তালিকায় নেই
                    </td>
                  </tr>
                ) : (
                  blockedList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                          {item.type === 'Mobile' ? (
                            <Smartphone className="w-4 h-4 text-slate-500" />
                          ) : (
                            <Globe className="w-4 h-4 text-slate-500" />
                          )}
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">{item.value}</td>
                      <td className="py-3 px-4 text-slate-600">{item.reason}</td>
                      <td className="py-3 px-4 text-slate-500">{item.addedBy}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Blocked
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBlocked(item.id)}
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          আনব্লক
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Blocked Entity Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="নম্বর অথবা আইপি অ্যাড্রেস ব্লক করুন"
        subtitle="ফ্রড বা ভুয়া অর্ডারকারীকে অনলাইন প্ল্যাটফর্ম থেকে ব্লক করুন"
        maxWidth="sm"
      >
        <form onSubmit={handleAddBlocked} className="space-y-4 py-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBlockType('Mobile')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                blockType === 'Mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              মোবাইল নম্বর
            </button>
            <button
              type="button"
              onClick={() => setBlockType('IP')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                blockType === 'IP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              আইপি অ্যাড্রেস
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {blockType === 'Mobile' ? 'মোবাইল নম্বর *' : 'আইপি অ্যাড্রেস *'}
            </label>
            <input
              type="text"
              value={blockValue}
              onChange={(e) => setBlockValue(e.target.value)}
              placeholder={blockType === 'Mobile' ? '017XXXXXXXX' : '103.14.***.***'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ব্লক করার কারণ</label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="কারণ উল্লেখ করুন"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="danger" size="sm">
              ব্লক তালিকায় যোগ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { DataStore } from '../../services/dataStorage';
import { PersonalBudget, PersonalTransaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Trash2,
  Edit2,
  DollarSign,
} from 'lucide-react';

interface PersonalBudgetViewProps {
  transactions: PersonalTransaction[];
}

const DEFAULT_BUDGET_CATEGORIES = [
  'Family Groceries (বাসার বাজার)',
  'Education & Tuition (বাচ্চার পড়াশোনা)',
  'House Rent (বাড়ি ভাড়া)',
  'Utility Bills (বিদ্যুৎ, গ্যাস, ওয়াইফাই)',
  'Medical & Health (চিকিৎসা ও ঔষধ)',
  'Shopping & Personal (পোশাক ও শপিং)',
  'Entertainment & Dining (ঘোরাঘুরি ও রেস্তোরাঁ)',
  'Other Personal (অন্যান্য ব্যক্তিগত খরচ)',
];

export const PersonalBudgetView: React.FC<PersonalBudgetViewProps> = ({ transactions }) => {
  const { showToast } = useToast();
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);
  const [budgets, setBudgets] = useState<PersonalBudget[]>(() => DataStore.getPersonalBudgets());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [category, setCategory] = useState(DEFAULT_BUDGET_CATEGORIES[0].split(' ')[0]);
  const [budgetAmount, setBudgetAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Save to storage whenever budgets change
  const updateBudgetsList = (newBudgets: PersonalBudget[]) => {
    setBudgets(newBudgets);
    DataStore.setPersonalBudgets(newBudgets);
  };

  // Filter budgets for selected month
  const monthBudgets = budgets.filter((b) => b.month === selectedMonth);

  // Calculate actual spending per category in selected month
  const getCategorySpent = (catKey: string) => {
    return transactions
      .filter((t) => {
        if (t.type !== 'EXPENSE') return false;
        const txMonth = t.date ? t.date.slice(0, 7) : '';
        if (txMonth !== selectedMonth) return false;
        return t.category.toLowerCase().includes(catKey.toLowerCase()) || catKey.toLowerCase().includes(t.category.toLowerCase());
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const totalBudget = monthBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpentInBudgetedCats = monthBudgets.reduce(
    (sum, b) => sum + getCategorySpent(b.category),
    0
  );
  const remainingBudget = totalBudget - totalSpentInBudgetedCats;
  const utilizationPercentage = totalBudget > 0 ? Math.round((totalSpentInBudgetedCats / totalBudget) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingBudgetId(null);
    setCategory(DEFAULT_BUDGET_CATEGORIES[0].split(' ')[0]);
    setBudgetAmount('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: PersonalBudget) => {
    setEditingBudgetId(b.id);
    setCategory(b.category);
    setBudgetAmount(b.budgetAmount);
    setNotes(b.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetAmount || Number(budgetAmount) <= 0) {
      showToast('সঠিক বাজেটের পরিমাণ প্রদান করুন', 'warning');
      return;
    }

    if (editingBudgetId) {
      const updated = budgets.map((b) =>
        b.id === editingBudgetId
          ? { ...b, category, budgetAmount: Number(budgetAmount), notes, month: selectedMonth }
          : b
      );
      updateBudgetsList(updated);
      showToast('বাজেট সফলভাবে আপডেট করা হয়েছে', 'success');
    } else {
      const existing = budgets.find((b) => b.category === category && b.month === selectedMonth);
      if (existing) {
        showToast('এই ক্যাটাগরিতে এই মাসের জন্য ইতিমধ্যে বাজেট রয়েছে। আপনি এটি এডিট করতে পারেন।', 'warning');
        return;
      }

      const newBudget: PersonalBudget = {
        id: `pbg_${Date.now()}`,
        category,
        budgetAmount: Number(budgetAmount),
        month: selectedMonth,
        notes: notes.trim() || undefined,
      };
      updateBudgetsList([...budgets, newBudget]);
      showToast('নতুন মাসিক বাজেট যুক্ত করা হয়েছে', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDeleteBudget = (id: string) => {
    if (!confirm('আপনি কি এই বাজেটটি মুছে ফেলতে চান?')) return;
    const updated = budgets.filter((b) => b.id !== id);
    updateBudgetsList(updated);
    showToast('বাজেট মুছে ফেলা হয়েছে', 'info');
  };

  return (
    <div className="space-y-5">
      {/* Month Selector & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">বাজেট মাস নির্বাচন:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          নতুন ক্যাটাগরি বাজেট যোগ করুন
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">মোট মাসিক বাজেট বরাদ্দ</p>
          <p className="text-xl font-black font-mono text-slate-900 mt-1">
            {formatCurrency(totalBudget)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{monthBudgets.length} টি নির্ধারিত খাত</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">চলতি মাসে ব্যয়িত</p>
          <p className="text-xl font-black font-mono text-rose-600 mt-1">
            {formatCurrency(totalSpentInBudgetedCats)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">বাজেটের মধ্যবর্তী খরচ</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">অবশিষ্ট বাজেট তহবিল</p>
          <p
            className={`text-xl font-black font-mono mt-1 ${
              remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(remainingBudget)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {remainingBudget >= 0 ? 'নিয়ন্ত্রণে রয়েছে' : 'বাজেট অতিক্রম করেছে!'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">সামগ্রিক ব্যবহার হার</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xl font-black font-mono ${
                utilizationPercentage > 100
                  ? 'text-rose-600'
                  : utilizationPercentage > 80
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {utilizationPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                utilizationPercentage > 100
                  ? 'bg-rose-500'
                  : utilizationPercentage > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budget List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <span>মাসিক খাতভিত্তিক বাজেট ও ব্যয়ের হিসাব ({selectedMonth})</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            রিয়েল-টাইম পার্সোনাল ট্রানজ্যাকশন অনুযায়ী হিসাবকৃত
          </span>
        </div>

        {monthBudgets.length === 0 ? (
          <div className="p-8 text-center">
            <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              {selectedMonth} মাসের জন্য কোনো বাজেট তৈরি করা হয়নি
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              আপনার পরিবারের বাজার, বাড়ি ভাড়া ও অন্যান্য খাতের জন্য পূর্বপরিকল্পিত বাজেট সেট করে ব্যয় নিয়ন্ত্রণ করুন।
            </p>
            <Button
              onClick={handleOpenAdd}
              variant="outline"
              size="sm"
              className="mt-3"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              প্রথম বাজেট সেট করুন
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {monthBudgets.map((b) => {
              const spent = getCategorySpent(b.category);
              const remaining = b.budgetAmount - spent;
              const pct = Math.round((spent / b.budgetAmount) * 100);
              const isOver = spent > b.budgetAmount;

              return (
                <div key={b.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">
                          {b.category}
                        </span>
                        {isOver ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> বাজেট অতিক্রম
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> সীমার মধ্যে
                          </span>
                        )}
                      </div>
                      {b.notes && <p className="text-[11px] text-slate-400 mt-0.5">{b.notes}</p>}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-800">
                          ব্যয়: {formatCurrency(spent)} /{' '}
                          <span className="text-slate-500">বাজেট: {formatCurrency(b.budgetAmount)}</span>
                        </div>
                        <div
                          className={`text-[10px] font-semibold mt-0.5 ${
                            remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {remaining >= 0
                            ? `বাকি আছে: ${formatCurrency(remaining)}`
                            : `অতিরিক্ত ব্যয়: ${formatCurrency(Math.abs(remaining))}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="বাজেট এডিট করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOver
                          ? 'bg-rose-500'
                          : pct > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudgetId ? 'মাসিক বাজেট সংশোধন' : 'নতুন মাসিক বাজেট নির্ধারণ'}
        subtitle={`মাস: ${selectedMonth} | পারিবারিক ও ব্যক্তিগত ব্যয়ের সীমা নির্ধারণ`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি বা ব্যয়ের খাত *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer bg-white"
            >
              {DEFAULT_BUDGET_CATEGORIES.map((cat) => {
                const catShort = cat.split(' ')[0];
                return (
                  <option key={cat} value={catShort}>
                    {cat}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">বাজেট লক্ষ্যমাত্রা (টাকা) *</label>
            <input
              type="number"
              required
              min="1"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="যেমন: ১৫০০০"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">নোট বা মন্তব্য (ঐচ্ছিক)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: সাপ্তাহিক বাজার ও চাল-ডাল ক্রয়"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

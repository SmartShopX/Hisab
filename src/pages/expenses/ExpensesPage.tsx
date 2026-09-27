import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { DollarSign, Plus, Search, Calendar, Tag, Trash2 } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>(() => DataStore.getExpenses());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Marketing');
  const [amount, setAmount] = useState<number>(500);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const categories: ExpenseCategory[] = [
    'Rent',
    'Utility',
    'Salary',
    'Marketing',
    'Packaging',
    'Courier Charge',
    'Miscellaneous',
  ];

  const categoryNamesBangla: Record<ExpenseCategory, string> = {
    Rent: 'দোকান ভাড়া',
    Utility: 'বিদ্যুৎ ও ইন্টারনেট বিল',
    Salary: 'কর্মচারী বেতন',
    Marketing: 'ফেসবুক বুস্টিং ও বিজ্ঞাপন',
    Packaging: 'প্যাকেজিং ও বক্স খরচ',
    'Courier Charge': 'কুরিয়ার পরিবহন চার্জ',
    Miscellaneous: 'অন্যান্য দৈনন্দিন খরচ',
  };

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [expenses, search, categoryFilter]);

  const totalExpense = useMemo(() => {
    return filtered.reduce((acc, e) => acc + e.amount, 0);
  }, [filtered]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      showToast('খরচের বিবরণ ও পরিমাণ আবশ্যক', 'warning');
      return;
    }

    const newExp: Expense = {
      id: `exp_${Date.now()}`,
      title: title.trim(),
      category,
      amount,
      date,
      notes: notes.trim() || undefined,
    };

    const updated = [newExp, ...expenses];
    setExpenses(updated);
    DataStore.setExpenses(updated);
    setIsAddModalOpen(false);
    setTitle('');
    setAmount(500);
    setNotes('');
    showToast('নতুন খরচ সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">দোকানের ব্যয় ও খরচ খাতা</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকান ভাড়া, বিজ্ঞাপন, প্যাকেজিং ও দৈনন্দিন খরচের নির্ভুল হিসাব
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          নতুন খরচ যুক্ত করুন
        </Button>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500">নির্বাচিত খাতের মোট ব্যয়</span>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">
            {formatCurrency(totalExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">মোট {filtered.length} টি খরচের এন্ট্রি</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
          ৳
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="খরচের বিবরণ দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="all">সকল ব্যয়ের খাত</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryNamesBangla[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">খরচের খাত (Category)</th>
                <th className="py-3 px-4">বিবরণ (Description)</th>
                <th className="py-3 px-4">রেফারেন্স / নোট</th>
                <th className="py-3 px-4 text-right">টাকার পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-600">{formatDate(e.date)}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {categoryNamesBangla[e.category] || e.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{e.title}</td>
                  <td className="py-3.5 px-4 text-slate-500">{e.notes || '—'}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 text-sm">
                    {formatCurrency(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="নতুন খরচ যুক্ত করুন"
        maxWidth="sm"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              খরচের খাত (Category) *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryNamesBangla[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              খরচের বিবরণ (Title) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: মার্চ মাসের দোকান ভাড়া / ফেসবুক পেজ বুস্ট"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">নোট / ভাউচার নং</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ঐচ্ছিক ভাউচার বা ক্যাশ মেমো রেফারেন্স"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
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

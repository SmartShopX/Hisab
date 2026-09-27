import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Smartphone, HelpCircle } from 'lucide-react';

interface SerialImeiManagerProps {
  hasSerialTracking: boolean;
  onToggleSerialTracking: (enabled: boolean) => void;
  serials: string[];
  onChangeSerials: (serials: string[]) => void;
  warrantyPeriod: string;
  onChangeWarranty: (warranty: string) => void;
  stockCount: number;
}

export const SerialImeiManager: React.FC<SerialImeiManagerProps> = ({
  hasSerialTracking,
  onToggleSerialTracking,
  serials,
  onChangeSerials,
  warrantyPeriod,
  onChangeWarranty,
  stockCount,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const warrantyOptions = [
    'কোনো ওয়ারেন্টি নেই',
    '৩ দিনের রিপ্লেসমেন্ট গ্যারান্টি',
    '৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি',
    '১ মাস রিপ্লেসমেন্ট',
    '৩ মাস পার্টস ও সার্ভিস',
    '৬ মাস অফিসিয়াল ওয়ারেন্টি',
    '১ বছর ব্র্যান্ড ওয়ারেন্টি',
    '২ বছর অফিসিয়াল ওয়ারেন্টি',
    'লাইফটাইম ওয়ারেন্টি',
  ];

  const handleAddSingle = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    if (!serials.includes(trimmed)) {
      onChangeSerials([...serials, trimmed]);
    }
    setInputVal('');
  };

  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;
    // split by comma, newline or space
    const parsed = bulkInput
      .split(/[\n,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const merged = Array.from(new Set([...serials, ...parsed]));
    onChangeSerials(merged);
    setBulkInput('');
    setShowBulkAdd(false);
  };

  const handleRemoveSerial = (idx: number) => {
    onChangeSerials(serials.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              আইএমইআই / সিরিয়াল নম্বর ও ওয়ারেন্টি (IMEI & Warranty)
            </h4>
            <p className="text-[11px] text-slate-500">
              মোবাইল, ল্যাপটপ বা গ্যাজেটের ব্যক্তিগত ইউনিট ট্র্যাকিং
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={hasSerialTracking}
            onChange={(e) => onToggleSerialTracking(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-2 text-xs font-semibold text-slate-700">
            {hasSerialTracking ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ওয়ারেন্টির মেয়াদ (Warranty Duration)
          </label>
          <select
            value={warrantyPeriod || 'কোনো ওয়ারেন্টি নেই'}
            onChange={(e) => onChangeWarranty(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {warrantyOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {hasSerialTracking && (
          <div className="flex items-end justify-between text-xs text-slate-600">
            <div>
              <span>রেকর্ডকৃত আইএমইআই: </span>
              <span className="font-mono font-bold text-blue-700">{serials.length} টি</span>
              <span className="text-[10px] text-slate-400 ml-1">(স্টক: {stockCount} টি)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
            >
              {showBulkAdd ? 'সাধারণ ইনপুট' : 'বাল্ক পেস্ট (একসাথে অনেক)'}
            </button>
          </div>
        )}
      </div>

      {hasSerialTracking && (
        <div className="space-y-3 pt-2">
          {showBulkAdd ? (
            <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <label className="block text-[11px] font-bold text-slate-700">
                একসাথে একাধিক IMEI / সিরিয়াল নম্বর পেস্ট করুন (প্রতি লাইনে বা কমা দিয়ে)
              </label>
              <textarea
                rows={3}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={`354892091234567\n354892091234568\n354892091234569`}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkAdd(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  disabled={!bulkInput.trim()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  সিরিয়ালগুলো যোগ করুন
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="বারকোড স্ক্যানার দিয়ে স্ক্যান করুন বা IMEI লিখুন..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSingle();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSingle}
                disabled={!inputVal.trim()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                যোগ
              </button>
            </div>
          )}

          {/* Tag Cloud of Serials */}
          {serials.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
              {serials.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-mono border border-slate-200"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSerial(idx)}
                    className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              কোনো IMEI বা সিরিয়াল নম্বর যুক্ত করা হয়নি।
            </p>
          )}
        </div>
      )}
    </div>
  );
};

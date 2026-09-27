import React, { useState } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sliders, DollarSign, Package, MapPin, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface BulkPriceStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onApplyBulkUpdate: (updates: {
    priceAdjustment?: { type: 'PERCENT_INC' | 'PERCENT_DEC' | 'FIXED_INC' | 'FIXED_DEC'; value: number };
    wholesaleAdjustment?: { type: 'PERCENT_INC' | 'PERCENT_DEC' | 'FIXED_INC' | 'FIXED_DEC'; value: number };
    stockAdjustment?: { type: 'ADD' | 'SUBTRACT' | 'SET'; value: number };
    newRackLocation?: string;
    newCategory?: string;
    newVatPercent?: number;
  }) => void;
}

export const BulkPriceStockModal: React.FC<BulkPriceStockModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  onApplyBulkUpdate,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'price' | 'stock' | 'location'>('price');

  // Price adjustment state
  const [applyPriceChange, setApplyPriceChange] = useState(false);
  const [priceType, setPriceType] = useState<'PERCENT_INC' | 'PERCENT_DEC' | 'FIXED_INC' | 'FIXED_DEC'>('PERCENT_INC');
  const [priceValue, setPriceValue] = useState<number>(5);

  // Wholesale adjustment
  const [applyWholesaleChange, setApplyWholesaleChange] = useState(false);
  const [wholesaleType, setWholesaleType] = useState<'PERCENT_INC' | 'PERCENT_DEC' | 'FIXED_INC' | 'FIXED_DEC'>('PERCENT_INC');
  const [wholesaleValue, setWholesaleValue] = useState<number>(5);

  // Stock adjustment state
  const [applyStockChange, setApplyStockChange] = useState(false);
  const [stockType, setStockType] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [stockValue, setStockValue] = useState<number>(10);

  // Location & Tax
  const [applyLocationChange, setApplyLocationChange] = useState(false);
  const [rackLocation, setRackLocation] = useState('');
  const [applyVatChange, setApplyVatChange] = useState(false);
  const [vatPercent, setVatPercent] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      showToast('কোনো পণ্য নির্বাচিত করা হয়নি', 'error');
      return;
    }

    onApplyBulkUpdate({
      priceAdjustment: applyPriceChange ? { type: priceType, value: priceValue } : undefined,
      wholesaleAdjustment: applyWholesaleChange ? { type: wholesaleType, value: wholesaleValue } : undefined,
      stockAdjustment: applyStockChange ? { type: stockType, value: stockValue } : undefined,
      newRackLocation: applyLocationChange ? rackLocation : undefined,
      newVatPercent: applyVatChange ? vatPercent : undefined,
    });

    showToast(`${selectedProducts.length} টি পণ্যে পরিবর্তন সফলভাবে প্রয়োগ করা হয়েছে`, 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="বাল্ক মূল্য ও স্টক আপডেট (Bulk Batch Editor)"
      subtitle={`একত্রে নির্বাচিত ${selectedProducts.length} টি পণ্যের দাম বা স্টক পরিবর্তন করুন`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 gap-2 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('price')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'price'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            মূল্য ও লাভ পরিবর্তন
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-blue-100 text-blue-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            স্টক সমন্বয়
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'location'
                ? 'bg-purple-100 text-purple-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            র্যাক ও ট্যাক্স
          </button>
        </div>

        {/* Tab 1: Price */}
        {activeTab === 'price' && (
          <div className="space-y-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* Retail selling price */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyPriceChange}
                  onChange={(e) => setApplyPriceChange(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-slate-800">
                  খুচরা বিক্রয়মূল্য (Retail MRP) পরিবর্তন করুন
                </span>
              </label>

              {applyPriceChange && (
                <div className="grid grid-cols-2 gap-2 pl-6 pt-1">
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="PERCENT_INC">শতাংশ (%) বৃদ্ধি</option>
                    <option value="PERCENT_DEC">শতাংশ (%) হ্রাস</option>
                    <option value="FIXED_INC">নির্ধারিত টাকা (৳) বৃদ্ধি</option>
                    <option value="FIXED_DEC">নির্ধারিত টাকা (৳) হ্রাস</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={priceValue}
                    onChange={(e) => setPriceValue(Number(e.target.value) || 0)}
                    placeholder="পরিমাণ"
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>
              )}
            </div>

            {/* Wholesale price */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyWholesaleChange}
                  onChange={(e) => setApplyWholesaleChange(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span className="text-xs font-bold text-slate-800">
                  পাইকারি মূল্য (Wholesale Price) পরিবর্তন করুন
                </span>
              </label>

              {applyWholesaleChange && (
                <div className="grid grid-cols-2 gap-2 pl-6 pt-1">
                  <select
                    value={wholesaleType}
                    onChange={(e) => setWholesaleType(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="PERCENT_INC">শতাংশ (%) বৃদ্ধি</option>
                    <option value="PERCENT_DEC">শতাংশ (%) হ্রাস</option>
                    <option value="FIXED_INC">নির্ধারিত টাকা (৳) বৃদ্ধি</option>
                    <option value="FIXED_DEC">নির্ধারিত টাকা (৳) হ্রাস</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={wholesaleValue}
                    onChange={(e) => setWholesaleValue(Number(e.target.value) || 0)}
                    placeholder="পরিমাণ"
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Stock */}
        {activeTab === 'stock' && (
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyStockChange}
                onChange={(e) => setApplyStockChange(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-xs font-bold text-slate-800">
                নির্বাচিত পণ্যের স্টক সংখ্যা পরিবর্তন করুন
              </span>
            </label>

            {applyStockChange && (
              <div className="grid grid-cols-2 gap-2 pl-6 pt-1">
                <select
                  value={stockType}
                  onChange={(e) => setStockType(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="ADD">বর্তমান স্টকে যোগ করুন (+)</option>
                  <option value="SUBTRACT">বর্তমান স্টক থেকে কমান (-)</option>
                  <option value="SET">নতুন নির্দিষ্ট স্টকে সেট করুন (=)</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={stockValue}
                  onChange={(e) => setStockValue(Number(e.target.value) || 0)}
                  placeholder="পরিমাণ"
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono font-bold text-blue-700"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Location & Tax */}
        {activeTab === 'location' && (
          <div className="space-y-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* Godown Rack */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyLocationChange}
                  onChange={(e) => setApplyLocationChange(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600"
                />
                <span className="text-xs font-bold text-slate-800">
                  দোকান / গোডাউন র্যাক লোকেশন সেট করুন
                </span>
              </label>

              {applyLocationChange && (
                <div className="pl-6 pt-1">
                  <input
                    type="text"
                    value={rackLocation}
                    onChange={(e) => setRackLocation(e.target.value)}
                    placeholder="যেমন: Shelf A-3, Rack 2"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              )}
            </div>

            {/* VAT */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyVatChange}
                  onChange={(e) => setApplyVatChange(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600"
                />
                <span className="text-xs font-bold text-slate-800">
                  ভ্যাট / ট্যাক্স হার সেট করুন (%)
                </span>
              </label>

              {applyVatChange && (
                <div className="pl-6 pt-1">
                  <select
                    value={vatPercent}
                    onChange={(e) => setVatPercent(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value={0}>০% (ট্যাক্স মুক্ত)</option>
                    <option value={5}>৫% ভ্যাট</option>
                    <option value={7.5}>৭.৫% ভ্যাট</option>
                    <option value={10}>১০% ভ্যাট</option>
                    <option value={15}>১৫% ভ্যাট</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            নির্বাচিত পণ্য: <strong className="text-slate-800 font-mono">{selectedProducts.length} টি</strong>
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={
                !applyPriceChange &&
                !applyWholesaleChange &&
                !applyStockChange &&
                !applyLocationChange &&
                !applyVatChange
              }
            >
              পরিবর্তন প্রয়োগ করুন
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

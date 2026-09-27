import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, ProductVariant } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { VariantManager } from './VariantManager';
import { SerialImeiManager } from './SerialImeiManager';
import { ProductImageUploader } from './ProductImageUploader';
import { optimizeProductImage } from '../../utils/imageOptimizer';
import { formatCurrency } from '../../utils/formatters';
import {
  Sparkles,
  Info,
  DollarSign,
  Package,
  Layers,
  Smartphone,
  Image as ImageIcon,
  Tag,
  Shield,
  MapPin,
  Calendar,
  Percent,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle2,
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  initialData?: Product | null;
  onSubmit: (formData: any) => Promise<void>;
  onOpenAiStudio: (initialImg: string) => void;
  existingCategories: string[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  isEdit,
  initialData,
  onSubmit,
  onOpenAiStudio,
  existingCategories,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'inventory' | 'variants' | 'serial' | 'media'>('basic');

  const defaultState = {
    name: '',
    category: 'Pharmacy & Medicine',
    subCategory: '',
    brand: '',
    sku: '',
    barcode: '',
    unit: 'পিস (Pcs)',
    purchasePrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    discount: 0,
    vatPercent: 0,
    stock: 0, // দোকানদার চাইলে প্রথমে কোনো স্টক দিবে না, পরে স্টক ইনওয়ার্ড করে সেল শুরু করবে
    minStock: 5,
    rackLocation: '',
    batchNumber: '',
    expiryDate: '',
    hasVariants: false,
    variants: [] as ProductVariant[],
    hasSerialTracking: false,
    serials: [] as string[],
    warrantyPeriod: 'কোনো ওয়ারেন্টি নেই',
    isFeatured: false,
    isActive: true,
    onlineStoreVisible: true,
    image: '',
    videoUrl: '',
    description: '',
  };

  const [formData, setFormData] = useState(defaultState);
  const [errors, setErrors] = useState<{ name?: string; sellingPrice?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabList: ('basic' | 'pricing' | 'inventory' | 'variants' | 'serial' | 'media')[] = [
    'basic',
    'pricing',
    'inventory',
    'variants',
    'serial',
    'media',
  ];

  const handleNextTab = () => {
    const idx = tabList.indexOf(activeTab);
    if (idx < tabList.length - 1) {
      setActiveTab(tabList[idx + 1]);
    }
  };

  const handlePrevTab = () => {
    const idx = tabList.indexOf(activeTab);
    if (idx > 0) {
      setActiveTab(tabList[idx - 1]);
    }
  };

  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'General',
        subCategory: initialData.subCategory || '',
        brand: initialData.brand || '',
        sku: initialData.sku || '',
        barcode: initialData.barcode || '',
        unit: initialData.unit || 'পিস (Pcs)',
        purchasePrice: initialData.purchasePrice || 0,
        sellingPrice: initialData.sellingPrice || 0,
        wholesalePrice: initialData.wholesalePrice || 0,
        discount: initialData.discount || 0,
        vatPercent: initialData.vatPercent || 0,
        stock: initialData.stock ?? 0,
        minStock: initialData.minStock ?? 5,
        rackLocation: initialData.rackLocation || '',
        batchNumber: initialData.batchNumber || '',
        expiryDate: initialData.expiryDate || '',
        hasVariants: Boolean(initialData.hasVariants || (initialData.variants && initialData.variants.length > 0)),
        variants: initialData.variants || [],
        hasSerialTracking: Boolean(initialData.hasSerialTracking || (initialData.serials && initialData.serials.length > 0)),
        serials: initialData.serials || [],
        warrantyPeriod: initialData.warrantyPeriod || 'কোনো ওয়ারেন্টি নেই',
        isFeatured: Boolean(initialData.isFeatured),
        isActive: initialData.isActive ?? true,
        onlineStoreVisible: initialData.onlineStoreVisible ?? true,
        image: initialData.image || '',
        videoUrl: initialData.videoUrl || '',
        description: initialData.description || '',
      });
      setErrors({});
    } else if (!isEdit) {
      setFormData(defaultState);
      setErrors({});
    }
  }, [initialData, isEdit, isOpen]);

  // Live profit calculation
  const profitMargin = useMemo(() => {
    const cost = Number(formData.purchasePrice) || 0;
    const retailNet = (Number(formData.sellingPrice) || 0) - (Number(formData.discount) || 0);
    const retailProfit = retailNet - cost;
    const retailMarginPct = cost > 0 ? ((retailProfit / cost) * 100).toFixed(1) : retailNet > 0 ? '100' : '0';

    const wholesaleNet = Number(formData.wholesalePrice) || 0;
    const wholesaleProfit = wholesaleNet > 0 ? wholesaleNet - cost : 0;
    const wholesaleMarginPct = cost > 0 && wholesaleNet > 0 ? ((wholesaleProfit / cost) * 100).toFixed(1) : '0';

    return {
      retailProfit,
      retailMarginPct,
      wholesaleProfit,
      wholesaleMarginPct,
    };
  }, [formData.purchasePrice, formData.sellingPrice, formData.wholesalePrice, formData.discount]);

  // Auto calculate total stock from variants if variants are enabled
  const handleVariantsChange = (newVariants: ProductVariant[]) => {
    const totalVarStock = newVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      variants: newVariants,
      stock: newVariants.length > 0 ? totalVarStock : prev.stock,
    }));
  };

  const handleGenerateSku = () => {
    const prefix = formData.brand ? formData.brand.slice(0, 3).toUpperCase() : 'PRD';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${rand}` }));
  };

  const handleGenerateBarcode = () => {
    const code = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    setFormData((prev) => ({ ...prev, barcode: code }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; sellingPrice?: string } = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'পণ্যের নাম দেওয়া আবশ্যক';
      setActiveTab('basic');
    }

    const price = Number(formData.sellingPrice);
    if (!price || price <= 0) {
      newErrors.sellingPrice = 'সঠিক বিক্রয়মূল্য দেওয়া আবশ্যক (০ এর চেয়ে বেশি)';
      if (!newErrors.name) {
        setActiveTab('basic');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'পণ্য তথ্য সম্পাদনা (Edit Product)' : 'নতুন পণ্য যোগ করুন (Add New Product)'}
      subtitle="খুচরা, পাইকারি, ভ্যারিয়েন্ট, সিরিয়াল ও গোডাউন সহ পণ্যের পূর্ণাঙ্গ তথ্য পূরণ করুন"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmitForm} className="space-y-4">
        {/* AI Product Studio Quick Banner */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">AI Product Studio</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md font-semibold">
                  স্মার্ট সহায়ক
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                ফটোর ব্যাকগ্রাউন্ড রিমুভ, প্রফেশনাল মডেল লুক ও পণ্যের বিবরণ জেনারেট করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenAiStudio(formData.image)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI স্টুডিও ওপেন</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-1 text-xs font-semibold pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'basic'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            ১. সাধারণ তথ্য
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'pricing'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            ২. মূল্য ও ভ্যাট
            {Number(formData.sellingPrice) > 0 && (
              <span className="text-[10px] bg-emerald-700/80 text-white px-1.5 py-0.2 rounded">
                ৳{formData.sellingPrice}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'inventory'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-blue-400" />
            ৩. ইনভেন্টরি ও র্যাক
            {formData.rackLocation && (
              <span className="text-[10px] bg-blue-700/80 text-white px-1 py-0.2 rounded">
                {formData.rackLocation}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'variants'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            ৪. ভ্যারিয়েন্ট (সাইজ/রং)
            {formData.variants.length > 0 && (
              <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                {formData.variants.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('serial')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'serial'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            ৫. IMEI ও ওয়ারেন্টি
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-2 px-3 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'media'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
            ৬. ছবি ও স্টোর
          </button>
        </div>

        {/* Tab 1: Basic Information & Quick Essentials */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {/* Validation alert banner */}
            {(errors.name || errors.sellingPrice) && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errors.name || errors.sellingPrice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পণ্যের নাম (Product Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="যেমন: Wireless Bluetooth Earbuds Pro / কটন ফরমাল শার্ট"
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 font-medium ${
                    errors.name
                      ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                  required
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মূল ক্যাটাগরি *</label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="যেমন: Mobile & Telecom, Fashion, Pharmacy"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
                <datalist id="category-suggestions">
                  {existingCategories.filter((c) => c !== 'all').map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সাব-ক্যাটাগরি</label>
                <input
                  type="text"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  placeholder="যেমন: হেডফোন, ডাটা কেবল, টি-শার্ট"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ব্র্যান্ড / কোম্পানি</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="যেমন: Samsung, Baseus, Apex, নো ব্র্যান্ড"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পরিমাপের একক (Unit)</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="পিস (Pcs)">পিস (Pcs)</option>
                  <option value="কেজি (Kg)">কেজি (Kg)</option>
                  <option value="গ্রাম (Gm)">গ্রাম (Gm)</option>
                  <option value="লিটার (Ltr)">লিটার (Ltr)</option>
                  <option value="প্যাকেট (Pkt)">প্যাকেট (Pkt)</option>
                  <option value="ডজন (Dzn)">ডজন (Dzn)</option>
                  <option value="বক্স (Box)">বক্স (Box)</option>
                  <option value="মিটার (Mtr)">মিটার (Mtr)</option>
                  <option value="জোড়া (Pair)">জোড়া (Pair)</option>
                  <option value="সেট (Set)">সেট (Set)</option>
                </select>
              </div>
            </div>

            {/* Core Pricing & Initial Inventory Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">প্রয়োজনীয় মূল্য ও প্রারম্ভিক স্টক</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  (পাইকারি মূল্য, ভ্যাট ও ডিসকাউন্টের জন্য '২. মূল্য ও ভ্যাট' ট্যাবে যান)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    খুচরা বিক্রয়মূল্য (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.sellingPrice || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, sellingPrice: Number(e.target.value) });
                      if (errors.sellingPrice) setErrors((prev) => ({ ...prev, sellingPrice: undefined }));
                    }}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold focus:outline-none focus:ring-2 bg-white ${
                      errors.sellingPrice
                        ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-emerald-500'
                    }`}
                    required
                  />
                  {errors.sellingPrice && (
                    <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.sellingPrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্রয়মূল্য (Cost ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      প্রারম্ভিক স্টক (ঐচ্ছিক / ০ রাখা যাবে)
                    </label>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      পরে স্টক যোগ করা যাবে
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="০ (পরে স্টক যোগ করবেন)"
                    value={formData.stock === 0 ? '' : formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white placeholder:text-slate-400 placeholder:font-normal"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    * স্টক না দিলে ০ থাকবে, পরবর্তীতে চালান/ইনওয়ার্ডের মাধ্যমে স্টক যোগ করে বিক্রি শুরু করবেন।
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সতর্কতা স্টক
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {Number(formData.sellingPrice) > 0 && (
                <div className="p-2.5 bg-emerald-100/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-950 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>আনুমানিক নিট লাভ:</span>
                    <strong className="font-mono text-emerald-800 font-bold">{formatCurrency(profitMargin.retailProfit)}</strong>
                    <span className="text-emerald-700 font-bold">({profitMargin.retailMarginPct}%)</span>
                  </div>
                  <span className="text-[11px] text-emerald-800">
                    প্রতি পিস বিক্রিতে লাভ
                  </span>
                </div>
              )}
            </div>

            {/* Quick Codes & Image */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">এসকেইউ কোড (SKU)</label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    অটো তৈরি
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="ফাঁকা রাখলে স্বয়ংক্রিয় তৈরি হবে"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">বারকোড (Barcode / EAN)</label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    অটো বারকোড
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="বারকোড স্ক্যান করুন বা টাইপ করুন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">পণ্যের ছবি (Image / Auto-WebP)</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('media')}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    ফুল মিডিয়া আপলোডার →
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="ছবির লিংক বা ফাইল আপলোড করুন"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>আপলোড (WebP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const res = await optimizeProductImage(file);
                            setFormData((prev: any) => ({ ...prev, image: res.dataUrl }));
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                    />
                  </label>
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pricing, Wholesale & VAT */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ক্রয়মূল্য (Cost Price ৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.purchasePrice === 0 ? '' : formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  খুচরা বিক্রয়মূল্য (Retail MRP ৳) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.sellingPrice === 0 ? '' : formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 bg-emerald-50/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পাইকারি মূল্য (Wholesale Price ৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.wholesalePrice === 0 ? '' : formData.wholesalePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, wholesalePrice: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ছাড় / ডিসকাউন্ট (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.discount === 0 ? '' : formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ভ্যাট / ট্যাক্স (VAT %)
                </label>
                <select
                  value={formData.vatPercent}
                  onChange={(e) => setFormData({ ...formData, vatPercent: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                >
                  <option value={0}>০% (ট্যাক্স মুক্ত)</option>
                  <option value={5}>৫% ভ্যাট</option>
                  <option value={7.5}>৭.৫% ভ্যাট</option>
                  <option value={10}>১০% ভ্যাট</option>
                  <option value={15}>১৫% ভ্যাট</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="w-full p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <div className="text-[10px] text-slate-500">কার্যকরী খুচরা বিক্রয় রেট:</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {formatCurrency(formData.sellingPrice - formData.discount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Profit & Margin Indicator */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200 rounded-2xl">
              <div className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-600" />
                লাইভ লাভ-মার্জিন প্রিভিউ (Profit Margin Breakdown)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block">খুচরা লাভ (Retail)</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatCurrency(profitMargin.retailProfit)}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block">খুচরা মার্জিন (%)</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {profitMargin.retailMarginPct}%
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block">পাইকারি লাভ (Wholesale)</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">
                    {formatCurrency(profitMargin.wholesaleProfit)}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block">পাইকারি মার্জিন (%)</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">
                    {profitMargin.wholesaleMarginPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory & Godown */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  প্রারম্ভিক / বর্তমান স্টক (ঐচ্ছিক / ০ রাখা যাবে)
                </label>
                <span className="text-[10px] text-emerald-600 font-medium">
                  ০ রেখে সেভ সম্ভব
                </span>
              </div>
              <input
                type="number"
                min={0}
                placeholder="০ (পরে স্টক যোগ করবেন)"
                value={formData.stock === 0 ? '' : formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                disabled={formData.hasVariants && formData.variants.length > 0}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                * দোকানদার চাইলে প্রথমে কোনো স্টক ইনপুট না দিয়ে পণ্য তালিকাভুক্ত করতে পারবেন। পরবর্তীতে চালান/ইনওয়ার্ড যোগ করলে বিক্রির জন্য স্টক প্রস্তুত হবে।
              </p>
              {formData.hasVariants && formData.variants.length > 0 && (
                <span className="text-[10px] text-purple-600 font-medium block mt-1">
                  * ভ্যারিয়েন্টের মোট স্টক অনুসারে স্বয়ংক্রিয় গণনা হচ্ছে
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সর্বনিম্ন স্টক সতর্কতা সীমা (Low Stock Alert)
              </label>
              <input
                type="number"
                min={1}
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">
                এই সংখ্যার নিচে নামলে সতর্কবার্তা দেখাবে
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                দোকান বা গোডাউন লোকেশন (Rack / Shelf No.)
              </label>
              <input
                type="text"
                value={formData.rackLocation}
                onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                placeholder="যেমন: Shelf A-3, Drawer B, গোডাউন-১ তাক ৪"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ব্যাচ নম্বর (Batch / Lot No.)
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="যেমন: BATCH-2026-09"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                মেয়াদোত্তীর্ণ তারিখ (Expiry Date)
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <span className="text-[10px] text-slate-400">
                মেয়াদ শেষের ৩০ দিন আগে থেকে সিস্টেমে স্বয়ংক্রিয় অ্যালার্ট প্রদর্শিত হবে
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Variants */}
        {activeTab === 'variants' && (
          <VariantManager
            hasVariants={formData.hasVariants}
            onToggleVariants={(enabled) => setFormData({ ...formData, hasVariants: enabled })}
            variants={formData.variants}
            onChangeVariants={handleVariantsChange}
            baseSellingPrice={formData.sellingPrice}
            basePurchasePrice={formData.purchasePrice}
            baseWholesalePrice={formData.wholesalePrice}
            baseSku={formData.sku}
          />
        )}

        {/* Tab 5: IMEI / Serial & Warranty */}
        {activeTab === 'serial' && (
          <SerialImeiManager
            hasSerialTracking={formData.hasSerialTracking}
            onToggleSerialTracking={(enabled) =>
              setFormData({ ...formData, hasSerialTracking: enabled })
            }
            serials={formData.serials}
            onChangeSerials={(serials) => setFormData({ ...formData, serials })}
            warrantyPeriod={formData.warrantyPeriod}
            onChangeWarranty={(warranty) => setFormData({ ...formData, warrantyPeriod: warranty })}
            stockCount={formData.stock}
          />
        )}

        {/* Tab 6: Media & Online Store */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <ProductImageUploader
              currentImage={formData.image}
              onImageChange={(newImg) => setFormData({ ...formData, image: newImg })}
              onOpenAiStudio={(initialImg) => onOpenAiStudio(initialImg || formData.image)}
              productName={formData.name}
              category={formData.category}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পণ্যের বিবরণ ও স্পেসিফিকেশন (Description)
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="পণ্যটির বিশেষ বৈশিষ্ট্য, ব্যবহারবিধি বা আকর্ষণীয় বিবরণ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Visibility switches */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">পণ্যটি সক্রিয় রাখুন</div>
                  <div className="text-[10px] text-slate-500">পিওএস ও বিক্রয় তালিকায় থাকবে</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={formData.onlineStoreVisible}
                  onChange={(e) => setFormData({ ...formData, onlineStoreVisible: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">অনলাইন স্টোরে প্রদর্শন</div>
                  <div className="text-[10px] text-slate-500">ই-কমার্স ক্যাটালগে দেখাবে</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">ফিচারড অফার পণ্য</div>
                  <div className="text-[10px] text-slate-500">বিশেষ হাইলাইট ব্যাজ পাবে</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {activeTab !== 'basic' && (
              <button
                type="button"
                onClick={handlePrevTab}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> আগের ধাপ
              </button>
            )}
            {activeTab !== 'media' && (
              <button
                type="button"
                onClick={handleNextTab}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                পরবর্তী ধাপ <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : isEdit ? 'পণ্য আপডেট করুন' : 'পণ্য সংরক্ষণ করুন'}</span>
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

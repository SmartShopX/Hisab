import React, { useState, useMemo } from 'react';
import {
  Layers,
  Pill,
  Smartphone,
  Shirt,
  Utensils,
  ShoppingBag,
  Sparkles,
  BookOpen,
  Wrench,
  Monitor,
  Home,
  Briefcase,
  Car,
  Wheat,
  LayoutGrid,
  ListFilter,
  SlidersHorizontal,
  ChevronDown,
  Tag,
  Check,
  Package,
  Boxes,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export type PosViewMode = 'grid' | 'grouped' | 'list';
export type PosSortOption = 'default' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_desc';

interface PosCategoryDepartmentFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedSubCategory: string;
  onSelectSubCategory: (subCat: string) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  stockFilter: 'all' | 'in_stock' | 'low_stock';
  onSelectStockFilter: (filter: 'all' | 'in_stock' | 'low_stock') => void;
  viewMode: PosViewMode;
  onViewModeChange: (mode: PosViewMode) => void;
  sortOption: PosSortOption;
  onSortOptionChange: (option: PosSortOption) => void;
  products: Product[];
}

export const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes('pharmacy') || c.includes('medicine') || c.includes('ওষুধ')) {
    return <Pill className="w-3.5 h-3.5 text-emerald-500" />;
  }
  if (c.includes('mobile') || c.includes('telecom') || c.includes('মোবাইল')) {
    return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
  }
  if (c.includes('fashion') || c.includes('clothing') || c.includes('পোশাক')) {
    return <Shirt className="w-3.5 h-3.5 text-purple-500" />;
  }
  if (c.includes('restaurant') || c.includes('food') || c.includes('খাবার') || c.includes('grocery')) {
    return <Utensils className="w-3.5 h-3.5 text-amber-500" />;
  }
  if (c.includes('cosmetics') || c.includes('beauty') || c.includes('সৌন্দর্য')) {
    return <Sparkles className="w-3.5 h-3.5 text-pink-500" />;
  }
  if (c.includes('book') || c.includes('stationery') || c.includes('বই')) {
    return <BookOpen className="w-3.5 h-3.5 text-indigo-500" />;
  }
  if (c.includes('hardware') || c.includes('materials') || c.includes('যন্ত্রপাতি')) {
    return <Wrench className="w-3.5 h-3.5 text-orange-500" />;
  }
  if (c.includes('computer') || c.includes('electronics') || c.includes('কম্পিউটার')) {
    return <Monitor className="w-3.5 h-3.5 text-cyan-500" />;
  }
  if (c.includes('agriculture') || c.includes('fish') || c.includes('কৃষি')) {
    return <Wheat className="w-3.5 h-3.5 text-lime-500" />;
  }
  if (c.includes('auto') || c.includes('bike') || c.includes('পরিবহন')) {
    return <Car className="w-3.5 h-3.5 text-teal-500" />;
  }
  return <Layers className="w-3.5 h-3.5 text-slate-500" />;
};

export const PosCategoryDepartmentFilter: React.FC<PosCategoryDepartmentFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  selectedBrand,
  onSelectBrand,
  stockFilter,
  onSelectStockFilter,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortOptionChange,
  products,
}) => {
  const { isEn } = useLanguage();
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Compute product counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.filter((p) => p.isActive).length };
    products.forEach((p) => {
      if (p.isActive) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Available sub-categories for current category (or all)
  const availableSubCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.isActive && (selectedCategory === 'all' || p.category === selectedCategory)) {
        if (p.subCategory) set.add(p.subCategory);
        if (p.dosageForm) set.add(p.dosageForm);
      }
    });
    return Array.from(set);
  }, [products, selectedCategory]);

  // Available brands for current category (or all)
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.isActive && (selectedCategory === 'all' || p.category === selectedCategory)) {
        if (p.brand) set.add(p.brand);
        if (p.manufacturer) set.add(p.manufacturer);
      }
    });
    return Array.from(set).slice(0, 15);
  }, [products, selectedCategory]);

  const hasActiveSubFilters =
    selectedSubCategory !== 'all' || selectedBrand !== 'all' || stockFilter !== 'all';

  const clearSubFilters = () => {
    onSelectSubCategory('all');
    onSelectBrand('all');
    onSelectStockFilter('all');
  };

  return (
    <div className="space-y-2.5">
      {/* Top Bar: Primary Department Tabs + View Mode Switcher + Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Department/Category Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            const label = cat === 'all' ? (isEn ? 'All Items' : 'সকল বিভাগ/পণ্য') : cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  onSelectSubCategory('all');
                  onSelectBrand('all');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0 select-none ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title={`${label} (${count}টি পণ্য)`}
              >
                {cat === 'all' ? (
                  <Boxes className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                ) : (
                  getCategoryIcon(cat)
                )}
                <span>{label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                    isSelected
                      ? 'bg-emerald-700/80 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Controls & Filter Trigger */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          {/* View Mode Toggle (Grid vs Grouped vs List) */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="গ্রিড ভিউ (Grid View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px] font-bold">{isEn ? 'Grid' : 'গ্রিড'}</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('grouped')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="বিভাগ অনুযায়ী গ্রুপিং ভিউ (Grouped by Department)"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px] font-bold">{isEn ? 'Grouped' : 'বিভাগ গ্রুপ'}</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="ঘন তালিকা ভিউ (Compact Table View)"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px] font-bold">{isEn ? 'List' : 'লিস্ট'}</span>
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortOption}
            onChange={(e) => onSortOptionChange(e.target.value as PosSortOption)}
            className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
          >
            <option value="default">{isEn ? 'Default Sort' : 'ডিফল্ট সাজানো'}</option>
            <option value="name_asc">{isEn ? 'Name (A-Z)' : 'নাম (অ-হ / A-Z)'}</option>
            <option value="price_asc">{isEn ? 'Price (Low to High)' : 'মূল্য (কম থেকে বেশি)'}</option>
            <option value="price_desc">{isEn ? 'Price (High to Low)' : 'মূল্য (বেশি থেকে কম)'}</option>
            <option value="stock_desc">{isEn ? 'Stock (High first)' : 'স্টক (বেশি আগে)'}</option>
          </select>

          {/* Sub-Filters Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              hasActiveSubFilters || isFilterDropdownOpen
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
            title="সাব-ক্যাটাগরি, ব্র্যান্ড ও স্টক ফিল্টার"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEn ? 'Filter' : 'ফিল্টার'}</span>
            {hasActiveSubFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            )}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expandable Sub-Category & Brand Filter Bar */}
      {isFilterDropdownOpen && (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
          {/* Stock Availability Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                {isEn ? 'Stock Status:' : 'স্টক অবস্থা:'}
              </span>
              <div className="flex items-center gap-1">
                {(['all', 'in_stock', 'low_stock'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onSelectStockFilter(st)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                      stockFilter === st
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all'
                      ? isEn ? 'All' : 'সব'
                      : st === 'in_stock'
                      ? isEn ? 'In Stock Only' : 'শুধুমাত্র স্টকে আছে'
                      : isEn ? 'Low Stock (<10)' : 'স্বল্প স্টক'}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveSubFilters && (
              <button
                type="button"
                onClick={clearSubFilters}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{isEn ? 'Clear All Filters' : 'ফিল্টার মুছুন'}</span>
              </button>
            )}
          </div>

          {/* Sub-Category Pills */}
          {availableSubCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] shrink-0">
                {isEn ? 'Subcategory:' : 'উপ-বিভাগ:'}
              </span>
              <button
                type="button"
                onClick={() => onSelectSubCategory('all')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 cursor-pointer ${
                  selectedSubCategory === 'all'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {isEn ? 'All Subcategories' : 'সব উপ-বিভাগ'}
              </button>
              {availableSubCategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => onSelectSubCategory(sub)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 cursor-pointer transition-all ${
                    selectedSubCategory === sub
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Brand Pills */}
          {availableBrands.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] shrink-0">
                {isEn ? 'Brand/Mfg:' : 'ব্র্যান্ড/কোম্পানি:'}
              </span>
              <button
                type="button"
                onClick={() => onSelectBrand('all')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 cursor-pointer ${
                  selectedBrand === 'all'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {isEn ? 'All Brands' : 'সব ব্র্যান্ড'}
              </button>
              {availableBrands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => onSelectBrand(b)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 cursor-pointer transition-all ${
                    selectedBrand === b
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PosCategoryDepartmentFilter;

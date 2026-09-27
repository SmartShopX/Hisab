import React from 'react';
import { Sun, Moon, Laptop, Sparkles, Type, Check, Palette } from 'lucide-react';
import { useTheme, ThemeMode, ThemeStyle, FontSize } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const ThemeAndFontSettings: React.FC = () => {
  const { theme, themeStyle, fontSize, isDark, setTheme, setThemeStyle, setFontSize } = useTheme();
  const { isEn } = useLanguage();

  const themeModeOptions: { mode: ThemeMode; labelBn: string; labelEn: string; descBn: string; descEn: string; icon: any }[] = [
    {
      mode: 'light',
      labelBn: 'লাইট মোড',
      labelEn: 'Light Mode',
      descBn: 'দিনের স্বাভাবিক আলোর জন্য পরিষ্কার ও স্পষ্ট ইন্টারফেস',
      descEn: 'Clean, crisp interface optimized for daylight',
      icon: Sun,
    },
    {
      mode: 'dark',
      labelBn: 'ডার্ক মোড',
      labelEn: 'Dark Mode',
      descBn: 'রাতের কাজের জন্য আরামদায়ক ও চোখের চাপমুক্ত ইন্টারফেস',
      descEn: 'High-contrast dark palette reducing eye strain',
      icon: Moon,
    },
    {
      mode: 'system',
      labelBn: 'সিস্টেম অটো',
      labelEn: 'System Match',
      descBn: 'আপনার অপারেটিং সিস্টেমের থিমের সাথে স্বয়ংক্রিয়ভাবে মিলবে',
      descEn: 'Automatically syncs with your device theme',
      icon: Laptop,
    },
  ];

  const themeStyleOptions: { style: ThemeStyle; labelBn: string; labelEn: string; descBn: string; descEn: string; color: string }[] = [
    {
      style: 'normal-clean',
      labelBn: 'স্বাভাবিক / ক্লিন (Normal Clean)',
      labelEn: 'Normal / Clean',
      descBn: 'মিনিমালিস্ট বর্ডার ও স্পষ্ট মার্জিন সহ নিখুঁত সরল ইন্টারফেস',
      descEn: 'Minimalist borders and crisp typography with minimal distraction',
      color: 'bg-slate-700',
    },
    {
      style: 'colorful-normal',
      labelBn: 'কালারফুল নরমাল (Colorful Normal)',
      labelEn: 'Colorful Normal',
      descBn: 'প্রাণবন্ত এমারেল্ড ও ইন্ডিগো অ্যাকসেন্ট সমৃদ্ধ ভারসাম্যপূর্ণ ডিজাইন',
      descEn: 'Balanced vibrant Emerald & Indigo accents for everyday business',
      color: 'bg-emerald-600',
    },
    {
      style: 'colorful-premium',
      labelBn: 'কালারফুল প্রিমিয়াম (Colorful Premium)',
      labelEn: 'Colorful Premium',
      descBn: 'চকচকে অ্যাকসেন্ট, প্রিমিয়াম গ্রেডিয়েন্ট ও পরিমার্জিত ফিনিশিং',
      descEn: 'Polished emerald & violet gradients with refined depth',
      color: 'bg-gradient-to-r from-emerald-500 to-indigo-600',
    },
  ];

  const fontSizeOptions: { size: FontSize; labelBn: string; labelEn: string; scale: string; descBn: string; descEn: string }[] = [
    {
      size: 'decreased',
      labelBn: 'ছোট ফন্ট (Compact 88%)',
      labelEn: 'Compact (88%)',
      scale: '14px',
      descBn: 'এক নজরে পর্দায় বেশি তথ্য দেখার উপযোগী',
      descEn: 'Dense view to see maximum data on screen',
    },
    {
      size: 'normal',
      labelBn: 'স্বাভাবিক (Normal 100%)',
      labelEn: 'Standard (100%)',
      scale: '16px',
      descBn: 'স্ট্যান্ডার্ড ব্যালান্সড পাঠযোগ্য সাইজ',
      descEn: 'Standard balanced size for all screens',
    },
    {
      size: 'increased',
      labelBn: 'বড় ফন্ট (Enhanced 112%)',
      labelEn: 'Enhanced (112%)',
      scale: '18px',
      descBn: 'বড় অক্ষর, বয়স্ক ও দূর থেকে দেখার জন্য অতি আরামদায়ক',
      descEn: 'Enlarged text for high legibility and comfort',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Theme Mode Selection */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
          <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isEn ? 'Theme Mode (Light / Dark)' : 'থিম মোড (লাইট / ডার্ক)'}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeModeOptions.map(({ mode, labelBn, labelEn, descBn, descEn, icon: Icon }) => {
            const isSelected = theme === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{isEn ? labelEn : labelBn}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{isEn ? descEn : descBn}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Visual Theme Styles (Normal/Clean, Colorful Normal, Colorful Premium) */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{isEn ? 'Visual Theme Styles' : 'ডিজাইন ও কালার প্যালেট স্টাইল'}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeStyleOptions.map(({ style, labelBn, labelEn, descBn, descEn, color }) => {
            const isSelected = themeStyle === style;
            return (
              <button
                key={style}
                type="button"
                onClick={() => setThemeStyle(style)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-500 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-5 h-5 rounded-full ${color} shadow-xs border border-white/40`} />
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{isEn ? labelEn : labelBn}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{isEn ? descEn : descBn}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Font Size Accessibility Controls */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
          <Type className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>{isEn ? 'Font Size & Accessibility' : 'ফন্ট সাইজ ও পাঠযোগ্যতা কন্ট্রোল'}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fontSizeOptions.map(({ size, labelBn, labelEn, scale, descBn, descEn }) => {
            const isSelected = fontSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-1 ring-amber-500 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {scale}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{isEn ? labelEn : labelBn}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{isEn ? descEn : descBn}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

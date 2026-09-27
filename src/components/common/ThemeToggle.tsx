import React from 'react';
import { Sun, Moon, Laptop, Sparkles } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface ThemeToggleProps {
  variant?: 'header' | 'segmented' | 'pill' | 'sidebar' | 'dropdown-item';
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'header',
  className = '',
  showLabels = true,
}) => {
  const { theme, effectiveTheme, isDark, setTheme, toggleTheme } = useTheme();
  const { isEn } = useLanguage();

  if (variant === 'segmented') {
    const options: { mode: ThemeMode; labelBn: string; labelEn: string; icon: React.FC<{ className?: string }> }[] = [
      { mode: 'light', labelBn: 'লাইট মোড', labelEn: 'Light', icon: Sun },
      { mode: 'dark', labelBn: 'ডার্ক মোড', labelEn: 'Dark', icon: Moon },
      { mode: 'system', labelBn: 'সিস্টেম অটো', labelEn: 'System', icon: Laptop },
    ];

    return (
      <div
        className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}
        role="group"
        aria-label="Theme selector"
      >
        {options.map(({ mode, labelBn, labelEn, icon: Icon }) => {
          const isActive = theme === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              {showLabels && <span>{isEn ? labelEn : labelBn}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer group ${className}`}
        title={
          isDark
            ? isEn
              ? 'Switch to Light Mode (Alt+D)'
              : 'লাইট মোডে পরিবর্তন করুন (Alt+D)'
            : isEn
            ? 'Switch to Dark Mode (Alt+D)'
            : 'ডার্ক মোড চালু করুন (Alt+D)'
        }
      >
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <Moon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          )}
          <span>{isDark ? (isEn ? 'Dark Mode' : 'ডার্ক মোড') : (isEn ? 'Light Mode' : 'লাইট মোড')}</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700">
          {isDark ? 'ON' : 'OFF'}
        </span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-500 transition-all cursor-pointer ${className}`}
        title={
          isDark
            ? isEn
              ? 'Switch to Light Mode'
              : 'লাইট মোড চালু করুন'
            : isEn
            ? 'Switch to Dark Mode'
            : 'ডার্ক মোড চালু করুন'
        }
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
        <span>{isDark ? (isEn ? 'Dark' : 'ডার্ক') : (isEn ? 'Light' : 'লাইট')}</span>
      </button>
    );
  }

  // Header Toggle (Default Icon Toggle)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-500/60 transition-all cursor-pointer group ${className}`}
      title={
        isDark
          ? isEn
            ? 'Switch to Light Mode (Alt+D)'
            : 'লাইট মোডে পরিবর্তন করুন (Alt+D)'
          : isEn
          ? 'Switch to Dark Mode (Alt+D) - High Contrast & Eye Comfort'
          : 'ডার্ক মোড সক্রিয় করুন (Alt+D) - রাতের জন্য চোখের আরাম ও হাই-কনট্রাস্ট'
      }
      aria-label="Toggle theme"
    >
      <div className="relative flex items-center justify-center w-4 h-4">
        {isDark ? (
          <Moon className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
        )}
      </div>
    </button>
  );
};

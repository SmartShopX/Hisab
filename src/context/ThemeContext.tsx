import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeStyle = 'normal-clean' | 'colorful-normal' | 'colorful-premium';
export type FontSize = 'normal' | 'increased' | 'decreased';

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  isDark: boolean;
  themeStyle: ThemeStyle;
  fontSize: FontSize;
  setTheme: (theme: ThemeMode) => void;
  setThemeStyle: (style: ThemeStyle) => void;
  setFontSize: (size: FontSize) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'smartshopx_theme_mode';
const THEME_STYLE_STORAGE_KEY = 'smartshopx_theme_style';
const FONT_SIZE_STORAGE_KEY = 'smartshopx_font_size';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }
    return 'system';
  });

  const [themeStyle, setThemeStyleState] = useState<ThemeStyle>(() => {
    try {
      const saved = localStorage.getItem(THEME_STYLE_STORAGE_KEY);
      if (saved === 'normal-clean' || saved === 'colorful-normal' || saved === 'colorful-premium') {
        return saved;
      }
    } catch {}
    return 'colorful-normal';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    try {
      const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
      if (saved === 'normal' || saved === 'increased' || saved === 'decreased') {
        return saved;
      }
    } catch {}
    return 'normal';
  });

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') return getSystemTheme();
    return theme;
  });

  // Apply or remove .dark class from <html> and <body>
  const applyThemeToDOM = useCallback((isDarkMode: boolean) => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  useEffect(() => {
    const isDarkTarget = theme === 'system' ? getSystemTheme() === 'dark' : theme === 'dark';
    const computedEffective = isDarkTarget ? 'dark' : 'light';
    setEffectiveTheme(computedEffective);
    applyThemeToDOM(isDarkTarget);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore
    }

    if (theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const isSysDark = e.matches;
        setEffectiveTheme(isSysDark ? 'dark' : 'light');
        applyThemeToDOM(isSysDark);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyThemeToDOM]);

  // Global keyboard shortcut: Alt + D or Alt + T to toggle Dark Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + D or Alt + T
      if (e.altKey && (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 't')) {
        e.preventDefault();
        setThemeState((prev) => {
          const currentEffective = prev === 'system' ? getSystemTheme() : prev;
          return currentEffective === 'dark' ? 'light' : 'dark';
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Apply theme style and font size to DOM
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Theme style classes
    root.classList.remove('theme-normal-clean', 'theme-colorful-normal', 'theme-colorful-premium');
    body.classList.remove('theme-normal-clean', 'theme-colorful-normal', 'theme-colorful-premium');
    root.classList.add(`theme-${themeStyle}`);
    body.classList.add(`theme-${themeStyle}`);

    try {
      localStorage.setItem(THEME_STYLE_STORAGE_KEY, themeStyle);
    } catch {}
  }, [themeStyle]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Font size accessibility classes
    root.classList.remove('font-size-normal', 'font-size-increased', 'font-size-decreased');
    body.classList.remove('font-size-normal', 'font-size-increased', 'font-size-decreased');
    root.classList.add(`font-size-${fontSize}`);
    body.classList.add(`font-size-${fontSize}`);

    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
    } catch {}
  }, [fontSize]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const setThemeStyle = useCallback((newStyle: ThemeStyle) => {
    setThemeStyleState(newStyle);
  }, []);

  const setFontSize = useCallback((newSize: FontSize) => {
    setFontSizeState(newSize);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const currentEffective = prev === 'system' ? getSystemTheme() : prev;
      return currentEffective === 'dark' ? 'light' : 'dark';
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        isDark: effectiveTheme === 'dark',
        themeStyle,
        fontSize,
        setTheme,
        setThemeStyle,
        setFontSize,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

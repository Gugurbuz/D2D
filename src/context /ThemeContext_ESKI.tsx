// src/context/ThemeContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// 1. Context'i oluştur
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 2. Provider Bileşenini oluştur (Tema yönetimi mantığı burada)
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Sayfa ilk yüklendiğinde localStorage'dan veya sistem tercihinden temayı al
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    // Sistem tercihini kontrol et (Kullanıcı işletim sisteminde karanlık mod kullanıyorsa)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // Varsayılan olarak aydınlık mod
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement; // <html> etiketi
    
    // Tema değiştikçe <html> etiketinden class'ı kaldır/ekle
    const isDark = theme === 'dark';
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);

    // Kullanıcının tercihini tarayıcı hafızasına (localStorage) kaydet
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Kolay kullanım için özel bir hook (useTheme) oluştur
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme, bir ThemeProvider içinde kullanılmalıdır');
  }
  return context;
};
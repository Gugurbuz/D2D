// src/context/ThemeContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// 1. Context'i oluştur
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 2. Provider Bileşenini oluştur
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Sayfa ilk yüklendiğinde localStorage'dan veya sistem tercihinden temayı al
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    // Sistem tercihini kontrol et
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement; // <html> etiketi
    
    // Tema değiştikçe <html> etiketinden class'ı kaldır/ekle
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Kullanıcının tercihini localStorage'a kaydet
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Kolay kullanım için özel bir hook oluştur
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
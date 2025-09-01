// src/components/ThemeSwitcher.tsx

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  // Oluşturduğumuz context'ten mevcut temayı ve tema değiştirme fonksiyonunu alıyoruz
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={theme === 'light' ? 'Karanlık Moda Geç' : 'Aydınlık Moda Geç'}
    >
      {/* Mevcut temaya göre Güneş veya Ay ikonunu göster */}
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
};

export default ThemeSwitcher;
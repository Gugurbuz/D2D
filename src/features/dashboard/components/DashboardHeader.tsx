import React, { useState, useRef, useEffect } from 'react';
import { Megaphone, Sparkles, Target, Award } from 'lucide-react';
import { BRAND_COLORS } from '../../../styles/theme';

interface Announcement {
  id: number;
  icon: React.ReactNode;
  text: string;
}

interface DashboardHeaderProps {
  agentName: string;
  headerMessage: string;
  currentTime: Date;
}

const announcements: Announcement[] = [
  { 
    id: 1, 
    icon: <Sparkles className="w-5 h-5 text-yellow-500" />, 
    text: "Yeni kampanya başladı! Müşterilerinize özel indirimleri sunmayı unutmayın." 
  },
  { 
    id: 2, 
    icon: <Target className="w-5 h-5 text-blue-500" />, 
    text: "Hedeflerinizi gün sonunda tamamlamayı unutmayın!" 
  },
  { 
    id: 3, 
    icon: <Award className="w-5 h-5 text-violet-500" />, 
    text: "Enerjisa saha ekibi için özel online eğitim yarın başlıyor." 
  }
];

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (hasUnread) setHasUnread(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="group relative p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
        aria-label="Duyuruları aç/kapat"
        title="Duyurular"
      >
        <Megaphone className="w-6 h-6 text-white" />
        {hasUnread && (
          <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white/50 group-hover:ring-white/70" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 z-10">
          <div className="p-3 border-b dark:border-gray-700">
            <h3 className="font-semibold text-md dark:text-gray-100">Duyurular</h3>
          </div>
          <div className="flex flex-col">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0 dark:border-gray-700"
              >
                <div className="flex-shrink-0 mt-1">{item.icon}</div>
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  agentName,
  headerMessage,
  currentTime,
}) => {
  return (
    <div
      className="rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-start md:justify-between gap-4"
      style={{ background: `linear-gradient(to right, ${BRAND_COLORS.navy}, #001B50)` }}
    >
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold">{headerMessage}</h1>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 self-end md:self-start">
        <div className="text-right">
          <div className="text-3xl font-bold">
            {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-blue-100">
            {currentTime.toLocaleDateString('tr-TR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </div>
        </div>
        <NotificationBell />
      </div>
    </div>
  );
};

export default DashboardHeader;
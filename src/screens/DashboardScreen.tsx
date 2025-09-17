import React, { useMemo } from 'react';
import {
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Calendar,
  Megaphone,
  ArrowRight
} from 'lucide-react';
import VisitCard from '../components/VisitCard';
import type { Customer, SalesRep } from '../types';

/** ====== MARKA RENKLERİ (Tutarlı Palet) ====== */
const BRAND_NAVY = '#002D72';
const BRAND_YELLOW = '#F9C800';
const STATE_GREEN = '#16A34A';
const STATE_AMBER = '#D97706';
const STATE_PURPLE = '#7C3AED';

/** Yardımcılar */
const toISO = (d: Date) => d.toISOString().split('T')[0];
const parseISO = (iso: string) => new Date(iso + 'T00:00:00');
const isWithinLastNDays = (isoDate: string | undefined, n = 7) => {
  if (!isoDate) return false;
  const d = parseISO(isoDate);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return diff >= 0 && diff <= n * 24 * 60 * 60 * 1000;
};

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: SalesRep[];
  setCurrentScreen: (screen: string) => void;
  onSelectCustomer: (customer: Customer) => void;
};

const DashboardScreen: React.FC<Props> = ({
  customers,
  assignments,
  allReps,
  setCurrentScreen,
  onSelectCustomer
}) => {
  const now = new Date();
  const today = toISO(now);
  const hour = now.getHours();

  /** --- Bugünkü ziyaretler --- */
  const todaysVisits = useMemo(
    () => customers.filter((c) => c.visitDate === today),
    [customers, today]
  );

  const completedVisits = useMemo(
    () => todaysVisits.filter((c) => c.status === 'Tamamlandı'),
    [todaysVisits]
  );

  const pendingVisits = useMemo(
    () => todaysVisits.filter((c) => c.status === 'Planlandı'),
    [todaysVisits]
  );

  /** --- Haftalık (son 7 gün) metrikleri --- */
  const weeklyVisits = useMemo(
    () => customers.filter((c) => isWithinLastNDays(c.visitDate, 7)),
    [customers]
  );
  const weeklyCompleted = useMemo(
    () => weeklyVisits.filter((c) => c.status === 'Tamamlandı'),
    [weeklyVisits]
  );

  /** --- Hedefler ve oranlar --- */
  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / Math.max(dailyTarget, 1)) * 100);
  const conversionRate = Math.round(
    (completedVisits.length / Math.max(todaysVisits.length, 1)) * 100
  );
  const weeklyRate = Math.round(
    (weeklyCompleted.length / Math.max(weeklyVisits.length, 1)) * 100
  );

  /** --- Selamlama + ikonlar + tek cümle mesaj --- */
  const greeting =
    hour >= 6 && hour < 12 ? 'Günaydın' :
    hour >= 17 && hour < 21 ? 'İyi akşamlar' :
    hour < 6 || hour >= 21 ? 'İyi geceler' : 'Hoş geldin';

  // Selamlama ikonları
  const greetingIcons: Record<string, string> = {
    'Günaydın': '🌅',
    'Hoş geldin': '☀️',
    'İyi akşamlar': '🌆',
    'İyi geceler': '🌙',
  };
  const greetingWithIcon = `${greetingIcons[greeting] || ''} ${greeting}`;

  // Mesai içi/dışı kısa mesaj
  const messageCore = (() => {
    if (hour >= 6 && hour < 18) {
      return `Bugün ${todaysVisits.length} ziyaretin var; başarılar!`;
    } else {
      const tmr = new Date();
      tmr.setDate(now.getDate() + 1);
      const tmrISO = toISO(tmr);
      const tmrCount = customers.filter((c) => c.visitDate === tmrISO).length;
      return tmrCount > 0
        ? `Mesai bitti. Yarın ${tmrCount} ziyaret planlı. Dinlenme zamanı.`
        : 'Mesai bitti. Yarın programında ziyaret görünmüyor.';
    }
  })();

  // Motivasyon ikonlu (oranlara göre)
  let motivation = '';
  if (completionRate >= 80) {
    motivation = '🚀 Harika gidiyorsun, az kaldı!';
  } else if (completionRate >= 40) {
    motivation = '🌱 İyi ilerliyorsun; ritmi koru.';
  } else {
    motivation = '💡 Başlamak için iyi bir an.';
  }
  if (conversionRate >= 30) {
    motivation += ' 🥇 Dönüşüm oranında çok iyisin!';
  } else if (conversionRate > 0) {
    motivation += ' 🤝 Daha çok teklif ile dönüşümü artırabilirsin.';
  }

  // Tek satır mesaj
  const singleLine = `${greetingWithIcon}. ${messageCore} ${motivation}`;

  /** --- Duyuru bandı içeriği (ayrı komponent) --- */
  const announcements = [
    '⚡ Yeni kampanya başladı.',
    '🎯 Gün sonu hedefini kontrol et.',
    '📚 Eğitim oturumu yarın.'
  ];

  return (
    <div className="space-y-6">
      {/* Duyuru Bandı (ayrı, sakin) */}
      <AnnouncementBar items={announcements} />

      {/* Hoş geldin bloğu (ikonlu tek cümle) */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ backgroundColor: BRAND_NAVY }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-base md:text-lg font-medium opacity-95">
            {singleLine}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold leading-none">
              {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm opacity-80">
              {now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Kartları (tutarlı renkler; haftalık gerçekten haftalık) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Günlük Hedef"
          value={`${completedVisits.length}/${dailyTarget}`}
          subtitle={`%${completionRate} tamamlandı`}
          icon={<Target className="w-6 h-6" />}
          color={BRAND_NAVY}
          progress={completionRate}
          accent={BRAND_YELLOW}
        />
        <KPICard
          title="Tamamlanan"
          value={String(completedVisits.length)}
          subtitle="Bugün"
          icon={<CheckCircle className="w-6 h-6" />}
          color={STATE_GREEN}
        />
        <KPICard
          title="Bekleyen"
          value={String(pendingVisits.length)}
          subtitle="Ziyaret"
          icon={<Clock className="w-6 h-6" />}
          color={STATE_AMBER}
        />
        <KPICard
          title="Haftalık"
          value={`%${weeklyRate}`}
          subtitle={`${weeklyCompleted.length}/${weeklyVisits.length || 0} tamamlandı (son 7 gün)`}
          icon={<TrendingUp className="w-6 h-6" />}
          color={STATE_PURPLE}
        />
      </div>

      {/* Bugünkü Program */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" style={{ color: BRAND_NAVY }} />
          <h2 className="text-lg font-semibold">Bugünkü Program</h2>
        </div>

        {todaysVisits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Bugün için planlanmış ziyaret yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysVisits.slice(0, 5).map((customer) => {
              const assignedName = assignments[customer.id]
                ? allReps.find((r) => r.id === assignments[customer.id])?.name
                : undefined;

              return (
                <div key={customer.id} className="rounded-xl border border-gray-200">
                  {/* Mevcut kart */}
                  <VisitCard
                    customer={customer}
                    assignedName={assignedName}
                    onDetail={() => onSelectCustomer(customer)}
                    onStart={() => {
                      onSelectCustomer(customer);
                      setCurrentScreen('visitFlow');
                    }}
                  />

                  {/* Net eylem bölümü: Birincil = Başlat, İkincil = Detay */}
                  <div className="flex items-center justify-end gap-4 px-4 pb-4 -mt-2">
                    <button
                      onClick={() => {
                        onSelectCustomer(customer);
                        setCurrentScreen('visitFlow');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-900 transition"
                      style={{ backgroundColor: BRAND_YELLOW }}
                    >
                      Ziyareti Başlat <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onSelectCustomer(customer)}
                      className="text-sm font-medium underline decoration-transparent hover:decoration-inherit transition"
                      style={{ color: BRAND_NAVY }}
                    >
                      Detay
                    </button>
                  </div>
                </div>
              );
            })}
            {todaysVisits.length > 5 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setCurrentScreen('visits')}
                  className="text-sm font-medium hover:underline"
                  style={{ color: BRAND_NAVY }}
                >
                  +{todaysVisits.length - 5} ziyaret daha… (Tümünü Gör)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/** ================== Alt Bileşenler ================== */

const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;       // arka plan rengi kutucuk için
  progress?: number;   // 0-100
  accent?: string;     // opsiyonel ilerleme çubuğu rengi
}> = ({ title, value, subtitle, icon, color, progress, accent }) => {
  const pct = Math.max(0, Math.min(progress ?? -1, 100));
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg text-white" style={{ backgroundColor: color }}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>

      {/* İlerleme çubuğu sadece progress varsa */}
      {pct >= 0 && (
        <div className="mt-3">
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: accent || color
              }}
            />
          </div>
          <div className="mt-1 text-right text-[11px] text-gray-500">%{pct}</div>
        </div>
      )}
    </div>
  );
};

const AnnouncementBar: React.FC<{ items: string[] }> = ({ items }) => {
  if (!items?.length) return null;
  return (
    <div
      className="w-full rounded-xl px-3 py-2 flex items-center gap-2"
      style={{ backgroundColor: '#F7F8FA', border: '1px solid #E5E7EB' }}
      aria-label="Duyurular"
    >
      <Megaphone className="w-4 h-4" style={{ color: BRAND_NAVY }} />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
        {items.map((msg, i) => (
          <span key={i} className="whitespace-nowrap">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DashboardScreen;

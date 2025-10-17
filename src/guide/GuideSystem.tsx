// src/guide/GuideSystem.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step as JoyrideStep } from "react-joyride";
import { guideConfig, GUIDE_VERSION, AppRole, AppScreen } from "./guideConfig";

// --------- Kurumsal tema (Enerjisa renkleri) ---------
const BRAND = {
  primary: "#002D72",   // Lacivert
  accent:  "#F9C800",   // Sarı
  text:    "#1F2937",   // Gray-800
  overlay: "rgba(0,0,0,.35)", // Koyu yarı-şeffaf arkaplan
};

// ---------- Yardımcılar ----------
const keyFor = (role: AppRole, screen: AppScreen) => `guide:${GUIDE_VERSION}:${role}:${screen}:done`;

const mapSteps = (role: AppRole, screen: AppScreen): JoyrideStep[] => {
  const cfg = guideConfig[role]?.[screen];
  if (!cfg) return [];
  return (cfg.tourSteps || []).map(s => ({
    target: s.target,
    content: (
      <div className="space-y-1 text-[14px] leading-6 text-gray-800">
        <div className="font-semibold" style={{ color: BRAND.primary }}>İpucu</div>
        <div className="text-gray-700">{s.content}</div>
      </div>
    ),
    placement: s.placement || "auto",
    disableBeacon: s.disableBeacon ?? true,
    spotlightPadding: 10,
  }));
};

// ---------- Context ----------
type GuideContextType = {
  role: AppRole;
  screen: AppScreen;
  openHelp: () => void;
  startTour: () => void;
  isHelpOpen: boolean;
  setHelpOpen: (v: boolean) => void;
};

const GuideContext = createContext<GuideContextType | null>(null);
export const useGuide = () => {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide must be used within <GuideProvider/>");
  return ctx;
};

// ---------- Provider + UI ----------
type ProviderProps = {
  role: AppRole;
  screen: AppScreen;
  autoStart?: boolean;        // ilk girişte tur otomatik başlasın mı?
  enableLongPress?: boolean;  // uzun basma ile yardım aç
  longPressMs?: number;       // uzun basma eşiği
  children: React.ReactNode;
};

export const GuideProvider: React.FC<ProviderProps> = ({
  role,
  screen,
  autoStart = true,
  enableLongPress = true,
  longPressMs = 700,
  children
}) => {
  const [run, setRun] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const steps = useMemo(() => mapSteps(role, screen), [role, screen]);
  const storageKey = useMemo(() => keyFor(role, screen), [role, screen]);

  // İlk girişte otomatik tur (tamamlanmamışsa)
  useEffect(() => {
    if (!autoStart || steps.length === 0) return;
    const done = localStorage.getItem(storageKey) === "1";
    if (!done) setRun(true);
  }, [autoStart, steps, storageKey]);

  const onJoyride = (data: CallBackProps) => {
    const { status } = data;
    const finished = [STATUS.FINISHED, STATUS.SKIPPED].includes(status);
    if (finished) {
      localStorage.setItem(storageKey, "1");
      setRun(false);
    }
  };

  const openHelp = () => setHelpOpen(true);
  const startTour = () => setRun(true);

  // Dokunmatik uzun basma: ekran boş bir yerine ~700ms basılı tut → Yardım aç
  useEffect(() => {
    if (!enableLongPress) return;

    let timer: number | null = null;

    const start = (e: TouchEvent) => {
      const el = e.target as HTMLElement | null;
      // İnteraktif elementlerde tetikleme devre dışı
      if (el && el.closest('button, a, input, textarea, select, [role="button"], [data-no-help-longpress]')) return;

      timer = window.setTimeout(() => {
        setHelpOpen(true);
        if (timer) clearTimeout(timer);
        timer = null;
      }, longPressMs) as unknown as number;
    };

    const cancel = () => {
      if (timer) { clearTimeout(timer); timer = null; }
    };

    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", cancel, { passive: true });
    document.addEventListener("touchend", cancel, { passive: true });
    document.addEventListener("touchcancel", cancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", cancel);
      document.removeEventListener("touchend", cancel);
      document.removeEventListener("touchcancel", cancel);
    };
  }, [enableLongPress, longPressMs]);

  return (
    <GuideContext.Provider value={{ role, screen, openHelp, startTour, isHelpOpen: helpOpen, setHelpOpen }}>
      {/* Joyride (Tour) */}
      <Joyride
        steps={steps}
        run={run}
        continuous
        scrollToFirstStep
        showProgress
        showSkipButton
        hideCloseButton
        locale={{ back: "Geri", close: "Kapat", last: "Bitti", next: "İleri", open: "Aç", skip: "Atla" }}
        styles={{
          // Genel ayarlar
          options: {
            zIndex: 10000,
            primaryColor: BRAND.primary,     // bazı highlight/ok renkleri
            textColor: BRAND.text,
            overlayColor: BRAND.overlay,
            width: 380,
            arrowColor: "#ffffff",
          },
          // Kart görünümü
          tooltip: {
            backgroundColor: "#ffffff",
            borderRadius: 16,
            boxShadow: "0 12px 32px rgba(0,0,0,.18)",
            padding: "16px 16px",
          },
          tooltipContainer: {
            textAlign: "left",
            fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            fontSize: 14,
            lineHeight: 1.55,
          },
          tooltipContent: { padding: 0 },
          tooltipFooter: { display: "flex", gap: 8 },

          // Butonlar
          buttonNext: {
            backgroundColor: BRAND.accent,
            color: "#111827",
            borderRadius: 9999,
            padding: "8px 14px",
            border: "1px solid rgba(0,0,0,.05)",
          },
          buttonBack: {
            color: BRAND.primary,
            background: "transparent",
            borderRadius: 9999,
            padding: "8px 12px",
          },
          buttonClose: {
            color: "#9CA3AF",
          },

          // Spotlight (hedef vurgusu)
          spotlight: {
            borderRadius: 12,
          },
        }}
        callback={onJoyride}
      />

      {/* Yardım Çekmecesi */}
      <HelpDrawer />

      {children}
    </GuideContext.Provider>
  );
};

// ---------- Help Drawer ----------
const DrawerSection: React.FC<{ title: string; bullets: string[] }> = ({ title, bullets }) => (
  <div className="mb-6">
    <div className="font-semibold mb-2">{title}</div>
    <ul className="list-disc ml-5 space-y-1">
      {bullets.map((b, i) => <li key={i}>{b}</li>)}
    </ul>
  </div>
);

const HelpDrawer: React.FC = () => {
  const { role, screen, isHelpOpen, setHelpOpen, startTour } = useGuide();
  const cfg = guideConfig[role]?.[screen];

  return (
    <div
      aria-hidden={!isHelpOpen}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: isHelpOpen ? "380px" : "0px",
        background: "#ffffff",
        boxShadow: isHelpOpen ? "-8px 0 24px rgba(0,0,0,.1)" : "none",
        transition: "width .25s ease",
        zIndex: 10001,
        overflow: "hidden",
        borderLeft: "1px solid #eee"
      }}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold" style={{ color: BRAND.primary }}>Yardım • {role} / {screen}</div>
          <button onClick={() => setHelpOpen(false)} className="px-2 py-1 rounded border" aria-label="Yardımı kapat">Kapat</button>
        </div>

        {!cfg ? (
          <div>Daha sonra desteklenecek.</div>
        ) : (
          <div className="overflow-auto">
            {(cfg.cheatsheet || []).map((c, idx) => (
              <DrawerSection key={idx} title={c.title} bullets={c.bullets} />
            ))}

            {!!cfg.tips?.length && <DrawerSection title="İpuçları" bullets={cfg.tips} />}

            <div className="mt-6">
              <button
                onClick={startTour}
                className="px-3 py-2 rounded border w-full"
                aria-label="Turu başlat"
                style={{ background: BRAND.accent, borderColor: "rgba(0,0,0,.05)" }}
              >
                Turu Başlat
              </button>
            </div>

            <div className="text-xs text-gray-500 mt-4">Guide v{GUIDE_VERSION}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Floating Help FAB (tablet) ----------
export const HelpFAB: React.FC = () => {
  const { openHelp, startTour } = useGuide();
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded(v => !v);

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 10002,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-end"
      }}
    >
      {expanded && (
        <>
          <button
            onClick={openHelp}
            className="px-3 py-2 rounded-lg shadow border bg-white"
            aria-label="Yardımı aç"
          >
            Yardım
          </button>
          <button
            onClick={startTour}
            className="px-3 py-2 rounded-lg shadow border bg-white"
            aria-label="Turu başlat"
          >
            Tur
          </button>
        </>
      )}

      <button
        onClick={toggle}
        aria-label="Yardım menüsü"
        style={{
          width: 56,
          height: 56,
          borderRadius: 9999,
          boxShadow: "0 6px 18px rgba(0,0,0,.15)",
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          fontWeight: 700,
          fontSize: 20,
          color: BRAND.primary
        }}
      >
        ?
      </button>
    </div>
  );
};

// (Opsiyonel) Topbar butonu hâlâ kullanılabilir
export const HelpButton: React.FC<{ className?: string }> = ({ className }) => {
  const { openHelp, startTour } = useGuide();
  return (
    <div className={className || ""} style={{ display: "flex", gap: 8 }}>
      <button onClick={openHelp} className="px-3 py-1.5 rounded border" aria-label="Yardımı aç">?</button>
      <button onClick={startTour} className="px-3 py-1.5 rounded border" aria-label="Turu başlat">Tur</button>
    </div>
  );
};

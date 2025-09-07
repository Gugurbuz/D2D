/* ==== Fullscreen butonu ==== */
const FullscreenBtn: React.FC = () => {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  return (
    <button
      onClick={async () => {
        const el = document.querySelector(".leaflet-container") as HTMLElement;
        if (!document.fullscreenElement && el) await el.requestFullscreen();
        else await document.exitFullscreen();
      }}
      className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-gray-50 inline-flex items-center gap-1"
    >
      {isFs ? (
        <>
          <Minimize2 className="w-3 h-3" /> Kapat
        </>
      ) : (
        <>
          <Maximize2 className="w-3 h-3" /> Tam Ekran
        </>
      )}
    </button>
  );
};

export default RouteMap;

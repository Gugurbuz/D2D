{/* 🔲 FİLTRE KUTUSU */}
<div className="bg-white border border-gray-300 rounded-xl p-4 space-y-6 shadow-sm">
  {/* DURUM */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {["Tümü", "Planlandı", "Tamamlandı", "İptal", "Yolda"].map((status) => {
        const active = statusFilter === status;
        const tone =
          status === "Tamamlandı"
            ? "green"
            : status === "Yolda"
            ? "blue"
            : status === "İptal"
            ? "red"
            : "yellow";

        const activeClass = active
          ? `bg-${tone}-100 text-${tone}-800 border-${tone}-200`
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50";

        return (
          <button
            key={status}
            onClick={() => setStatusFilter(status as any)}
            className={`px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${activeClass}`}
          >
            {status}
          </button>
        );
      })}
    </div>
  </div>

  {/* TARİH */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {["Tümü", "Bugün", "Yarın", "Bu Hafta"].map((label) => {
        const isActive = dateFilter === label;
        const activeClass = isActive
          ? "bg-green-600 text-white border-green-600"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50";

        return (
          <button
            key={label}
            onClick={() => setDateFilter(label as any)}
            className={`px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${activeClass}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  </div>

  {/* SIRALAMA */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Sıralama</label>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {[
        { key: "plannedTime", label: "Tarihe Göre" },
        { key: "priority", label: "Önceliğe Göre" },
      ].map((item) => {
        const isActive = sortBy === item.key;
        const activeClass = isActive
          ? "bg-purple-600 text-white border-purple-600"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50";

        return (
          <button
            key={item.key}
            onClick={() => {
              if (sortBy === item.key) setAsc(!asc);
              else {
                setSortBy(item.key as any);
                setAsc(true);
              }
            }}
            className={`flex items-center justify-center gap-1 px-4 py-2 min-w-[120px] rounded-full border text-sm transition whitespace-nowrap ${activeClass}`}
          >
            {item.label}
            {isActive && (asc ? <SortAsc size={16} /> : <SortDesc size={16} />)}
          </button>
        );
      })}
    </div>
  </div>

  {/* 🔁 Filtre Sıfırla Butonu */}
  <div className="text-right">
    <button
      onClick={resetFilters}
      className="text-sm text-blue-600 hover:underline"
    >
      Filtreleri Sıfırla
    </button>
  </div>
</div>

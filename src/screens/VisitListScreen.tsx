
import React, { useMemo, useState, useCallback, useEffect } from "react";

import type { Customer } from "../data/mockCustomers";

import type { Rep } from "../types";

import VisitCard from "../components/VisitCard";

import { SortAsc, SortDesc } from "lucide-react";

import { isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";



const pageSize = 20;



const VisitListScreen = ({

  customers,

  assignments,

  allReps,

  setCurrentScreen,

  onSelectCustomer,

}: {

  customers: Customer[];

  assignments: Record<string, string | undefined>;

  allReps: Rep[];

  setCurrentScreen: (s: any) => void;

  onSelectCustomer: (c: Customer) => void;

}) => {

  const [q, setQ] = useState("");

  const [statusFilter, setStatusFilter] = useState<"Tümü" | Customer["status"]>("Tümü");

  const [sortBy, setSortBy] = useState<"plannedTime" | "priority">("plannedTime");

  const [asc, setAsc] = useState(true);

  const [dateFilter, setDateFilter] = useState<"Tümü" | "Bugün" | "Yarın" | "Bu Hafta">("Tümü");

  const [page, setPage] = useState(1);

  const [filtersVisible, setFiltersVisible] = useState(true);



  // İlk yüklemede mobilde filtreleri gizle

  useEffect(() => {

    if (window.innerWidth < 768) {

      setFiltersVisible(false);

    }

  }, []);



  const getAssignedName = (customerId: string) => {

    const repId = assignments[customerId];

    return repId ? allReps.find((r) => r.id === repId)?.name || repId : null;

  };



  const filteredSorted = useMemo(() => {

    let list = [...customers];



    if (q.trim()) {

      const needle = q.trim().toLowerCase();

      list = list.filter(

        (c) =>

          c.name.toLowerCase().includes(needle) ||

          c.address.toLowerCase().includes(needle) ||

          c.customerNumber?.toLowerCase().includes(needle)

      );

    }



    if (statusFilter !== "Tümü") {

      list = list.filter((c) => c.status === statusFilter);

    }



    if (dateFilter !== "Tümü") {

      list = list.filter((c) => {

        if (!c.visitDate) return false;

        const date = parseISO(c.visitDate);

        if (dateFilter === "Bugün") return isToday(date);

        if (dateFilter === "Yarın") return isTomorrow(date);

        if (dateFilter === "Bu Hafta") return isThisWeek(date, { weekStartsOn: 1 });

        return true;

      });

    }



    list.sort((a, b) => {

      if (sortBy === "plannedTime") {

        const cmp = a.visitDate.localeCompare(b.visitDate);

        return asc ? cmp : -cmp;

      }

      const order = { Yüksek: 3, Orta: 2, Düşük: 1 } as const;

      const cmp = order[a.priority] - order[b.priority];

      return asc ? -cmp : cmp;

    });



    return list;

  }, [customers, q, statusFilter, dateFilter, sortBy, asc]);



  const visibleItems = filteredSorted.slice(0, page * pageSize);



  const resetFilters = () => {

    setQ("");

    setStatusFilter("Tümü");

    setDateFilter("Tümü");

    setSortBy("plannedTime");

    setAsc(true);

    setPage(1);

  };



  const selectAndGo = useCallback(

    (c: Customer, screen: "visitDetail" | "visitFlow") => {

      onSelectCustomer(c);

      requestAnimationFrame(() => setCurrentScreen(screen));

    },

    [onSelectCustomer, setCurrentScreen]

  );



  return (

    <div className="px-4 md:px-6 py-6 space-y-6">

      {/* Arama */}

      <input

        type="text"

        value={q}

        onChange={(e) => setQ(e.target.value)}

        placeholder="Müşteri adı, adres veya no ile ara..."

        className="border rounded px-3 py-2 w-full"

      />



      {/* Göster/Gizle */}

      <div className="text-right">

        <button

          onClick={() => setFiltersVisible((v) => !v)}

          className="text-sm text-blue-600 hover:underline mb-2"

        >

          {filtersVisible ? "Filtreleri Gizle ▲" : "Filtreleri Göster ▼"}

        </button>

      </div>



      {/* 🔲 Filtreler: 3 Sütun, 3 Kutu */}

      {filtersVisible && (

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* ✅ DURUM */}

          <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-4 shadow-sm">

            <label className="block text-sm font-medium text-gray-700">Durum</label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

              {["Tümü", "Planlandı", "Tamamlandı", "İptal", "Yolda"].map((status) => {

                const isActive = statusFilter === status;



                const statusColors: Record<string, string> = {

                  "Tümü": isActive

                    ? "bg-green-600 text-white border-green-600"

                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",

                  "Planlandı": isActive

                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"

                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",

                  "Tamamlandı": isActive

                    ? "bg-green-100 text-green-800 border-green-200"

                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",

                  "Yolda": isActive

                    ? "bg-blue-100 text-blue-800 border-blue-200"

                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",

                  "İptal": isActive

                    ? "bg-red-100 text-red-800 border-red-200"

                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",

                };



                return (

                  <button

                    key={status}

                    onClick={() => setStatusFilter(status as any)}

                    className={`px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${statusColors[status]}`}

                  >

                    {status}

                  </button>

                );

              })}

            </div>

          </div>



          {/* TARİH */}

          <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-4 shadow-sm">

            <label className="block text-sm font-medium text-gray-700">Tarih</label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

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

          <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-4 shadow-sm">

            <label className="block text-sm font-medium text-gray-700">Sıralama</label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

              {[

                { key: "plannedTime", label: "Tarihe Göre" },

                { key: "priority", label: "Önceliğe Göre" },

              ].map((item) => {

                const isActive = sortBy === item.key;

                const activeClass = isActive

                  ? "bg-gray-200 text-gray-900 border-gray-400"

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

        </div>

      )}



      {/* 🔁 Sıfırla */}

      {filtersVisible && (

        <div className="text-right pt-2">

          <button

            onClick={resetFilters}

            className="text-sm text-blue-600 hover:underline"

          >

            Filtreleri Sıfırla

          </button>

        </div>

      )}



      {/* Ziyaret Listesi */}

      {visibleItems.length === 0 ? (

        <div className="text-center py-12 text-gray-500">Hiç ziyaret bulunamadı.</div>

      ) : (

        <div className="space-y-4">

          {visibleItems.map((c) => (

            <VisitCard

              key={c.id}

              customer={c}

              assignedName={getAssignedName(c.id)}

              onDetail={() => selectAndGo(c, "visitDetail")}

              onStart={() => selectAndGo(c, "visitFlow")}

            />

          ))}



          {filteredSorted.length > visibleItems.length && (

            <button

              onClick={() => setPage((p) => p + 1)}

              className="mt-4 mx-auto block bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 text-sm"

            >

              Daha Fazla Yükle

            </button>

          )}

        </div>

      )}

    </div>

  );

};



export default VisitListScreen;
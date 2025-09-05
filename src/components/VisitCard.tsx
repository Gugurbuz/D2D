import React from "react";
import { Eye, Play, MapPin, UserCheck, StickyNote } from "lucide-react";
import type { Customer } from "../types";
import { Chip } from "./Chip";

const getStatusTone = (status: Customer["status"]) =>
  status === "Tamamlandı" ? "green" : status === "Yolda" ? "blue" : "yellow";

const getPriorityTone = (priority: Customer["priority"]) =>
  priority === "Yüksek" ? "red" : priority === "Orta" ? "yellow" : "green";

type Props = {
  customer: Customer;
  assignedName: string | null;
  onDetail: () => void;
  onStart: () => void;
};

const VisitCard: React.FC<Props> = ({ customer, assignedName, onDetail, onStart }) => {
  const statusTone = getStatusTone(customer.status);
  const priorityTone = getPriorityTone(customer.priority);
  const typeLabel = customer.tariff === "İş Yeri" ? "B2B – Sabit Fiyat" : "B2C – Endeks";

  return (
    <div className="bg-white border border-gray-200 hover:border-cyan-600 rounded-xl p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* SOL TARAF */}
        <div className="flex-1 space-y-2">
          {/* İsim + müşteri & tesisat no */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="text-lg font-semibold text-gray-900">{customer.name}</div>
            <div className="text-xs text-gray-500">Müşteri No: {customer.customerNumber ?? "-"}</div>
            <div className="text-xs text-gray-500">Tesisat No: {customer.installationNumber ?? "-"}</div>
          </div>

          {/* Adres */}
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {customer.address} – {customer.district}
          </div>

          {/* Chip alanları */}
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip tone={statusTone}>{customer.status}</Chip>
            <Chip tone={priorityTone}>{customer.priority} Öncelik</Chip>
            <Chip tone="blue">{typeLabel}</Chip>
            {assignedName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-100 text-gray-800 border-gray-200">
                <UserCheck className="w-3 h-3 mr-1" /> {assignedName}
              </span>
            )}
          </div>
        </div>

        {/* SAĞ TARAF */}
        <div className="text-right space-y-2 flex flex-col items-end justify-between">
          <div>
            {/* Tarih + Saat aynı satırda */}
            <div className="text-sm font-medium text-gray-900 flex gap-2">
              <span>{customer.visitDate ?? "-"}</span>
              <span>{customer.plannedTime}</span>
            </div>
            {/* Mesafe */}
            <div className="text-xs text-gray-500">{customer.distance}</div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {/* Detay butonu */}
            <button
              onClick={onDetail}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs transition"
              aria-label="Ziyaret detayını gör"
              title="Detay"
            >
              <Eye className="w-4 h-4" /> Detay
            </button>

            {/* Başlat butonu */}
            {customer.status === "Bekliyor" && (
              <button
                onClick={onStart}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs transition"
                aria-label="Ziyareti başlat"
                title="Başlat"
              >
                <Play className="w-4 h-4" /> Başlat
              </button>
            )}

            {/* Not ekle */}
            <button
              onClick={() => alert("Not Ekle özelliği geliştirilecek")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs transition"
              title="Not Ekle"
            >
              <StickyNote className="w-4 h-4" /> Not Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitCard;

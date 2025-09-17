import React from "react";
import { Eye, Play, MapPin, UserCheck } from "lucide-react";
import type { Customer } from "../types";
import Button from "./Button";
import { 
  getStatusChipClassesFromKPI, 
  getPriorityChipClassesFromKPI, 
  colorTones, BRAND_COLORS 
} from "../styles/theme";

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

type Props = {
  customer: Customer;
  assignedName: string | null;
  onDetail: () => void;
  onStart: () => void;
};

const VisitCard: React.FC<Props> = ({ customer, assignedName, onDetail, onStart }) => {
  const typeLabel = customer.tariff === "İş Yeri" ? "B2B – Sabit Fiyat" : "B2C – Endeks";

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[var(--brand-navy,#0099CB)] rounded-xl p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* SOL */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{customer.name}</div>
            <div className="text-xs text-gray-500">Müşteri No: {customer.customerNumber ?? "-"}</div>
            <div className="text-xs text-gray-500">Tesisat No: {customer.installationNumber ?? "-"}</div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {customer.address} – {customer.district}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {/* Statü: KPI renkleri */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getStatusChipClassesFromKPI(customer.status)}`}>
              {customer.status}
            </span>

            {/* Öncelik: KPI renkleri */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getPriorityChipClassesFromKPI(customer.priority)}`}>
              {customer.priority} Öncelik
            </span>

            {/* Tür etiketi: markanın yeni primary'si (açık mavi) */}
            <span 
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs 
                          bg-[${colorTones.navy[50]}] text-[${BRAND_COLORS.navy}] ring-1 ring-[${colorTones.navy[200]}]`}>
              {typeLabel}
            </span>

            {assignedName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">
                <UserCheck className="w-3 h-3 mr-1" /> {assignedName}
              </span>
            )}
          </div>
        </div>

        {/* SAĞ */}
        <div className="text-right space-y-2 flex flex-col items-end justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex gap-2">
              <span>{formatDate(customer.visitDate)}</span>
              <span>{customer.plannedTime}</span>
            </div>
            <div className="text-xs text-gray-500">{customer.distance}</div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="primary" size="sm" onClick={onDetail} leftIcon={<Eye className="w-4 h-4" />}>
              Detay
            </Button>

            {customer.status === "Bekliyor" && (
              <Button variant="secondary" size="sm" onClick={onStart} leftIcon={<Play className="w-4 h-4" />}>
                Başlat
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitCard;

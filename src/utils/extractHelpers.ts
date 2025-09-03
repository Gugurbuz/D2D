import type { ExtractResponseData } from "../types/extract";

export function toFormDefaults(d: ExtractResponseData) {
  return {
    provider: d?.provider?.name ?? "",
    customerName: d?.customer?.name ?? "",
    address: d?.customer?.address ?? "",
    installationNo: d?.installation_no?.value ?? "",
    meterNo: d?.meter_no?.value ?? "",
    periodFrom: d?.period?.from ?? "",
    periodTo: d?.period?.to ?? "",
    consumptionKwh: d?.consumption_kwh?.value?.toString?.() ?? "",
    unitPrice: d?.unit_price_tl_per_kwh?.value?.toString?.() ?? "",
    totalAmount: d?.total_amount_tl?.value?.toString?.() ?? "",
  };
}

export function confColor(c?: number) {
  if (c === undefined || c === null) return "";
  if (c >= 0.85) return "ring-emerald-400";
  if (c >= 0.7) return "ring-amber-400";
  return "ring-rose-400";
}

export type ExtractField<T = string | number | null> = {
  value?: T | null;
  confidence?: number;
};
export type ExtractResponseData = {
  provider?: { name?: string | null; confidence?: number };
  period?: { from?: string | null; to?: string | null; confidence?: number };
  customer?: { name?: string | null; address?: string | null };
  installation_no?: ExtractField<string>;
  meter_no?: ExtractField<string>;
  consumption_kwh?: ExtractField<number>;
  unit_price_tl_per_kwh?: ExtractField<number>;
  total_amount_tl?: ExtractField<number>;
};
export type ExtractAPIResponse = { ok: boolean; data: ExtractResponseData };

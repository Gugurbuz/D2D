// supabase/functions/gpt-summary/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/std@0.177.0/dotenv/load.ts";     // OPENAI_API_KEY, ALLOWED_ORIGIN

/* ---------- CORS ---------- */
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN");
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ---------- Hedef Şema ---------- */
const TARGET_SCHEMA = {
  companyName: "",
  customer: { name: "", address: "" },
  supplyDetails: { installationNumber: "" },
  meterReadings: { consumption: { total_kWh: "" } },
  charges: { energyLow: { unitPrice: "" } },
} as const;

const SCHEMA_PRETTY = JSON.stringify(TARGET_SCHEMA, null, 2);

/* ---------- Yardımcı ---------- */
function extractionPrompt(text: string) {
  return `
You are an expert data-extraction API.

### Task
Extract the information from the Turkish electricity bill below **into a JSON object that EXACTLY matches THIS template** (no extra keys, same hierarchy, keep empty string "" if not found):

${SCHEMA_PRETTY}

### Rules
* Values may be strings or numbers – convert everything to string except unitPrice and total_kWh, which can be number.
* The response **must be ONLY valid JSON**, no markdown, no backticks.

### Invoice Text
${"```"}
${text}
${"```"}
`.trim();
}

function summaryPrompt(invoiceData: Record<string, unknown>) {
  return `
Aşağıdaki yapılandırılmış fatura verisine göre tek paragraflık, samimi bir özet yaz:
• Fatura kimin tarafından kime düzenlenmiş?
• Vergiler hariç 1 kWh birim enerji bedeli ne kadar?

Veri:
${JSON.stringify(invoiceData, null, 2)}
`.trim();
}

/* ---------- Sunucu ---------- */
serve(async (req) => {
  /* --- CORS preflight --- */
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    /* --- Giriş doğrulama --- */
    const { rawText } = await req.json();
    if (!rawText || typeof rawText !== "string" || rawText.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Geçerli 'rawText' sağlanmadı." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY tanımlı değil.");

    /* -------- AŞAMA 1: Yapısal çıkarım -------- */
    const extractRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0,
        messages: [
          { role: "system", content: extractionPrompt(rawText) },
        ],
      }),
    });
    if (!extractRes.ok) throw new Error("Aşama 1: OpenAI yanıtı başarısız.");
    const extractJson = await extractRes.json();
    const invoiceData = JSON.parse(extractJson.choices[0].message.content);

    /* -------- AŞAMA 2: Özet -------- */
    const summaryRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: "Sen, yapılandırılmış fatura verilerini yorumlayan Türkçe bir asistansın.",
          },
          { role: "user", content: summaryPrompt(invoiceData) },
        ],
      }),
    });
    if (!summaryRes.ok) throw new Error("Aşama 2: Özet oluşturulamadı.");
    const summaryJson = await summaryRes.json();
    const summary = summaryJson.choices[0].message.content.trim();

    /* -------- AŞAMA 3: Yanıt -------- */
    return new Response(
      JSON.stringify({ invoiceData, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("Fonksiyon Hatası:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

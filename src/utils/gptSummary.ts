// src/utils/gptSummary.ts

export async function generateInvoiceSummary(data) {
  const response = await fetch("https://YOUR_PROJECT_ID.functions.supabase.co/gpt-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  return result.summary || "GPT özeti alınamadı.";
}

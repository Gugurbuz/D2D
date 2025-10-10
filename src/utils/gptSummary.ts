// src/utils/gptSummary.ts

export async function generateInvoiceSummary(rawText: string) {
  // Fonksiyon artık yapılandırılmış veri değil, ham metin gönderiyor.
  const response = await fetch("https://ehqotgebdywdmwxbwbjl.supabase.co/functions/v1/gpt-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText }), // Sadece ham metni gönderiyoruz
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Yapay zeka işleme sırasında bir hata oluştu.");
  }

  // Backend'den gelen { invoiceData, summary } objesinin tamamını döndürüyoruz.
  return result;
}


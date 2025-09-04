// src/utils/gptSummary.ts

export async function generateInvoiceSummary(data) {
  // DOĞRU URL AŞAĞIDAKİ GİBİ OLMALI:
  const response = await fetch("https://ehqotgebdywdmwxbwbjl.supabase.co/functions/v1/gpt-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  // Eğer istek başarısız olursa (örn: 500 sunucu hatası), hatayı yakala
  if (!response.ok) {
    // result.error, Supabase fonksiyonundaki catch bloğundan gelir.
    throw new Error(result.error || "Fonksiyondan bilinmeyen bir hata döndü.");
  }

  return result.summary || "GPT özeti alınamadı.";
}

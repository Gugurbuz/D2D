export async function generateInvoiceSummary(rawText: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/gpt-summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ rawText }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Yapay zeka işleme sırasında bir hata oluştu.");
  }

  return result;
}


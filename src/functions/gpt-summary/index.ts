// functions/gpt-summary/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.21.1/mod.ts";

// OpenAI Projeye özel key burada güvenli olur
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

serve(async (req) => {
  const body = await req.json();

  const prompt = `
Aşağıdaki fatura bilgilerini sade ve resmi dille Türkçe özetle:

- Müşteri: ${body.customerName || "Bilinmiyor"}
- Firma: ${body.companyName || "Bilinmiyor"}
- Tesisat No: ${body.installationNumber || "Yok"}
- Adres: ${body.address || "Yok"}
- Tüketim: ${body.consumption || "Yok"} kWh
- Birim Fiyat: ${body.unitPrice || "Yok"} TL/kWh
`;

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const summary = chatCompletion.choices[0]?.message?.content;
  return new Response(JSON.stringify({ summary }), {
    headers: { "Content-Type": "application/json" },
  });
});

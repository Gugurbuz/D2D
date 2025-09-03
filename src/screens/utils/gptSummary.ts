// src/screens/utils/gptSummary.ts
import OpenAI from "openai";
import { InvoiceData } from "../InvoiceOcrPage";

const openai = new OpenAI({
  apiKey: "sk-proj-...", // API KEY buraya
  dangerouslyAllowBrowser: true,
});

export async function generateInvoiceSummary(data: InvoiceData): Promise<string> {
  const prompt = `
Aşağıdaki fatura bilgilerini kısa, resmi ve kullanıcı dostu bir dille özetle:

- Müşteri: ${data.customerName || "Bilinmiyor"}
- Firma: ${data.companyName || "Bilinmiyor"}
- Tesisat No: ${data.installationNumber || "Yok"}
- Adres: ${data.address || "Yok"}
- Tüketim: ${data.consumption || "Yok"} kWh
- Birim Fiyat: ${data.unitPrice || "Yok"} TL/kWh

Türkçe, sade ve resmi şekilde açıkla.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content?.trim() || "GPT özeti alınamadı.";
}

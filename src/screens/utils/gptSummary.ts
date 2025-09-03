// server/routes/gpt-summary.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Buraya .env'den çekilecek
});

router.post("/", async (req, res) => {
  const { customerName, companyName, installationNumber, address, consumption, unitPrice } = req.body;

  const prompt = `
Aşağıdaki fatura bilgilerini kısa ve resmi dille Türkçe olarak özetle:

- Müşteri: ${customerName}
- Firma: ${companyName}
- Tesisat No: ${installationNumber}
- Adres: ${address}
- Tüketim: ${consumption} kWh
- Birim Fiyat: ${unitPrice} TL/kWh
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    return res.json({ summary: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "GPT çağrısı başarısız oldu." });
  }
});

export default router;

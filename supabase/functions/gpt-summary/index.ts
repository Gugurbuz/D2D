import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InvoiceRequest {
  rawText: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { rawText }: InvoiceRequest = await req.json();

    if (!rawText || typeof rawText !== "string") {
      return new Response(
        JSON.stringify({ error: "rawText is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `You are an expert at analyzing Turkish electricity invoices (fatura). Extract structured data from the OCR text provided.

Return a JSON object with this structure:
{
  "invoiceData": {
    "companyName": "supplier name",
    "customer": {
      "name": "customer name",
      "address": "customer address"
    },
    "supplyDetails": {
      "installationNumber": "installation/tesisat number"
    },
    "tariff": "tariff type (e.g., Mesken, Ticarethane, Sanayi)",
    "annualConsumption": "yearly consumption in kWh",
    "avgConsumption": "average monthly consumption",
    "meterReadings": {
      "consumption": {
        "total_kWh": "total kWh consumed"
      }
    },
    "charges": {
      "energyLow": {
        "unitPrice": "unit price for energy"
      }
    }
  },
  "allDetails": {
    "parties": {
      "supplierName": "",
      "supplierTaxNo": "",
      "customerName": "",
      "customerAddress": ""
    },
    "identifiers": {
      "invoiceNumber": "",
      "billNumber": "",
      "subscriberNumber": "",
      "installationNumber": "",
      "meterNumber": ""
    },
    "period": {
      "startDate": "",
      "endDate": "",
      "issueDate": "",
      "dueDate": "",
      "days": ""
    },
    "readings": {
      "prevReading": "",
      "currReading": "",
      "multiplier": "",
      "active_kWh": "",
      "reactive_kvarh": "",
      "inductive_kvarh": "",
      "capacitive_kvarh": ""
    },
    "pricing": {
      "currency": "TRY",
      "tiers": [],
      "energySubtotalExclTax": "",
      "distributionExclTax": "",
      "otherFeesExclTax": "",
      "taxes": [],
      "totalExclTax": "",
      "totalInclTax": ""
    },
    "payment": {
      "method": "",
      "accountNumber": ""
    },
    "notes": ""
  },
  "summary": "A brief human-readable summary in Turkish"
}

Extract as much information as possible from the text. Leave fields as empty strings if not found.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: rawText },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to process invoice with AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing invoice:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

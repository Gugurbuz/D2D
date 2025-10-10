# GPT Summary Edge Function

This edge function processes OCR text from Turkish electricity invoices and extracts structured data using OpenAI's GPT model.

## Setup

### 1. Add OpenAI API Key as Secret

You need to add your OpenAI API key as a secret in Supabase:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

Or set it in your Supabase Dashboard:
1. Go to your project dashboard
2. Navigate to Settings → Edge Functions
3. Add a new secret: `OPENAI_API_KEY` with your OpenAI API key

### 2. Deploy the Function

The function can be deployed using the Supabase CLI or through the dashboard.

## Usage

The function accepts POST requests with the following payload:

```json
{
  "rawText": "OCR text from invoice..."
}
```

And returns:

```json
{
  "invoiceData": {
    "companyName": "...",
    "customer": {...},
    "supplyDetails": {...},
    "tariff": "...",
    "annualConsumption": "...",
    "avgConsumption": "...",
    "meterReadings": {...},
    "charges": {...}
  },
  "allDetails": {
    "parties": {...},
    "identifiers": {...},
    "period": {...},
    "readings": {...},
    "pricing": {...},
    "payment": {...},
    "notes": ""
  },
  "summary": "Brief summary in Turkish"
}
```

## CORS

The function includes proper CORS headers to allow requests from your frontend application.

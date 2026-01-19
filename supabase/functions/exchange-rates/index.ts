import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExchangeRates {
  base: string;
  rates: {
    USD: number;
    EUR: number;
    GBP: number;
  };
  lastUpdated: string;
}

// Fallback rates in case API fails
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching exchange rates...");

    // Try to fetch from ExchangeRate-API (free tier, no key required for USD base)
    let rates = { ...FALLBACK_RATES };
    let lastUpdated = new Date().toISOString();

    try {
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD',
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        rates = {
          USD: 1,
          EUR: data.rates?.EUR || FALLBACK_RATES.EUR,
          GBP: data.rates?.GBP || FALLBACK_RATES.GBP,
        };
        lastUpdated = data.date ? new Date(data.date).toISOString() : new Date().toISOString();
        console.log("Successfully fetched rates from API:", rates);
      } else {
        console.log("API returned non-OK status, using fallback rates");
      }
    } catch (fetchError) {
      console.log("Failed to fetch from API, using fallback rates:", fetchError);
    }

    const result: ExchangeRates = {
      base: "USD",
      rates,
      lastUpdated,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in exchange-rates function:", error);
    
    // Return fallback rates on error
    return new Response(
      JSON.stringify({
        base: "USD",
        rates: FALLBACK_RATES,
        lastUpdated: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});

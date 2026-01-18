import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  sparkline?: number[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cmcApiKey = Deno.env.get("CMC_API_KEY");
    
    if (!cmcApiKey) {
      console.error("CMC_API_KEY not configured");
      // Return demo data if no API key
      return new Response(JSON.stringify(getDemoData()), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const symbols = url.searchParams.get("symbols") || "BTC,ETH";
    
    console.log(`Fetching crypto data for: ${symbols}`);

    // Try CoinMarketCap first
    try {
      const cmcData = await fetchFromCMC(cmcApiKey, symbols);
      console.log("Successfully fetched from CoinMarketCap");
      return new Response(JSON.stringify(cmcData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (cmcError) {
      console.error("CoinMarketCap error, falling back to CoinGecko:", cmcError);
      
      // Fallback to CoinGecko
      try {
        const geckoData = await fetchFromCoinGecko(symbols);
        console.log("Successfully fetched from CoinGecko");
        return new Response(JSON.stringify(geckoData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (geckoError) {
        console.error("CoinGecko error:", geckoError);
        // Return demo data as last resort
        return new Response(JSON.stringify(getDemoData()), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  } catch (error) {
    console.error("Error in crypto-data function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchFromCMC(apiKey: string, symbols: string): Promise<CryptoData[]> {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols}`,
    {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`CMC API error: ${response.status}`);
  }

  const data = await response.json();
  const result: CryptoData[] = [];

  for (const symbol of symbols.split(",")) {
    const coin = data.data[symbol.toUpperCase()];
    if (coin) {
      result.push({
        symbol: coin.symbol,
        name: coin.name,
        price: coin.quote.USD.price,
        change24h: coin.quote.USD.percent_change_24h,
        marketCap: coin.quote.USD.market_cap,
        volume24h: coin.quote.USD.volume_24h,
      });
    }
  }

  return result;
}

async function fetchFromCoinGecko(symbols: string): Promise<CryptoData[]> {
  // Map common symbols to CoinGecko IDs
  const symbolToId: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tether",
    BNB: "binancecoin",
    XRP: "ripple",
    SOL: "solana",
    DOGE: "dogecoin",
    ADA: "cardano",
  };

  const ids = symbols
    .split(",")
    .map((s) => symbolToId[s.toUpperCase()] || s.toLowerCase())
    .join(",");

  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  
  return data.map((coin: any) => ({
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: coin.current_price,
    change24h: coin.price_change_percentage_24h,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    sparkline: coin.sparkline_in_7d?.price,
  }));
}

function getDemoData(): CryptoData[] {
  // Generate realistic demo sparkline data
  const generateSparkline = (basePrice: number): number[] => {
    const data: number[] = [];
    let price = basePrice;
    for (let i = 0; i < 168; i++) {
      price += (Math.random() - 0.5) * basePrice * 0.02;
      data.push(price);
    }
    return data;
  };

  return [
    {
      symbol: "BTC",
      name: "Bitcoin",
      price: 104250.45,
      change24h: 2.34,
      marketCap: 2050000000000,
      volume24h: 45000000000,
      sparkline: generateSparkline(104250),
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      price: 3320.78,
      change24h: 1.87,
      marketCap: 399000000000,
      volume24h: 18500000000,
      sparkline: generateSparkline(3320),
    },
  ];
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CryptoData {
  symbol: string;
  price: number;
  change24h: number;
}

export const useBTCPrice = () => {
  const [btcPrice, setBtcPrice] = useState<number>(104250); // Default fallback
  const [ethPrice, setEthPrice] = useState<number>(3320);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("crypto-data", {
        body: {},
      });

      if (!error && data && Array.isArray(data)) {
        const btc = data.find((c: CryptoData) => c.symbol === "BTC");
        const eth = data.find((c: CryptoData) => c.symbol === "ETH");
        
        if (btc?.price) setBtcPrice(btc.price);
        if (eth?.price) setEthPrice(eth.price);
      }
    } catch (err) {
      console.error("Error fetching BTC price:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBTC = (amount: number) => `${amount.toFixed(4)} BTC`;
  
  const formatUSD = (btc: number) => {
    const usdValue = btc * btcPrice;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(usdValue);
  };

  const btcToUSD = (btc: number) => btc * btcPrice;
  const usdToBTC = (usd: number) => usd / btcPrice;

  return {
    btcPrice,
    ethPrice,
    isLoading,
    formatBTC,
    formatUSD,
    btcToUSD,
    usdToBTC,
    refreshPrices: fetchPrices,
  };
};

export default useBTCPrice;

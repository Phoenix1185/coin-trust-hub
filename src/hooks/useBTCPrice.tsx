import { useState, useEffect, useCallback } from "react";
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("crypto-data", {
        body: {},
      });

      console.log("Crypto data response:", data, error);

      if (!error && data && Array.isArray(data)) {
        const btc = data.find((c: CryptoData) => c.symbol === "BTC");
        const eth = data.find((c: CryptoData) => c.symbol === "ETH");
        
        if (btc?.price && btc.price > 0) {
          setBtcPrice(btc.price);
          console.log("BTC price updated:", btc.price);
        }
        if (eth?.price && eth.price > 0) {
          setEthPrice(eth.price);
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching BTC price:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Format BTC amount with 4-8 decimal places depending on size
  const formatBTC = useCallback((btcAmount: number) => {
    if (btcAmount >= 1) {
      return `${btcAmount.toFixed(4)} BTC`;
    } else if (btcAmount >= 0.0001) {
      return `${btcAmount.toFixed(6)} BTC`;
    } else {
      return `${btcAmount.toFixed(8)} BTC`;
    }
  }, []);
  
  // Convert BTC to USD and format as currency
  const formatUSD = useCallback((btcAmount: number) => {
    const usdValue = btcAmount * btcPrice;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdValue);
  }, [btcPrice]);

  // Get raw USD value from BTC
  const btcToUSD = useCallback((btcAmount: number) => btcAmount * btcPrice, [btcPrice]);
  
  // Get BTC amount from USD
  const usdToBTC = useCallback((usdAmount: number) => usdAmount / btcPrice, [btcPrice]);

  // Format raw USD number
  const formatRawUSD = useCallback((usdAmount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdAmount);
  }, []);

  return {
    btcPrice,
    ethPrice,
    isLoading,
    lastUpdated,
    formatBTC,
    formatUSD,
    formatRawUSD,
    btcToUSD,
    usdToBTC,
    refreshPrices: fetchPrices,
  };
};

export default useBTCPrice;

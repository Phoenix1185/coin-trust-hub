import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CryptoData {
  symbol: string;
  price: number;
  change24h: number;
}

interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
}

type CurrencyCode = "USD" | "EUR" | "GBP";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

export const useBTCPrice = () => {
  const [btcPrice, setBtcPrice] = useState<number>(104250); // Default fallback
  const [ethPrice, setEthPrice] = useState<number>(3320);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
  });
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

  const fetchExchangeRates = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("exchange-rates", {
        body: {},
      });

      if (!error && data?.rates) {
        setExchangeRates(data.rates);
        console.log("Exchange rates updated:", data.rates);
      }
    } catch (err) {
      console.error("Error fetching exchange rates:", err);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    fetchExchangeRates();
    
    const priceInterval = setInterval(fetchPrices, 60000); // Refresh every minute
    const ratesInterval = setInterval(fetchExchangeRates, 1800000); // Refresh every 30 min
    
    return () => {
      clearInterval(priceInterval);
      clearInterval(ratesInterval);
    };
  }, [fetchPrices, fetchExchangeRates]);

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

  // Convert USD to another currency
  const convertFromUSD = useCallback((usdAmount: number, currency: CurrencyCode): number => {
    return usdAmount * exchangeRates[currency];
  }, [exchangeRates]);

  // Format a fiat amount in a specific currency
  const formatFiatAmount = useCallback((usdAmount: number, currency: CurrencyCode = "USD"): string => {
    const convertedAmount = convertFromUSD(usdAmount, currency);
    const symbol = CURRENCY_SYMBOLS[currency];
    const locale = CURRENCY_LOCALES[currency];
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount);
  }, [convertFromUSD]);

  // Format BTC as user's preferred currency with BTC shown below
  const formatCurrency = useCallback((btcAmount: number, currency: CurrencyCode = "USD"): string => {
    const usdValue = btcAmount * btcPrice;
    return formatFiatAmount(usdValue, currency);
  }, [btcPrice, formatFiatAmount]);

  // Format display with both fiat and BTC
  const formatWithBTC = useCallback((btcAmount: number, currency: CurrencyCode = "USD"): { fiat: string; btc: string } => {
    return {
      fiat: formatCurrency(btcAmount, currency),
      btc: formatBTC(btcAmount),
    };
  }, [formatCurrency, formatBTC]);

  // Get currency symbol
  const getCurrencySymbol = useCallback((currency: CurrencyCode): string => {
    return CURRENCY_SYMBOLS[currency];
  }, []);

  return {
    btcPrice,
    ethPrice,
    exchangeRates,
    isLoading,
    lastUpdated,
    formatBTC,
    formatUSD,
    formatRawUSD,
    btcToUSD,
    usdToBTC,
    formatFiatAmount,
    formatCurrency,
    formatWithBTC,
    convertFromUSD,
    getCurrencySymbol,
    refreshPrices: fetchPrices,
    refreshExchangeRates: fetchExchangeRates,
  };
};

export type { CurrencyCode };
export default useBTCPrice;

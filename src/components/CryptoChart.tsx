import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  sparkline?: number[];
}

interface CryptoChartProps {
  className?: string;
  showDetails?: boolean;
}

export const CryptoChart = ({ className, showDetails = true }: CryptoChartProps) => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTC");

  useEffect(() => {
    fetchCryptoData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchCryptoData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("crypto-data", {
        body: {},
      });

      if (error) {
        console.error("Error fetching crypto data:", error);
        // Use demo data on error
        setCryptoData(getDemoData());
      } else {
        setCryptoData(data || getDemoData());
      }
    } catch (err) {
      console.error("Error:", err);
      setCryptoData(getDemoData());
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoData = (): CryptoData[] => {
    const generateSparkline = (basePrice: number): number[] => {
      const data: number[] = [];
      let price = basePrice * 0.95;
      for (let i = 0; i < 168; i++) {
        price += (Math.random() - 0.48) * basePrice * 0.015;
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
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const selectedData = cryptoData.find((c) => c.symbol === selectedCrypto) || cryptoData[0];
  
  const chartData = selectedData?.sparkline?.map((price, index) => ({
    time: index,
    price,
  })) || [];

  if (isLoading) {
    return (
      <div className={cn("bg-card border border-border rounded-xl p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const isPositive = selectedData?.change24h >= 0;

  return (
    <div className={cn("bg-card border border-border rounded-xl p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {cryptoData.map((crypto) => (
            <button
              key={crypto.symbol}
              onClick={() => setSelectedCrypto(crypto.symbol)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedCrypto === crypto.symbol
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {crypto.symbol}
            </button>
          ))}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{formatPrice(selectedData?.price || 0)}</div>
          <div className={cn(
            "flex items-center justify-end gap-1 text-sm",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? "+" : ""}{selectedData?.change24h?.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={["dataMin - 1000", "dataMax + 1000"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(240, 10%, 8%)",
                border: "1px solid hsl(240, 10%, 18%)",
                borderRadius: "8px",
                color: "hsl(0, 0%, 95%)",
              }}
              formatter={(value: number) => [formatPrice(value), "Price"]}
              labelFormatter={() => ""}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(43, 96%, 56%)"
              strokeWidth={2}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      {showDetails && selectedData && (
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
          <div>
            <div className="text-sm text-muted-foreground">Market Cap</div>
            <div className="font-semibold">{formatMarketCap(selectedData.marketCap)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">24h Volume</div>
            <div className="font-semibold">{formatMarketCap(selectedData.volume24h)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoChart;

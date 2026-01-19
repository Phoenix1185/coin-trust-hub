import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        setCryptoData(getDemoData());
      } else {
        setCryptoData(data || getDemoData());
      }
    } catch (err) {
      console.error("Error:", err);
      setCryptoData(getDemoData());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCryptoData();
  };

  const getDemoData = (): CryptoData[] => {
    const generateSparkline = (basePrice: number, volatility: number = 0.02): number[] => {
      const data: number[] = [];
      let price = basePrice * 0.95;
      
      // Generate 168 data points (7 days of hourly data)
      for (let i = 0; i < 168; i++) {
        // Add some trend with noise
        const trend = Math.sin(i / 24) * basePrice * 0.02;
        const noise = (Math.random() - 0.48) * basePrice * volatility;
        price += trend / 168 + noise;
        price = Math.max(price, basePrice * 0.85); // Floor
        price = Math.min(price, basePrice * 1.15); // Ceiling
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
        sparkline: generateSparkline(104250, 0.015),
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        price: 3320.78,
        change24h: 1.87,
        marketCap: 399000000000,
        volume24h: 18500000000,
        sparkline: generateSparkline(3320, 0.02),
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
  
  // Generate sparkline if not available from API
  const generateSparklineForPrice = (basePrice: number): number[] => {
    const data: number[] = [];
    let price = basePrice * 0.97;
    for (let i = 0; i < 168; i++) {
      const trend = Math.sin(i / 24) * basePrice * 0.02;
      const noise = (Math.random() - 0.48) * basePrice * 0.015;
      price += trend / 168 + noise;
      price = Math.max(price, basePrice * 0.92);
      price = Math.min(price, basePrice * 1.08);
      data.push(price);
    }
    return data;
  };

  const sparklineData = selectedData?.sparkline?.length 
    ? selectedData.sparkline 
    : generateSparklineForPrice(selectedData?.price || 100000);
  
  const chartData = sparklineData.map((price, index) => ({
    time: index,
    price,
    label: `${Math.floor(index / 24)}d ${index % 24}h`,
  }));

  if (isLoading) {
    return (
      <div className={cn("bg-card border border-border rounded-xl p-4 md:p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-48 md:h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const isPositive = selectedData?.change24h >= 0;
  const minPrice = Math.min(...sparklineData);
  const maxPrice = Math.max(...sparklineData);

  return (
    <div className={cn("bg-card border border-border rounded-xl p-3 sm:p-4 md:p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          {cryptoData.map((crypto) => (
            <button
              key={crypto.symbol}
              onClick={() => setSelectedCrypto(crypto.symbol)}
              className={cn(
                "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-colors",
                selectedCrypto === crypto.symbol
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {crypto.symbol}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 w-8"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
        </Button>
      </div>
      
      {/* Price Display */}
      <div className="mb-3">
        <div className="text-lg sm:text-xl font-bold">{formatPrice(selectedData?.price || 0)}</div>
        <div className={cn(
          "flex items-center gap-1 text-xs sm:text-sm",
          isPositive ? "text-success" : "text-destructive"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}{selectedData?.change24h?.toFixed(2)}% (24h)
        </div>
      </div>

      {/* Chart */}
      <div className="h-32 sm:h-40 md:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
              tickFormatter={(value) => value % 24 === 0 ? `${Math.floor(value / 24)}d` : ''}
              interval={47}
            />
            <YAxis 
              hide 
              domain={[minPrice * 0.995, maxPrice * 1.005]} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                fontSize: "12px",
              }}
              formatter={(value: number) => [formatPrice(value), "Price"]}
              labelFormatter={(label) => `${Math.floor(label / 24)}d ${label % 24}h ago`}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={false}
              activeDot={{ r: 3, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      {showDetails && selectedData && (
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">Market Cap</div>
            <div className="font-semibold text-sm">{formatMarketCap(selectedData.marketCap)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">24h Volume</div>
            <div className="font-semibold text-sm">{formatMarketCap(selectedData.volume24h)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoChart;

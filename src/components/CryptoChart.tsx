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
  
  const chartData = selectedData?.sparkline?.map((price, index) => ({
    time: index,
    price,
    // Add formatted time for tooltip
    label: `${Math.floor(index / 24)}d ${index % 24}h`,
  })) || [];

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
  const minPrice = Math.min(...(selectedData?.sparkline || [0]));
  const maxPrice = Math.max(...(selectedData?.sparkline || [0]));

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 md:p-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="flex items-center gap-2 md:gap-4">
          {cryptoData.map((crypto) => (
            <button
              key={crypto.symbol}
              onClick={() => setSelectedCrypto(crypto.symbol)}
              className={cn(
                "px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors",
                selectedCrypto === crypto.symbol
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {crypto.symbol}
            </button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-auto md:ml-0"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        <div className="text-left md:text-right">
          <div className="text-xl md:text-2xl font-bold">{formatPrice(selectedData?.price || 0)}</div>
          <div className={cn(
            "flex items-center gap-1 text-sm",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? "+" : ""}{selectedData?.change24h?.toFixed(2)}% (24h)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(value) => value % 24 === 0 ? `${Math.floor(value / 24)}d` : ''}
              interval={23}
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
              }}
              formatter={(value: number) => [formatPrice(value), "Price"]}
              labelFormatter={(label) => `${Math.floor(label / 24)} days, ${label % 24} hours ago`}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      {showDetails && selectedData && (
        <div className="grid grid-cols-2 gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
          <div>
            <div className="text-xs md:text-sm text-muted-foreground">Market Cap</div>
            <div className="font-semibold text-sm md:text-base">{formatMarketCap(selectedData.marketCap)}</div>
          </div>
          <div>
            <div className="text-xs md:text-sm text-muted-foreground">24h Volume</div>
            <div className="font-semibold text-sm md:text-base">{formatMarketCap(selectedData.volume24h)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoChart;

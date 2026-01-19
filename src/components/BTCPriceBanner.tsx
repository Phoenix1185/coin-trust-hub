import { useBTCPrice } from "@/hooks/useBTCPrice";
import { TrendingUp, TrendingDown, Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";

interface BTCPriceBannerProps {
  className?: string;
}

export const BTCPriceBanner = ({ className }: BTCPriceBannerProps) => {
  const { btcPrice, ethPrice, isLoading } = useBTCPrice();

  // Simulated 24h change (would come from API in production)
  const btcChange = 2.34;
  const ethChange = 1.87;

  if (isLoading) {
    return (
      <div className={cn("bg-card/80 backdrop-blur-sm border-b border-border py-2 px-4", className)}>
        <div className="flex items-center justify-center gap-6 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card/80 backdrop-blur-sm border-b border-border py-2 px-3 sm:px-4", className)}>
      <div className="flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
        {/* BTC Price */}
        <div className="flex items-center gap-2">
          <Bitcoin className="w-4 h-4 text-primary" />
          <span className="font-medium">BTC</span>
          <span className="font-bold">
            ${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className={cn(
            "flex items-center gap-0.5",
            btcChange >= 0 ? "text-success" : "text-destructive"
          )}>
            {btcChange >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">{btcChange >= 0 ? "+" : ""}{btcChange.toFixed(2)}%</span>
          </span>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* ETH Price */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">Ξ</span>
          </div>
          <span className="font-medium">ETH</span>
          <span className="font-bold">
            ${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className={cn(
            "flex items-center gap-0.5",
            ethChange >= 0 ? "text-success" : "text-destructive"
          )}>
            {ethChange >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">{ethChange >= 0 ? "+" : ""}{ethChange.toFixed(2)}%</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default BTCPriceBanner;
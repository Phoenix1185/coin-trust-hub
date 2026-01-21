import { useBTCPrice } from "@/hooks/useBTCPrice";
import { useBalance } from "@/hooks/useBalance";
import { Wallet } from "lucide-react";

export const MobileBalanceWidget = () => {
  const { formatBTC, formatUSD } = useBTCPrice();
  const { balance } = useBalance();

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 py-2 px-4 sm:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/20 rounded-full">
            <Wallet className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Balance</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-primary">{formatBTC(balance)}</div>
          <div className="text-[10px] text-muted-foreground">{formatUSD(balance)}</div>
        </div>
      </div>
    </div>
  );
};

export default MobileBalanceWidget;
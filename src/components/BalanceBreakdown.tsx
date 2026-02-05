import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Calculator, 
  ChevronDown, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Lock, 
  CheckCircle2,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceComponents {
  totalDeposits: number;
  totalWithdrawals: number;
  lockedCapital: number;
  completedProfit: number;
  availableBalance: number;
}

export const BalanceBreakdown = () => {
  const { user, profile } = useAuth();
  const { formatBTC, btcToUSD, formatFiatAmount } = useBTCPrice();
  const currency = profile?.preferred_currency || "USD";
  const [components, setComponents] = useState<BalanceComponents | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBalanceComponents();
    }
  }, [user]);

  const fetchBalanceComponents = async () => {
    if (!user) return;

    try {
      const [deposits, withdrawals, investments] = await Promise.all([
        supabase
          .from("deposits")
          .select("amount, status")
          .eq("user_id", user.id)
          .eq("status", "approved"),
        supabase
          .from("withdrawals")
          .select("amount, status")
          .eq("user_id", user.id)
          .eq("status", "approved"),
        supabase
          .from("user_investments")
          .select("amount, status, accrued_profit")
          .eq("user_id", user.id),
      ]);

      const totalDeposits = deposits.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalWithdrawals = withdrawals.data?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      
      const activeInvestments = investments.data?.filter(i => i.status === "active" || i.status === "pending") || [];
      const completedInvestments = investments.data?.filter(i => i.status === "completed") || [];
      
      const lockedCapital = activeInvestments.reduce((sum, i) => sum + Number(i.amount), 0);
      const completedProfit = completedInvestments.reduce((sum, i) => sum + Number(i.accrued_profit || 0), 0);

      // CORRECT Formula: deposits - withdrawals - locked + profit ONLY
      // The principal is NOT added back because it was already in deposits!
      // When investment completes, principal simply stops being "locked" (no longer subtracted)
      const availableBalance = totalDeposits - totalWithdrawals - lockedCapital + completedProfit;

      setComponents({
        totalDeposits,
        totalWithdrawals,
        lockedCapital,
        completedProfit,
        availableBalance: Math.max(0, availableBalance),
      });
    } catch (error) {
      console.error("Error fetching balance components:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!components) return null;

  const breakdownItems = [
    {
      label: "Total Deposits",
      value: components.totalDeposits,
      icon: ArrowDownCircle,
      color: "text-success",
      prefix: "+",
    },
    {
      label: "Total Withdrawals",
      value: components.totalWithdrawals,
      icon: ArrowUpCircle,
      color: "text-destructive",
      prefix: "-",
    },
    {
      label: "Locked in Active Plans",
      value: components.lockedCapital,
      icon: Lock,
      color: "text-warning",
      prefix: "-",
    },
    {
      label: "Earned Profit (Completed)",
      value: components.completedProfit,
      icon: CheckCircle2,
      color: "text-success",
      prefix: "+",
    },
  ];

  return (
    <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Balance Breakdown
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              How your available balance is calculated:
            </p>

            {breakdownItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <item.icon className={cn("w-4 h-4", item.color)} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className={cn("font-medium text-sm", item.color)}>
                    {item.prefix}{formatFiatAmount(btcToUSD(item.value), currency)}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {item.prefix}{formatBTC(item.value)}
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-3 mt-3 border-t-2 border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Available Balance</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-primary">
                    {formatFiatAmount(btcToUSD(components.availableBalance), currency)}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {formatBTC(components.availableBalance)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2 bg-muted/30 rounded p-2">
              Formula: Deposits − Withdrawals − Locked Capital + Completed Profit
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default BalanceBreakdown;

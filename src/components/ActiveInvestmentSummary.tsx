import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, ChevronDown, Lock, Coins, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveInvestment {
  id: string;
  amount: number;
  accrued_profit: number | null;
  total_profit: number | null;
  settlement_count: number | null;
  activated_at: string | null;
  investment_plans: {
    name: string;
    duration_days: number;
    roi_percentage: number;
  } | null;
}

interface InvestmentSummary {
  totalCapital: number;
  totalAccruedProfit: number;
  totalExpectedProfit: number;
  investments: ActiveInvestment[];
}

export const ActiveInvestmentSummary = () => {
  const { user, profile } = useAuth();
  const { formatBTC, btcToUSD, formatFiatAmount } = useBTCPrice();
  const currency = profile?.preferred_currency || "USD";
  const [summary, setSummary] = useState<InvestmentSummary>({
    totalCapital: 0,
    totalAccruedProfit: 0,
    totalExpectedProfit: 0,
    investments: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActiveInvestments();
    }
  }, [user]);

  const fetchActiveInvestments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_investments")
        .select(`
          id,
          amount,
          accrued_profit,
          total_profit,
          settlement_count,
          activated_at,
          investment_plans (
            name,
            duration_days,
            roi_percentage
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      if (data && data.length > 0) {
        const investments = data.map((inv) => ({
          ...inv,
          investment_plans: Array.isArray(inv.investment_plans)
            ? inv.investment_plans[0]
            : inv.investment_plans,
        })) as ActiveInvestment[];

        const totalCapital = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const totalAccruedProfit = investments.reduce(
          (sum, inv) => sum + Number(inv.accrued_profit || 0),
          0
        );
        const totalExpectedProfit = investments.reduce(
          (sum, inv) => sum + Number(inv.total_profit || 0),
          0
        );

        setSummary({
          totalCapital,
          totalAccruedProfit,
          totalExpectedProfit,
          investments,
        });
      } else {
        setSummary({
          totalCapital: 0,
          totalAccruedProfit: 0,
          totalExpectedProfit: 0,
          investments: [],
        });
      }
    } catch (error) {
      console.error("Error fetching active investments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || summary.investments.length === 0) {
    return null;
  }

  const totalValue = summary.totalCapital + summary.totalAccruedProfit;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Active Investments
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <PiggyBank className="w-3 h-3" />
                  Capital
                </p>
                <p className="text-sm font-semibold">
                  {formatFiatAmount(btcToUSD(summary.totalCapital), currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  Profit
                </p>
                <p className="text-sm font-semibold text-success">
                  +{formatFiatAmount(btcToUSD(summary.totalAccruedProfit), currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3" />
                  Total
                </p>
                <p className="text-sm font-bold text-primary">
                  {formatFiatAmount(btcToUSD(totalValue), currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="border-t border-border pt-3 space-y-2">
              {summary.investments.map((inv) => {
                const plan = inv.investment_plans;
                const progress = plan
                  ? ((inv.settlement_count || 0) / plan.duration_days) * 100
                  : 0;
                const invTotal = Number(inv.amount) + Number(inv.accrued_profit || 0);

                return (
                  <div
                    key={inv.id}
                    className="p-3 bg-muted/30 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {plan?.name || "Investment"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Day {inv.settlement_count || 0}/{plan?.duration_days || 0}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Capital:</span>
                        <p className="font-medium">
                          {formatFiatAmount(btcToUSD(inv.amount), currency)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Accrued:</span>
                        <p className="font-medium text-success">
                          +{formatFiatAmount(btcToUSD(inv.accrued_profit || 0), currency)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-medium text-primary">
                          {formatFiatAmount(btcToUSD(invTotal), currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground text-center pt-2 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Profits are locked until plan completion
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ActiveInvestmentSummary;

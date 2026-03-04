import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useInvestmentProgress } from "@/hooks/useInvestmentProgress";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { Clock, Zap, CheckCircle, AlertCircle, Lock, Timer, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusLabel } from "@/lib/statusLabels";

interface InvestmentProgressCardProps {
  investment: {
    id: string;
    amount: number;
    status: string;
    start_date: string | null;
    end_date: string | null;
    expected_return: number | null;
    activated_at: string | null;
    last_settlement_at: string | null;
    settlement_count: number | null;
    accrued_profit: number | null;
    total_profit: number | null;
    investment_plans: {
      name: string;
      duration_days: number;
      roi_percentage: number;
    };
  };
  currency: "USD" | "EUR" | "GBP";
}

const InvestmentProgressCard = ({ investment, currency }: InvestmentProgressCardProps) => {
  const { formatBTC, btcToUSD, formatFiatAmount, getCurrencySymbol } = useBTCPrice();
  
  const progress = useInvestmentProgress({
    activatedAt: investment.activated_at,
    lastSettlementAt: investment.last_settlement_at,
    settlementCount: investment.settlement_count,
    accruedProfit: investment.accrued_profit,
    totalProfit: investment.total_profit,
    durationDays: investment.investment_plans.duration_days,
    amount: investment.amount,
    roiPercentage: investment.investment_plans.roi_percentage,
    status: investment.status,
    startDate: investment.start_date, // Fallback for legacy investments
  });

  const getStatusIcon = () => {
    switch (investment.status) {
      case "active":
        return <Zap className="w-4 h-4 text-success" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    const label = getStatusLabel(investment.status, "investment");
    switch (investment.status) {
      case "active":
        return <Badge variant="default" className="bg-success/20 text-success border-success/30">{label}</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">{label}</Badge>;
      case "pending":
        return <Badge variant="default" className="bg-warning/20 text-warning border-warning/30">{label}</Badge>;
      case "cancelled":
        return <Badge variant="default" className="bg-destructive/20 text-destructive border-destructive/30">{label}</Badge>;
      default:
        return <Badge>{label}</Badge>;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Pending";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // For pending investments, show simple card
  if (investment.status === "pending") {
    return (
      <Card className="bg-muted/30 border-warning/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">{investment.investment_plans.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFiatAmount(btcToUSD(investment.amount), currency)} invested
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-muted-foreground">
            Awaiting admin approval. You'll be notified when your investment is activated.
          </p>
        </CardContent>
      </Card>
    );
  }

  // For cancelled investments
  if (investment.status === "cancelled") {
    return (
      <Card className="bg-muted/30 border-destructive/20 opacity-75">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">{investment.investment_plans.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFiatAmount(btcToUSD(investment.amount), currency)}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardContent>
      </Card>
    );
  }

  // For active or completed investments - show full progress
  return (
    <Card className={cn(
      "bg-muted/30 transition-all",
      investment.status === "active" && "border-success/30 glow-gold-sm",
      investment.status === "completed" && "border-primary/30"
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{investment.investment_plans.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBTC(investment.amount)} • {investment.investment_plans.roi_percentage}% ROI
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Investment & Profit Summary */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-background/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Invested</p>
            <p className="font-semibold">{formatFiatAmount(btcToUSD(investment.amount), currency)}</p>
            <p className="text-xs text-muted-foreground">{formatBTC(investment.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total ROI</p>
            <p className="font-semibold text-success">
              +{formatFiatAmount(btcToUSD(progress.totalProfit), currency)}
            </p>
            <p className="text-xs text-muted-foreground">+{formatBTC(progress.totalProfit)}</p>
          </div>
        </div>

        {/* Accrued Profit Section */}
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm font-medium">Accrued Profit</span>
              {investment.status === "active" && (
                <div className="flex items-center gap-1 text-xs text-warning">
                  <Lock className="w-3 h-3" />
                  <span>Locked</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-success">
                +{formatFiatAmount(btcToUSD(progress.accruedProfit), currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                +{formatBTC(progress.accruedProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Settlement Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Settlement Progress</span>
            <span className="font-medium">
              {progress.settlementCount}/{progress.totalCycles} days
            </span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Daily: +{formatFiatAmount(btcToUSD(progress.dailyProfit), currency)}</span>
            <span>{progress.progressPercentage.toFixed(0)}% complete</span>
          </div>
        </div>

        {/* Timers */}
        {investment.status === "active" && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Next Settlement</p>
                <p className="text-sm font-mono font-medium">{progress.timeUntilNextSettlement}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Time Remaining</p>
              <p className="text-sm font-medium">{progress.timeUntilCompletion}</p>
            </div>
          </div>
        )}

        {/* Completed Summary */}
        {investment.status === "completed" && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Your Returns</p>
            <p className="text-xl font-bold text-primary">
              {formatFiatAmount(btcToUSD(investment.amount + progress.accruedProfit), currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBTC(investment.amount + progress.accruedProfit)} • Now available for withdrawal
            </p>
          </div>
        )}

        {/* Dates */}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>Started: {formatDate(progress.activatedAt)}</span>
          <span>
            {investment.status === "completed" ? "Completed" : "Ends"}: {formatDate(progress.endDate)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentProgressCard;

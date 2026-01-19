import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import InvestmentProgressCard from "@/components/InvestmentProgressCard";

interface InvestmentPlan {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  min_amount: number;
  max_amount: number;
  roi_percentage: number;
}

interface UserInvestment {
  id: string;
  plan_id: string;
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
}

const Investments = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatBTC, btcPrice, btcToUSD, formatFiatAmount, fiatToBTC, getCurrencySymbol } = useBTCPrice();
  const currency = (profile?.preferred_currency || "USD") as "USD" | "EUR" | "GBP";
  
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [balance, setBalance] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
      
      // Subscribe to real-time investment updates for settlement changes
      const channel = supabase
        .channel('investment-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_investments',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Refetch data when investments are updated (e.g., by settlement engine)
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch investment plans
    const { data: plansData } = await supabase
      .from("investment_plans")
      .select("*")
      .eq("is_active", true)
      .order("duration_days", { ascending: true });

    if (plansData) {
      setPlans(plansData.map(p => ({
        ...p,
        min_amount: Number(p.min_amount),
        max_amount: Number(p.max_amount),
        roi_percentage: Number(p.roi_percentage),
      })));
    }

    if (!user) return;

    // Fetch user investments with new settlement fields
    const { data: investmentsData } = await supabase
      .from("user_investments")
      .select(`
        *,
        investment_plans (
          name,
          duration_days,
          roi_percentage
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (investmentsData) {
      setUserInvestments(investmentsData.map(i => ({
        ...i,
        amount: Number(i.amount),
        expected_return: i.expected_return ? Number(i.expected_return) : null,
        accrued_profit: i.accrued_profit ? Number(i.accrued_profit) : null,
        total_profit: i.total_profit ? Number(i.total_profit) : null,
      })));
    }

    // Fetch balance
    const { data: deposits } = await supabase
      .from("deposits")
      .select("amount, status")
      .eq("user_id", user.id);

    const { data: withdrawals } = await supabase
      .from("withdrawals")
      .select("amount, status")
      .eq("user_id", user.id);

    const { data: investments } = await supabase
      .from("user_investments")
      .select("amount, status")
      .eq("user_id", user.id);

    const approvedDeposits = deposits?.filter(d => d.status === "approved") || [];
    const approvedWithdrawals = withdrawals?.filter(w => w.status === "approved") || [];
    const activeInvestments = investments?.filter(i => i.status === "pending" || i.status === "active") || [];

    const totalDeposited = approvedDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    const investedAmount = activeInvestments.reduce((sum, i) => sum + Number(i.amount), 0);

    setBalance(Math.max(0, totalDeposited - totalWithdrawn - investedAmount));
  };

  const handleSelectPlan = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setInvestAmount("");
    setIsDialogOpen(true);
  };

  const handleInvest = async () => {
    if (!user || !selectedPlan || !investAmount) {
      return;
    }

    const fiatAmount = parseFloat(investAmount);
    if (isNaN(fiatAmount) || fiatAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Convert fiat input to BTC for validation and storage
    const btcAmount = fiatToBTC(fiatAmount, currency);

    // Validate against plan-specific minimum (convert BTC min_amount to fiat)
    const minFiatAmount = btcToUSD(selectedPlan.min_amount);
    if (fiatAmount < minFiatAmount) {
      toast({
        title: "Amount Too Low",
        description: `Minimum investment for ${selectedPlan.name} is ${formatFiatAmount(minFiatAmount, currency)}`,
        variant: "destructive",
      });
      return;
    }

    if (btcAmount > selectedPlan.max_amount) {
      toast({
        title: "Amount Too High",
        description: `Maximum investment is ${formatFiatAmount(btcToUSD(selectedPlan.max_amount), currency)}`,
        variant: "destructive",
      });
      return;
    }

    if (btcAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this investment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const investBtcAmount = fiatToBTC(parseFloat(investAmount), currency);
    const expectedReturn = investBtcAmount * (1 + selectedPlan.roi_percentage / 100);

    const { error } = await supabase.from("user_investments").insert({
      user_id: user.id,
      plan_id: selectedPlan.id,
      amount: investBtcAmount,
      status: "pending",
      expected_return: expectedReturn,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create investment. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Investment Created",
        description: "Your investment is pending admin approval.",
      });
      setIsDialogOpen(false);
      setSelectedPlan(null);
      setInvestAmount("");
      fetchData();
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Investment Plans</h1>
            <p className="text-muted-foreground">Choose a plan that fits your goals</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-xl font-bold text-primary">{formatFiatAmount(btcToUSD(balance), currency)}</p>
            <p className="text-xs text-muted-foreground">{formatBTC(balance)}</p>
          </div>
        </div>

        {/* Investment Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden hover:border-primary/50 transition-colors cursor-pointer",
                plan.name === "VIP Plan" && "border-primary glow-gold-sm"
              )}
              onClick={() => handleSelectPlan(plan)}
            >
              {plan.name === "VIP Plan" && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-bold text-gradient-gold">{plan.roi_percentage}%</span>
                  <p className="text-sm text-muted-foreground">ROI</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{plan.duration_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min</span>
                    <span>{formatFiatAmount(btcToUSD(plan.min_amount), currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max</span>
                    <span>{formatFiatAmount(btcToUSD(plan.max_amount), currency)}</span>
                  </div>
                </div>
                <Button className="w-full">Invest Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Investments - Now using InvestmentProgressCard */}
        <Card>
          <CardHeader>
            <CardTitle>Your Investments</CardTitle>
            <p className="text-sm text-muted-foreground">Track your investment progress and daily profit settlements</p>
          </CardHeader>
          <CardContent>
            {userInvestments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No investments yet</p>
                <p className="text-sm">Choose a plan above to start investing!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userInvestments.map((investment) => (
                  <InvestmentProgressCard 
                    key={investment.id} 
                    investment={investment} 
                    currency={currency} 
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invest in {selectedPlan?.name}</DialogTitle>
              <DialogDescription>
                {selectedPlan?.roi_percentage}% ROI over {selectedPlan?.duration_days} days
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Investment Amount ({currency})</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min={selectedPlan ? btcToUSD(selectedPlan.min_amount).toFixed(2) : "0"}
                    placeholder="50.00"
                    className="pl-8"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                  />
                </div>
                {investAmount && parseFloat(investAmount) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {formatBTC(fiatToBTC(parseFloat(investAmount), currency))}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Available: {formatFiatAmount(btcToUSD(balance), currency)} ({formatBTC(balance)})
                </p>
                <p className="text-xs text-primary">
                  Minimum investment: {selectedPlan ? formatFiatAmount(btcToUSD(selectedPlan.min_amount), currency) : "varies by plan"}
                </p>
              </div>

              {investAmount && selectedPlan && parseFloat(investAmount) >= btcToUSD(selectedPlan.min_amount) && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Investment</span>
                    <div className="text-right">
                      <span className="block">{getCurrencySymbol(currency)}{parseFloat(investAmount).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">{formatBTC(fiatToBTC(parseFloat(investAmount), currency))}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ROI ({selectedPlan?.roi_percentage}%)</span>
                    <div className="text-right text-success">
                      <span className="block">+{getCurrencySymbol(currency)}{(parseFloat(investAmount) * (selectedPlan?.roi_percentage || 0) / 100).toFixed(2)}</span>
                      <span className="text-xs">+{formatBTC(fiatToBTC(parseFloat(investAmount), currency) * (selectedPlan?.roi_percentage || 0) / 100)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t border-border">
                    <span>Expected Return</span>
                    <div className="text-right text-primary">
                      <span className="block">{getCurrencySymbol(currency)}{(parseFloat(investAmount) * (1 + (selectedPlan?.roi_percentage || 0) / 100)).toFixed(2)}</span>
                      <span className="text-xs">{formatBTC(fiatToBTC(parseFloat(investAmount), currency) * (1 + (selectedPlan?.roi_percentage || 0) / 100))}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning">
                  ⚠️ Investment carries risk. Past performance does not guarantee future results.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleInvest}
                disabled={isSubmitting || !investAmount}
              >
                {isSubmitting ? "Processing..." : "Confirm Investment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Investments;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, XCircle, AlertTriangle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Withdrawal {
  id: string;
  amount: number;
  wallet_address: string;
  status: string;
  admin_txid: string | null;
  decline_reason: string | null;
  created_at: string;
}

interface WithdrawalSettings {
  min_investment_days: number;
  min_withdrawal_amount: number;
}

const Withdraw = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatBTC, formatUSD, btcPrice } = useBTCPrice();
  
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<WithdrawalSettings | null>(null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [daysInvested, setDaysInvested] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch withdrawal settings
    const { data: settingsData } = await supabase
      .from("withdrawal_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsData) {
      setSettings({
        min_investment_days: settingsData.min_investment_days ?? 7,
        min_withdrawal_amount: Number(settingsData.min_withdrawal_amount ?? 0.001),
      });
    }

    // Fetch withdrawals
    const { data: withdrawalsData } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (withdrawalsData) {
      setWithdrawals(withdrawalsData.map(w => ({
        ...w,
        amount: Number(w.amount),
      })));
    }

    // Use the database function for accurate balance calculation
    // This properly accounts for invested amounts
    const { data: balanceData, error: balanceError } = await supabase.rpc("get_user_balance", {
      _user_id: user.id,
    });

    if (!balanceError && balanceData !== null) {
      setBalance(Math.max(0, Number(balanceData)));
    }

    // Check investment duration
    const { data: investments } = await supabase
      .from("user_investments")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1);

    if (investments && investments.length > 0) {
      const firstInvestment = new Date(investments[0].created_at);
      const daysSince = Math.floor((Date.now() - firstInvestment.getTime()) / (1000 * 60 * 60 * 24));
      setDaysInvested(daysSince);
      setCanWithdraw(daysSince >= (settingsData?.min_investment_days ?? 7));
    } else {
      // If no active investments, check approved deposits
      const { data: firstDeposit } = await supabase
        .from("deposits")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .order("created_at", { ascending: true })
        .limit(1);

      if (firstDeposit && firstDeposit.length > 0) {
        const depositDate = new Date(firstDeposit[0].created_at);
        const daysSince = Math.floor((Date.now() - depositDate.getTime()) / (1000 * 60 * 60 * 24));
        setDaysInvested(daysSince);
        setCanWithdraw(daysSince >= (settingsData?.min_investment_days ?? 7));
      }
    }

    // Fetch saved wallet address from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.wallet_address) {
      setWalletAddress(profile.wallet_address);
    }
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount || !walletAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (settings && amountNum < settings.min_withdrawal_amount) {
      toast({
        title: "Amount Too Low",
        description: `Minimum withdrawal is ${settings.min_withdrawal_amount} BTC`,
        variant: "destructive",
      });
      return;
    }

    if (amountNum > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    if (!canWithdraw) {
      toast({
        title: "Withdrawal Not Available",
        description: `You need to wait ${settings?.min_investment_days || 7} days from your first investment`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: amountNum,
      wallet_address: walletAddress,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit withdrawal. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Withdrawal Submitted",
        description: "Your withdrawal is pending admin approval.",
      });
      setAmount("");
      fetchData();
    }

    setIsSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "declined":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <div>
          <h1 className="text-2xl font-bold">Withdraw</h1>
          <p className="text-muted-foreground">Withdraw funds to your wallet</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Withdrawal Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Withdrawal Requirements
              </CardTitle>
              <CardDescription>
                Meet these requirements to withdraw
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Minimum Investment Period</span>
                  <div className="flex items-center gap-2">
                    {daysInvested >= (settings?.min_investment_days ?? 7) ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Clock className="w-4 h-4 text-warning" />
                    )}
                    <span className="text-sm">
                      {daysInvested} / {settings?.min_investment_days ?? 7} days
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Minimum Withdrawal</span>
                  <span className="text-sm font-mono">
                    {settings?.min_withdrawal_amount ?? 0.001} BTC
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Available Balance</span>
                  <div className="text-right">
                    <span className="text-sm font-mono text-primary block">
                      {formatBTC(balance)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatUSD(balance)}
                    </span>
                  </div>
                </div>
              </div>

              {!canWithdraw && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning">
                    You need to wait {(settings?.min_investment_days ?? 7) - daysInvested} more days
                    before you can withdraw.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-primary" />
                Request Withdrawal
              </CardTitle>
              <CardDescription>
                Enter your withdrawal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (BTC)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {formatBTC(balance)} ({formatUSD(balance)})
                  </p>
                  {amount && parseFloat(amount) > 0 && (
                    <p className="text-xs text-primary">
                      ≈ {formatUSD(parseFloat(amount))} (1 BTC = ${btcPrice.toLocaleString()})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet">BTC Wallet Address</Label>
                  <Input
                    id="wallet"
                    type="text"
                    placeholder="Enter your BTC wallet address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !canWithdraw || balance <= 0}
                >
                  {isSubmitting ? "Submitting..." : "Request Withdrawal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No withdrawals yet
              </p>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{formatBTC(withdrawal.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatUSD(withdrawal.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(withdrawal.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        To: {withdrawal.wallet_address}
                      </p>
                      {withdrawal.admin_txid && (
                        <p className="text-xs text-success font-mono truncate max-w-[200px]">
                          TXID: {withdrawal.admin_txid}
                        </p>
                      )}
                      {withdrawal.decline_reason && (
                        <p className="text-xs text-destructive">
                          Reason: {withdrawal.decline_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(withdrawal.status)}
                      <span
                        className={cn(
                          "text-sm capitalize",
                          withdrawal.status === "approved" && "text-success",
                          withdrawal.status === "pending" && "text-warning",
                          withdrawal.status === "declined" && "text-destructive"
                        )}
                      >
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Withdraw;

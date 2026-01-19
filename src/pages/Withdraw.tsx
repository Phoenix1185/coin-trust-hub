import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, XCircle, AlertTriangle, ArrowUpCircle, Wallet, CreditCard, Landmark, Bitcoin, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string | null;
}

interface UserPaymentDetail {
  id: string;
  payment_method_id: string;
  details: Record<string, string>;
}

interface Withdrawal {
  id: string;
  amount: number;
  wallet_address: string;
  status: string;
  admin_txid: string | null;
  decline_reason: string | null;
  payment_method: string | null;
  created_at: string;
}

interface WithdrawalSettings {
  min_investment_days: number;
  min_withdrawal_amount: number;
}

const getPaymentIcon = (icon: string) => {
  switch (icon) {
    case "bitcoin":
      return <Bitcoin className="w-5 h-5" />;
    case "usdt":
      return <Wallet className="w-5 h-5" />;
    case "paypal":
      return <CreditCard className="w-5 h-5" />;
    case "bank":
      return <Landmark className="w-5 h-5" />;
    default:
      return <Wallet className="w-5 h-5" />;
  }
};

const getPaymentDetailFields = (icon: string): { key: string; label: string; placeholder: string; type?: string }[] => {
  switch (icon) {
    case "bitcoin":
      return [{ key: "wallet_address", label: "BTC Wallet Address", placeholder: "Enter your BTC wallet address" }];
    case "usdt":
      return [{ key: "wallet_address", label: "USDT (BEP20) Address", placeholder: "Enter your USDT BEP20 address" }];
    case "paypal":
      return [{ key: "email", label: "PayPal Email", placeholder: "Enter your PayPal email", type: "email" }];
    case "bank":
      return [
        { key: "bank_name", label: "Bank Name", placeholder: "Enter your bank name" },
        { key: "account_name", label: "Account Name", placeholder: "Enter account holder name" },
        { key: "account_number", label: "Account Number", placeholder: "Enter your account number" },
        { key: "routing_number", label: "Routing/Sort Code", placeholder: "Enter routing or sort code" },
        { key: "swift_code", label: "SWIFT Code (Optional)", placeholder: "For international transfers" },
      ];
    default:
      return [{ key: "wallet_address", label: "Wallet Address", placeholder: "Enter your address" }];
  }
};

const Withdraw = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatBTC, btcToUSD, usdToBTC, formatFiatAmount, getCurrencySymbol } = useBTCPrice();
  const currency = profile?.preferred_currency || "USD";
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [userPaymentDetails, setUserPaymentDetails] = useState<UserPaymentDetail[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<WithdrawalSettings | null>(null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [daysInvested, setDaysInvested] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Fetch payment methods once
  const fetchPaymentMethods = useCallback(async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("id, name, type, icon, description")
      .in("type", ["withdrawal", "both"])
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setPaymentMethods(data);
      if (data.length > 0 && !selectedMethod) {
        setSelectedMethod(data[0].id);
      }
    }
  }, [selectedMethod]);

  // Fetch user's saved payment details
  const fetchUserPaymentDetails = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_payment_details")
      .select("id, payment_method_id, details")
      .eq("user_id", user.id);

    if (!error && data) {
      setUserPaymentDetails(data.map(d => ({
        ...d,
        details: (d.details || {}) as Record<string, string>
      })));
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [settingsRes, withdrawalsRes, balanceRes, investmentsRes] = await Promise.all([
      supabase.from("withdrawal_settings").select("*").limit(1).maybeSingle(),
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.rpc("get_user_balance", { _user_id: user.id }),
      supabase.from("user_investments").select("created_at").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: true }).limit(1),
    ]);

    if (settingsRes.data) {
      setSettings({
        min_investment_days: settingsRes.data.min_investment_days ?? 7,
        min_withdrawal_amount: Number(settingsRes.data.min_withdrawal_amount ?? 0.001),
      });
    }

    if (withdrawalsRes.data) {
      setWithdrawals(withdrawalsRes.data.map(w => ({
        ...w,
        amount: Number(w.amount),
      })));
    }

    if (balanceRes.data !== null) {
      setBalance(Math.max(0, Number(balanceRes.data)));
    }

    let minDays = settingsRes.data?.min_investment_days ?? 7;

    if (investmentsRes.data && investmentsRes.data.length > 0) {
      const firstInvestment = new Date(investmentsRes.data[0].created_at);
      const daysSince = Math.floor((Date.now() - firstInvestment.getTime()) / (1000 * 60 * 60 * 24));
      setDaysInvested(daysSince);
      setCanWithdraw(daysSince >= minDays);
    } else {
      // Check approved deposits if no active investments
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
        setCanWithdraw(daysSince >= minDays);
      }
    }

    setDataLoaded(true);
  }, [user]);

  useEffect(() => {
    if (user && !dataLoaded) {
      Promise.all([fetchPaymentMethods(), fetchUserPaymentDetails(), fetchData()]);
    }
  }, [user, dataLoaded, fetchPaymentMethods, fetchUserPaymentDetails, fetchData]);

  // Load saved details when method changes
  useEffect(() => {
    if (selectedMethod && userPaymentDetails.length > 0) {
      const saved = userPaymentDetails.find(d => d.payment_method_id === selectedMethod);
      if (saved) {
        setPaymentDetails(saved.details);
      } else {
        setPaymentDetails({});
      }
    } else {
      setPaymentDetails({});
    }
  }, [selectedMethod, userPaymentDetails]);

  const selectedPaymentMethod = useMemo(() => 
    paymentMethods.find(m => m.id === selectedMethod),
    [paymentMethods, selectedMethod]
  );

  const detailFields = useMemo(() => 
    selectedPaymentMethod ? getPaymentDetailFields(selectedPaymentMethod.icon) : [],
    [selectedPaymentMethod]
  );

  const handleSavePaymentDetails = async () => {
    if (!user || !selectedMethod) return;

    setIsSavingDetails(true);

    const existingDetail = userPaymentDetails.find(d => d.payment_method_id === selectedMethod);

    if (existingDetail) {
      const { error } = await supabase
        .from("user_payment_details")
        .update({ details: paymentDetails })
        .eq("id", existingDetail.id);

      if (error) {
        toast({ title: "Error", description: "Failed to save payment details", variant: "destructive" });
      } else {
        toast({ title: "Saved", description: "Payment details updated successfully" });
        await fetchUserPaymentDetails();
      }
    } else {
      const { error } = await supabase
        .from("user_payment_details")
        .insert({
          user_id: user.id,
          payment_method_id: selectedMethod,
          details: paymentDetails,
        });

      if (error) {
        toast({ title: "Error", description: "Failed to save payment details", variant: "destructive" });
      } else {
        toast({ title: "Saved", description: "Payment details saved successfully" });
        await fetchUserPaymentDetails();
      }
    }

    setIsSavingDetails(false);
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount || !selectedMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a payment method",
        variant: "destructive",
      });
      return;
    }

    // Check if payment details are filled
    const hasRequiredDetails = detailFields.every(field => 
      !field.key.includes("Optional") ? paymentDetails[field.key]?.trim() : true
    );

    if (!hasRequiredDetails) {
      toast({
        title: "Missing Payment Details",
        description: "Please fill in your payment details and save them first",
        variant: "destructive",
      });
      return;
    }

    const fiatAmount = parseFloat(amount);
    if (isNaN(fiatAmount) || fiatAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // Convert fiat to BTC for storage
    const exchangeRate = currency === "USD" ? 1 : currency === "EUR" ? 0.92 : 0.79;
    const usdAmount = fiatAmount / exchangeRate;
    const btcAmount = usdToBTC(usdAmount);

    const minBtc = settings?.min_withdrawal_amount ?? 0.001;
    if (btcAmount < minBtc) {
      toast({
        title: "Amount Too Low",
        description: `Minimum withdrawal is ${formatFiatAmount(btcToUSD(minBtc), currency)}`,
        variant: "destructive",
      });
      return;
    }

    if (btcAmount > balance) {
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

    // Format wallet address from payment details
    const walletAddress = Object.entries(paymentDetails)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");

    setIsSubmitting(true);

    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: btcAmount,
      wallet_address: walletAddress,
      status: "pending",
      payment_method: selectedPaymentMethod?.name || null,
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
      setDataLoaded(false);
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
                  <div className="text-right">
                    <span className="text-sm font-mono block">
                      {formatFiatAmount(btcToUSD(settings?.min_withdrawal_amount ?? 0.001), currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatBTC(settings?.min_withdrawal_amount ?? 0.001)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Available Balance</span>
                  <div className="text-right">
                    <span className="text-sm font-mono text-primary block">
                      {formatFiatAmount(btcToUSD(balance), currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatBTC(balance)}
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
                {/* Payment Method Selection */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  {paymentMethods.length > 0 ? (
                    <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className={cn(
                              "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                              selectedMethod === method.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => setSelectedMethod(method.id)}
                          >
                            <RadioGroupItem value={method.id} id={`w-${method.id}`} />
                            <div className="flex items-center gap-2">
                              <div className="text-primary">
                                {getPaymentIcon(method.icon)}
                              </div>
                              <Label htmlFor={`w-${method.id}`} className="text-sm cursor-pointer">
                                {method.name}
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payment methods available</p>
                  )}
                </div>

                {/* Dynamic Payment Details Fields */}
                {selectedPaymentMethod && (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <Label className="text-base font-medium">
                      {selectedPaymentMethod.name} Details
                    </Label>
                    {detailFields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <Label htmlFor={field.key} className="text-sm">
                          {field.label}
                        </Label>
                        {field.key === "bank_name" || field.key.includes("address") ? (
                          <Input
                            id={field.key}
                            type={field.type || "text"}
                            placeholder={field.placeholder}
                            value={paymentDetails[field.key] || ""}
                            onChange={(e) => setPaymentDetails(prev => ({
                              ...prev,
                              [field.key]: e.target.value
                            }))}
                          />
                        ) : (
                          <Input
                            id={field.key}
                            type={field.type || "text"}
                            placeholder={field.placeholder}
                            value={paymentDetails[field.key] || ""}
                            onChange={(e) => setPaymentDetails(prev => ({
                              ...prev,
                              [field.key]: e.target.value
                            }))}
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSavePaymentDetails}
                      disabled={isSavingDetails}
                      className="mt-2"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSavingDetails ? "Saving..." : "Save Details"}
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({currency})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {getCurrencySymbol(currency)}
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: {formatFiatAmount(btcToUSD(balance), currency)} ({formatBTC(balance)})
                  </p>
                  {amount && parseFloat(amount) > 0 && (
                    <p className="text-xs text-primary">
                      ≈ {formatBTC(usdToBTC(parseFloat(amount) / (currency === "USD" ? 1 : currency === "EUR" ? 0.92 : 0.79)))}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !canWithdraw || balance <= 0 || !selectedMethod}
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
            <CardDescription>Your past withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No withdrawals yet
              </p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(withdrawal.status)}
                        <span className="font-medium capitalize">
                          {withdrawal.status}
                        </span>
                        {withdrawal.payment_method && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {withdrawal.payment_method}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(withdrawal.created_at)}
                      </p>
                      {withdrawal.decline_reason && (
                        <p className="text-sm text-destructive">
                          Reason: {withdrawal.decline_reason}
                        </p>
                      )}
                      {withdrawal.admin_txid && (
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          TXID: {withdrawal.admin_txid}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatFiatAmount(btcToUSD(withdrawal.amount), currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBTC(withdrawal.amount)}
                      </p>
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { useDepositEnabled } from "@/hooks/useDepositEnabled";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, CheckCircle, Clock, XCircle, QrCode, Wallet, CreditCard, Landmark, Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DepositAddress {
  id: string;
  address: string;
  label: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string | null;
  wallet_address: string | null;
  instructions: string | null;
}

interface Deposit {
  id: string;
  amount: number;
  txid: string | null;
  status: string;
  payment_method: string | null;
  created_at: string;
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

const Deposit = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatBTC, btcPrice, btcToUSD, usdToBTC, formatFiatAmount, getCurrencySymbol } = useBTCPrice();
  const { depositsEnabled, isLoading: depositSettingLoading } = useDepositEnabled();
  const currency = profile?.preferred_currency || "USD";
  
  const [depositAddress, setDepositAddress] = useState<DepositAddress | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [amount, setAmount] = useState("");
  const [txid, setTxid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Redirect if deposits are disabled
  useEffect(() => {
    if (!depositSettingLoading && !depositsEnabled) {
      navigate("/dashboard");
    }
  }, [depositsEnabled, depositSettingLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDepositAddress();
      fetchPaymentMethods();
      fetchDeposits();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .in("type", ["deposit", "both"])
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setPaymentMethods(data);
      if (data.length > 0) {
        setSelectedMethod(data[0].id);
      }
    }
  };

  const fetchDepositAddress = async () => {
    const { data, error } = await supabase
      .from("deposit_addresses")
      .select("id, address, label")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setDepositAddress(data);
    }
  };

  const fetchDeposits = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("deposits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDeposits(data.map(d => ({
        ...d,
        amount: Number(d.amount),
      })));
    }
  };

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast({
      title: "Address Copied",
      description: "Address copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount || !selectedMethod) {
      toast({
        title: "Missing Information",
        description: "Please select a payment method and enter the deposit amount",
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

    const selectedPayment = paymentMethods.find(m => m.id === selectedMethod);

    setIsSubmitting(true);

    const { error } = await supabase.from("deposits").insert({
      user_id: user.id,
      amount: btcAmount,
      txid: txid || null,
      status: "pending",
      payment_method: selectedPayment?.name || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit deposit. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deposit Submitted",
        description: "Your deposit is pending admin approval.",
      });
      setAmount("");
      setTxid("");
      fetchDeposits();
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

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);

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
          <h1 className="text-2xl font-bold">Deposit</h1>
          <p className="text-muted-foreground">Add funds to your account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Select Payment Method
              </CardTitle>
              <CardDescription>
                Choose how you want to deposit funds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.length > 0 ? (
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={cn(
                        "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        selectedMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-muted rounded-lg text-primary">
                          {getPaymentIcon(method.icon)}
                        </div>
                        <div>
                          <Label htmlFor={method.id} className="font-medium cursor-pointer">
                            {method.name}
                          </Label>
                          {method.description && (
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No payment methods available. Please contact support.
                </p>
              )}

              {/* Show deposit address for crypto methods */}
              {selectedPaymentMethod?.icon === "bitcoin" && (depositAddress || selectedPaymentMethod.wallet_address) && (
                <div className="mt-4 space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedPaymentMethod.wallet_address || depositAddress?.address}`}
                      alt="QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>BTC Address</Label>
                    <div className="flex gap-2">
                      <Input
                        value={selectedPaymentMethod.wallet_address || depositAddress?.address || ""}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyAddress(selectedPaymentMethod.wallet_address || depositAddress?.address || "")}
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show wallet address for USDT/USDC */}
              {(selectedPaymentMethod?.icon === "usdt" || selectedPaymentMethod?.icon === "usdc") && selectedPaymentMethod.wallet_address && (
                <div className="mt-4 space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedPaymentMethod.wallet_address}`}
                      alt="QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{selectedPaymentMethod.name} Address</Label>
                    <div className="flex gap-2">
                      <Input
                        value={selectedPaymentMethod.wallet_address}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyAddress(selectedPaymentMethod.wallet_address!)}
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {selectedPaymentMethod.instructions && (
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm text-warning">{selectedPaymentMethod.instructions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Show no address message for crypto without address */}
              {(selectedPaymentMethod?.icon === "usdt" || selectedPaymentMethod?.icon === "usdc") && !selectedPaymentMethod.wallet_address && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">No deposit address configured for this payment method. Please contact support.</p>
                </div>
              )}

              {/* Show PayPal instructions */}
              {selectedPaymentMethod?.icon === "paypal" && (
                <div className="mt-4 space-y-3">
                  {selectedPaymentMethod.wallet_address && (
                    <div className="space-y-2">
                      <Label>PayPal Email</Label>
                      <div className="flex gap-2">
                        <Input value={selectedPaymentMethod.wallet_address} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={() => handleCopyAddress(selectedPaymentMethod.wallet_address!)}>
                          {copied ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedPaymentMethod.instructions && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">{selectedPaymentMethod.instructions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Show Bank Transfer instructions */}
              {selectedPaymentMethod?.icon === "bank" && (
                <div className="mt-4 space-y-3">
                  {selectedPaymentMethod.instructions ? (
                    <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-line">
                      <p className="text-sm">{selectedPaymentMethod.instructions}</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm text-warning">Bank transfer details not configured. Please contact support.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Deposit */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Deposit</CardTitle>
              <CardDescription>
                After sending funds, submit your deposit details for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitDeposit} className="space-y-4">
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
                  {amount && parseFloat(amount) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ≈ {formatBTC(usdToBTC(parseFloat(amount) / (currency === "USD" ? 1 : currency === "EUR" ? 0.92 : 0.79)))} (1 BTC = {formatFiatAmount(btcPrice, currency)})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="txid">Transaction ID / Reference (Optional)</Label>
                  <Input
                    id="txid"
                    type="text"
                    placeholder="Enter your transaction ID or reference"
                    value={txid}
                    onChange={(e) => setTxid(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Providing a reference helps speed up verification
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-success hover:bg-success/90"
                  disabled={isSubmitting || !selectedMethod}
                >
                  {isSubmitting ? "Submitting..." : "Submit Deposit"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Deposit History */}
        <Card>
          <CardHeader>
            <CardTitle>Deposit History</CardTitle>
          </CardHeader>
          <CardContent>
            {deposits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No deposits yet
              </p>
            ) : (
              <div className="space-y-4">
                {deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{formatFiatAmount(btcToUSD(deposit.amount), currency)}</p>
                      <p className="text-xs text-muted-foreground">{formatBTC(deposit.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(deposit.created_at)}
                      </p>
                      {deposit.payment_method && (
                        <p className="text-xs text-primary">
                          via {deposit.payment_method}
                        </p>
                      )}
                      {deposit.txid && (
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          Ref: {deposit.txid}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deposit.status)}
                      <span
                        className={cn(
                          "text-sm capitalize",
                          deposit.status === "approved" && "text-success",
                          deposit.status === "pending" && "text-warning",
                          deposit.status === "declined" && "text-destructive"
                        )}
                      >
                        {deposit.status}
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

export default Deposit;
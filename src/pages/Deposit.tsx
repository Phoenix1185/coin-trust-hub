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
import { Copy, CheckCircle, Clock, XCircle, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface DepositAddress {
  id: string;
  address: string;
  label: string | null;
}

interface Deposit {
  id: string;
  amount: number;
  txid: string | null;
  status: string;
  created_at: string;
}

const Deposit = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatBTC, formatUSD, btcPrice } = useBTCPrice();
  
  const [depositAddress, setDepositAddress] = useState<DepositAddress | null>(null);
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

  useEffect(() => {
    if (user) {
      fetchDepositAddress();
      fetchDeposits();
    }
  }, [user]);

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

  const handleCopyAddress = async () => {
    if (depositAddress) {
      await navigator.clipboard.writeText(depositAddress.address);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "BTC address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount) {
      toast({
        title: "Missing Information",
        description: "Please enter the deposit amount",
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

    setIsSubmitting(true);

    const { error } = await supabase.from("deposits").insert({
      user_id: user.id,
      amount: amountNum,
      txid: txid || null,
      status: "pending",
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
          {/* Deposit Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Bitcoin Deposit Address
              </CardTitle>
              <CardDescription>
                Send BTC to this address to fund your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {depositAddress ? (
                <>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${depositAddress.address}`}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>BTC Address</Label>
                    <div className="flex gap-2">
                      <Input
                        value={depositAddress.address}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyAddress}
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {depositAddress.label && (
                    <p className="text-sm text-muted-foreground">
                      {depositAddress.label}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No deposit address available. Please contact support.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Deposit */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Deposit</CardTitle>
              <CardDescription>
                After sending BTC, submit your deposit details for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitDeposit} className="space-y-4">
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
                  {amount && parseFloat(amount) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ≈ {formatUSD(parseFloat(amount))} (1 BTC = ${btcPrice.toLocaleString()})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="txid">Transaction ID (Optional)</Label>
                  <Input
                    id="txid"
                    type="text"
                    placeholder="Enter your transaction ID"
                    value={txid}
                    onChange={(e) => setTxid(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Providing the TXID helps speed up verification
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-success hover:bg-success/90"
                  disabled={isSubmitting}
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
                      <p className="font-medium">{formatBTC(deposit.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatUSD(deposit.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(deposit.created_at)}
                      </p>
                      {deposit.txid && (
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          TXID: {deposit.txid}
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

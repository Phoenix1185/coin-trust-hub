import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, ArrowUpCircle, Bitcoin, Wallet as WalletIcon, TrendingUp, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "investment";
  amount: number;
  status: string;
  created_at: string;
}

const Wallet = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;
    
    try {
      // Fetch balance
      const { data: balanceData } = await supabase.rpc("get_user_balance", {
        _user_id: user.id,
      });
      setBalance(balanceData || 0);

      // Fetch recent transactions
      const [deposits, withdrawals, investments] = await Promise.all([
        supabase
          .from("deposits")
          .select("id, amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("withdrawals")
          .select("id, amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("user_investments")
          .select("id, amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const allTransactions: Transaction[] = [
        ...(deposits.data?.map((d) => ({ ...d, type: "deposit" as const })) || []),
        ...(withdrawals.data?.map((w) => ({ ...w, type: "withdrawal" as const })) || []),
        ...(investments.data?.map((i) => ({ ...i, type: "investment" as const })) || []),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTransactions.slice(0, 10));
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
      case "active":
        return "text-success";
      case "pending":
        return "text-warning";
      case "declined":
      case "cancelled":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="w-5 h-5 text-success" />;
      case "withdrawal":
        return <ArrowUpCircle className="w-5 h-5 text-destructive" />;
      case "investment":
        return <TrendingUp className="w-5 h-5 text-primary" />;
      default:
        return <History className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and view transactions</p>
        </div>

        {/* Balance Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 glow-gold-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <WalletIcon className="w-4 h-4" />
                Available Balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="text-3xl md:text-4xl font-bold text-gradient-gold">
                  {formatCurrency(balance)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Bitcoin className="w-4 h-4" />
                Bitcoin Equivalent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="text-3xl md:text-4xl font-bold">
                  {(balance / 104250).toFixed(6)} BTC
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button 
                onClick={() => navigate("/deposit")} 
                className="flex-1 bg-success hover:bg-success/90"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Deposit
              </Button>
              <Button 
                onClick={() => navigate("/withdraw")} 
                variant="outline"
                className="flex-1 border-primary text-primary hover:bg-primary/10"
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest wallet activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Make your first deposit to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={`${tx.type}-${tx.id}`}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-card rounded-lg">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{tx.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-semibold",
                        tx.type === "deposit" ? "text-success" : 
                        tx.type === "withdrawal" ? "text-destructive" : ""
                      )}>
                        {tx.type === "deposit" ? "+" : tx.type === "withdrawal" ? "-" : ""}
                        {formatCurrency(tx.amount)}
                      </div>
                      <div className={cn("text-sm capitalize", getStatusColor(tx.status))}>
                        {tx.status}
                      </div>
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

export default Wallet;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import DashboardLayout from "@/components/DashboardLayout";
import CryptoChart from "@/components/CryptoChart";
import LiveTicker from "@/components/LiveTicker";
import ActiveInvestmentSummary from "@/components/ActiveInvestmentSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Wallet,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeInvestments: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

interface RecentActivity {
  id: string;
  type: "deposit" | "withdrawal" | "investment";
  amount: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { formatBTC, formatWithBTC, btcToUSD, formatFiatAmount } = useBTCPrice();
  const currency = profile?.preferred_currency || "USD";
  
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  
  // Enable realtime notifications
  useRealtimeNotifications();
  
  const [stats, setStats] = useState<DashboardStats>({
    balance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeInvestments: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch deposits
      const { data: deposits } = await supabase
        .from("deposits")
        .select("amount, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from("withdrawals")
        .select("amount, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch investments
      const { data: investments } = await supabase
        .from("user_investments")
        .select("amount, status, accrued_profit, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Calculate stats
      const approvedDeposits = deposits?.filter(d => d.status === "approved") || [];
      const approvedWithdrawals = withdrawals?.filter(w => w.status === "approved") || [];
      const activeInvests = investments?.filter(i => i.status === "active" || i.status === "pending") || [];
      const completedInvests = investments?.filter(i => i.status === "completed") || [];

      const totalDeposited = approvedDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
      const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
      const investedAmount = activeInvests.reduce((sum, i) => sum + Number(i.amount), 0);
      
      // Use same formula as DB function: principal + accrued_profit for completed investments
      const completedPrincipal = completedInvests.reduce((sum, i) => sum + Number(i.amount), 0);
      const completedProfit = completedInvests.reduce((sum, i) => sum + Number(i.accrued_profit || 0), 0);
      const returnedAmount = completedPrincipal + completedProfit;

      const balance = totalDeposited - totalWithdrawn - investedAmount + returnedAmount;

      setStats({
        balance: Math.max(0, balance),
        totalDeposits: totalDeposited,
        totalWithdrawals: totalWithdrawn,
        activeInvestments: activeInvests.length,
        pendingDeposits: deposits?.filter(d => d.status === "pending").length || 0,
        pendingWithdrawals: withdrawals?.filter(w => w.status === "pending").length || 0,
      });

      // Combine recent activity
      const activity: RecentActivity[] = [
        ...(deposits?.map(d => ({
          id: crypto.randomUUID(),
          type: "deposit" as const,
          amount: Number(d.amount),
          status: d.status,
          created_at: d.created_at,
        })) || []),
        ...(withdrawals?.map(w => ({
          id: crypto.randomUUID(),
          type: "withdrawal" as const,
          amount: Number(w.amount),
          status: w.status,
          created_at: w.created_at,
        })) || []),
        ...(investments?.map(i => ({
          id: crypto.randomUUID(),
          type: "investment" as const,
          amount: Number(i.amount),
          status: i.status,
          created_at: i.created_at,
        })) || []),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setRecentActivity(activity);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
      case "active":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "declined":
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      {/* Live Ticker - hidden on mobile for cleaner look */}
      <div className="hidden sm:block -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-4 lg:mb-6">
        <LiveTicker />
      </div>

      <div className="space-y-4">
        {/* Welcome Section */}
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Welcome back, {displayName}!</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Here's an overview of your investments.</p>
        </div>

        {/* Stats Cards - Mobile: stacked, larger screens: grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Available Balance</p>
                  <p className="text-base sm:text-lg font-bold text-primary truncate">{formatFiatAmount(btcToUSD(stats.balance), currency)}</p>
                  <p className="text-xs text-muted-foreground">{formatBTC(stats.balance)}</p>
                </div>
                <div className="p-2 bg-primary/20 rounded-full ml-2">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Total Deposits</p>
                  <p className="text-base sm:text-lg font-bold truncate">{formatFiatAmount(btcToUSD(stats.totalDeposits), currency)}</p>
                  <p className="text-xs text-muted-foreground">{formatBTC(stats.totalDeposits)}</p>
                  {stats.pendingDeposits > 0 && (
                    <p className="text-xs text-warning">{stats.pendingDeposits} pending</p>
                  )}
                </div>
                <div className="p-2 bg-success/20 rounded-full ml-2">
                  <ArrowDownCircle className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Total Withdrawals</p>
                  <p className="text-base sm:text-lg font-bold truncate">{formatFiatAmount(btcToUSD(stats.totalWithdrawals), currency)}</p>
                  <p className="text-xs text-muted-foreground">{formatBTC(stats.totalWithdrawals)}</p>
                  {stats.pendingWithdrawals > 0 && (
                    <p className="text-xs text-warning">{stats.pendingWithdrawals} pending</p>
                  )}
                </div>
                <div className="p-2 bg-muted rounded-full ml-2">
                  <ArrowUpCircle className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Active Investments</p>
                  <p className="text-base sm:text-lg font-bold">{stats.activeInvestments}</p>
                  <p className="text-xs text-muted-foreground">plans active</p>
                </div>
                <div className="p-2 bg-primary/20 rounded-full ml-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Investment Summary - Expandable */}
        <ActiveInvestmentSummary />

        {/* Quick Actions - Mobile only */}
        <div className="grid grid-cols-3 gap-2 sm:hidden">
          <Button
            className="flex-col h-auto py-3 bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => navigate("/deposit")}
          >
            <ArrowDownCircle className="w-5 h-5 mb-1" />
            <span className="text-xs">Deposit</span>
          </Button>
          <Button
            className="flex-col h-auto py-3"
            variant="outline"
            onClick={() => navigate("/withdraw")}
          >
            <ArrowUpCircle className="w-5 h-5 mb-1" />
            <span className="text-xs">Withdraw</span>
          </Button>
          <Button
            className="flex-col h-auto py-3 bg-primary hover:bg-primary/90"
            onClick={() => navigate("/investments")}
          >
            <TrendingUp className="w-5 h-5 mb-1" />
            <span className="text-xs">Invest</span>
          </Button>
        </div>

        {/* Chart - Full width on mobile */}
        <CryptoChart className="w-full" />

        {/* Desktop Quick Actions */}
        <Card className="hidden sm:block lg:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => navigate("/deposit")}
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Deposit
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => navigate("/withdraw")}
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => navigate("/investments")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Invest
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Start by making a deposit!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {activity.type === "deposit" ? (
                        <ArrowDownCircle className="w-4 h-4 text-success flex-shrink-0" />
                      ) : activity.type === "withdrawal" ? (
                        <ArrowUpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium capitalize text-sm">{activity.type}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatFiatAmount(btcToUSD(activity.amount), currency)} ({formatBTC(activity.amount)})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {getStatusIcon(activity.status)}
                      <span className={cn(
                        "text-xs capitalize",
                        (activity.status === "approved" || activity.status === "active" || activity.status === "completed") && "text-success",
                        activity.status === "pending" && "text-warning",
                        (activity.status === "declined" || activity.status === "cancelled") && "text-destructive"
                      )}>
                        {activity.status}
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

export default Dashboard;

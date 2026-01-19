import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import DashboardLayout from "@/components/DashboardLayout";
import CryptoChart from "@/components/CryptoChart";
import LiveTicker from "@/components/LiveTicker";
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
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { formatBTC, formatUSD } = useBTCPrice();
  
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
        .select("amount, status, expected_return, created_at")
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
      const returnedAmount = completedInvests.reduce((sum, i) => sum + Number(i.expected_return || 0), 0);

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
      {/* Live Ticker */}
      <div className="-mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-6">
        <LiveTicker />
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Welcome back!</h1>
          <p className="text-sm md:text-base text-muted-foreground">Here's an overview of your investments.</p>
        </div>

        {/* Stats Cards - Mobile optimized 2x2 grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-lg md:text-2xl font-bold text-primary truncate">{formatBTC(stats.balance)}</p>
                  <p className="text-xs text-muted-foreground truncate">{formatUSD(stats.balance)}</p>
                </div>
                <div className="p-2 md:p-3 bg-primary/20 rounded-full self-start md:self-center">
                  <Wallet className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Total Deposits</p>
                  <p className="text-lg md:text-2xl font-bold truncate">{formatBTC(stats.totalDeposits)}</p>
                  {stats.pendingDeposits > 0 && (
                    <p className="text-xs text-warning">{stats.pendingDeposits} pending</p>
                  )}
                </div>
                <div className="p-2 md:p-3 bg-success/20 rounded-full self-start md:self-center">
                  <ArrowDownCircle className="w-4 h-4 md:w-6 md:h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Total Withdrawals</p>
                  <p className="text-lg md:text-2xl font-bold truncate">{formatBTC(stats.totalWithdrawals)}</p>
                  {stats.pendingWithdrawals > 0 && (
                    <p className="text-xs text-warning">{stats.pendingWithdrawals} pending</p>
                  )}
                </div>
                <div className="p-2 md:p-3 bg-muted rounded-full self-start md:self-center">
                  <ArrowUpCircle className="w-4 h-4 md:w-6 md:h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Active Investments</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.activeInvestments}</p>
                  <p className="text-xs text-muted-foreground">plans active</p>
                </div>
                <div className="p-2 md:p-3 bg-primary/20 rounded-full self-start md:self-center">
                  <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Mobile first */}
        <Card className="lg:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
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
          </CardContent>
        </Card>

        {/* Chart and Quick Actions - Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <CryptoChart />
          </div>

          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => navigate("/deposit")}
              >
                <ArrowDownCircle className="w-5 h-5 mr-3" />
                Make a Deposit
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/withdraw")}
              >
                <ArrowUpCircle className="w-5 h-5 mr-3" />
                Withdraw Funds
              </Button>
              <Button
                className="w-full justify-start bg-primary hover:bg-primary/90"
                onClick={() => navigate("/investments")}
              >
                <TrendingUp className="w-5 h-5 mr-3" />
                View Investment Plans
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <p>No recent activity</p>
                <p className="text-sm">Start by making a deposit!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 md:p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      {activity.type === "deposit" ? (
                        <ArrowDownCircle className="w-4 h-4 md:w-5 md:h-5 text-success flex-shrink-0" />
                      ) : activity.type === "withdrawal" ? (
                        <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                      ) : (
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium capitalize text-sm md:text-base">{activity.type}</p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {formatBTC(activity.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      {getStatusIcon(activity.status)}
                      <span className={cn(
                        "text-xs md:text-sm capitalize",
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

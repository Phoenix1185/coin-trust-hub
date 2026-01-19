import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Activity,
  Settings,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  is_frozen: boolean;
  created_at: string;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  txid: string | null;
  created_at: string;
  profiles?: { email: string; full_name: string | null };
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: string;
  admin_txid: string | null;
  created_at: string;
  profiles?: { email: string; full_name: string | null };
}

interface Investment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  profiles?: { email: string; full_name: string | null };
  investment_plans?: { name: string };
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    activeInvestments: 0,
    totalBalance: 0,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/dashboard");
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin panel.",
          variant: "destructive",
        });
      }
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllData();
    }
  }, [user, isAdmin]);

  const fetchAllData = async () => {
    try {
      const [usersRes, depositsRes, withdrawalsRes, investmentsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("deposits").select("*").order("created_at", { ascending: false }),
        supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
        supabase.from("user_investments").select("*, investment_plans(name)").order("created_at", { ascending: false }),
      ]);

      const profiles = usersRes.data || [];
      const profileMap = new Map(profiles.map(p => [p.user_id, p]));

      setUsers(profiles);
      setDeposits((depositsRes.data || []).map(d => ({
        ...d,
        profiles: profileMap.get(d.user_id) ? { email: profileMap.get(d.user_id)!.email, full_name: profileMap.get(d.user_id)!.full_name } : undefined
      })));
      setWithdrawals((withdrawalsRes.data || []).map(w => ({
        ...w,
        profiles: profileMap.get(w.user_id) ? { email: profileMap.get(w.user_id)!.email, full_name: profileMap.get(w.user_id)!.full_name } : undefined
      })));
      setInvestments((investmentsRes.data || []).map(i => ({
        ...i,
        profiles: profileMap.get(i.user_id) ? { email: profileMap.get(i.user_id)!.email, full_name: profileMap.get(i.user_id)!.full_name } : undefined
      })));

      setStats({
        totalUsers: usersRes.data?.length || 0,
        pendingDeposits: depositsRes.data?.filter((d) => d.status === "pending").length || 0,
        pendingWithdrawals: withdrawalsRes.data?.filter((w) => w.status === "pending").length || 0,
        activeInvestments: investmentsRes.data?.filter((i) => i.status === "active").length || 0,
        totalBalance: depositsRes.data
          ?.filter((d) => d.status === "approved")
          .reduce((sum, d) => sum + d.amount, 0) || 0,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDeposit = async (deposit: Deposit) => {
    try {
      const { error } = await supabase
        .from("deposits")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", deposit.id);

      if (error) throw error;

      // Send notification
      await supabase.from("notifications").insert({
        user_id: deposit.user_id,
        title: "Deposit Approved",
        message: `Your deposit of $${deposit.amount.toLocaleString()} has been approved and added to your balance.`,
      });

      toast({ title: "Deposit Approved", description: `$${deposit.amount} approved successfully.` });
      fetchAllData();
    } catch (error) {
      console.error("Error approving deposit:", error);
      toast({ title: "Error", description: "Failed to approve deposit.", variant: "destructive" });
    }
  };

  const handleDeclineDeposit = async (deposit: Deposit) => {
    try {
      const { error } = await supabase
        .from("deposits")
        .update({
          status: "declined",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", deposit.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: deposit.user_id,
        title: "Deposit Declined",
        message: `Your deposit of $${deposit.amount.toLocaleString()} has been declined. Please contact support for more information.`,
      });

      toast({ title: "Deposit Declined", description: "Deposit has been declined." });
      fetchAllData();
    } catch (error) {
      console.error("Error declining deposit:", error);
      toast({ title: "Error", description: "Failed to decline deposit.", variant: "destructive" });
    }
  };

  const handleApproveWithdrawal = async (withdrawal: Withdrawal, txid: string) => {
    if (!txid.trim()) {
      toast({ title: "Error", description: "Please enter a transaction ID.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: "approved",
          admin_txid: txid,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", withdrawal.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "Withdrawal Approved",
        message: `Your withdrawal of $${withdrawal.amount.toLocaleString()} has been processed. TXID: ${txid}`,
      });

      toast({ title: "Withdrawal Approved", description: `$${withdrawal.amount} sent successfully.` });
      fetchAllData();
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      toast({ title: "Error", description: "Failed to approve withdrawal.", variant: "destructive" });
    }
  };

  const handleDeclineWithdrawal = async (withdrawal: Withdrawal, reason: string) => {
    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: "declined",
          decline_reason: reason || "Request declined by admin.",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", withdrawal.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: "Withdrawal Declined",
        message: `Your withdrawal of $${withdrawal.amount.toLocaleString()} has been declined. Reason: ${reason || "Contact support for details."}`,
      });

      toast({ title: "Withdrawal Declined", description: "Withdrawal has been declined." });
      fetchAllData();
    } catch (error) {
      console.error("Error declining withdrawal:", error);
      toast({ title: "Error", description: "Failed to decline withdrawal.", variant: "destructive" });
    }
  };

  const handleActivateInvestment = async (investment: Investment) => {
    try {
      const startDate = new Date();
      const { data: plan } = await supabase
        .from("investment_plans")
        .select("duration_days, roi_percentage")
        .eq("id", investment.plan_id)
        .single();

      if (!plan) throw new Error("Plan not found");

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.duration_days);

      const expectedReturn = investment.amount + (investment.amount * plan.roi_percentage) / 100;

      const { error } = await supabase
        .from("user_investments")
        .update({
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          expected_return: expectedReturn,
        })
        .eq("id", investment.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: investment.user_id,
        title: "Investment Activated",
        message: `Your investment of $${investment.amount.toLocaleString()} has been activated. Expected return: $${expectedReturn.toLocaleString()}.`,
      });

      toast({ title: "Investment Activated", description: "Investment is now active." });
      fetchAllData();
    } catch (error) {
      console.error("Error activating investment:", error);
      toast({ title: "Error", description: "Failed to activate investment.", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning">Pending</Badge>;
      case "approved":
      case "active":
      case "completed":
        return <Badge variant="outline" className="border-success text-success">{status}</Badge>;
      case "declined":
      case "cancelled":
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading || (!isAdmin && user)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Verifying admin access...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground">Manage users, deposits, withdrawals, and investments</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users, transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Deposits</p>
                  <p className="text-2xl font-bold">{stats.pendingDeposits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="w-8 h-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
                  <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Investments</p>
                  <p className="text-2xl font-bold">{stats.activeInvestments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Deposits</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deposits" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Deposits Tab */}
          <TabsContent value="deposits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-success" />
                  Deposit Requests
                </CardTitle>
                <CardDescription>Review and approve deposit requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : deposits.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No deposit requests</p>
                ) : (
                  <div className="space-y-4">
                    {deposits.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {deposit.profiles?.email || "Unknown User"}
                            </span>
                            {getStatusBadge(deposit.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Amount: <span className="text-success font-semibold">{formatCurrency(deposit.amount)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(deposit.created_at)}</p>
                          {deposit.txid && (
                            <p className="text-xs text-muted-foreground">TXID: {deposit.txid}</p>
                          )}
                        </div>
                        {deposit.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveDeposit(deposit)}
                              className="bg-success hover:bg-success/90"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeclineDeposit(deposit)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-primary" />
                  Withdrawal Requests
                </CardTitle>
                <CardDescription>Review and process withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : withdrawals.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No withdrawal requests</p>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <WithdrawalItem
                        key={withdrawal.id}
                        withdrawal={withdrawal}
                        onApprove={handleApproveWithdrawal}
                        onDecline={handleDeclineWithdrawal}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  User Investments
                </CardTitle>
                <CardDescription>Manage and activate user investments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : investments.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No investments</p>
                ) : (
                  <div className="space-y-4">
                    {investments.map((investment) => (
                      <div
                        key={investment.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {investment.profiles?.email || "Unknown User"}
                            </span>
                            {getStatusBadge(investment.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Plan: <span className="font-medium">{investment.investment_plans?.name || "Unknown"}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Amount: <span className="text-primary font-semibold">{formatCurrency(investment.amount)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(investment.created_at)}</p>
                        </div>
                        {investment.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleActivateInvestment(investment)}
                            className="bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  All Users
                </CardTitle>
                <CardDescription>Manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No users found</p>
                ) : (
                  <div className="space-y-3">
                    {users
                      .filter(
                        (u) =>
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-primary font-medium">
                                {u.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{u.full_name || "No Name"}</p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {u.is_frozen && (
                              <Badge variant="destructive">Frozen</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(u.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

// Withdrawal Item Component with TXID input
const WithdrawalItem = ({
  withdrawal,
  onApprove,
  onDecline,
  formatCurrency,
  formatDate,
  getStatusBadge,
}: {
  withdrawal: Withdrawal;
  onApprove: (w: Withdrawal, txid: string) => void;
  onDecline: (w: Withdrawal, reason: string) => void;
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
  getStatusBadge: (s: string) => JSX.Element;
}) => {
  const [txid, setTxid] = useState("");
  const [reason, setReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  return (
    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{withdrawal.profiles?.email || "Unknown User"}</span>
            {getStatusBadge(withdrawal.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="text-primary font-semibold">{formatCurrency(withdrawal.amount)}</span>
          </p>
          <p className="text-xs text-muted-foreground break-all">
            Wallet: {withdrawal.wallet_address}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(withdrawal.created_at)}</p>
        </div>
      </div>

      {withdrawal.status === "pending" && (
        <div className="space-y-3 pt-3 border-t border-border">
          {!showDecline ? (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Transaction ID (TXID)"
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(withdrawal, txid)}
                  className="bg-success hover:bg-success/90"
                  disabled={!txid.trim()}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve & Send
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDecline(true)}
                >
                  Decline
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input
                placeholder="Reason for decline (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDecline(withdrawal, reason)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Confirm Decline
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDecline(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;

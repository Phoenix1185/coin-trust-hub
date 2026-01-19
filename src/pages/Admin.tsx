import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search,
  MessageSquare,
  Settings,
  Save,
  Plus,
  Trash2,
  Reply,
} from "lucide-react";

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

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  created_at: string;
  profiles?: { email: string; full_name: string | null };
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  live_chat: string;
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
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    activeInvestments: 0,
    totalBalance: 0,
    openTickets: 0,
  });

  // Settings state
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: "support@bitcryptotradingco.com",
    phone: "+1 (888) 123-4567",
    live_chat: "Available 24/7",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Ticket reply state
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

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
      fetchSiteSettings();
    }
  }, [user, isAdmin]);

  const fetchSiteSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from("site_settings")
        .select("setting_key, setting_value");

      if (settings) {
        settings.forEach((setting) => {
          if (setting.setting_key === "contact_info") {
            setContactInfo(setting.setting_value as unknown as ContactInfo);
          }
          if (setting.setting_key === "faq_items") {
            setFaqItems(setting.setting_value as unknown as FAQItem[]);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching site settings:", error);
    }
  };

  const fetchAllData = async () => {
    try {
      const [usersRes, depositsRes, withdrawalsRes, investmentsRes, ticketsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("deposits").select("*").order("created_at", { ascending: false }),
        supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
        supabase.from("user_investments").select("*, investment_plans(name)").order("created_at", { ascending: false }),
        supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
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
      setTickets((ticketsRes.data || []).map(t => ({
        ...t,
        profiles: profileMap.get(t.user_id) ? { email: profileMap.get(t.user_id)!.email, full_name: profileMap.get(t.user_id)!.full_name } : undefined
      })));

      setStats({
        totalUsers: usersRes.data?.length || 0,
        pendingDeposits: depositsRes.data?.filter((d) => d.status === "pending").length || 0,
        pendingWithdrawals: withdrawalsRes.data?.filter((w) => w.status === "pending").length || 0,
        activeInvestments: investmentsRes.data?.filter((i) => i.status === "active").length || 0,
        totalBalance: depositsRes.data?.filter((d) => d.status === "approved").reduce((sum, d) => sum + d.amount, 0) || 0,
        openTickets: ticketsRes.data?.filter((t) => t.status === "open").length || 0,
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

      await supabase.from("notifications").insert({
        user_id: deposit.user_id,
        title: "Deposit Approved",
        message: `Your deposit of ${deposit.amount.toFixed(4)} BTC has been approved and added to your balance.`,
      });

      toast({ title: "Deposit Approved", description: `${deposit.amount.toFixed(4)} BTC approved successfully.` });
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
        message: `Your deposit of ${deposit.amount.toFixed(4)} BTC has been declined. Please contact support for more information.`,
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
        message: `Your withdrawal of ${withdrawal.amount.toFixed(4)} BTC has been processed. TXID: ${txid}`,
      });

      toast({ title: "Withdrawal Approved", description: `${withdrawal.amount.toFixed(4)} BTC sent successfully.` });
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
        message: `Your withdrawal of ${withdrawal.amount.toFixed(4)} BTC has been declined. Reason: ${reason || "Contact support for details."}`,
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
        message: `Your investment of ${investment.amount.toFixed(4)} BTC has been activated. Expected return: ${expectedReturn.toFixed(4)} BTC.`,
      });

      toast({ title: "Investment Activated", description: "Investment is now active." });
      fetchAllData();
    } catch (error) {
      console.error("Error activating investment:", error);
      toast({ title: "Error", description: "Failed to activate investment.", variant: "destructive" });
    }
  };

  const handleReplyToTicket = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          response: replyMessage,
          status: "resolved",
          responded_at: new Date().toISOString(),
          responded_by: user?.id,
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selectedTicket.user_id,
        title: "Support Ticket Replied",
        message: `Your support ticket "${selectedTicket.subject}" has received a response.`,
      });

      toast({ title: "Reply Sent", description: "Your response has been sent to the user." });
      setReplyDialogOpen(false);
      setReplyMessage("");
      setSelectedTicket(null);
      fetchAllData();
    } catch (error) {
      console.error("Error replying to ticket:", error);
      toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
    } finally {
      setIsReplying(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      // Update contact info
      const { error: contactError } = await supabase
        .from("site_settings")
        .update({ setting_value: JSON.parse(JSON.stringify(contactInfo)), updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("setting_key", "contact_info");

      if (contactError) throw contactError;

      // Update FAQ items
      const { error: faqError } = await supabase
        .from("site_settings")
        .update({ setting_value: JSON.parse(JSON.stringify(faqItems)), updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("setting_key", "faq_items");

      if (faqError) throw faqError;

      toast({ title: "Settings Saved", description: "Site settings have been updated." });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const addFAQItem = () => {
    setFaqItems([...faqItems, { question: "", answer: "" }]);
  };

  const removeFAQItem = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const updateFAQItem = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...faqItems];
    updated[index][field] = value;
    setFaqItems(updated);
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(4)} BTC`;

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
      case "open":
        return <Badge variant="outline" className="border-warning text-warning">{status}</Badge>;
      case "approved":
      case "active":
      case "completed":
      case "resolved":
        return <Badge variant="outline" className="border-success text-success">{status}</Badge>;
      case "declined":
      case "cancelled":
      case "closed":
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
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2 md:gap-3">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage users, transactions, and settings</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-6">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Users</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-warning" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Pending Dep.</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.pendingDeposits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <ArrowUpCircle className="w-6 h-6 md:w-8 md:h-8 text-warning" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Pending With.</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.pendingWithdrawals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-success" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Active Inv.</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.activeInvestments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Open Tickets</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.openTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Dep.</p>
                  <p className="text-lg md:text-2xl font-bold">{formatCurrency(stats.totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deposits" className="space-y-4">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value="deposits" className="text-xs md:text-sm">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs md:text-sm">Withdrawals</TabsTrigger>
            <TabsTrigger value="investments" className="text-xs md:text-sm">Investments</TabsTrigger>
            <TabsTrigger value="tickets" className="text-xs md:text-sm">Tickets</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">Users</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm">Settings</TabsTrigger>
          </TabsList>

          {/* Deposits Tab */}
          <TabsContent value="deposits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <ArrowDownCircle className="w-5 h-5 text-success" />
                  Deposit Requests
                </CardTitle>
                <CardDescription>Review and approve deposit requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
                ) : deposits.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No deposit requests</p>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {deposits.map((deposit) => (
                      <div key={deposit.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg gap-3 md:gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm md:text-base">{deposit.profiles?.email || "Unknown"}</span>
                            {getStatusBadge(deposit.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Amount: <span className="text-success font-semibold">{formatCurrency(deposit.amount)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(deposit.created_at)}</p>
                          {deposit.txid && <p className="text-xs text-muted-foreground break-all">TXID: {deposit.txid}</p>}
                        </div>
                        {deposit.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApproveDeposit(deposit)} className="bg-success hover:bg-success/90">
                              <CheckCircle className="w-4 h-4 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeclineDeposit(deposit)}>
                              <XCircle className="w-4 h-4 mr-1" />Decline
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
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <ArrowUpCircle className="w-5 h-5 text-primary" />
                  Withdrawal Requests
                </CardTitle>
                <CardDescription>Review and process withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
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
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  User Investments
                </CardTitle>
                <CardDescription>Manage and activate user investments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
                ) : investments.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No investments</p>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {investments.map((investment) => (
                      <div key={investment.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg gap-3 md:gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm md:text-base">{investment.profiles?.email || "Unknown"}</span>
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
                          <Button size="sm" onClick={() => handleActivateInvestment(investment)} className="bg-success hover:bg-success/90">
                            <CheckCircle className="w-4 h-4 mr-1" />Activate
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Support Tickets
                </CardTitle>
                <CardDescription>Respond to user support requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
                ) : tickets.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No support tickets</p>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="p-3 md:p-4 bg-muted/30 rounded-lg space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm md:text-base truncate">{ticket.subject}</span>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground">{ticket.profiles?.email || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(ticket.created_at)}</p>
                          </div>
                          {ticket.status === "open" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setReplyDialogOpen(true);
                              }}
                            >
                              <Reply className="w-4 h-4 mr-1" />Reply
                            </Button>
                          )}
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm">{ticket.message}</p>
                        </div>
                        {ticket.response && (
                          <div className="bg-success/10 border border-success/20 p-3 rounded-lg">
                            <p className="text-xs font-medium text-success mb-1">Your Response:</p>
                            <p className="text-sm">{ticket.response}</p>
                          </div>
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
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Users className="w-5 h-5 text-primary" />
                  All Users
                </CardTitle>
                <CardDescription>View registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}</div>
                ) : users.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No users found</p>
                ) : (
                  <div className="space-y-3">
                    {users
                      .filter((u) =>
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((u) => (
                        <div key={u.id} className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-medium text-sm md:text-base">{u.email[0].toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm md:text-base truncate">{u.full_name || "No Name"}</p>
                              <p className="text-xs md:text-sm text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {u.is_frozen && <Badge variant="destructive">Frozen</Badge>}
                            <span className="text-xs text-muted-foreground hidden md:inline">{formatDate(u.created_at)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-4 md:space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Settings className="w-5 h-5 text-primary" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>Edit the contact info shown to users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                        placeholder="support@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                        placeholder="+1 (888) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Live Chat Status</Label>
                      <Input
                        value={contactInfo.live_chat}
                        onChange={(e) => setContactInfo({ ...contactInfo, live_chat: e.target.value })}
                        placeholder="Available 24/7"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg md:text-xl">FAQ Items</CardTitle>
                      <CardDescription>Manage frequently asked questions</CardDescription>
                    </div>
                    <Button size="sm" onClick={addFAQItem}>
                      <Plus className="w-4 h-4 mr-1" />Add FAQ
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {faqItems.map((faq, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <Label>Question</Label>
                            <Input
                              value={faq.question}
                              onChange={(e) => updateFAQItem(index, "question", e.target.value)}
                              placeholder="Enter question..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Answer</Label>
                            <Textarea
                              value={faq.answer}
                              onChange={(e) => updateFAQItem(index, "answer", e.target.value)}
                              placeholder="Enter answer..."
                              rows={2}
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFAQItem(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {faqItems.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground">No FAQ items. Click "Add FAQ" to create one.</p>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">User Message:</p>
              <p className="text-sm">{selectedTicket?.message}</p>
            </div>
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReplyToTicket} disabled={isReplying || !replyMessage.trim()}>
              {isReplying ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

// Withdrawal Item Component
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
    <div className="p-3 md:p-4 bg-muted/30 rounded-lg space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm md:text-base">{withdrawal.profiles?.email || "Unknown"}</span>
            {getStatusBadge(withdrawal.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="text-primary font-semibold">{formatCurrency(withdrawal.amount)}</span>
          </p>
          <p className="text-xs text-muted-foreground break-all">Wallet: {withdrawal.wallet_address}</p>
          <p className="text-xs text-muted-foreground">{formatDate(withdrawal.created_at)}</p>
        </div>
      </div>

      {withdrawal.status === "pending" && (
        <div className="space-y-3 pt-3 border-t border-border">
          {!showDecline ? (
            <>
              <Input
                placeholder="Enter Transaction ID (TXID)"
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onApprove(withdrawal, txid)} className="bg-success hover:bg-success/90" disabled={!txid.trim()}>
                  <CheckCircle className="w-4 h-4 mr-1" />Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDecline(true)}>Decline</Button>
              </div>
            </>
          ) : (
            <>
              <Input placeholder="Reason for decline (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => onDecline(withdrawal, reason)}>
                  <XCircle className="w-4 h-4 mr-1" />Confirm Decline
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDecline(false)}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;

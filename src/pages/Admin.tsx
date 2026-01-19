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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  HelpCircle,
  Edit,
  Snowflake,
  Lock,
  Wallet,
  Activity,
  Bell,
  RefreshCw,
  AlertTriangle,
  Eye,
  Copy,
  Power,
} from "lucide-react";

// Interfaces
interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  is_frozen: boolean | null;
  created_at: string;
  phone: string | null;
  wallet_address: string | null;
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

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

interface DepositAddress {
  id: string;
  address: string;
  label: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface InvestmentPlan {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  min_amount: number;
  max_amount: number;
  roi_percentage: number;
  is_active: boolean | null;
  created_at: string;
}

interface WithdrawalSettings {
  min_investment_days: number;
  min_withdrawal_amount: number;
  withdrawals_enabled: boolean;
}

interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: unknown;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: string | null;
  title: string;
  message: string;
  is_read: boolean | null;
  created_at: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  live_chat: string;
}

interface DemoFeedSettings {
  enabled: boolean;
  mode: "demo" | "real" | "mixed";
  refresh_interval_seconds: number;
  min_deposit_usd: number;
  max_deposit_usd: number;
  min_investment_usd: number;
  max_investment_usd: number;
  min_withdrawal_usd: number;
  max_withdrawal_usd: number;
  activity_types: string[];
}

interface LandingStats {
  stat1_value: string;
  stat1_label: string;
  stat2_value: string;
  stat2_label: string;
  stat3_value: string;
  stat3_label: string;
}

interface ApiHealthStatus {
  coinmarketcap: { status: string; lastSync: string | null };
  coingecko: { status: string; lastSync: string | null };
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Core data
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  
  // New data
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>([]);
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [withdrawalSettings, setWithdrawalSettings] = useState<WithdrawalSettings>({
    min_investment_days: 7,
    min_withdrawal_amount: 0.001,
    withdrawals_enabled: true,
  });
  const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({
    coinmarketcap: { status: "unknown", lastSync: null },
    coingecko: { status: "unknown", lastSync: null },
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingInvestments: 0,
    activeInvestments: 0,
    totalBalance: 0,
    openTickets: 0,
  });

  // Settings state
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: "support@bitcryptotradingco.com",
    phone: "+1 (888) 123-4567",
    live_chat: "Available 24/7",
  });
  const [demoFeedSettings, setDemoFeedSettings] = useState<DemoFeedSettings>({
    enabled: true,
    mode: "demo",
    refresh_interval_seconds: 5,
    min_deposit_usd: 100,
    max_deposit_usd: 50000,
    min_investment_usd: 500,
    max_investment_usd: 25000,
    min_withdrawal_usd: 200,
    max_withdrawal_usd: 15000,
    activity_types: ["deposit", "investment", "withdrawal"],
  });
  const [landingStats, setLandingStats] = useState<LandingStats>({
    stat1_value: "$2.5B+",
    stat1_label: "Assets Managed",
    stat2_value: "150%",
    stat2_label: "Avg. Returns",
    stat3_value: "24/7",
    stat3_label: "Support",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Dialog states
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "general", display_order: 0, is_active: true });

  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DepositAddress | null>(null);
  const [addressForm, setAddressForm] = useState({ address: "", label: "", is_active: true });

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    duration_days: 30,
    min_amount: 0.001,
    max_amount: 10,
    roi_percentage: 150,
    is_active: true,
  });

  const [userActivityDialogOpen, setUserActivityDialogOpen] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<User | null>(null);
  const [userActivityLogs, setUserActivityLogs] = useState<AdminActivityLog[]>([]);

  // Auth check
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

  // Data fetching
  useEffect(() => {
    if (user && isAdmin) {
      fetchAllData();
      fetchSiteSettings();
      fetchFAQs();
      fetchDepositAddresses();
      fetchInvestmentPlans();
      fetchWithdrawalSettings();
      fetchAdminLogs();
      fetchNotifications();
      checkApiHealth();
    }
  }, [user, isAdmin]);

  const logAdminAction = async (action: string, targetType?: string, targetId?: string, details?: Record<string, unknown>) => {
    try {
      await supabase.from("admin_activity_logs").insert([{
        admin_id: user?.id,
        action,
        target_type: targetType || null,
        target_id: targetId || null,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
      }]);
      fetchAdminLogs();
    } catch (error) {
      console.error("Error logging admin action:", error);
    }
  };

  const fetchAdminLogs = async () => {
    const { data } = await supabase
      .from("admin_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setAdminLogs(data);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setNotifications(data);
  };

  const fetchDepositAddresses = async () => {
    const { data } = await supabase
      .from("deposit_addresses")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDepositAddresses(data);
  };

  const fetchInvestmentPlans = async () => {
    const { data } = await supabase
      .from("investment_plans")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInvestmentPlans(data);
  };

  const fetchWithdrawalSettings = async () => {
    const { data } = await supabase
      .from("withdrawal_settings")
      .select("*")
      .limit(1)
      .single();
    
    if (data) {
      setWithdrawalSettings({
        min_investment_days: data.min_investment_days || 7,
        min_withdrawal_amount: data.min_withdrawal_amount || 0.001,
        withdrawals_enabled: true,
      });
    }

    // Also check site_settings for global toggle
    const { data: siteData } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "withdrawals_enabled")
      .single();
    
    if (siteData) {
      setWithdrawalSettings(prev => ({
        ...prev,
        withdrawals_enabled: siteData.setting_value as boolean,
      }));
    }
  };

  const checkApiHealth = async () => {
    try {
      const response = await supabase.functions.invoke("crypto-data", {
        body: { symbols: "BTC" },
      });
      
      setApiHealth({
        coinmarketcap: {
          status: response.error ? "error" : "healthy",
          lastSync: new Date().toISOString(),
        },
        coingecko: {
          status: "fallback",
          lastSync: new Date().toISOString(),
        },
      });
    } catch {
      setApiHealth({
        coinmarketcap: { status: "error", lastSync: null },
        coingecko: { status: "error", lastSync: null },
      });
    }
  };

  const fetchFAQs = async () => {
    const { data } = await supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setFaqs(data);
  };

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
          if (setting.setting_key === "demo_feed_settings") {
            setDemoFeedSettings(setting.setting_value as unknown as DemoFeedSettings);
          }
          if (setting.setting_key === "landing_stats") {
            setLandingStats(setting.setting_value as unknown as LandingStats);
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
        pendingInvestments: investmentsRes.data?.filter((i) => i.status === "pending").length || 0,
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

  // User Management Actions
  const handleFreezeUser = async (userProfile: User) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_frozen: !userProfile.is_frozen })
        .eq("id", userProfile.id);

      if (error) throw error;

      await logAdminAction(
        userProfile.is_frozen ? "unfreeze_user" : "freeze_user",
        "user",
        userProfile.user_id,
        { email: userProfile.email }
      );

      toast({
        title: userProfile.is_frozen ? "Account Unfrozen" : "Account Frozen",
        description: `${userProfile.email}'s account has been ${userProfile.is_frozen ? "unfrozen" : "frozen"}.`,
      });
      fetchAllData();
    } catch (error) {
      console.error("Error toggling freeze:", error);
      toast({ title: "Error", description: "Failed to update account status.", variant: "destructive" });
    }
  };

  const handleForcePasswordReset = async (userProfile: User) => {
    try {
      const { error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: userProfile.email,
      });

      if (error) {
        // Fallback: Just notify the user
        await supabase.from("notifications").insert({
          user_id: userProfile.user_id,
          type: "system",
          title: "Password Reset Required",
          message: "An administrator has requested that you reset your password. Please use the 'Forgot Password' option to create a new password.",
        });
      }

      await logAdminAction("force_password_reset", "user", userProfile.user_id, { email: userProfile.email });

      toast({
        title: "Password Reset Initiated",
        description: `A password reset notification has been sent to ${userProfile.email}.`,
      });
    } catch (error) {
      console.error("Error forcing password reset:", error);
      toast({ title: "Error", description: "Failed to initiate password reset.", variant: "destructive" });
    }
  };

  const handleViewUserActivity = async (userProfile: User) => {
    setSelectedUserForActivity(userProfile);
    
    const { data } = await supabase
      .from("admin_activity_logs")
      .select("*")
      .eq("target_id", userProfile.user_id)
      .order("created_at", { ascending: false })
      .limit(50);
    
    setUserActivityLogs(data || []);
    setUserActivityDialogOpen(true);
  };

  // Deposit Actions
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

      await logAdminAction("approve_deposit", "deposit", deposit.id, { amount: deposit.amount, user_id: deposit.user_id });

      toast({ title: "Deposit Approved", description: `${deposit.amount.toFixed(4)} BTC approved successfully.` });
      fetchAllData();
    } catch (error) {
      console.error("Error approving deposit:", error);
      toast({ title: "Error", description: "Failed to approve deposit.", variant: "destructive" });
    }
  };

  const handleDeclineDeposit = async (deposit: Deposit, reason?: string) => {
    try {
      const { error } = await supabase
        .from("deposits")
        .update({
          status: "declined",
          admin_notes: reason || "Declined by admin",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", deposit.id);

      if (error) throw error;

      await logAdminAction("decline_deposit", "deposit", deposit.id, { amount: deposit.amount, reason });

      toast({ title: "Deposit Declined", description: "Deposit has been declined." });
      fetchAllData();
    } catch (error) {
      console.error("Error declining deposit:", error);
      toast({ title: "Error", description: "Failed to decline deposit.", variant: "destructive" });
    }
  };

  // Withdrawal Actions
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

      await logAdminAction("approve_withdrawal", "withdrawal", withdrawal.id, { amount: withdrawal.amount, txid });

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

      await logAdminAction("decline_withdrawal", "withdrawal", withdrawal.id, { amount: withdrawal.amount, reason });

      toast({ title: "Withdrawal Declined", description: "Withdrawal has been declined." });
      fetchAllData();
    } catch (error) {
      console.error("Error declining withdrawal:", error);
      toast({ title: "Error", description: "Failed to decline withdrawal.", variant: "destructive" });
    }
  };

  // Investment Actions - Updated for 24-hour rolling settlement model
  const handleActivateInvestment = async (investment: Investment) => {
    try {
      const activationTime = new Date();
      const { data: plan } = await supabase
        .from("investment_plans")
        .select("duration_days, roi_percentage")
        .eq("id", investment.plan_id)
        .single();

      if (!plan) throw new Error("Plan not found");

      const endDate = new Date(activationTime);
      endDate.setDate(endDate.getDate() + plan.duration_days);

      // Calculate total expected profit
      const totalProfit = investment.amount * plan.roi_percentage / 100;
      const expectedReturn = investment.amount + totalProfit;

      const { error } = await supabase
        .from("user_investments")
        .update({
          status: "active",
          start_date: activationTime.toISOString(),
          end_date: endDate.toISOString(),
          expected_return: expectedReturn,
          // New settlement fields
          activated_at: activationTime.toISOString(),
          last_settlement_at: activationTime.toISOString(),
          settlement_count: 0,
          accrued_profit: 0,
          total_profit: totalProfit,
        })
        .eq("id", investment.id);

      if (error) throw error;

      await logAdminAction("activate_investment", "investment", investment.id, { 
        amount: investment.amount,
        total_profit: totalProfit,
        duration_days: plan.duration_days,
      });

      toast({ 
        title: "Investment Activated", 
        description: `Investment is now active. Daily profit of ${(totalProfit / plan.duration_days).toFixed(8)} BTC will settle every 24 hours.` 
      });
      fetchAllData();
    } catch (error) {
      console.error("Error activating investment:", error);
      toast({ title: "Error", description: "Failed to activate investment.", variant: "destructive" });
    }
  };

  const handleDeclineInvestment = async (investment: Investment) => {
    try {
      const { error } = await supabase
        .from("user_investments")
        .update({ status: "cancelled" })
        .eq("id", investment.id);

      if (error) throw error;

      await logAdminAction("decline_investment", "investment", investment.id, { amount: investment.amount });

      toast({ title: "Investment Declined", description: "Investment has been declined." });
      fetchAllData();
    } catch (error) {
      console.error("Error declining investment:", error);
      toast({ title: "Error", description: "Failed to decline investment.", variant: "destructive" });
    }
  };

  // Deposit Address Actions
  const handleSaveAddress = async () => {
    try {
      if (editingAddress) {
        const { error } = await supabase
          .from("deposit_addresses")
          .update({
            address: addressForm.address,
            label: addressForm.label || null,
            is_active: addressForm.is_active,
          })
          .eq("id", editingAddress.id);

        if (error) throw error;
        await logAdminAction("update_deposit_address", "deposit_address", editingAddress.id);
        toast({ title: "Address Updated", description: "Deposit address has been updated." });
      } else {
        const { error } = await supabase.from("deposit_addresses").insert({
          address: addressForm.address,
          label: addressForm.label || null,
          is_active: addressForm.is_active,
        });

        if (error) throw error;
        await logAdminAction("create_deposit_address", "deposit_address");
        toast({ title: "Address Created", description: "New deposit address has been added." });
      }

      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm({ address: "", label: "", is_active: true });
      fetchDepositAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      toast({ title: "Error", description: "Failed to save deposit address.", variant: "destructive" });
    }
  };

  const handleToggleAddressActive = async (address: DepositAddress) => {
    try {
      const { error } = await supabase
        .from("deposit_addresses")
        .update({ is_active: !address.is_active })
        .eq("id", address.id);

      if (error) throw error;
      await logAdminAction("toggle_deposit_address", "deposit_address", address.id, { is_active: !address.is_active });
      fetchDepositAddresses();
    } catch (error) {
      console.error("Error toggling address:", error);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase.from("deposit_addresses").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete_deposit_address", "deposit_address", id);
      toast({ title: "Address Deleted", description: "Deposit address has been deleted." });
      fetchDepositAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({ title: "Error", description: "Failed to delete address.", variant: "destructive" });
    }
  };

  // Investment Plan Actions
  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from("investment_plans")
          .update({
            name: planForm.name,
            description: planForm.description || null,
            duration_days: planForm.duration_days,
            min_amount: planForm.min_amount,
            max_amount: planForm.max_amount,
            roi_percentage: planForm.roi_percentage,
            is_active: planForm.is_active,
          })
          .eq("id", editingPlan.id);

        if (error) throw error;
        await logAdminAction("update_investment_plan", "investment_plan", editingPlan.id);
        toast({ title: "Plan Updated", description: "Investment plan has been updated." });
      } else {
        const { error } = await supabase.from("investment_plans").insert({
          name: planForm.name,
          description: planForm.description || null,
          duration_days: planForm.duration_days,
          min_amount: planForm.min_amount,
          max_amount: planForm.max_amount,
          roi_percentage: planForm.roi_percentage,
          is_active: planForm.is_active,
        });

        if (error) throw error;
        await logAdminAction("create_investment_plan", "investment_plan");
        toast({ title: "Plan Created", description: "New investment plan has been created." });
      }

      setPlanDialogOpen(false);
      setEditingPlan(null);
      setPlanForm({ name: "", description: "", duration_days: 30, min_amount: 0.001, max_amount: 10, roi_percentage: 150, is_active: true });
      fetchInvestmentPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({ title: "Error", description: "Failed to save investment plan.", variant: "destructive" });
    }
  };

  const handleTogglePlanActive = async (plan: InvestmentPlan) => {
    try {
      const { error } = await supabase
        .from("investment_plans")
        .update({ is_active: !plan.is_active })
        .eq("id", plan.id);

      if (error) throw error;
      await logAdminAction("toggle_investment_plan", "investment_plan", plan.id, { is_active: !plan.is_active });
      fetchInvestmentPlans();
    } catch (error) {
      console.error("Error toggling plan:", error);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const { error } = await supabase.from("investment_plans").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete_investment_plan", "investment_plan", id);
      toast({ title: "Plan Deleted", description: "Investment plan has been deleted." });
      fetchInvestmentPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({ title: "Error", description: "Failed to delete plan.", variant: "destructive" });
    }
  };

  // Ticket Actions
  const handleReplyToTicket = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsReplying(true);
    try {
      await supabase.from("support_ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user?.id,
        sender_type: "admin",
        message: replyMessage,
      });

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
        type: "system",
        title: "Support Ticket Replied",
        message: `Your support ticket "${selectedTicket.subject}" has received a response.`,
      });

      await logAdminAction("reply_to_ticket", "support_ticket", selectedTicket.id);

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

  // FAQ Actions
  const handleSaveFaq = async () => {
    try {
      if (editingFaq) {
        const { error } = await supabase
          .from("faqs")
          .update({
            question: faqForm.question,
            answer: faqForm.answer,
            category: faqForm.category,
            display_order: faqForm.display_order,
            is_active: faqForm.is_active,
          })
          .eq("id", editingFaq.id);

        if (error) throw error;
        toast({ title: "FAQ Updated", description: "FAQ has been updated successfully." });
      } else {
        const { error } = await supabase.from("faqs").insert({
          question: faqForm.question,
          answer: faqForm.answer,
          category: faqForm.category,
          display_order: faqForm.display_order,
          is_active: faqForm.is_active,
        });

        if (error) throw error;
        toast({ title: "FAQ Created", description: "New FAQ has been created." });
      }

      setFaqDialogOpen(false);
      setEditingFaq(null);
      setFaqForm({ question: "", answer: "", category: "general", display_order: 0, is_active: true });
      fetchFAQs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast({ title: "Error", description: "Failed to save FAQ.", variant: "destructive" });
    }
  };

  const handleEditFaq = (faq: FAQ) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "general",
      display_order: faq.display_order ?? 0,
      is_active: faq.is_active ?? true,
    });
    setFaqDialogOpen(true);
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "FAQ Deleted", description: "FAQ has been deleted." });
      fetchFAQs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast({ title: "Error", description: "Failed to delete FAQ.", variant: "destructive" });
    }
  };

  const handleToggleFaqActive = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from("faqs")
        .update({ is_active: !faq.is_active })
        .eq("id", faq.id);

      if (error) throw error;
      fetchFAQs();
    } catch (error) {
      console.error("Error toggling FAQ:", error);
    }
  };

  // Settings Save
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const settingsToSave = [
        { key: "contact_info", value: contactInfo },
        { key: "demo_feed_settings", value: demoFeedSettings },
        { key: "landing_stats", value: landingStats },
        { key: "withdrawals_enabled", value: withdrawalSettings.withdrawals_enabled },
      ];

      for (const { key, value } of settingsToSave) {
        const { data: existing } = await supabase
          .from("site_settings")
          .select("id")
          .eq("setting_key", key)
          .single();

        if (existing) {
          await supabase
            .from("site_settings")
            .update({ setting_value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString(), updated_by: user?.id })
            .eq("setting_key", key);
        } else {
          await supabase.from("site_settings").insert({
            setting_key: key,
            setting_value: JSON.parse(JSON.stringify(value)),
            updated_by: user?.id,
          });
        }
      }

      // Save withdrawal settings
      const { data: existingWs } = await supabase.from("withdrawal_settings").select("id").limit(1).single();
      
      if (existingWs) {
        await supabase.from("withdrawal_settings").update({
          min_investment_days: withdrawalSettings.min_investment_days,
          min_withdrawal_amount: withdrawalSettings.min_withdrawal_amount,
          updated_by: user?.id,
        }).eq("id", existingWs.id);
      } else {
        await supabase.from("withdrawal_settings").insert({
          min_investment_days: withdrawalSettings.min_investment_days,
          min_withdrawal_amount: withdrawalSettings.min_withdrawal_amount,
          updated_by: user?.id,
        });
      }

      await logAdminAction("update_settings", "settings");
      toast({ title: "Settings Saved", description: "All settings have been updated." });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Utility Functions
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

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-primary/10 text-primary",
      investments: "bg-success/10 text-success",
      deposits: "bg-success/10 text-success",
      withdrawals: "bg-warning/10 text-warning",
      security: "bg-destructive/10 text-destructive",
    };
    return <Badge className={colors[category] || "bg-muted text-muted-foreground"}>{category}</Badge>;
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-7">
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
                  <p className="text-xs md:text-sm text-muted-foreground">Pend. Dep.</p>
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
                  <p className="text-xs md:text-sm text-muted-foreground">Pend. With.</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.pendingWithdrawals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Pend. Inv.</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.pendingInvestments}</p>
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
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="deposits" className="text-xs md:text-sm">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-xs md:text-sm">Withdrawals</TabsTrigger>
            <TabsTrigger value="investments" className="text-xs md:text-sm">Investments</TabsTrigger>
            <TabsTrigger value="plans" className="text-xs md:text-sm">Plans</TabsTrigger>
            <TabsTrigger value="addresses" className="text-xs md:text-sm">Addresses</TabsTrigger>
            <TabsTrigger value="tickets" className="text-xs md:text-sm">Tickets</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">Users</TabsTrigger>
            <TabsTrigger value="faqs" className="text-xs md:text-sm">FAQs</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm">Notifications</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs md:text-sm">Activity Feed</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs md:text-sm">Admin Logs</TabsTrigger>
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
                      <DepositItem
                        key={deposit.id}
                        deposit={deposit}
                        onApprove={handleApproveDeposit}
                        onDecline={handleDeclineDeposit}
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
                  Investments
                </CardTitle>
                <CardDescription>Manage user investments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
                ) : investments.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No investments</p>
                ) : (
                  <div className="space-y-3">
                    {investments.map((investment) => (
                      <div key={investment.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm md:text-base">{investment.profiles?.email || "Unknown"}</span>
                            {getStatusBadge(investment.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Plan: {investment.investment_plans?.name} | Amount: <span className="text-primary font-semibold">{formatCurrency(investment.amount)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(investment.created_at)}</p>
                        </div>
                        {investment.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleActivateInvestment(investment)} className="bg-success hover:bg-success/90">
                              <CheckCircle className="w-4 h-4 mr-1" />Activate
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeclineInvestment(investment)}>
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

          {/* Investment Plans Tab */}
          <TabsContent value="plans">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Investment Plans
                  </CardTitle>
                  <CardDescription>Create and manage investment plans</CardDescription>
                </div>
                <Button onClick={() => { setEditingPlan(null); setPlanForm({ name: "", description: "", duration_days: 30, min_amount: 0.001, max_amount: 10, roi_percentage: 150, is_active: true }); setPlanDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Plan
                </Button>
              </CardHeader>
              <CardContent>
                {investmentPlans.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No investment plans</p>
                ) : (
                  <div className="space-y-3">
                    {investmentPlans.map((plan) => (
                      <div key={plan.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{plan.name}</span>
                            {plan.is_active ? (
                              <Badge variant="outline" className="border-success text-success">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>Duration: {plan.duration_days} days</span>
                            <span>ROI: {plan.roi_percentage}%</span>
                            <span>Min: {plan.min_amount} BTC</span>
                            <span>Max: {plan.max_amount} BTC</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={plan.is_active ?? false} onCheckedChange={() => handleTogglePlanActive(plan)} />
                          <Button variant="ghost" size="icon" onClick={() => { setEditingPlan(plan); setPlanForm({ name: plan.name, description: plan.description || "", duration_days: plan.duration_days, min_amount: plan.min_amount, max_amount: plan.max_amount, roi_percentage: plan.roi_percentage, is_active: plan.is_active ?? true }); setPlanDialogOpen(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposit Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Wallet className="w-5 h-5 text-primary" />
                    Deposit Addresses
                  </CardTitle>
                  <CardDescription>Manage BTC deposit addresses</CardDescription>
                </div>
                <Button onClick={() => { setEditingAddress(null); setAddressForm({ address: "", label: "", is_active: true }); setAddressDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Address
                </Button>
              </CardHeader>
              <CardContent>
                {depositAddresses.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No deposit addresses configured</p>
                ) : (
                  <div className="space-y-3">
                    {depositAddresses.map((addr) => (
                      <div key={addr.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{addr.label || "Unlabeled"}</span>
                            {addr.is_active ? (
                              <Badge variant="outline" className="border-success text-success">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono break-all">{addr.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(addr.address); toast({ title: "Copied", description: "Address copied to clipboard." }); }}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Switch checked={addr.is_active ?? false} onCheckedChange={() => handleToggleAddressActive(addr)} />
                          <Button variant="ghost" size="icon" onClick={() => { setEditingAddress(addr); setAddressForm({ address: addr.address, label: addr.label || "", is_active: addr.is_active ?? true }); setAddressDialogOpen(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(addr.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
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
                <CardDescription>View and respond to support tickets</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
                ) : tickets.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No support tickets</p>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{ticket.subject}</span>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{ticket.profiles?.email || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(ticket.created_at)}</p>
                          </div>
                          {ticket.status === "open" && (
                            <Button size="sm" onClick={() => { setSelectedTicket(ticket); setReplyDialogOpen(true); }}>
                              <Reply className="w-4 h-4 mr-1" />Reply
                            </Button>
                          )}
                        </div>
                        <p className="text-sm bg-muted/50 p-3 rounded">{ticket.message}</p>
                        {ticket.response && (
                          <div className="bg-primary/10 p-3 rounded">
                            <p className="text-xs font-medium text-primary mb-1">Admin Response:</p>
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
                  User Management
                </CardTitle>
                <CardDescription>Search by email, name, phone, or wallet address</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No users found</p>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((userProfile) => (
                      <div key={userProfile.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{userProfile.full_name || "No Name"}</span>
                            {userProfile.is_frozen && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Snowflake className="w-3 h-3" />Frozen
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                          {userProfile.phone && <p className="text-xs text-muted-foreground">Phone: {userProfile.phone}</p>}
                          {userProfile.wallet_address && <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">Wallet: {userProfile.wallet_address}</p>}
                          <p className="text-xs text-muted-foreground">Joined: {formatDate(userProfile.created_at)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant={userProfile.is_frozen ? "default" : "destructive"} onClick={() => handleFreezeUser(userProfile)}>
                            {userProfile.is_frozen ? <Power className="w-4 h-4 mr-1" /> : <Snowflake className="w-4 h-4 mr-1" />}
                            {userProfile.is_frozen ? "Unfreeze" : "Freeze"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleForcePasswordReset(userProfile)}>
                            <Lock className="w-4 h-4 mr-1" />Reset PW
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleViewUserActivity(userProfile)}>
                            <Eye className="w-4 h-4 mr-1" />Activity
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    FAQs Management
                  </CardTitle>
                  <CardDescription>Create and manage FAQs</CardDescription>
                </div>
                <Button onClick={() => { setEditingFaq(null); setFaqForm({ question: "", answer: "", category: "general", display_order: 0, is_active: true }); setFaqDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add FAQ
                </Button>
              </CardHeader>
              <CardContent>
                {faqs.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No FAQs created</p>
                ) : (
                  <div className="space-y-3">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{faq.question}</span>
                              {getCategoryBadge(faq.category || "general")}
                              {!faq.is_active && <Badge variant="secondary">Hidden</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                            <p className="text-xs text-muted-foreground">Order: {faq.display_order ?? 0}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Switch checked={faq.is_active ?? false} onCheckedChange={() => handleToggleFaqActive(faq)} />
                            <Button variant="ghost" size="icon" onClick={() => handleEditFaq(faq)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteFaq(faq.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications Center
                </CardTitle>
                <CardDescription>View all system notifications</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No notifications</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`p-3 rounded-lg ${notif.is_read ? "bg-muted/20" : "bg-muted/50"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{notif.title}</span>
                              <Badge variant="outline" className="text-xs">{notif.type || "system"}</Badge>
                              {!notif.is_read && <Badge className="bg-primary text-xs">New</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{notif.message}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(notif.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Feed Tab */}
          <TabsContent value="activity">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Activity className="w-5 h-5 text-primary" />
                    Demo Activity Feed Settings
                  </CardTitle>
                  <CardDescription>Control the live activity ticker on the landing page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Enable Demo Mode</Label>
                      <p className="text-sm text-muted-foreground">Show simulated activity on the landing page</p>
                    </div>
                    <Switch
                      checked={demoFeedSettings.enabled}
                      onCheckedChange={(v) => setDemoFeedSettings({ ...demoFeedSettings, enabled: v })}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select value={demoFeedSettings.mode} onValueChange={(v: "demo" | "real" | "mixed") => setDemoFeedSettings({ ...demoFeedSettings, mode: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">Demo Only</SelectItem>
                          <SelectItem value="real">Real Only</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Refresh Interval (seconds)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={demoFeedSettings.refresh_interval_seconds}
                        onChange={(e) => setDemoFeedSettings({ ...demoFeedSettings, refresh_interval_seconds: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Amount Ranges (USD)</Label>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-3 p-4 bg-success/5 border border-success/20 rounded-lg">
                        <Label className="text-success">Deposits</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Min</Label>
                            <Input type="number" value={demoFeedSettings.min_deposit_usd} onChange={(e) => setDemoFeedSettings({ ...demoFeedSettings, min_deposit_usd: parseInt(e.target.value) || 100 })} />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Max</Label>
                            <Input type="number" value={demoFeedSettings.max_deposit_usd} onChange={(e) => setDemoFeedSettings({ ...demoFeedSettings, max_deposit_usd: parseInt(e.target.value) || 50000 })} />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <Label className="text-primary">Investments</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Min</Label>
                            <Input type="number" value={demoFeedSettings.min_investment_usd} onChange={(e) => setDemoFeedSettings({ ...demoFeedSettings, min_investment_usd: parseInt(e.target.value) || 500 })} />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Max</Label>
                            <Input type="number" value={demoFeedSettings.max_investment_usd} onChange={(e) => setDemoFeedSettings({ ...demoFeedSettings, max_investment_usd: parseInt(e.target.value) || 25000 })} />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                        <Label className="text-warning">Withdrawals</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Min</Label>
                            <Input type="number" value={demoFeedSettings.min_withdrawal_usd} onChange={(e) => setDemoFeedSettings({ ...demoFeedSettings, min_withdrawal_usd: parseInt(e.target.value) || 200 })} />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Max</Label>
                            <Input type="number" value={demoFeedSettings.max_withdrawal_usd} onChange={(e) => setDemoFeedSettings({ ...demoFeedSettings, max_withdrawal_usd: parseInt(e.target.value) || 15000 })} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Activity Types</Label>
                    <div className="flex flex-wrap gap-4">
                      {["deposit", "investment", "withdrawal"].map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <Switch
                            checked={demoFeedSettings.activity_types.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setDemoFeedSettings({ ...demoFeedSettings, activity_types: [...demoFeedSettings.activity_types, type] });
                              } else {
                                setDemoFeedSettings({ ...demoFeedSettings, activity_types: demoFeedSettings.activity_types.filter(t => t !== type) });
                              }
                            }}
                          />
                          <Label className="capitalize">{type}s</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingSettings ? "Saving..." : "Save Activity Settings"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Admin Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Activity className="w-5 h-5 text-primary" />
                    Admin Activity Logs
                  </CardTitle>
                  <CardDescription>Audit trail of all admin actions (immutable)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAdminLogs}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {adminLogs.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No admin activity logged</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {adminLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-muted/30 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{log.action}</Badge>
                            {log.target_type && <Badge variant="secondary">{log.target_type}</Badge>}
                          </div>
                          {log.details && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* API Health Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Activity className="w-5 h-5 text-primary" />
                    API Health Status
                  </CardTitle>
                  <CardDescription>Monitor crypto data API status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">CoinMarketCap</p>
                        <p className="text-xs text-muted-foreground">Primary data source</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {apiHealth.coinmarketcap.status === "healthy" ? (
                          <Badge className="bg-success">Healthy</Badge>
                        ) : apiHealth.coinmarketcap.status === "error" ? (
                          <Badge variant="destructive">Error</Badge>
                        ) : (
                          <Badge variant="secondary">Unknown</Badge>
                        )}
                        <Button variant="outline" size="sm" onClick={checkApiHealth}>
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">CoinGecko</p>
                        <p className="text-xs text-muted-foreground">Fallback source</p>
                      </div>
                      <Badge variant="outline">Fallback Ready</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawal Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <ArrowUpCircle className="w-5 h-5 text-primary" />
                    Withdrawal Settings
                  </CardTitle>
                  <CardDescription>Configure withdrawal rules and limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Enable Withdrawals</Label>
                      <p className="text-sm text-muted-foreground">Global toggle to enable/disable all withdrawals</p>
                    </div>
                    <Switch
                      checked={withdrawalSettings.withdrawals_enabled}
                      onCheckedChange={(v) => setWithdrawalSettings({ ...withdrawalSettings, withdrawals_enabled: v })}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Minimum Investment Days</Label>
                      <Input
                        type="number"
                        min={0}
                        value={withdrawalSettings.min_investment_days}
                        onChange={(e) => setWithdrawalSettings({ ...withdrawalSettings, min_investment_days: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">User must have an active investment for this many days before withdrawing</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Withdrawal Amount (BTC)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        min={0}
                        value={withdrawalSettings.min_withdrawal_amount}
                        onChange={(e) => setWithdrawalSettings({ ...withdrawalSettings, min_withdrawal_amount: parseFloat(e.target.value) || 0.001 })}
                      />
                      <p className="text-xs text-muted-foreground">Minimum BTC amount for withdrawal requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Landing Page Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Landing Page Statistics
                  </CardTitle>
                  <CardDescription>Edit the statistics shown on the landing page hero section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <Label>Stat 1 Value</Label>
                        <Input value={landingStats.stat1_value} onChange={(e) => setLandingStats({ ...landingStats, stat1_value: e.target.value })} placeholder="$2.5B+" />
                      </div>
                      <div className="space-y-2">
                        <Label>Stat 1 Label</Label>
                        <Input value={landingStats.stat1_label} onChange={(e) => setLandingStats({ ...landingStats, stat1_label: e.target.value })} placeholder="Assets Managed" />
                      </div>
                    </div>
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <Label>Stat 2 Value</Label>
                        <Input value={landingStats.stat2_value} onChange={(e) => setLandingStats({ ...landingStats, stat2_value: e.target.value })} placeholder="150%" />
                      </div>
                      <div className="space-y-2">
                        <Label>Stat 2 Label</Label>
                        <Input value={landingStats.stat2_label} onChange={(e) => setLandingStats({ ...landingStats, stat2_label: e.target.value })} placeholder="Avg. Returns" />
                      </div>
                    </div>
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <Label>Stat 3 Value</Label>
                        <Input value={landingStats.stat3_value} onChange={(e) => setLandingStats({ ...landingStats, stat3_value: e.target.value })} placeholder="24/7" />
                      </div>
                      <div className="space-y-2">
                        <Label>Stat 3 Label</Label>
                        <Input value={landingStats.stat3_label} onChange={(e) => setLandingStats({ ...landingStats, stat3_label: e.target.value })} placeholder="Support" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                      <Input value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} placeholder="support@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} placeholder="+1 (888) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label>Live Chat Status</Label>
                      <Input value={contactInfo.live_chat} onChange={(e) => setContactInfo({ ...contactInfo, live_chat: e.target.value })} placeholder="Available 24/7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingSettings ? "Saving..." : "Save All Settings"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* FAQ Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
            <DialogDescription>{editingFaq ? "Update the FAQ details below." : "Create a new frequently asked question."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} placeholder="Enter the question..." />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} placeholder="Enter the answer..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={faqForm.category} onValueChange={(v) => setFaqForm({ ...faqForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="investments">Investments</SelectItem>
                    <SelectItem value="deposits">Deposits</SelectItem>
                    <SelectItem value="withdrawals">Withdrawals</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={faqForm.display_order} onChange={(e) => setFaqForm({ ...faqForm, display_order: parseInt(e.target.value) || 0 })} min={0} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={faqForm.is_active} onCheckedChange={(v) => setFaqForm({ ...faqForm, is_active: v })} />
              <Label>Active (visible to users)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFaq} disabled={!faqForm.question.trim() || !faqForm.answer.trim()}>{editingFaq ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to Ticket</DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">User Message:</p>
              <p className="text-sm">{selectedTicket?.message}</p>
            </div>
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type your response..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReplyToTicket} disabled={isReplying || !replyMessage.trim()}>{isReplying ? "Sending..." : "Send Reply"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Deposit Address" : "Add Deposit Address"}</DialogTitle>
            <DialogDescription>Manage BTC deposit addresses for users</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>BTC Address</Label>
              <Input value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} placeholder="bc1q..." className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} placeholder="Main wallet" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={addressForm.is_active} onCheckedChange={(v) => setAddressForm({ ...addressForm, is_active: v })} />
              <Label>Active (shown to users)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress} disabled={!addressForm.address.trim()}>{editingAddress ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Investment Plan" : "Create Investment Plan"}</DialogTitle>
            <DialogDescription>Configure investment plan details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Gold Plan" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Plan description..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Input type="number" value={planForm.duration_days} onChange={(e) => setPlanForm({ ...planForm, duration_days: parseInt(e.target.value) || 30 })} min={1} />
              </div>
              <div className="space-y-2">
                <Label>ROI (%)</Label>
                <Input type="number" value={planForm.roi_percentage} onChange={(e) => setPlanForm({ ...planForm, roi_percentage: parseFloat(e.target.value) || 100 })} min={0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Amount (BTC)</Label>
                <Input type="number" step="0.0001" value={planForm.min_amount} onChange={(e) => setPlanForm({ ...planForm, min_amount: parseFloat(e.target.value) || 0.001 })} min={0} />
              </div>
              <div className="space-y-2">
                <Label>Max Amount (BTC)</Label>
                <Input type="number" step="0.0001" value={planForm.max_amount} onChange={(e) => setPlanForm({ ...planForm, max_amount: parseFloat(e.target.value) || 10 })} min={0} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={planForm.is_active} onCheckedChange={(v) => setPlanForm({ ...planForm, is_active: v })} />
              <Label>Active (available for purchase)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={!planForm.name.trim()}>{editingPlan ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Activity Dialog */}
      <Dialog open={userActivityDialogOpen} onOpenChange={setUserActivityDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Activity Log</DialogTitle>
            <DialogDescription>{selectedUserForActivity?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto py-4">
            {userActivityLogs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No admin activity for this user</p>
            ) : (
              userActivityLogs.map((log) => (
                <div key={log.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.action}</Badge>
                      {log.details && <span className="text-xs text-muted-foreground">{JSON.stringify(log.details)}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserActivityDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

// Deposit Item Component
const DepositItem = ({
  deposit,
  onApprove,
  onDecline,
  formatCurrency,
  formatDate,
  getStatusBadge,
}: {
  deposit: Deposit;
  onApprove: (d: Deposit) => void;
  onDecline: (d: Deposit, reason?: string) => void;
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
  getStatusBadge: (s: string) => JSX.Element;
}) => {
  const [reason, setReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  return (
    <div className="p-3 md:p-4 bg-muted/30 rounded-lg space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
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
      </div>

      {deposit.status === "pending" && (
        <div className="space-y-3 pt-3 border-t border-border">
          {!showDecline ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onApprove(deposit)} className="bg-success hover:bg-success/90">
                <CheckCircle className="w-4 h-4 mr-1" />Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDecline(true)}>Decline</Button>
            </div>
          ) : (
            <>
              <Input placeholder="Reason for decline (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => onDecline(deposit, reason)}>
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
              <Input placeholder="Enter Transaction ID (TXID)" value={txid} onChange={(e) => setTxid(e.target.value)} />
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

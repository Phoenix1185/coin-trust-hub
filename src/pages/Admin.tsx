import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import LiveChatAdmin from "@/components/LiveChatAdmin";
import BlogAdmin from "@/components/BlogAdmin";
import EmailTemplatesAdmin from "@/components/EmailTemplatesAdmin";
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
  MinusCircle,
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
  phone_number: string | null;
  wallet_address: string | null;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  txid: string | null;
  payment_method: string | null;
  admin_notes: string | null;
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
  payment_method: string | null;
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
  duration_hours: number | null;
  min_amount: number;
  max_amount: number;
  roi_percentage: number;
  is_active: boolean | null;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string | null;
  wallet_address: string | null;
  instructions: string | null;
  is_active: boolean | null;
  display_order: number | null;
  network_addresses: unknown;
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
  const [btcPrice, setBtcPrice] = useState<number>(100000);

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [withdrawalSettings, setWithdrawalSettings] = useState<WithdrawalSettings>({
    min_investment_days: 7,
    min_withdrawal_amount: 0.001,
    withdrawals_enabled: true,
  });
  const [depositsEnabled, setDepositsEnabled] = useState(true);

  // Add Funds state
  const [addFundsSearch, setAddFundsSearch] = useState("");
  const [addFundsUser, setAddFundsUser] = useState<User | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [addFundsCurrency, setAddFundsCurrency] = useState<"BTC" | "USD" | "EUR">("USD");
  const [addFundsStatus, setAddFundsStatus] = useState<"pending" | "approved">("pending");
  const [addFundsNote, setAddFundsNote] = useState("");
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [addFundsSearching, setAddFundsSearching] = useState(false);

  // Remove Funds state
  const [removeFundsSearch, setRemoveFundsSearch] = useState("");
  const [removeFundsUser, setRemoveFundsUser] = useState<User | null>(null);
  const [removeFundsAmount, setRemoveFundsAmount] = useState("");
  const [removeFundsCurrency, setRemoveFundsCurrency] = useState<"BTC" | "USD">("USD");
  const [removeFundsReason, setRemoveFundsReason] = useState("");
  const [isRemovingFunds, setIsRemovingFunds] = useState(false);
  const [removeFundsSearching, setRemoveFundsSearching] = useState(false);
  const [userDeposits, setUserDeposits] = useState<Deposit[]>([]);
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
  const [companyAddress, setCompanyAddress] = useState("123 Crypto Street, New York, NY 10001");
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
    duration_hours: null as number | null,
    duration_type: "days" as "days" | "hours",
    min_amount: 0.001,
    max_amount: 10,
    roi_percentage: 150,
    is_active: true,
  });

  const openNewPlanDialog = () => {
    setEditingPlan(null);
    setPlanForm({ name: "", description: "", duration_days: 30, duration_hours: null, duration_type: "days", min_amount: 0.001, max_amount: 10, roi_percentage: 150, is_active: true });
    setPlanDialogOpen(true);
  };

  const openEditPlanDialog = (plan: InvestmentPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      duration_days: plan.duration_days,
      duration_hours: plan.duration_hours,
      duration_type: plan.duration_hours ? "hours" : "days",
      min_amount: plan.min_amount,
      max_amount: plan.max_amount,
      roi_percentage: plan.roi_percentage,
      is_active: plan.is_active ?? true,
    });
    setPlanDialogOpen(true);
  };

  const [userActivityDialogOpen, setUserActivityDialogOpen] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<User | null>(null);
  const [userActivityLogs, setUserActivityLogs] = useState<AdminActivityLog[]>([]);

  // Payment Method Dialog states
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    name: "",
    type: "both",
    icon: "bitcoin",
    description: "",
    wallet_address: "",
    instructions: "",
    display_order: 0,
    is_active: true,
    network_addresses: {} as Record<string, string>,
  });

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
      fetchPaymentMethods();
      fetchWithdrawalSettings();
      fetchAdminLogs();
      fetchNotifications();
      checkApiHealth();
      fetchBtcPrice();
    }
  }, [user, isAdmin]);

  const fetchBtcPrice = async () => {
    try {
      const { data } = await supabase.functions.invoke("crypto-data", { body: {} });
      if (data && Array.isArray(data)) {
        const btc = data.find((c: any) => c.symbol === "BTC");
        if (btc?.price && btc.price > 0) setBtcPrice(btc.price);
      }
    } catch (err) {
      console.error("Error fetching BTC price for admin:", err);
    }
  };

  const sendEmailNotification = async (type: string, userId: string, data: Record<string, unknown>) => {
    try {
      await supabase.functions.invoke("send-email", {
        body: { type, user_id: userId, data },
      });
    } catch (err) {
      console.error("Error sending email notification:", err);
    }
  };

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

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setPaymentMethods(data);
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
          if (setting.setting_key === "deposits_enabled") {
            setDepositsEnabled(setting.setting_value as unknown as boolean);
          }
          if (setting.setting_key === "company_address") {
            setCompanyAddress(setting.setting_value as unknown as string);
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

      sendEmailNotification(
        userProfile.is_frozen ? "account_unfrozen" : "account_frozen",
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

  // Deposit Actions - with automatic debt recovery
  const handleApproveDeposit = async (deposit: Deposit) => {
    try {
      // 1. Check for outstanding ADMIN_DEBT_RECOVERY records for this user
      const { data: debtRecords } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", deposit.user_id)
        .eq("wallet_address", "ADMIN_DEBT_RECOVERY")
        .eq("status", "approved");

      const totalDebt = debtRecords?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      // 2. Approve the deposit
      const { error } = await supabase
        .from("deposits")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", deposit.id);

      if (error) throw error;

      // 3. Auto-deduct debt from this deposit if applicable
      let debtDeducted = 0;
      if (totalDebt > 0) {
        debtDeducted = Math.min(totalDebt, deposit.amount);

        // Create a withdrawal to offset the debt
        await supabase.from("withdrawals").insert({
          user_id: deposit.user_id,
          amount: debtDeducted,
          wallet_address: "ADMIN_DEBT_DEDUCTION",
          status: "approved",
          payment_method: "Automatic Debt Recovery",
          admin_txid: `DEDUCT_${Date.now()}`,
          decline_reason: `Automatic deduction of ${debtDeducted.toFixed(8)} BTC from deposit to recover outstanding debt of ${totalDebt.toFixed(8)} BTC.`,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        });

        // Remove the old debt records (mark as resolved by deleting via update)
        for (const debt of debtRecords || []) {
          await supabase
            .from("withdrawals")
            .update({
              decline_reason: `[RESOLVED] ${debt.decline_reason || ''} — Recovered ${debtDeducted.toFixed(8)} BTC from deposit on ${new Date().toISOString()}`,
              wallet_address: "ADMIN_DEBT_RESOLVED",
            })
            .eq("id", debt.id);
        }

        // If partial debt remains, create new debt record for remainder
        if (totalDebt > debtDeducted) {
          const remainingDebt = totalDebt - debtDeducted;
          await supabase.from("withdrawals").insert({
            user_id: deposit.user_id,
            amount: remainingDebt,
            wallet_address: "ADMIN_DEBT_RECOVERY",
            status: "approved",
            payment_method: "Admin Debt Recovery",
            admin_txid: `DEBT_REMAINDER_${Date.now()}`,
            decline_reason: `Remaining debt after partial recovery. Original: ${totalDebt.toFixed(8)} BTC, Recovered: ${debtDeducted.toFixed(8)} BTC, Remaining: ${remainingDebt.toFixed(8)} BTC`,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
          });
        }

        // Notify user about debt deduction
        await supabase.from("notifications").insert({
          user_id: deposit.user_id,
          type: "system",
          title: "Debt Recovery Applied",
          message: `${debtDeducted.toFixed(8)} BTC has been automatically deducted from your deposit to settle an outstanding balance.${totalDebt > debtDeducted ? ` Remaining debt: ${(totalDebt - debtDeducted).toFixed(8)} BTC.` : ' Your debt has been fully cleared.'}`,
        });

        await logAdminAction("auto_debt_recovery", "deposit", deposit.id, {
          deposit_amount: deposit.amount,
          total_debt: totalDebt,
          debt_deducted: debtDeducted,
          remaining_debt: totalDebt - debtDeducted,
        });
      }

      await logAdminAction("approve_deposit", "deposit", deposit.id, { amount: deposit.amount, user_id: deposit.user_id, debt_deducted: debtDeducted });

      // Send email notification
      sendEmailNotification("deposit_approved", deposit.user_id, {
        amount: deposit.amount.toFixed(4),
        payment_method: deposit.payment_method,
        debt_deducted: debtDeducted > 0 ? debtDeducted.toFixed(8) : null,
      });

      const debtMsg = debtDeducted > 0 ? ` (${debtDeducted.toFixed(8)} BTC auto-deducted for debt recovery)` : '';
      toast({ title: "Deposit Confirmed", description: `${deposit.amount.toFixed(4)} BTC confirmed successfully.${debtMsg}` });
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

      // Send email notification
      sendEmailNotification("deposit_declined", deposit.user_id, {
        amount: deposit.amount.toFixed(4),
        reason: reason || "Declined by admin",
      });

      toast({ title: "Deposit Rejected", description: "Deposit has been marked as unconfirmed." });
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

      sendEmailNotification("withdrawal_approved", withdrawal.user_id, {
        amount: withdrawal.amount.toFixed(4),
        txid,
        wallet_address: withdrawal.wallet_address,
      });

      toast({ title: "Withdrawal Processed", description: `${withdrawal.amount.toFixed(4)} BTC sent successfully.` });
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

      sendEmailNotification("withdrawal_declined", withdrawal.user_id, {
        amount: withdrawal.amount.toFixed(4),
        reason: reason || "Request declined by admin.",
      });

      toast({ title: "Withdrawal Rejected", description: "Withdrawal has been rejected." });
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

      sendEmailNotification("investment_activated", investment.user_id, {
        amount: investment.amount.toFixed(4),
        plan_name: investment.investment_plans?.name,
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

      sendEmailNotification("investment_declined", investment.user_id, {
        amount: investment.amount.toFixed(4),
      });

      toast({ title: "Investment Cancelled", description: "Investment has been cancelled." });
      fetchAllData();
    } catch (error) {
      console.error("Error declining investment:", error);
      toast({ title: "Error", description: "Failed to decline investment.", variant: "destructive" });
    }
  };

  // Manual Settlement Trigger
  const [isRunningSettlement, setIsRunningSettlement] = useState(false);
  const [lastSettlementResult, setLastSettlementResult] = useState<{ settlementsProcessed: number; completionsProcessed: number } | null>(null);

  const handleRunSettlement = async () => {
    setIsRunningSettlement(true);
    try {
      const { data, error } = await supabase.functions.invoke("settlement-engine", {
        body: { trigger: "manual" },
      });

      if (error) throw error;

      await logAdminAction("manual_settlement", "settlement", undefined, data);

      setLastSettlementResult({
        settlementsProcessed: data?.settlementsProcessed || 0,
        completionsProcessed: data?.completionsProcessed || 0,
      });

      toast({
        title: "Settlement Complete",
        description: `Processed ${data?.settlementsProcessed || 0} settlements and ${data?.completionsProcessed || 0} completions.`,
      });
      
      fetchAllData();
    } catch (error) {
      console.error("Error running settlement:", error);
      toast({ title: "Error", description: "Failed to run settlement engine.", variant: "destructive" });
    } finally {
      setIsRunningSettlement(false);
    }
  };

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
      const durationDays = planForm.duration_type === "days" ? planForm.duration_days : 0;
      const durationHours = planForm.duration_type === "hours" ? planForm.duration_hours : null;

      if (editingPlan) {
        const { error } = await supabase
          .from("investment_plans")
          .update({
            name: planForm.name,
            description: planForm.description || null,
            duration_days: durationDays,
            duration_hours: durationHours,
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
          duration_days: durationDays,
          duration_hours: durationHours,
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
      setPlanForm({ name: "", description: "", duration_days: 30, duration_hours: null, duration_type: "days", min_amount: 0.001, max_amount: 10, roi_percentage: 150, is_active: true });
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

  // Payment Method Actions
  const handleSavePaymentMethod = async () => {
    try {
      if (editingPaymentMethod) {
        const { error } = await supabase
          .from("payment_methods")
          .update({
            name: paymentMethodForm.name,
            type: paymentMethodForm.type,
            icon: paymentMethodForm.icon,
            description: paymentMethodForm.description || null,
            wallet_address: paymentMethodForm.wallet_address || null,
            instructions: paymentMethodForm.instructions || null,
            display_order: paymentMethodForm.display_order,
            is_active: paymentMethodForm.is_active,
            network_addresses: Object.keys(paymentMethodForm.network_addresses).length > 0 ? paymentMethodForm.network_addresses : null,
          })
          .eq("id", editingPaymentMethod.id);

        if (error) throw error;
        await logAdminAction("update_payment_method", "payment_method", editingPaymentMethod.id);
        toast({ title: "Payment Method Updated", description: "Payment method has been updated." });
      } else {
        const { error } = await supabase.from("payment_methods").insert({
          name: paymentMethodForm.name,
          type: paymentMethodForm.type,
          icon: paymentMethodForm.icon,
          description: paymentMethodForm.description || null,
          wallet_address: paymentMethodForm.wallet_address || null,
          instructions: paymentMethodForm.instructions || null,
          display_order: paymentMethodForm.display_order,
          is_active: paymentMethodForm.is_active,
          network_addresses: Object.keys(paymentMethodForm.network_addresses).length > 0 ? paymentMethodForm.network_addresses : null,
        });

        if (error) throw error;
        await logAdminAction("create_payment_method", "payment_method");
        toast({ title: "Payment Method Created", description: "New payment method has been added." });
      }

      setPaymentMethodDialogOpen(false);
      setEditingPaymentMethod(null);
      setPaymentMethodForm({ name: "", type: "both", icon: "bitcoin", description: "", wallet_address: "", instructions: "", display_order: 0, is_active: true, network_addresses: {} });
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({ title: "Error", description: "Failed to save payment method.", variant: "destructive" });
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete_payment_method", "payment_method", id);
      toast({ title: "Payment Method Deleted", description: "Payment method has been deleted." });
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({ title: "Error", description: "Failed to delete payment method.", variant: "destructive" });
    }
  };

  const handleCloseTicket = async (ticket: SupportTicket) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "closed" })
        .eq("id", ticket.id);

      if (error) throw error;

      await logAdminAction("close_ticket", "support_ticket", ticket.id);
      toast({ title: "Ticket Closed", description: "Support ticket has been closed." });
      fetchAllData();
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast({ title: "Error", description: "Failed to close ticket.", variant: "destructive" });
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

  // Add Funds - Search user by email/phone/username
  const handleSearchUser = async () => {
    if (!addFundsSearch.trim()) return;
    setAddFundsSearching(true);
    setAddFundsUser(null);

    const term = addFundsSearch.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === term ||
        u.phone?.toLowerCase() === term ||
        (u as any).phone_number?.toLowerCase() === term ||
        u.full_name?.toLowerCase() === term ||
        u.email.split("@")[0].toLowerCase() === term
    );

    if (found) {
      setAddFundsUser(found);
    } else {
      // Try partial match
      const partial = users.find(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          u.phone?.toLowerCase().includes(term) ||
          (u as any).phone_number?.toLowerCase().includes(term) ||
          u.full_name?.toLowerCase().includes(term)
      );
      if (partial) {
        setAddFundsUser(partial);
      } else {
        toast({ title: "User Not Found", description: "No user matches that email, phone, or username.", variant: "destructive" });
      }
    }
    setAddFundsSearching(false);
  };

  // Convert add funds amount to BTC based on selected currency
  const getAddFundsBtcAmount = (): number => {
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) return 0;
    if (addFundsCurrency === "BTC") return amount;
    // Use a simple fetch of current BTC price from the crypto-data edge function
    // For now we use the exchange rates: USD=1, EUR=0.92
    const usdAmount = addFundsCurrency === "EUR" ? amount / 0.92 : amount;
    // We need BTC price - fetch it inline or use a rough estimate
    return usdAmount; // Will be converted below using actual price
  };

  const handleAddFunds = async () => {
    if (!addFundsUser || !addFundsAmount) return;

    const inputAmount = parseFloat(addFundsAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }

    setIsAddingFunds(true);
    try {
      let btcAmount = inputAmount;
      
      if (addFundsCurrency !== "BTC") {
        // Fetch current BTC price for conversion
        const { data: cryptoData } = await supabase.functions.invoke("crypto-data", { body: {} });
        const btcPrice = cryptoData?.find((c: any) => c.symbol === "BTC")?.price || 100000;
        
        let usdAmount = inputAmount;
        if (addFundsCurrency === "EUR") {
          // Fetch exchange rates
          const { data: ratesData } = await supabase.functions.invoke("exchange-rates", { body: {} });
          const eurRate = ratesData?.rates?.EUR || 0.92;
          usdAmount = inputAmount / eurRate;
        }
        btcAmount = usdAmount / btcPrice;
      }

      const { error } = await supabase.from("deposits").insert({
        user_id: addFundsUser.user_id,
        amount: btcAmount,
        status: addFundsStatus,
        txid: null,
        payment_method: "Admin Manual",
        admin_notes: addFundsNote || `Added ${inputAmount} ${addFundsCurrency}`,
        reviewed_by: addFundsStatus === "approved" ? user?.id : null,
        reviewed_at: addFundsStatus === "approved" ? new Date().toISOString() : null,
      });

      if (error) throw error;

      await logAdminAction("add_funds", "deposit", addFundsUser.user_id, {
        email: addFundsUser.email,
        amount: btcAmount,
        inputAmount,
        currency: addFundsCurrency,
        status: addFundsStatus,
        note: addFundsNote,
      });

      toast({ title: "Funds Added", description: `${btcAmount.toFixed(8)} BTC (${inputAmount} ${addFundsCurrency}) added to ${addFundsUser.email} as ${addFundsStatus}.` });
      setAddFundsSearch("");
      setAddFundsUser(null);
      setAddFundsAmount("");
      setAddFundsCurrency("USD");
      setAddFundsStatus("pending");
      setAddFundsNote("");
      fetchAllData();
    } catch (error) {
      console.error("Error adding funds:", error);
      toast({ title: "Error", description: "Failed to add funds.", variant: "destructive" });
    } finally {
      setIsAddingFunds(false);
    }
  };

  // Remove Funds - Search user
  const handleSearchUserForRemoval = async () => {
    if (!removeFundsSearch.trim()) return;
    setRemoveFundsSearching(true);
    setRemoveFundsUser(null);
    setUserDeposits([]);

    const term = removeFundsSearch.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === term ||
        u.phone?.toLowerCase() === term ||
        (u as any).phone_number?.toLowerCase() === term ||
        u.full_name?.toLowerCase() === term ||
        u.email.split("@")[0].toLowerCase() === term ||
        u.email.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term)
    );

    if (found) {
      setRemoveFundsUser(found);
      // Fetch user's approved deposits
      const { data: depData } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", found.user_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (depData) {
        setUserDeposits(depData.map(d => ({
          ...d,
          profiles: { email: found.email, full_name: found.full_name },
        })));
      }
    } else {
      toast({ title: "User Not Found", description: "No user matches that search.", variant: "destructive" });
    }
    setRemoveFundsSearching(false);
  };

  // Smart Remove specific deposit - cancel investments, handle debt
  const handleRemoveDeposit = async (depositId: string) => {
    if (!removeFundsReason.trim()) {
      toast({ title: "Reason Required", description: "Please enter a reason for removing this deposit.", variant: "destructive" });
      return;
    }
    if (!removeFundsUser) return;

    setIsRemovingFunds(true);
    try {
      const deposit = userDeposits.find(d => d.id === depositId);
      if (!deposit) throw new Error("Deposit not found");

      const depositAmount = deposit.amount;

      // 1. Get user's current balance
      const { data: balanceData } = await supabase.rpc("get_user_balance", { _user_id: removeFundsUser.user_id });
      const currentBalance = Number(balanceData) || 0;

      // 2. Get active/pending investments
      const { data: activeInvestments } = await supabase
        .from("user_investments")
        .select("*")
        .eq("user_id", removeFundsUser.user_id)
        .in("status", ["active", "pending"]);

      let investmentsCancelled = 0;
      let freedCapital = 0;

      // 3. If balance < deposit amount, cancel investments to free up capital
      if (currentBalance < depositAmount && activeInvestments && activeInvestments.length > 0) {
        for (const inv of activeInvestments) {
          if (currentBalance + freedCapital >= depositAmount) break;
          
          const { error: cancelErr } = await supabase
            .from("user_investments")
            .update({ status: "cancelled" })
            .eq("id", inv.id);
          
          if (!cancelErr) {
            freedCapital += Number(inv.amount);
            investmentsCancelled++;
          }
        }
      }

      const availableAfterCancellations = currentBalance + freedCapital;

      // 4. Decline the deposit
      await supabase
        .from("deposits")
        .update({
          status: "declined",
          admin_notes: `Removed by admin: ${removeFundsReason}`,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", depositId);

      // 5. If deposit was already partially used (withdrawn), create debt record
      let debtAmount = 0;
      if (availableAfterCancellations < 0) {
        // The balance was already negative or removal creates a deficit
        debtAmount = Math.abs(availableAfterCancellations);
      } else if (depositAmount > availableAfterCancellations + depositAmount) {
        // Edge case: shouldn't happen but safety
        debtAmount = depositAmount - availableAfterCancellations;
      }
      
      // Calculate how much of the deposit had been spent (withdrawn by user)
      // After declining the deposit, the balance would drop by depositAmount
      // If balance was less than depositAmount, the difference is what was spent
      const spentFromDeposit = depositAmount - Math.min(depositAmount, currentBalance + freedCapital);
      
      if (spentFromDeposit > 0) {
        // Create debt record for the spent portion
        await supabase.from("withdrawals").insert({
          user_id: removeFundsUser.user_id,
          amount: spentFromDeposit,
          wallet_address: "ADMIN_DEBT_RECOVERY",
          status: "approved",
          payment_method: "Admin Debt Recovery",
          admin_txid: `DEBT_${Date.now()}`,
          decline_reason: `Debt from reversed deposit. Original deposit: ${depositAmount.toFixed(8)} BTC. User had already spent ${spentFromDeposit.toFixed(8)} BTC. Reason: ${removeFundsReason}`,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        });
        debtAmount = spentFromDeposit;
      }

      // 6. Send email notification
      const usdValue = (depositAmount * btcPrice).toFixed(2);
      sendEmailNotification("funds_removed", removeFundsUser.user_id, {
        amount_btc: depositAmount.toFixed(8),
        amount_usd: usdValue,
        reason: removeFundsReason,
        debt_amount: debtAmount > 0 ? debtAmount.toFixed(8) : null,
        investments_cancelled: investmentsCancelled > 0 ? investmentsCancelled : null,
      });

      // 7. Create in-app notification
      await supabase.from("notifications").insert({
        user_id: removeFundsUser.user_id,
        type: "system",
        title: "Funds Removed",
        message: `${depositAmount.toFixed(8)} BTC ($${usdValue}) has been removed from your account. Reason: ${removeFundsReason}${debtAmount > 0 ? `. A debt of ${debtAmount.toFixed(8)} BTC will be deducted from your next deposit.` : ''}${investmentsCancelled > 0 ? ` ${investmentsCancelled} investment(s) were cancelled.` : ''}`,
      });

      await logAdminAction("remove_deposit", "deposit", depositId, {
        reason: removeFundsReason,
        user_email: removeFundsUser.email,
        deposit_amount: depositAmount,
        debt_created: debtAmount,
        investments_cancelled: investmentsCancelled,
      });

      toast({
        title: "Deposit Removed",
        description: `${depositAmount.toFixed(8)} BTC removed.${investmentsCancelled > 0 ? ` ${investmentsCancelled} investments cancelled.` : ''}${debtAmount > 0 ? ` Debt of ${debtAmount.toFixed(8)} BTC created.` : ''}`,
      });

      // Refresh deposits list
      const { data: depData } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", removeFundsUser.user_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      setUserDeposits((depData || []).map(d => ({
        ...d,
        profiles: { email: removeFundsUser.email, full_name: removeFundsUser.full_name },
      })));

      fetchAllData();
    } catch (err) {
      console.error("Error removing deposit:", err);
      toast({ title: "Error", description: "Failed to remove deposit.", variant: "destructive" });
    } finally {
      setIsRemovingFunds(false);
    }
  };

  // Smart Remove funds by amount - cancel investments if needed, handle debt
  const handleRemoveFundsByAmount = async () => {
    if (!removeFundsUser || !removeFundsAmount || !removeFundsReason.trim()) {
      toast({ title: "Missing Info", description: "Please fill in amount and reason.", variant: "destructive" });
      return;
    }

    const inputAmount = parseFloat(removeFundsAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }

    setIsRemovingFunds(true);
    try {
      let btcAmount = inputAmount;
      let usdValue = inputAmount;

      if (removeFundsCurrency === "USD") {
        btcAmount = inputAmount / btcPrice;
        usdValue = inputAmount;
      } else {
        usdValue = inputAmount * btcPrice;
      }

      // 1. Get user's current balance
      const { data: balanceData } = await supabase.rpc("get_user_balance", { _user_id: removeFundsUser.user_id });
      const currentBalance = Number(balanceData) || 0;

      // 2. Get active/pending investments
      const { data: activeInvestments } = await supabase
        .from("user_investments")
        .select("*")
        .eq("user_id", removeFundsUser.user_id)
        .in("status", ["active", "pending"]);

      let investmentsCancelled = 0;
      let freedCapital = 0;

      // 3. If balance < removal amount, cancel investments
      if (currentBalance < btcAmount && activeInvestments && activeInvestments.length > 0) {
        for (const inv of activeInvestments) {
          if (currentBalance + freedCapital >= btcAmount) break;

          const { error: cancelErr } = await supabase
            .from("user_investments")
            .update({ status: "cancelled" })
            .eq("id", inv.id);

          if (!cancelErr) {
            freedCapital += Number(inv.amount);
            investmentsCancelled++;
          }
        }
      }

      const availableAfterCancellations = currentBalance + freedCapital;
      let debtAmount = 0;

      if (btcAmount > availableAfterCancellations) {
        debtAmount = btcAmount - availableAfterCancellations;
      }

      // 4. Create removal withdrawal for the removable portion
      const removableAmount = Math.min(btcAmount, availableAfterCancellations);
      if (removableAmount > 0) {
        await supabase.from("withdrawals").insert({
          user_id: removeFundsUser.user_id,
          amount: removableAmount,
          wallet_address: "ADMIN_REMOVAL",
          status: "approved",
          payment_method: "Admin Removal",
          admin_txid: `ADMIN_REMOVE_${Date.now()}`,
          decline_reason: `Admin removal: ${removeFundsReason}`,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        });
      }

      // 5. If debt, create debt recovery record
      if (debtAmount > 0) {
        await supabase.from("withdrawals").insert({
          user_id: removeFundsUser.user_id,
          amount: debtAmount,
          wallet_address: "ADMIN_DEBT_RECOVERY",
          status: "approved",
          payment_method: "Admin Debt Recovery",
          admin_txid: `DEBT_${Date.now()}`,
          decline_reason: `Debt from fund removal. Removed ${btcAmount.toFixed(8)} BTC but only ${availableAfterCancellations.toFixed(8)} BTC was available. Reason: ${removeFundsReason}`,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        });
      }

      // 6. Send email notification
      sendEmailNotification("funds_removed", removeFundsUser.user_id, {
        amount_btc: btcAmount.toFixed(8),
        amount_usd: usdValue.toFixed(2),
        reason: removeFundsReason,
        debt_amount: debtAmount > 0 ? debtAmount.toFixed(8) : null,
        investments_cancelled: investmentsCancelled > 0 ? investmentsCancelled : null,
      });

      // 7. In-app notification
      await supabase.from("notifications").insert({
        user_id: removeFundsUser.user_id,
        type: "system",
        title: "Funds Removed",
        message: `${btcAmount.toFixed(8)} BTC ($${usdValue.toFixed(2)}) has been removed from your account. Reason: ${removeFundsReason}${debtAmount > 0 ? `. A debt of ${debtAmount.toFixed(8)} BTC will be deducted from your next deposit.` : ''}${investmentsCancelled > 0 ? ` ${investmentsCancelled} investment(s) were cancelled.` : ''}`,
      });

      await logAdminAction("remove_funds", "withdrawal", removeFundsUser.user_id, {
        email: removeFundsUser.email,
        amount: btcAmount,
        inputAmount,
        currency: removeFundsCurrency,
        reason: removeFundsReason,
        debt_created: debtAmount,
        investments_cancelled: investmentsCancelled,
      });

      toast({
        title: "Funds Removed",
        description: `${btcAmount.toFixed(8)} BTC ($${usdValue.toFixed(2)}) removed from ${removeFundsUser.email}.${investmentsCancelled > 0 ? ` ${investmentsCancelled} investments cancelled.` : ''}${debtAmount > 0 ? ` Debt: ${debtAmount.toFixed(8)} BTC.` : ''}`,
      });

      setRemoveFundsAmount("");
      setRemoveFundsReason("");
      fetchAllData();
    } catch (err) {
      console.error("Error removing funds:", err);
      toast({ title: "Error", description: "Failed to remove funds.", variant: "destructive" });
    } finally {
      setIsRemovingFunds(false);
    }
  };

  const handleToggleDeposits = async (enabled: boolean) => {
    setDepositsEnabled(enabled);
    // Immediately save to site_settings
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("setting_key", "deposits_enabled")
      .single();

    if (existing) {
      await supabase
        .from("site_settings")
        .update({ setting_value: JSON.parse(JSON.stringify(enabled)), updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("setting_key", "deposits_enabled");
    } else {
      await supabase.from("site_settings").insert({
        setting_key: "deposits_enabled",
        setting_value: JSON.parse(JSON.stringify(enabled)),
        updated_by: user?.id,
      });
    }

    await logAdminAction(enabled ? "enable_deposits" : "disable_deposits", "settings");
    toast({ title: enabled ? "Deposits Enabled" : "Deposits Disabled", description: `Deposit page is now ${enabled ? "visible" : "hidden"} for all users.` });
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
        { key: "deposits_enabled", value: depositsEnabled },
        { key: "company_address", value: companyAddress },
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
  const formatCurrency = (amount: number) => {
    const usdValue = amount * btcPrice;
    return `$${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${amount.toFixed(4)} BTC)`;
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

  const getStatusBadge = (status: string, type: "deposit" | "withdrawal" | "investment" | "general" = "general") => {
    const labels: Record<string, Record<string, string>> = {
      deposit: { approved: "Confirmed", declined: "Unconfirmed", pending: "Pending" },
      withdrawal: { approved: "Completed", declined: "Rejected", pending: "Processing" },
      investment: { active: "Active", completed: "Matured", cancelled: "Cancelled", pending: "Pending" },
      general: { approved: "Confirmed", declined: "Unconfirmed", pending: "Pending", active: "Active", completed: "Completed", cancelled: "Cancelled", open: "Open", resolved: "Resolved", closed: "Closed" },
    };
    const label = labels[type]?.[status] || labels.general[status] || status;

    switch (status) {
      case "pending":
      case "open":
        return <Badge variant="outline" className="border-warning text-warning">{label}</Badge>;
      case "approved":
      case "active":
      case "completed":
      case "resolved":
        return <Badge variant="outline" className="border-success text-success">{label}</Badge>;
      case "declined":
      case "cancelled":
      case "closed":
        return <Badge variant="destructive">{label}</Badge>;
      default:
        return <Badge variant="secondary">{label}</Badge>;
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
            <TabsTrigger value="payment-methods" className="text-xs md:text-sm">Payment Methods</TabsTrigger>
            <TabsTrigger value="tickets" className="text-xs md:text-sm">Tickets</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">Users</TabsTrigger>
            <TabsTrigger value="faqs" className="text-xs md:text-sm">FAQs</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm">Notifications</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs md:text-sm">Activity Feed</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs md:text-sm">Admin Logs</TabsTrigger>
            <TabsTrigger value="add-funds" className="text-xs md:text-sm">Add Funds</TabsTrigger>
            <TabsTrigger value="remove-funds" className="text-xs md:text-sm">Remove Funds</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm">Settings</TabsTrigger>
            <TabsTrigger value="live-chat" className="text-xs md:text-sm">Live Chat</TabsTrigger>
            <TabsTrigger value="blog" className="text-xs md:text-sm">Blog</TabsTrigger>
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
                        getStatusBadge={(s: string) => getStatusBadge(s, "deposit")}
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
                        getStatusBadge={(s: string) => getStatusBadge(s, "withdrawal")}
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
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Investments
                  </CardTitle>
                  <CardDescription>Manage user investments</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {lastSettlementResult && (
                    <span className="text-xs text-muted-foreground">
                      Last run: {lastSettlementResult.settlementsProcessed}S / {lastSettlementResult.completionsProcessed}C
                    </span>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handleRunSettlement} 
                    disabled={isRunningSettlement}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isRunningSettlement && "animate-spin")} />
                    {isRunningSettlement ? "Running..." : "Run Settlement"}
                  </Button>
                </div>
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
                            {getStatusBadge(investment.status, "investment")}
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
                <Button onClick={openNewPlanDialog}>
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
                            <span>Duration: {plan.duration_hours ? `${plan.duration_hours} hours` : `${plan.duration_days} days`}</span>
                            <span>ROI: {plan.roi_percentage}%</span>
                            <span>Min: {plan.min_amount} BTC</span>
                            <span>Max: {plan.max_amount} BTC</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={plan.is_active ?? false} onCheckedChange={() => handleTogglePlanActive(plan)} />
                          <Button variant="ghost" size="icon" onClick={() => openEditPlanDialog(plan)}>
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

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Wallet className="w-5 h-5 text-primary" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>Manage deposit and withdrawal methods</CardDescription>
                </div>
                <Button onClick={() => { setEditingPaymentMethod(null); setPaymentMethodForm({ name: "", type: "both", icon: "bitcoin", description: "", wallet_address: "", instructions: "", display_order: 0, is_active: true, network_addresses: {} }); setPaymentMethodDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Method
                </Button>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No payment methods configured</p>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{method.name}</span>
                            <Badge variant="outline">{method.type}</Badge>
                            {method.is_active ? (
                              <Badge variant="outline" className="border-success text-success">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          {method.description && <p className="text-sm text-muted-foreground">{method.description}</p>}
                          {method.wallet_address && <p className="text-xs text-muted-foreground font-mono break-all">Address: {method.wallet_address}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { 
                            setEditingPaymentMethod(method); 
                            setPaymentMethodForm({ 
                              name: method.name, 
                              type: method.type, 
                              icon: method.icon || "bitcoin", 
                              description: method.description || "", 
                              wallet_address: method.wallet_address || "", 
                              instructions: method.instructions || "", 
                              display_order: method.display_order || 0, 
                              is_active: method.is_active ?? true,
                              network_addresses: (typeof method.network_addresses === 'object' && method.network_addresses !== null ? method.network_addresses : {}) as Record<string, string>,
                            });
                            setPaymentMethodDialogOpen(true); 
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePaymentMethod(method.id)}>
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
                          <div className="flex gap-2">
                            {ticket.status === "open" && (
                              <Button size="sm" onClick={() => { setSelectedTicket(ticket); setReplyDialogOpen(true); }}>
                                <Reply className="w-4 h-4 mr-1" />Reply
                              </Button>
                            )}
                            {ticket.status !== "closed" && (
                              <Button size="sm" variant="outline" onClick={() => handleCloseTicket(ticket)}>
                                <XCircle className="w-4 h-4 mr-1" />Close
                              </Button>
                            )}
                          </div>
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

          {/* Add Funds Tab */}
          <TabsContent value="add-funds">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <DollarSign className="w-5 h-5 text-success" />
                  Add Funds to User Account
                </CardTitle>
                <CardDescription>Search for a user by email, phone, or name and add funds to their account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Email / Phone / Username</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. iyanu1184@gmail.com or username or phone"
                      value={addFundsSearch}
                      onChange={(e) => setAddFundsSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                    />
                    <Button onClick={handleSearchUser} disabled={addFundsSearching || !addFundsSearch.trim()}>
                      <Search className="w-4 h-4 mr-2" />
                      {addFundsSearching ? "Searching..." : "Find"}
                    </Button>
                  </div>
                </div>

                {addFundsUser && (
                  <div className="space-y-4 p-4 bg-success/5 border border-success/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {(addFundsUser.full_name?.[0] || addFundsUser.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{addFundsUser.full_name || "No Name"}</p>
                        <p className="text-sm text-muted-foreground">{addFundsUser.email}</p>
                        {addFundsUser.phone && <p className="text-xs text-muted-foreground">📞 {addFundsUser.phone}</p>}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={addFundsCurrency} onValueChange={(v: "BTC" | "USD" | "EUR") => setAddFundsCurrency(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="BTC">BTC (₿)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount ({addFundsCurrency})</Label>
                        <Input
                          type="number"
                          step={addFundsCurrency === "BTC" ? "0.00000001" : "0.01"}
                          placeholder={addFundsCurrency === "BTC" ? "0.001" : "50.00"}
                          value={addFundsAmount}
                          onChange={(e) => setAddFundsAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={addFundsStatus} onValueChange={(v: "pending" | "approved") => setAddFundsStatus(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {addFundsCurrency !== "BTC" && addFundsAmount && parseFloat(addFundsAmount) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Will be converted to BTC at the current market rate upon submission.
                      </p>
                    )}

                    <div className="space-y-2">
                      <Label>Admin Note (Optional)</Label>
                      <Textarea
                        placeholder="Optional note for this deposit..."
                        value={addFundsNote}
                        onChange={(e) => setAddFundsNote(e.target.value)}
                        rows={2}
                      />
                    </div>

                    {addFundsStatus === "pending" && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="text-sm text-warning">⚠️ Pending deposits will appear in the user's history but won't be added to their balance until approved.</p>
                      </div>
                    )}

                    <Button
                      onClick={handleAddFunds}
                      disabled={isAddingFunds || !addFundsAmount}
                      className="w-full bg-success hover:bg-success/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isAddingFunds ? "Adding..." : `Add ${addFundsAmount || "0"} ${addFundsCurrency} (${addFundsStatus})`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Remove Funds Tab */}
          <TabsContent value="remove-funds">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <MinusCircle className="w-5 h-5 text-destructive" />
                  Remove Funds
                </CardTitle>
                <CardDescription>Search for a user and remove funds by amount or reverse a specific deposit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Search */}
                <div className="space-y-2">
                  <Label>Search User (email, phone, or username)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email, phone, or username..."
                      value={removeFundsSearch}
                      onChange={(e) => setRemoveFundsSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchUserForRemoval()}
                    />
                    <Button onClick={handleSearchUserForRemoval} disabled={removeFundsSearching}>
                      <Search className="w-4 h-4 mr-2" />
                      {removeFundsSearching ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>

                {removeFundsUser && (
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="font-medium">{removeFundsUser.full_name || "No Name"}</p>
                      <p className="text-sm text-muted-foreground">{removeFundsUser.email}</p>
                      {removeFundsUser.phone && <p className="text-xs text-muted-foreground">Phone: {removeFundsUser.phone}</p>}
                    </div>

                    {/* Remove by Amount */}
                    <div className="space-y-4 p-4 border border-destructive/20 rounded-lg">
                      <h3 className="font-medium flex items-center gap-2">
                        <MinusCircle className="w-4 h-4 text-destructive" />
                        Remove by Amount
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.0001"
                              placeholder="Enter amount"
                              value={removeFundsAmount}
                              onChange={(e) => setRemoveFundsAmount(e.target.value)}
                            />
                            <Select value={removeFundsCurrency} onValueChange={(v: "BTC" | "USD") => setRemoveFundsCurrency(v)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="BTC">BTC</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {removeFundsAmount && parseFloat(removeFundsAmount) > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {removeFundsCurrency === "USD"
                                ? `≈ ${(parseFloat(removeFundsAmount) / btcPrice).toFixed(8)} BTC`
                                : `≈ $${(parseFloat(removeFundsAmount) * btcPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Reason (required)</Label>
                          <Textarea
                            placeholder="Why are you removing these funds?"
                            value={removeFundsReason}
                            onChange={(e) => setRemoveFundsReason(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleRemoveFundsByAmount}
                        disabled={isRemovingFunds || !removeFundsAmount || !removeFundsReason.trim()}
                      >
                        <MinusCircle className="w-4 h-4 mr-2" />
                        {isRemovingFunds ? "Removing..." : "Remove Funds"}
                      </Button>
                    </div>

                    {/* Remove Specific Deposit */}
                    <div className="space-y-4 p-4 border border-border rounded-lg">
                      <h3 className="font-medium flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-destructive" />
                        Reverse a Specific Deposit
                      </h3>
                      <div className="space-y-2">
                        <Label>Reason for reversal (required)</Label>
                        <Input
                          placeholder="Enter reason..."
                          value={removeFundsReason}
                          onChange={(e) => setRemoveFundsReason(e.target.value)}
                        />
                      </div>
                      {userDeposits.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No approved deposits found for this user.</p>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {userDeposits.map((dep) => (
                            <div key={dep.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  ${(dep.amount * btcPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  <span className="text-xs text-muted-foreground ml-2">({dep.amount.toFixed(8)} BTC)</span>
                                </p>
                                {dep.payment_method && (
                                  <p className="text-xs text-muted-foreground">Method: {dep.payment_method}</p>
                                )}
                                <p className="text-xs text-muted-foreground">{formatDate(dep.created_at)}</p>
                                {dep.admin_notes && <p className="text-xs text-muted-foreground">Note: {dep.admin_notes}</p>}
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveDeposit(dep.id)}
                                disabled={!removeFundsReason.trim()}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Deposit Toggle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <ArrowDownCircle className="w-5 h-5 text-success" />
                    Deposit Page
                  </CardTitle>
                  <CardDescription>Control whether the deposit page is accessible to users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Enable Deposits</Label>
                      <p className="text-sm text-muted-foreground">When disabled, the deposit page and all deposit links are completely hidden</p>
                    </div>
                    <Switch
                      checked={depositsEnabled}
                      onCheckedChange={handleToggleDeposits}
                    />
                  </div>
                </CardContent>
              </Card>

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

              {/* Company Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Company Address</CardTitle>
                  <CardDescription>Displayed on the landing page and About page</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="123 Crypto Street, New York, NY 10001" />
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

          {/* Live Chat Tab */}
          <TabsContent value="live-chat">
            <LiveChatAdmin />
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog">
            <BlogAdmin />
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
                <Label>Duration Type</Label>
                <Select value={planForm.duration_type} onValueChange={(v: "days" | "hours") => setPlanForm({ ...planForm, duration_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration ({planForm.duration_type})</Label>
                {planForm.duration_type === "days" ? (
                  <Input type="number" value={planForm.duration_days} onChange={(e) => setPlanForm({ ...planForm, duration_days: parseInt(e.target.value) || 1 })} min={1} />
                ) : (
                  <Input type="number" value={planForm.duration_hours || 1} onChange={(e) => setPlanForm({ ...planForm, duration_hours: parseInt(e.target.value) || 1 })} min={1} />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ROI (%)</Label>
                <Input type="number" value={planForm.roi_percentage} onChange={(e) => setPlanForm({ ...planForm, roi_percentage: parseFloat(e.target.value) || 100 })} min={0} />
              </div>
              <div className="space-y-2">
                <Label>Min Amount (BTC)</Label>
                <Input type="number" step="0.0001" value={planForm.min_amount} onChange={(e) => setPlanForm({ ...planForm, min_amount: parseFloat(e.target.value) || 0.001 })} min={0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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

      {/* Payment Method Dialog */}
      <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPaymentMethod ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
            <DialogDescription>Configure payment method details for deposits and withdrawals</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={paymentMethodForm.name} 
                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, name: e.target.value })} 
                placeholder="e.g., USDT, PayPal, Bank Transfer" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={paymentMethodForm.type} onValueChange={(v) => setPaymentMethodForm({ ...paymentMethodForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit Only</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal Only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={paymentMethodForm.icon} onValueChange={(v) => setPaymentMethodForm({ ...paymentMethodForm, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bitcoin">Bitcoin</SelectItem>
                    <SelectItem value="usdt">USDT</SelectItem>
                    <SelectItem value="usdc">USDC</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Wallet Address / Account Info</Label>
              <Input 
                value={paymentMethodForm.wallet_address} 
                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, wallet_address: e.target.value })} 
                placeholder="Enter wallet address or account details" 
                className="font-mono"
              />
            </div>

            {/* Network-specific addresses for USDT/USDC */}
            {(paymentMethodForm.icon === "usdt" || paymentMethodForm.icon === "usdc") && (
              <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <Label className="text-base font-medium">Network-Specific Addresses</Label>
                <p className="text-xs text-muted-foreground">Set a wallet address for each supported network</p>
                {(paymentMethodForm.icon === "usdt" 
                  ? ["ERC20", "TRC20", "BEP20", "POLYGON", "ARBITRUM", "OPTIMISM", "SOLANA"]
                  : ["ERC20", "BEP20", "POLYGON", "ARBITRUM", "OPTIMISM", "SOLANA", "BASE"]
                ).map((network) => (
                  <div key={network} className="space-y-1">
                    <Label className="text-xs">{network}</Label>
                    <Input
                      value={paymentMethodForm.network_addresses[network] || ""}
                      onChange={(e) => setPaymentMethodForm({
                        ...paymentMethodForm,
                        network_addresses: {
                          ...paymentMethodForm.network_addresses,
                          [network]: e.target.value,
                        },
                      })}
                      placeholder={`${paymentMethodForm.icon.toUpperCase()} ${network} address`}
                      className="font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={paymentMethodForm.description} 
                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, description: e.target.value })} 
                placeholder="Short description for users" 
              />
            </div>
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea 
                value={paymentMethodForm.instructions} 
                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, instructions: e.target.value })} 
                placeholder="Detailed instructions for users (e.g., network to use, minimum amount)" 
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input 
                type="number" 
                value={paymentMethodForm.display_order} 
                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, display_order: parseInt(e.target.value) || 0 })} 
                min={0} 
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={paymentMethodForm.is_active} 
                onCheckedChange={(v) => setPaymentMethodForm({ ...paymentMethodForm, is_active: v })} 
              />
              <Label>Active (available to users)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentMethodDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePaymentMethod} disabled={!paymentMethodForm.name.trim()}>
              {editingPaymentMethod ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

// Deposit Item Component with debt warning
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
  const [debtAmount, setDebtAmount] = useState<number | null>(null);
  const [debtChecked, setDebtChecked] = useState(false);

  // Check for outstanding debt when deposit is pending
  useEffect(() => {
    if (deposit.status === "pending" && !debtChecked) {
      setDebtChecked(true);
      supabase
        .from("withdrawals")
        .select("amount")
        .eq("user_id", deposit.user_id)
        .eq("wallet_address", "ADMIN_DEBT_RECOVERY")
        .eq("status", "approved")
        .then(({ data }) => {
          const total = data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
          if (total > 0) setDebtAmount(total);
        });
    }
  }, [deposit.status, deposit.user_id, debtChecked]);

  return (
    <div className="p-3 md:p-4 bg-muted/30 rounded-lg space-y-3">
      {/* Debt Warning Banner */}
      {debtAmount !== null && debtAmount > 0 && deposit.status === "pending" && (
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Outstanding Debt: {debtAmount.toFixed(8)} BTC</p>
            <p className="text-xs text-muted-foreground">
              This user has an outstanding debt from a previous fund removal. 
              Confirming this deposit will automatically deduct {Math.min(debtAmount, deposit.amount).toFixed(8)} BTC to recover the debt.
              {debtAmount <= deposit.amount 
                ? " The debt will be fully cleared."
                : ` Remaining debt after deduction: ${(debtAmount - deposit.amount).toFixed(8)} BTC.`
              }
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm md:text-base">{deposit.profiles?.email || "Unknown"}</span>
            {getStatusBadge(deposit.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="text-success font-semibold">{formatCurrency(deposit.amount)}</span>
          </p>
          {deposit.payment_method && (
            <p className="text-xs text-muted-foreground">
              Method: <Badge variant="outline" className="text-xs ml-1">{deposit.payment_method}</Badge>
            </p>
          )}
          <p className="text-xs text-muted-foreground">{formatDate(deposit.created_at)}</p>
          {deposit.txid && <p className="text-xs text-muted-foreground break-all">TXID: {deposit.txid}</p>}
        </div>
      </div>

      {deposit.status === "pending" && (
        <div className="space-y-3 pt-3 border-t border-border">
          {!showDecline ? (
            <div className="flex gap-2">
               <Button size="sm" onClick={() => onApprove(deposit)} className="bg-success hover:bg-success/90">
                 <CheckCircle className="w-4 h-4 mr-1" />Confirm{debtAmount ? " & Recover Debt" : ""}
               </Button>
               <Button size="sm" variant="outline" onClick={() => setShowDecline(true)}>Reject</Button>
            </div>
          ) : (
            <>
               <Input placeholder="Reason for rejection (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
               <div className="flex gap-2">
                 <Button size="sm" variant="destructive" onClick={() => onDecline(deposit, reason)}>
                   <XCircle className="w-4 h-4 mr-1" />Confirm Rejection
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
          {withdrawal.payment_method && (
            <p className="text-xs text-muted-foreground">
              Method: <Badge variant="outline" className="text-xs ml-1">{withdrawal.payment_method}</Badge>
            </p>
          )}
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
                   <CheckCircle className="w-4 h-4 mr-1" />Process
                 </Button>
                 <Button size="sm" variant="outline" onClick={() => setShowDecline(true)}>Reject</Button>
              </div>
            </>
          ) : (
            <>
               <Input placeholder="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} />
               <div className="flex gap-2">
                 <Button size="sm" variant="destructive" onClick={() => onDecline(withdrawal, reason)}>
                   <XCircle className="w-4 h-4 mr-1" />Confirm Rejection
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

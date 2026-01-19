import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

type FilterType = "all" | "deposit" | "investment" | "withdrawal" | "system";

const Notifications = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setNotifications(data as Notification[]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      toast({
        title: "Success",
        description: "All notifications marked as read.",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from("notifications").delete().eq("id", id);

      setNotifications((prev) => prev.filter((n) => n.id !== id));

      toast({
        title: "Deleted",
        description: "Notification removed.",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    try {
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      setNotifications([]);

      toast({
        title: "Cleared",
        description: "All notifications have been removed.",
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on type
    switch (notification.type) {
      case "deposit":
        navigate("/wallet");
        break;
      case "withdrawal":
        navigate("/wallet");
        break;
      case "investment":
        navigate("/investments");
        break;
      case "system":
        if (notification.title.toLowerCase().includes("frozen")) {
          navigate("/support");
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const { type, title } = notification;
    const lowerTitle = title.toLowerCase();

    // Check for declined/approved status first
    if (lowerTitle.includes("declined")) {
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
    if (lowerTitle.includes("approved") || lowerTitle.includes("completed")) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    }

    // Then check by type
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="w-5 h-5 text-success" />;
      case "withdrawal":
        return <ArrowUpCircle className="w-5 h-5 text-primary" />;
      case "investment":
        return <TrendingUp className="w-5 h-5 text-primary" />;
      case "system":
        if (lowerTitle.includes("frozen")) {
          return <AlertTriangle className="w-5 h-5 text-warning" />;
        }
        return <Settings className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === "all") return notifications.length;
    return notifications.filter((n) => n.type === filterType).length;
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-sm font-normal bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">Stay updated with your account activity</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your notifications. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={clearAllNotifications}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({getFilterCount("all")})
            </TabsTrigger>
            <TabsTrigger value="deposit" className="text-xs sm:text-sm">
              <ArrowDownCircle className="w-3 h-3 mr-1" />
              Deposits ({getFilterCount("deposit")})
            </TabsTrigger>
            <TabsTrigger value="investment" className="text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              Investments ({getFilterCount("investment")})
            </TabsTrigger>
            <TabsTrigger value="withdrawal" className="text-xs sm:text-sm">
              <ArrowUpCircle className="w-3 h-3 mr-1" />
              Withdrawals ({getFilterCount("withdrawal")})
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs sm:text-sm">
              <Settings className="w-3 h-3 mr-1" />
              System ({getFilterCount("system")})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BellOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {filter === "all" ? "No notifications yet" : `No ${filter} notifications`}
                </p>
                <p className="text-sm">
                  {filter === "all" 
                    ? "We'll notify you when something important happens" 
                    : "Try selecting a different filter"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 flex items-start gap-4 transition-colors cursor-pointer",
                      !notification.is_read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="p-2 bg-card border border-border rounded-lg shrink-0">
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "font-medium",
                            !notification.is_read && "text-primary"
                          )}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
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

export default Notifications;

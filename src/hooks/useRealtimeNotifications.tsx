import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Subscribe to notifications
    const notificationsChannel = supabase
      .channel("user_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as { title: string; message: string };
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    // Subscribe to deposit status changes
    const depositsChannel = supabase
      .channel("user_deposits")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deposits",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deposit = payload.new as { status: string; amount: number };
          if (deposit.status === "approved") {
            toast({
              title: "Deposit Approved! 🎉",
              description: `Your deposit of ${deposit.amount.toFixed(4)} BTC has been approved.`,
            });
          } else if (deposit.status === "declined") {
            toast({
              title: "Deposit Declined",
              description: "Your deposit was declined. Please contact support.",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    // Subscribe to withdrawal status changes
    const withdrawalsChannel = supabase
      .channel("user_withdrawals")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "withdrawals",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const withdrawal = payload.new as { status: string; amount: number };
          if (withdrawal.status === "approved") {
            toast({
              title: "Withdrawal Processed! 🎉",
              description: `Your withdrawal of ${withdrawal.amount.toFixed(4)} BTC has been sent.`,
            });
          } else if (withdrawal.status === "declined") {
            toast({
              title: "Withdrawal Declined",
              description: "Your withdrawal was declined. Check your notifications for details.",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    // Subscribe to investment status changes
    const investmentsChannel = supabase
      .channel("user_investments")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_investments",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const investment = payload.new as { status: string; amount: number };
          if (investment.status === "active") {
            toast({
              title: "Investment Activated! 🚀",
              description: `Your investment of ${investment.amount.toFixed(4)} BTC is now active.`,
            });
          } else if (investment.status === "completed") {
            toast({
              title: "Investment Completed! 💰",
              description: "Your investment has matured. Check your wallet for returns.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(depositsChannel);
      supabase.removeChannel(withdrawalsChannel);
      supabase.removeChannel(investmentsChannel);
    };
  }, [user, toast]);
};

export default useRealtimeNotifications;

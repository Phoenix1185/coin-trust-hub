import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

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
              title: "Deposit Confirmed",
              description: `${deposit.amount.toFixed(4)} BTC has been verified and credited to your balance.`,
            });
          } else if (deposit.status === "declined") {
            toast({
              title: "Deposit Unconfirmed",
              description: "Your deposit could not be verified. Check your notifications for details.",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

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
              title: "Withdrawal Completed",
              description: `${withdrawal.amount.toFixed(4)} BTC has been sent to your wallet.`,
            });
          } else if (withdrawal.status === "declined") {
            toast({
              title: "Withdrawal Rejected",
              description: "Your withdrawal could not be processed. See notifications for details.",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

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
              title: "Investment Activated",
              description: `Your ${investment.amount.toFixed(4)} BTC investment is now active and generating returns.`,
            });
          } else if (investment.status === "completed") {
            toast({
              title: "Investment Matured",
              description: "Your investment has reached maturity. Returns have been credited to your balance.",
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

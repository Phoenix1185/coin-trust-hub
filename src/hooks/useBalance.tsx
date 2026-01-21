import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface BalanceData {
  balance: number;
  lockedCapital: number;
  lockedProfit: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export const useBalance = (): BalanceData => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [lockedCapital, setLockedCapital] = useState(0);
  const [lockedProfit, setLockedProfit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLockedCapital(0);
      setLockedProfit(0);
      setIsLoading(false);
      return;
    }

    try {
      // Use the database function for accurate balance (single source of truth)
      const [balanceRes, investmentsRes] = await Promise.all([
        supabase.rpc("get_user_balance", { _user_id: user.id }),
        supabase
          .from("user_investments")
          .select("amount, accrued_profit, status")
          .eq("user_id", user.id)
          .in("status", ["pending", "active"]),
      ]);

      if (!balanceRes.error && balanceRes.data !== null) {
        setBalance(Math.max(0, Number(balanceRes.data)));
      }

      if (!investmentsRes.error && investmentsRes.data) {
        const activeInvests = investmentsRes.data;
        setLockedCapital(activeInvests.reduce((sum, i) => sum + Number(i.amount), 0));
        setLockedProfit(activeInvests.reduce((sum, i) => sum + Number(i.accrued_profit || 0), 0));
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBalance();

      // Real-time subscriptions for balance updates
      const depositsChannel = supabase
        .channel("balance-deposits")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "deposits",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchBalance()
        )
        .subscribe();

      const withdrawalsChannel = supabase
        .channel("balance-withdrawals")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "withdrawals",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchBalance()
        )
        .subscribe();

      const investmentsChannel = supabase
        .channel("balance-investments")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_investments",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchBalance()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(depositsChannel);
        supabase.removeChannel(withdrawalsChannel);
        supabase.removeChannel(investmentsChannel);
      };
    }
  }, [user, fetchBalance]);

  return {
    balance,
    lockedCapital,
    lockedProfit,
    isLoading,
    refetch: fetchBalance,
  };
};

export default useBalance;

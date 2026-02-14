import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDepositEnabled = () => {
  const [depositsEnabled, setDepositsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "deposits_enabled")
        .single();

      if (data) {
        setDepositsEnabled(data.setting_value as unknown as boolean);
      }
      setIsLoading(false);
    };

    fetchSetting();

    // Listen for realtime changes
    const channel = supabase
      .channel("deposits-enabled")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "setting_key=eq.deposits_enabled" },
        () => fetchSetting()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { depositsEnabled, isLoading };
};

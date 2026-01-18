import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  activity_type: string;
  display_name: string;
  amount: number;
  created_at: string;
}

export const LiveTicker = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchActivities();
    
    // Set up real-time subscription
    const channel = supabase
      .channel("activity_feed_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_feed" },
        (payload) => {
          setActivities((prev) => [payload.new as ActivityItem, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setActivities(data);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="w-4 h-4 text-success" />;
      case "withdrawal":
        return <ArrowUpCircle className="w-4 h-4 text-primary" />;
      case "investment":
        return <TrendingUp className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case "deposit":
        return "deposited";
      case "withdrawal":
        return "withdrew";
      case "investment":
        return "invested";
      default:
        return "transacted";
    }
  };

  if (activities.length === 0) return null;

  return (
    <div className="w-full overflow-hidden bg-card/50 border-y border-border py-2">
      <div className="relative">
        <div className="flex animate-ticker-scroll whitespace-nowrap">
          {[...activities, ...activities].map((activity, index) => (
            <div
              key={`${activity.id}-${index}`}
              className="inline-flex items-center gap-2 px-6"
            >
              {getIcon(activity.activity_type)}
              <span className="text-sm">
                <span className="font-medium text-foreground">{activity.display_name}</span>
                {" "}
                <span className="text-muted-foreground">{getActionText(activity.activity_type)}</span>
                {" "}
                <span className={cn(
                  "font-semibold",
                  activity.activity_type === "deposit" ? "text-success" : "text-primary"
                )}>
                  {activity.amount.toFixed(4)} BTC
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTicker;

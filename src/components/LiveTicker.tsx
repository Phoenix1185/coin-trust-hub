import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBTCPrice, type CurrencyCode } from "@/hooks/useBTCPrice";

interface DemoSettings {
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

interface ActivityItem {
  id: string;
  activity_type: string;
  display_name: string;
  amount_usd: number;
  amount_btc: number;
}

// 100 diverse international first names
const FIRST_NAMES = [
  "James", "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "Benjamin", "Isabella",
  "Lucas", "Mia", "Henry", "Charlotte", "Alexander", "Amelia", "Daniel", "Harper", "Matthew", "Evelyn",
  "Michael", "Abigail", "David", "Emily", "Joseph", "Elizabeth", "Samuel", "Sofia", "Sebastian", "Victoria",
  "Jack", "Grace", "Owen", "Chloe", "Ethan", "Ella", "Jacob", "Scarlett", "Logan", "Lily",
  "Aiden", "Aria", "Jackson", "Zoey", "Muhammad", "Penelope", "Leo", "Layla", "Oliver", "Riley",
  "Carlos", "Fatima", "Ahmed", "Yuki", "Chen", "Priya", "Ivan", "Aisha", "Hans", "Maria",
  "Pierre", "Anna", "Jorge", "Mei", "Raj", "Olga", "Viktor", "Sarah", "Thomas", "Rachel",
  "Robert", "Jennifer", "John", "Linda", "Andrew", "Michelle", "Steven", "Amanda", "Kevin", "Jessica",
  "Brian", "Ashley", "Ryan", "Stephanie", "Dylan", "Nicole", "Tyler", "Lauren", "Brandon", "Christina",
  "Marcus", "Kenji", "Omar", "Ingrid", "Dmitri", "Zara", "Luis", "Nadia", "Erik", "Sana"
];

const LAST_INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const DEFAULT_SETTINGS: DemoSettings = {
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
};

// Seeded random number generator for consistent results within time windows
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const LiveTicker = () => {
  const [settings, setSettings] = useState<DemoSettings>(DEFAULT_SETTINGS);
  const [tick, setTick] = useState(0);
  const { btcPrice, formatFiatAmount, getCurrencySymbol } = useBTCPrice();

  // Default to USD for public display
  const displayCurrency: CurrencyCode = "USD";

  // Fetch demo settings from site_settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "demo_feed_settings")
          .single();

        if (!error && data?.setting_value) {
          const parsed = typeof data.setting_value === 'string' 
            ? JSON.parse(data.setting_value) 
            : data.setting_value;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (err) {
        console.error("Error fetching demo settings:", err);
      }
    };

    fetchSettings();
  }, []);

  // Refresh tick based on settings interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, (settings.refresh_interval_seconds || 5) * 1000);

    return () => clearInterval(interval);
  }, [settings.refresh_interval_seconds]);

  // Generate demo activities based on current time
  const activities = useMemo(() => {
    if (!settings.enabled) return [];

    const now = Date.now();
    const baseTimestamp = Math.floor(now / (settings.refresh_interval_seconds * 1000));
    const items: ActivityItem[] = [];

    for (let i = 0; i < 20; i++) {
      const seed = baseTimestamp + i * 13;
      const nameIndex = Math.floor(seededRandom(seed) * FIRST_NAMES.length);
      const initialIndex = Math.floor(seededRandom(seed * 7) * 26);
      
      const typeIndex = Math.floor(seededRandom(seed * 11) * settings.activity_types.length);
      const activityType = settings.activity_types[typeIndex] || "deposit";

      let minAmount: number, maxAmount: number;
      switch (activityType) {
        case "deposit":
          minAmount = settings.min_deposit_usd;
          maxAmount = settings.max_deposit_usd;
          break;
        case "investment":
          minAmount = settings.min_investment_usd;
          maxAmount = settings.max_investment_usd;
          break;
        case "withdrawal":
          minAmount = settings.min_withdrawal_usd;
          maxAmount = settings.max_withdrawal_usd;
          break;
        default:
          minAmount = 100;
          maxAmount = 10000;
      }

      // Generate realistic-looking amounts (tend toward round numbers)
      const rawAmount = minAmount + seededRandom(seed * 17) * (maxAmount - minAmount);
      // Round to nice numbers more often
      const roundFactor = seededRandom(seed * 23) < 0.7 ? 
        (rawAmount > 1000 ? 100 : 50) : 1;
      const amountUsd = Math.round(rawAmount / roundFactor) * roundFactor;
      const amountBtc = amountUsd / btcPrice;

      items.push({
        id: `demo-${seed}-${i}`,
        display_name: `${FIRST_NAMES[nameIndex]} ${LAST_INITIALS[initialIndex]}.`,
        activity_type: activityType,
        amount_usd: amountUsd,
        amount_btc: amountBtc,
      });
    }

    return items;
  }, [tick, settings, btcPrice]);

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

  const formatBTCAmount = (btc: number): string => {
    if (btc >= 1) return btc.toFixed(4);
    if (btc >= 0.0001) return btc.toFixed(6);
    return btc.toFixed(8);
  };

  if (!settings.enabled || activities.length === 0) return null;

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
                  {formatFiatAmount(activity.amount_usd, displayCurrency)}
                </span>
                {" "}
                <span className="text-muted-foreground text-xs">
                  ({formatBTCAmount(activity.amount_btc)} BTC)
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

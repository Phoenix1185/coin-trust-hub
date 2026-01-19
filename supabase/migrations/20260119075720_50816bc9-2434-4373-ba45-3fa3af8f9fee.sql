-- Add preferred_currency to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD' 
CHECK (preferred_currency IN ('USD', 'EUR', 'GBP'));

-- Add demo_feed_settings to site_settings if not exists
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES (
  'demo_feed_settings',
  '{"enabled": true, "mode": "demo", "refresh_interval_seconds": 5, "min_deposit_usd": 100, "max_deposit_usd": 50000, "min_investment_usd": 500, "max_investment_usd": 25000, "min_withdrawal_usd": 200, "max_withdrawal_usd": 15000, "activity_types": ["deposit", "investment", "withdrawal"]}'
)
ON CONFLICT (setting_key) DO NOTHING;
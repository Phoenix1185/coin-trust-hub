-- Add duration_hours column to investment_plans for hour-based plans
ALTER TABLE public.investment_plans 
ADD COLUMN IF NOT EXISTS duration_hours integer DEFAULT NULL;

-- Add a check constraint to ensure either days or hours is set (but not both required)
COMMENT ON COLUMN public.investment_plans.duration_hours IS 'Duration in hours for short-term plans. If set, this takes precedence over duration_days for settlement calculations.';
COMMENT ON COLUMN public.investment_plans.duration_days IS 'Duration in days for standard plans. Used when duration_hours is NULL.';
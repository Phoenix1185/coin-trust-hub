-- Add settlement tracking fields to user_investments table
ALTER TABLE public.user_investments 
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_settlement_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS settlement_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS accrued_profit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_profit NUMERIC DEFAULT 0;

-- Add index for efficient settlement engine queries
CREATE INDEX IF NOT EXISTS idx_user_investments_active_settlement 
ON public.user_investments (status, last_settlement_at) 
WHERE status = 'active';

-- Add comment for documentation
COMMENT ON COLUMN public.user_investments.activated_at IS 'Timestamp when admin approved and activated the investment';
COMMENT ON COLUMN public.user_investments.last_settlement_at IS 'Timestamp of the last 24-hour profit settlement';
COMMENT ON COLUMN public.user_investments.settlement_count IS 'Number of 24-hour settlement cycles completed';
COMMENT ON COLUMN public.user_investments.accrued_profit IS 'Total profit accumulated from settlements (locked until completion)';
COMMENT ON COLUMN public.user_investments.total_profit IS 'Total profit expected at plan completion';
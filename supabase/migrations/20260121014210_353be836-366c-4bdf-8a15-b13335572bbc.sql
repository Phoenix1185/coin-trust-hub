-- Fix the get_user_balance function to correctly calculate balance
-- The issue: when investment completes, we add actual_return (principal + profit)
-- but the principal was already from deposits, so we're double counting.
-- 
-- Correct formula:
-- deposits - withdrawals - (pending/active investment amounts) + (completed actual_returns)
-- This works because when investment is created, balance goes down.
-- When completed, actual_return (principal+profit) is returned.

CREATE OR REPLACE FUNCTION public.get_user_balance(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE((SELECT SUM(amount) FROM public.deposits WHERE user_id = _user_id AND status = 'approved'), 0)
    - COALESCE((SELECT SUM(amount) FROM public.withdrawals WHERE user_id = _user_id AND status = 'approved'), 0)
    - COALESCE((SELECT SUM(amount) FROM public.user_investments WHERE user_id = _user_id AND status IN ('pending', 'active')), 0)
    + COALESCE((SELECT SUM(accrued_profit) FROM public.user_investments WHERE user_id = _user_id AND status = 'completed'), 0)
$$;
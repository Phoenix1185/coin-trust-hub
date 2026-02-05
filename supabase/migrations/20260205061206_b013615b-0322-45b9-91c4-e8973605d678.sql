-- Fix the get_user_balance function to prevent double-counting reinvestments
-- The issue: when reinvesting completed returns, the formula was counting:
-- 1. The original deposit
-- 2. The completed return (principal + profit)
-- 3. But the principal was already part of the deposit!
-- 
-- CORRECT FORMULA:
-- Available = Deposits - Withdrawals - Capital_In_Active_Investments + ONLY_Profit_From_Completed
-- The principal returns implicitly when status changes from 'active' to 'completed' (no longer subtracted)

CREATE OR REPLACE FUNCTION public.get_user_balance(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Total approved deposits (all money that came INTO the platform)
    COALESCE((SELECT SUM(amount) FROM public.deposits WHERE user_id = _user_id AND status = 'approved'), 0)
    -- Minus approved withdrawals (all money that LEFT the platform)
    - COALESCE((SELECT SUM(amount) FROM public.withdrawals WHERE user_id = _user_id AND status = 'approved'), 0)
    -- Minus capital locked in pending/active investments (temporarily unavailable)
    - COALESCE((SELECT SUM(amount) FROM public.user_investments WHERE user_id = _user_id AND status IN ('pending', 'active')), 0)
    -- Plus ONLY THE PROFIT from completed investments (principal is already in deposits, not double-counted)
    + COALESCE((SELECT SUM(COALESCE(accrued_profit, 0)) FROM public.user_investments WHERE user_id = _user_id AND status = 'completed'), 0)
$$;
-- Fix balance calculation to return principal + profit from completed investments
-- Previously only accrued_profit was added, missing the original principal

CREATE OR REPLACE FUNCTION public.get_user_balance(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Total approved deposits
    COALESCE((SELECT SUM(amount) FROM public.deposits WHERE user_id = _user_id AND status = 'approved'), 0)
    -- Minus approved withdrawals
    - COALESCE((SELECT SUM(amount) FROM public.withdrawals WHERE user_id = _user_id AND status = 'approved'), 0)
    -- Minus locked capital in pending/active investments
    - COALESCE((SELECT SUM(amount) FROM public.user_investments WHERE user_id = _user_id AND status IN ('pending', 'active')), 0)
    -- Plus BOTH principal AND profit from completed investments (the full return)
    + COALESCE((SELECT SUM(amount + COALESCE(accrued_profit, 0)) FROM public.user_investments WHERE user_id = _user_id AND status = 'completed'), 0)
$$;
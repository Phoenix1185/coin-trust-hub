-- Update investment plan descriptions to be more professional and realistic
-- This is a data update but using migration since read-query is read-only

-- No schema changes needed, just updating plan descriptions via a function
CREATE OR REPLACE FUNCTION public.update_plan_descriptions() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE investment_plans SET description = 'Ideal for first-time investors. Low-risk entry point with steady daily returns over 7 days.' WHERE name = 'Starter Plan';
  UPDATE investment_plans SET description = 'Quick-turnaround plan for active traders. Invest for 24 hours and receive your principal plus returns at maturity.' WHERE name = 'Short-Term';
  UPDATE investment_plans SET description = 'Balanced risk-reward ratio for growing portfolios. Higher returns over a 14-day lock-in period.' WHERE name = 'Growth Plan';
  UPDATE investment_plans SET description = 'Optimized for serious investors seeking maximum yield. 30-day term with compounding daily settlements.' WHERE name = 'Premium Plan';
  UPDATE investment_plans SET description = 'Our highest-yield opportunity for qualified investors. Premium support and priority withdrawal processing included.' WHERE name = 'VIP Plan';
END;
$$;

SELECT public.update_plan_descriptions();
DROP FUNCTION public.update_plan_descriptions();
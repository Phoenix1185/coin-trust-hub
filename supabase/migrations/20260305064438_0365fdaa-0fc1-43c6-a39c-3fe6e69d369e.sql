
-- Update notification triggers to use professional crypto terminology

CREATE OR REPLACE FUNCTION public.notify_deposit_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'deposit',
        'Deposit Confirmed',
        'Your deposit of ' || NEW.amount || ' BTC has been verified and credited to your account balance.',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'deposit',
        'Deposit Unconfirmed',
        CASE 
          WHEN NEW.admin_notes IS NOT NULL AND NEW.admin_notes != '' 
          THEN 'Your deposit could not be confirmed on the blockchain. Details: ' || NEW.admin_notes
          ELSE 'Your deposit could not be confirmed. Please verify your transaction details and contact support if needed.'
        END,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_withdrawal_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'withdrawal',
        'Withdrawal Completed',
        'Your withdrawal of ' || NEW.amount || ' BTC has been processed and sent to your wallet address.',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'withdrawal',
        'Withdrawal Rejected',
        CASE 
          WHEN NEW.decline_reason IS NOT NULL AND NEW.decline_reason != '' 
          THEN 'Your withdrawal request was rejected. Reason: ' || NEW.decline_reason
          ELSE 'Your withdrawal request could not be processed. Please contact support for details.'
        END,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_investment_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_name text;
BEGIN
  SELECT name INTO plan_name FROM public.investment_plans WHERE id = NEW.plan_id;
  
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'active' AND OLD.status = 'pending' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'investment',
        'Investment Activated',
        'Your ' || COALESCE(plan_name, 'investment') || ' plan (' || NEW.amount || ' BTC) is now active and generating returns.',
        NEW.id
      );
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'investment',
        'Investment Cancelled',
        'Your ' || COALESCE(plan_name, 'investment') || ' plan has been cancelled. Your capital has been returned to your available balance.',
        NEW.id
      );
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'investment',
        'Investment Matured',
        'Your ' || COALESCE(plan_name, 'investment') || ' plan has reached maturity. Your principal plus ' || COALESCE(NEW.accrued_profit, 0) || ' BTC in returns have been credited to your balance.',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_account_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.is_frozen IS DISTINCT FROM NEW.is_frozen THEN
    IF NEW.is_frozen = true THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        NEW.user_id,
        'system',
        'Account Restricted',
        'Your account has been temporarily restricted pending a security review. Deposits, withdrawals, and new investments are disabled until the review is complete.'
      );
    ELSE
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        NEW.user_id,
        'system',
        'Account Restored',
        'Your account restrictions have been lifted. All features are now fully accessible.'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

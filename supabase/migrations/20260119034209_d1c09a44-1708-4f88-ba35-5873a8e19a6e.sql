-- Add type and related_id columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS related_id uuid;

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow admins to insert notifications for any user
CREATE POLICY "Admins can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to notify user on deposit status change
CREATE OR REPLACE FUNCTION public.notify_deposit_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'deposit',
        'Deposit Approved',
        'Your Bitcoin deposit of ' || NEW.amount || ' BTC has been approved and credited to your account.',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'deposit',
        'Deposit Declined',
        CASE 
          WHEN NEW.admin_notes IS NOT NULL AND NEW.admin_notes != '' 
          THEN 'Your deposit was declined. Reason: ' || NEW.admin_notes
          ELSE 'Your deposit was declined. Please contact support for more information.'
        END,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for deposit notifications
DROP TRIGGER IF EXISTS on_deposit_status_change ON public.deposits;
CREATE TRIGGER on_deposit_status_change
  AFTER UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_deposit_status_change();

-- Create function to notify user on withdrawal status change
CREATE OR REPLACE FUNCTION public.notify_withdrawal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'withdrawal',
        'Withdrawal Approved',
        'Your withdrawal of ' || NEW.amount || ' BTC has been approved and processed.',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'withdrawal',
        'Withdrawal Declined',
        CASE 
          WHEN NEW.decline_reason IS NOT NULL AND NEW.decline_reason != '' 
          THEN 'Your withdrawal was declined. Reason: ' || NEW.decline_reason
          ELSE 'Your withdrawal was declined. Please contact support for more information.'
        END,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for withdrawal notifications
DROP TRIGGER IF EXISTS on_withdrawal_status_change ON public.withdrawals;
CREATE TRIGGER on_withdrawal_status_change
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_withdrawal_status_change();

-- Create function to notify user on investment status change
CREATE OR REPLACE FUNCTION public.notify_investment_status_change()
RETURNS TRIGGER AS $$
DECLARE
  plan_name text;
BEGIN
  -- Get the plan name
  SELECT name INTO plan_name FROM public.investment_plans WHERE id = NEW.plan_id;
  
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'active' AND OLD.status = 'pending' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'investment',
        'Investment Approved',
        'Your ' || COALESCE(plan_name, 'investment') || ' plan of ' || NEW.amount || ' BTC has been approved and is now active.',
        NEW.id
      );
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'investment',
        'Investment Declined',
        'Your investment plan request was declined. Please contact support for more information.',
        NEW.id
      );
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.user_id,
        'investment',
        'Investment Completed',
        'Congratulations! Your ' || COALESCE(plan_name, 'investment') || ' plan has matured. Your returns of ' || COALESCE(NEW.actual_return, NEW.expected_return) || ' BTC have been credited.',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for investment notifications
DROP TRIGGER IF EXISTS on_investment_status_change ON public.user_investments;
CREATE TRIGGER on_investment_status_change
  AFTER UPDATE ON public.user_investments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_investment_status_change();

-- Create function to notify user on account freeze/unfreeze
CREATE OR REPLACE FUNCTION public.notify_account_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_frozen IS DISTINCT FROM NEW.is_frozen THEN
    IF NEW.is_frozen = true THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        NEW.user_id,
        'system',
        'Account Frozen',
        'Your account has been temporarily frozen. Please contact support for assistance.'
      );
    ELSE
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        NEW.user_id,
        'system',
        'Account Unfrozen',
        'Your account has been unfrozen and is now fully accessible.'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for account status notifications
DROP TRIGGER IF EXISTS on_account_status_change ON public.profiles;
CREATE TRIGGER on_account_status_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_account_status_change();
-- Grant admin role to tradingbitcrypto@gmail.com
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = '11fff9a2-5e57-48da-9076-d930b28bff7c';

-- Create the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create payment_methods table for deposits and withdrawals
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'both')),
  icon TEXT,
  description TEXT,
  wallet_address TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Everyone can read active payment methods
CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods
FOR SELECT
USING (is_active = true);

-- Only admins can manage payment methods
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add payment_method field to deposits and withdrawals
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Insert default payment methods
INSERT INTO public.payment_methods (name, type, icon, description, display_order) VALUES
  ('Bitcoin (BTC)', 'both', 'bitcoin', 'Send or receive Bitcoin directly', 1),
  ('USDT (BEP20)', 'both', 'usdt', 'Tether on Binance Smart Chain', 2),
  ('PayPal', 'both', 'paypal', 'Fast and secure PayPal transfers', 3),
  ('Bank Transfer', 'both', 'bank', 'Direct bank wire transfer', 4);

-- Create trigger for updating updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
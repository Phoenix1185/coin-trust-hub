-- Create user_payment_details table for storing user withdrawal details per payment method
CREATE TABLE public.user_payment_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, payment_method_id)
);

-- Enable RLS
ALTER TABLE public.user_payment_details ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment details
CREATE POLICY "Users can view own payment details"
ON public.user_payment_details
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own payment details
CREATE POLICY "Users can insert own payment details"
ON public.user_payment_details
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment details
CREATE POLICY "Users can update own payment details"
ON public.user_payment_details
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own payment details
CREATE POLICY "Users can delete own payment details"
ON public.user_payment_details
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all payment details
CREATE POLICY "Admins can view all payment details"
ON public.user_payment_details
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_user_payment_details_updated_at
BEFORE UPDATE ON public.user_payment_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
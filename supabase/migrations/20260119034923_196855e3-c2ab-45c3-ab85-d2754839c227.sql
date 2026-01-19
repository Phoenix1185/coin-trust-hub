-- Create FAQs table
CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active FAQs
CREATE POLICY "Anyone can view active FAQs" 
ON public.faqs 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all FAQs
CREATE POLICY "Admins can manage FAQs" 
ON public.faqs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default FAQs
INSERT INTO public.faqs (question, answer, category, display_order) VALUES
('What is BitCryptoTradingCo?', 'BitCryptoTradingCo is a professional cryptocurrency investment platform that helps you grow your wealth through expertly managed Bitcoin investments. We provide secure, transparent, and high-yield investment plans.', 'general', 1),
('How do I get started?', 'Simply create a free account, deposit Bitcoin to your wallet, and choose an investment plan that suits your goals. Our team handles the rest, and you can track your returns in real-time.', 'general', 2),
('What investment plans do you offer?', 'We offer three main investment plans: 7-day (short-term), 14-day (medium-term), and 30-day (long-term) plans. Each plan has different minimum investments and ROI percentages. Visit our Investments page to see current offerings.', 'investments', 3),
('What are the minimum and maximum investment amounts?', 'Minimum and maximum amounts vary by plan. Generally, you can start with as little as 0.001 BTC. Check individual plan details for specific limits.', 'investments', 4),
('How are returns calculated?', 'Returns are calculated based on the ROI percentage of your chosen plan, applied to your invested amount over the plan duration. For example, a 15% ROI on a 7-day plan means you receive your principal plus 15% profit at maturity.', 'investments', 5),
('When can I withdraw my funds?', 'You can withdraw your available balance anytime, subject to minimum withdrawal requirements and any active investment lock-up periods. Pending investments cannot be withdrawn until they mature.', 'withdrawals', 6),
('How long do withdrawals take?', 'Withdrawal requests are typically processed within 24-48 hours after admin approval. Network confirmation times may add additional processing time depending on blockchain congestion.', 'withdrawals', 7),
('How do I deposit Bitcoin?', 'Go to the Deposit page, copy our Bitcoin wallet address or scan the QR code, send your desired amount, then submit the transaction ID (TXID) for verification. Deposits are credited after admin approval.', 'deposits', 8),
('Is my investment safe?', 'We implement bank-grade security measures including cold storage, multi-layer encryption, and strict access controls. However, all cryptocurrency investments carry inherent market risks. Please review our Risk Disclosure.', 'security', 9),
('How do I contact support?', 'You can reach our support team through the Support page in your dashboard. Create a ticket and our team will respond as quickly as possible.', 'general', 10);
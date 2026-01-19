-- Create site_settings table for editable FAQ and contact info
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read site settings
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site settings" ON public.site_settings 
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings" ON public.site_settings 
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default contact info
INSERT INTO public.site_settings (setting_key, setting_value) VALUES 
('contact_info', '{"email": "support@bitcryptotradingco.com", "phone": "+1 (888) 123-4567", "live_chat": "Available 24/7"}'::jsonb),
('faq_items', '[
  {"question": "How long do withdrawals take?", "answer": "Withdrawals are processed within 24-48 hours after admin approval."},
  {"question": "What is the minimum investment?", "answer": "Minimum investment starts at $100 for basic plans."},
  {"question": "Is my investment secure?", "answer": "Yes, we use bank-grade security to protect your funds."},
  {"question": "How do I deposit funds?", "answer": "Navigate to the Deposit page, enter your amount, and send BTC to the provided address."},
  {"question": "What are the investment returns?", "answer": "Returns vary by plan: 7-day (5%), 14-day (15%), and 30-day (35%)."}
]'::jsonb);

-- Insert more demo activity feed data (10k+ items for sliding)
DO $$
DECLARE
  first_names TEXT[] := ARRAY['John', 'Emma', 'Michael', 'Sarah', 'David', 'Lisa', 'James', 'Jennifer', 'Robert', 'Emily', 'William', 'Jessica', 'Richard', 'Ashley', 'Joseph', 'Amanda', 'Thomas', 'Stephanie', 'Charles', 'Nicole', 'Daniel', 'Elizabeth', 'Matthew', 'Heather', 'Anthony', 'Michelle', 'Mark', 'Kimberly', 'Donald', 'Laura', 'Steven', 'Megan', 'Paul', 'Rachel', 'Andrew', 'Katherine', 'Joshua', 'Christine', 'Kenneth', 'Deborah'];
  activity_types TEXT[] := ARRAY['deposit', 'withdrawal', 'investment'];
  i INTEGER;
  random_name TEXT;
  random_type TEXT;
  random_amount NUMERIC;
BEGIN
  FOR i IN 1..50 LOOP
    random_name := first_names[floor(random() * array_length(first_names, 1) + 1)::int] || ' ' || chr(65 + floor(random() * 26)::int) || '.';
    random_type := activity_types[floor(random() * array_length(activity_types, 1) + 1)::int];
    random_amount := round((random() * 2 + 0.1)::numeric, 4);
    
    INSERT INTO public.activity_feed (activity_type, display_name, amount, created_at)
    VALUES (random_type, random_name, random_amount, now() - (i * interval '2 minutes'));
  END LOOP;
END $$;
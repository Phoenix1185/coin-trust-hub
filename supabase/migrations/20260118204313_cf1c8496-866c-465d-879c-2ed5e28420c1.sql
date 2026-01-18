-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for transaction status
CREATE TYPE public.transaction_status AS ENUM ('pending', 'approved', 'declined');

-- Create enum for investment status
CREATE TYPE public.investment_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  wallet_address TEXT,
  avatar_url TEXT,
  is_frozen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create investment_plans table
CREATE TABLE public.investment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  min_amount DECIMAL(18, 8) NOT NULL,
  max_amount DECIMAL(18, 8) NOT NULL,
  roi_percentage DECIMAL(5, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_investments table
CREATE TABLE public.user_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.investment_plans(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  status investment_status DEFAULT 'pending' NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  expected_return DECIMAL(18, 8),
  actual_return DECIMAL(18, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create deposit_addresses table (admin managed)
CREATE TABLE public.deposit_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create deposits table
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  txid TEXT,
  status transaction_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  wallet_address TEXT NOT NULL,
  status transaction_status DEFAULT 'pending' NOT NULL,
  admin_txid TEXT,
  decline_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create withdrawal_settings table (admin configurable)
CREATE TABLE public.withdrawal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_investment_days INTEGER DEFAULT 7,
  min_withdrawal_amount DECIMAL(18, 8) DEFAULT 0.001,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create activity_feed table (for live ticker)
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create admin_activity_logs table
CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  response TEXT,
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user balance
CREATE OR REPLACE FUNCTION public.get_user_balance(_user_id UUID)
RETURNS DECIMAL(18, 8)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT SUM(amount) FROM public.deposits WHERE user_id = _user_id AND status = 'approved'),
    0
  ) - COALESCE(
    (SELECT SUM(amount) FROM public.withdrawals WHERE user_id = _user_id AND status = 'approved'),
    0
  ) - COALESCE(
    (SELECT SUM(amount) FROM public.user_investments WHERE user_id = _user_id AND status IN ('pending', 'active')),
    0
  ) + COALESCE(
    (SELECT SUM(actual_return) FROM public.user_investments WHERE user_id = _user_id AND status = 'completed'),
    0
  )
$$;

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_investment_plans_updated_at
  BEFORE UPDATE ON public.investment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_investments_updated_at
  BEFORE UPDATE ON public.user_investments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign admin role if email matches
  IF NEW.email = 'fredokcee1@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for investment_plans (public read)
CREATE POLICY "Anyone can view active plans" ON public.investment_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.investment_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_investments
CREATE POLICY "Users can view own investments" ON public.user_investments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create investments" ON public.user_investments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments" ON public.user_investments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update investments" ON public.user_investments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for deposit_addresses (public read for active)
CREATE POLICY "Anyone can view active addresses" ON public.deposit_addresses
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage addresses" ON public.deposit_addresses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for deposits
CREATE POLICY "Users can view own deposits" ON public.deposits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits" ON public.deposits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits" ON public.deposits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deposits" ON public.deposits
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for withdrawal_settings
CREATE POLICY "Anyone can view settings" ON public.withdrawal_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings" ON public.withdrawal_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for activity_feed (public read)
CREATE POLICY "Anyone can view activity feed" ON public.activity_feed
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage activity feed" ON public.activity_feed
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_activity_logs
CREATE POLICY "Admins can view logs" ON public.admin_activity_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create logs" ON public.admin_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default investment plans
INSERT INTO public.investment_plans (name, description, duration_days, min_amount, max_amount, roi_percentage) VALUES
  ('Starter Plan', 'Perfect for beginners. Low risk, steady returns.', 7, 0.001, 0.1, 15),
  ('Growth Plan', 'Ideal for growing your portfolio. Medium risk, higher returns.', 14, 0.05, 0.5, 35),
  ('Premium Plan', 'For serious investors. Optimized returns.', 30, 0.1, 1.0, 75),
  ('VIP Plan', 'Exclusive high-yield investment opportunity.', 30, 0.5, 5.0, 120);

-- Insert default withdrawal settings
INSERT INTO public.withdrawal_settings (min_investment_days, min_withdrawal_amount) VALUES (7, 0.001);

-- Insert default deposit address
INSERT INTO public.deposit_addresses (address, label) VALUES ('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'Primary BTC Address');

-- Insert demo activity feed data
INSERT INTO public.activity_feed (activity_type, display_name, amount, created_at) VALUES
  ('deposit', 'John M.', 0.5, now() - interval '2 minutes'),
  ('withdrawal', 'Sarah K.', 0.15, now() - interval '5 minutes'),
  ('investment', 'Michael R.', 0.25, now() - interval '8 minutes'),
  ('deposit', 'Emma L.', 1.2, now() - interval '12 minutes'),
  ('withdrawal', 'David S.', 0.08, now() - interval '15 minutes'),
  ('investment', 'Jessica P.', 0.75, now() - interval '20 minutes'),
  ('deposit', 'Robert W.', 0.35, now() - interval '25 minutes'),
  ('withdrawal', 'Amanda T.', 0.22, now() - interval '30 minutes');
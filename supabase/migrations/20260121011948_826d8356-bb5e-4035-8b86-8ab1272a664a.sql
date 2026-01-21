-- Add new profile fields for extended signup
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS middle_name text,
ADD COLUMN IF NOT EXISTS surname text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS phone_number text;

-- Update handle_new_user function to handle new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile with extended fields
  INSERT INTO public.profiles (user_id, email, full_name, first_name, middle_name, surname, date_of_birth, preferred_currency)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      CONCAT_WS(' ', 
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'middle_name',
        NEW.raw_user_meta_data->>'surname'
      ),
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'middle_name',
    NEW.raw_user_meta_data->>'surname',
    (NEW.raw_user_meta_data->>'date_of_birth')::date,
    COALESCE(NEW.raw_user_meta_data->>'preferred_currency', 'USD')
  );
  
  -- Assign admin role if email matches
  IF NEW.email = 'fredokcee1@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
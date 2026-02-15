-- Allow admins to insert deposits for any user (needed for Add Funds feature)
CREATE POLICY "Admins can create deposits"
ON public.deposits
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

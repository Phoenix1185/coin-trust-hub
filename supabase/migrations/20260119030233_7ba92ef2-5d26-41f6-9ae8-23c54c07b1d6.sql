-- Create support_ticket_messages table for chat-like conversations
CREATE TABLE public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages on their own tickets
CREATE POLICY "Users can view messages on own tickets"
ON public.support_ticket_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

-- Users can insert messages on their own open tickets
CREATE POLICY "Users can send messages on own open tickets"
ON public.support_ticket_messages
FOR INSERT
WITH CHECK (
  sender_type = 'user' AND
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_id AND user_id = auth.uid() AND status NOT IN ('closed', 'resolved')
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.support_ticket_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert messages
CREATE POLICY "Admins can send messages"
ON public.support_ticket_messages
FOR INSERT
WITH CHECK (
  sender_type = 'admin' AND
  has_role(auth.uid(), 'admin'::app_role)
);
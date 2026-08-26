-- Migration 011: Support Staff, Ticket Assignments & Audit Logging

-- 1. Create support_staff table
CREATE TABLE IF NOT EXISTS public.support_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed primary admin
INSERT INTO public.support_staff (email, full_name, role, is_active)
VALUES ('atschemeris@icloud.com', 'Arien Tschemeris', 'admin', true)
ON CONFLICT (email) DO UPDATE SET role = 'admin', full_name = 'Arien Tschemeris', is_active = true;

-- 2. Adjust tickets table
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.support_staff(id) ON DELETE SET NULL;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);

-- 3. Adjust ticket_messages table
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.support_staff(id) ON DELETE SET NULL;
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS staff_name TEXT;

-- 4. Create support_audit_logs table
CREATE TABLE IF NOT EXISTS public.support_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.support_staff(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  action TEXT NOT NULL,
  ticket_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_audit_logs_staff_id ON public.support_audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_support_audit_logs_ticket_id ON public.support_audit_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_audit_logs_created_at ON public.support_audit_logs(created_at DESC);

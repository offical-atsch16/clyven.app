-- Migration 008: Add clerk_user_id and is_verified_user to tickets, and seed feature flags

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS is_verified_user BOOLEAN DEFAULT false;

-- Create index for quick user ticket lookups
CREATE INDEX IF NOT EXISTS idx_tickets_clerk_user_id ON public.tickets(clerk_user_id);

-- Seed feature flags
INSERT INTO public.feature_flags (flag_key, description, is_enabled_globally, allowed_user_ids)
VALUES
  ('clyven_ai_sidebar', 'KI Sidebar Chatbot (CLYVEN AI)', false, '[]'::jsonb),
  ('audio_journal_voice', 'Voice Recorder & AI Transcription für Journale', false, '[]'::jsonb),
  ('zen_focus_mode', 'Distraction-free Vollbild Mode für Editor', true, '[]'::jsonb),
  ('smart_backlinks_graph', 'Visueller Graph für verknüpfte Notizen', false, '[]'::jsonb)
ON CONFLICT (flag_key) DO NOTHING;

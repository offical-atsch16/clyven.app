-- Migration 009: Email Notifications tracking and User Settings Preferences

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS task_emails_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS journal_reminders_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS streak_alerts_enabled BOOLEAN DEFAULT true;

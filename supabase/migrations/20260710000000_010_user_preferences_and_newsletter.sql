-- Migration 010: User Preferences and Newsletter Subscribers Tables

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  email_reminders BOOLEAN DEFAULT true,
  email_journal BOOLEAN DEFAULT true,
  email_streaks BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_subscribed BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP DEFAULT now(),
  unsubscribed_at TIMESTAMP
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS for user_preferences
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own preferences' AND tablename = 'user_preferences') THEN
    CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert/update their own preferences' AND tablename = 'user_preferences') THEN
    CREATE POLICY "Users can insert/update their own preferences" ON public.user_preferences FOR ALL USING (true);
  END IF;
END $$;

-- RLS for newsletter_subscribers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert newsletter subscription' AND tablename = 'newsletter_subscribers') THEN
    CREATE POLICY "Anyone can insert newsletter subscription" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update newsletter subscription' AND tablename = 'newsletter_subscribers') THEN
    CREATE POLICY "Anyone can update newsletter subscription" ON public.newsletter_subscribers FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read newsletter subscription' AND tablename = 'newsletter_subscribers') THEN
    CREATE POLICY "Public read newsletter subscription" ON public.newsletter_subscribers FOR SELECT USING (true);
  END IF;
END $$;

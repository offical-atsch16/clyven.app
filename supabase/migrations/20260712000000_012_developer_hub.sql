-- Migration 012: Developer Hub (user_github_integrations & code_snippets)

CREATE TABLE IF NOT EXISTS public.user_github_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  installation_id TEXT,
  access_token TEXT,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.code_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  code_content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.user_github_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own github integration' AND tablename = 'user_github_integrations') THEN
    CREATE POLICY "Users can view their own github integration" ON public.user_github_integrations FOR SELECT USING (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert/update their github integration' AND tablename = 'user_github_integrations') THEN
    CREATE POLICY "Users can insert/update their github integration" ON public.user_github_integrations FOR ALL USING (auth.uid()::text = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access their own code snippets' AND tablename = 'code_snippets') THEN
    CREATE POLICY "Users can access their own code snippets" ON public.code_snippets FOR ALL USING (auth.uid()::text = user_id);
  END IF;
END $$;

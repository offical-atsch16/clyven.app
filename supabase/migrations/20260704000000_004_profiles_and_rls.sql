/*
# User Profiles and Plus Plan RLS Policies

1. `profiles` table: id (Clerk user ID), email, plan ('free', 'plus', 'business'), created_at, updated_at
2. `has_plus_plan` SQL function to evaluate user plan status on DB level
3. RLS policies on `profiles` and Plus feature tables
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for plan queries
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies (restricted to the user's own profile)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = id OR auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = id OR auth.uid()::text = user_id);

-- Function to check if user has Plus or Business plan on DB level
CREATE OR REPLACE FUNCTION public.has_plus_plan(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
BEGIN
  -- Check profiles table
  SELECT plan INTO v_plan
  FROM public.profiles
  WHERE id = p_user_id OR user_id = p_user_id
  LIMIT 1;

  IF v_plan IS NOT NULL AND LOWER(v_plan) IN ('plus', 'clyven_plus', 'premium', 'business', 'clyven_business') THEN
    RETURN TRUE;
  END IF;

  -- Fallback check in subscriptions table
  SELECT plan INTO v_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_plan IS NOT NULL AND (LOWER(v_plan) LIKE '%plus%' OR LOWER(v_plan) LIKE '%premium%' OR LOWER(v_plan) LIKE '%business%') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

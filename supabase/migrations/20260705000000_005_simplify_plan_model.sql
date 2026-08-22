/*
# Simplify Plan Model to Free & Clyven Plus

1. Migrate existing 'business' / 'clyven_business' profiles and subscriptions to 'plus' / 'clyven_plus'.
2. Update `has_plus_plan` function and RLS policies so all premium features evaluate `profiles.plan = 'plus'`.
*/

-- 1. Migration: Convert all 'business' entries to 'plus'
UPDATE public.profiles
SET plan = 'plus', updated_at = NOW()
WHERE LOWER(plan) IN ('business', 'clyven_business', 'pro_business');

UPDATE public.subscriptions
SET plan = 'clyven_plus', updated_at = NOW()
WHERE LOWER(plan) IN ('business', 'clyven_business');

-- 2. Update `has_plus_plan` DB function
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

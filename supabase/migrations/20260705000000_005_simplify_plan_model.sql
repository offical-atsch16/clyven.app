/*
# Consolidate Plan Model to Business Key (Branded as CLYVEN PLUS in UI)

1. Ensure all premium accounts utilize 'business' or 'clyven_business'.
2. Update `has_plus_plan` function and RLS policies so all premium features evaluate `profiles.plan = 'business'`.
*/

-- 1. Migration: Ensure all 'plus' or 'clyven_plus' entries use 'business' / 'clyven_business'
UPDATE public.profiles
SET plan = 'business', updated_at = NOW()
WHERE LOWER(plan) IN ('plus', 'clyven_plus', 'premium');

UPDATE public.subscriptions
SET plan = 'clyven_business', updated_at = NOW()
WHERE LOWER(plan) IN ('plus', 'clyven_plus', 'premium');

-- 2. Update `has_plus_plan` DB function to evaluate business plan
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

  IF v_plan IS NOT NULL AND LOWER(v_plan) IN ('business', 'clyven_business') THEN
    RETURN TRUE;
  END IF;

  -- Fallback check in subscriptions table
  SELECT plan INTO v_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_plan IS NOT NULL AND LOWER(v_plan) LIKE '%business%' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 3. Function helper for has_business_plan
CREATE OR REPLACE FUNCTION public.has_business_plan(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.has_plus_plan(p_user_id);
END;
$$;

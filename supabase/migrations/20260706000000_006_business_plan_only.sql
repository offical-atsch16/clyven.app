/*
# Final Cleanup: Remove 'plus' plan references and enforce 'business' key

1. Clean up any remaining profiles or subscriptions with plan = 'plus'.
2. Ensure public.has_business_plan and public.has_plus_plan both check profiles.plan = 'business'.
*/

UPDATE public.profiles
SET plan = 'business', updated_at = NOW()
WHERE LOWER(plan) = 'plus' OR LOWER(plan) = 'clyven_plus';

UPDATE public.subscriptions
SET plan = 'clyven_business', updated_at = NOW()
WHERE LOWER(plan) = 'plus' OR LOWER(plan) = 'clyven_plus';

CREATE OR REPLACE FUNCTION public.has_business_plan(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT plan INTO v_plan
  FROM public.profiles
  WHERE id = p_user_id OR user_id = p_user_id
  LIMIT 1;

  IF v_plan IS NOT NULL AND LOWER(v_plan) IN ('business', 'clyven_business') THEN
    RETURN TRUE;
  END IF;

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

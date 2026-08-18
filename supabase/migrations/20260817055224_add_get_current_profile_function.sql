
-- Create a function to get the current user's profile
-- This bypasses PostgREST schema query issues by running as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'role', p.role,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  )
  INTO v_profile
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  RETURN v_profile;
END;
$$;

-- Grant execute to authenticated role only
REVOKE EXECUTE ON FUNCTION public.get_current_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_profile() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_profile() TO authenticated;

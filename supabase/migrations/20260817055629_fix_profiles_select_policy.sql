
-- Drop the get_current_profile function — we'll query profiles directly
DROP FUNCTION IF EXISTS public.get_current_profile();

-- Update the profiles SELECT policy to allow both anon and authenticated
-- The auth.uid() check ensures users can only see their own profile
-- This is needed because onAuthStateChange may fire before the token switches
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (auth.uid() = id);

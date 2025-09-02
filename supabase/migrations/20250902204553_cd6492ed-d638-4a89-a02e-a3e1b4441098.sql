-- Add INSERT policy to profiles table to prevent unauthorized profile creation
-- This ensures users can only create profiles for themselves
CREATE POLICY "Users can create own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);
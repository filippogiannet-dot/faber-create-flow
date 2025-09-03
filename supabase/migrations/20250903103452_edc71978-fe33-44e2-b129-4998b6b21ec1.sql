-- Update the user profile to admin with unlimited messages
UPDATE public.profiles 
SET 
  plan = 'enterprise',
  messages_limit = 999999,
  messages_used = 0
WHERE email = 'filippo.giannetti@icloud.com';
-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan, messages_limit)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    CASE 
      WHEN NEW.raw_user_meta_data->>'plan' = 'pro' THEN 100
      WHEN NEW.raw_user_meta_data->>'plan' = 'enterprise' THEN 1000
      ELSE 1
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix check_user_limits function
CREATE OR REPLACE FUNCTION public.check_user_limits(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  usage_limit INTEGER;
BEGIN
  SELECT messages_used, messages_limit 
  INTO current_usage, usage_limit
  FROM public.profiles 
  WHERE id = user_id;
  
  RETURN current_usage < usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix increment_usage function
CREATE OR REPLACE FUNCTION public.increment_usage(user_id UUID, project_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- Increment user's total usage
  UPDATE public.profiles 
  SET messages_used = messages_used + 1 
  WHERE id = user_id;
  
  -- Increment project's usage if project_id provided
  IF project_id IS NOT NULL THEN
    UPDATE public.projects 
    SET messages_used = messages_used + 1 
    WHERE id = project_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Create enum for user plans
CREATE TYPE public.user_plan AS ENUM ('free', 'pro', 'enterprise');

-- Create enum for project status
CREATE TYPE public.project_status AS ENUM ('active', 'archived', 'deleted');

-- Create users profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan user_plan DEFAULT 'free',
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status project_status DEFAULT 'active',
  state JSONB DEFAULT '{}',
  libraries TEXT[] DEFAULT ARRAY[]::TEXT[],
  messages_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create prompts table for tracking AI interactions
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_text TEXT NOT NULL,
  ai_response JSONB,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create snapshots table for version control
CREATE TABLE public.snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  state JSONB NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for prompts
CREATE POLICY "Users can view own prompts" ON public.prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for snapshots
CREATE POLICY "Users can view own snapshots" ON public.snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = snapshots.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can create snapshots" ON public.snapshots
  FOR INSERT WITH CHECK (true);

-- Create function to auto-create profile on user signup
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check usage limits
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counter
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_prompts_project_id ON public.prompts(project_id);
CREATE INDEX idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX idx_snapshots_project_id ON public.snapshots(project_id);
CREATE INDEX idx_snapshots_version ON public.snapshots(project_id, version);
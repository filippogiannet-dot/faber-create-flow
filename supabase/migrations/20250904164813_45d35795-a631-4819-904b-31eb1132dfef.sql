-- Logging e telemetria sistema
CREATE TABLE public.build_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID,
  user_id UUID,
  phase VARCHAR(50) NOT NULL, -- 'analyze', 'generate', 'validate', 'build', 'preview'
  status VARCHAR(20) NOT NULL, -- 'started', 'success', 'error', 'warning'
  duration_ms INTEGER,
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb, 
  deps_added JSONB DEFAULT '[]'::jsonb,
  files_changed JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Preview errors per debug
CREATE TABLE public.preview_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID,
  user_id UUID,
  error_type VARCHAR(50) NOT NULL, -- 'compile', 'runtime', 'import', 'syntax'
  file_path TEXT,
  line_number INTEGER,
  column_number INTEGER,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  browser_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quality checks results
CREATE TABLE public.quality_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID,
  user_id UUID,
  check_type VARCHAR(50) NOT NULL, -- 'typescript', 'eslint', 'build', 'accessibility'
  status VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'warning'
  results JSONB NOT NULL,
  suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.build_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preview_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own build logs" 
ON public.build_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own build logs" 
ON public.build_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own preview errors" 
ON public.preview_errors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preview errors" 
ON public.preview_errors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quality checks" 
ON public.quality_checks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quality checks" 
ON public.quality_checks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_build_logs_project_created ON public.build_logs(project_id, created_at DESC);
CREATE INDEX idx_preview_errors_project_created ON public.preview_errors(project_id, created_at DESC);
CREATE INDEX idx_quality_checks_project_created ON public.quality_checks(project_id, created_at DESC);
CREATE INDEX idx_build_logs_phase_status ON public.build_logs(phase, status);

-- Function to get project logs
CREATE OR REPLACE FUNCTION public.get_project_logs(p_project_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  log_type TEXT,
  id UUID,
  phase TEXT,
  status TEXT,
  duration_ms INTEGER,
  errors JSONB,
  warnings JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'build'::TEXT as log_type,
    bl.id,
    bl.phase::TEXT,
    bl.status::TEXT,
    bl.duration_ms,
    bl.errors,
    bl.warnings,
    bl.created_at
  FROM build_logs bl
  WHERE bl.project_id = p_project_id 
    AND bl.user_id = auth.uid()
  ORDER BY bl.created_at DESC
  LIMIT p_limit;
END;
$$;
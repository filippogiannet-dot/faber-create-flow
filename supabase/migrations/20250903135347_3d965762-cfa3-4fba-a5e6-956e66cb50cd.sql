
-- 1) Tabelle per file generati, log e modifiche, con RLS per proprietario del progetto

-- project_files: contenuto dei file generati/modificati dall'AI
CREATE TABLE public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_type TEXT NOT NULL, -- javascript, typescript, css, html, json, markdown, ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, file_path)
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Politiche RLS: accesso solo al proprietario del progetto
CREATE POLICY "Users can view own project_files"
  ON public.project_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_files.project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into own project_files"
  ON public.project_files
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_files.project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project_files"
  ON public.project_files
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_files.project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project_files"
  ON public.project_files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_files.project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_project_files_project_id ON public.project_files(project_id);

-- Trigger per updated_at
CREATE TRIGGER set_timestamp_project_files
BEFORE UPDATE ON public.project_files
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();


-- generation_logs: tracking dettagliato della pipeline (parsing/generation/saving/error)
CREATE TABLE public.generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  step TEXT NOT NULL,   -- parsing, generation, saving, error, etc.
  status TEXT NOT NULL, -- started, completed, failed
  details JSONB,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generation_logs"
  ON public.generation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = generation_logs.project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own generation_logs"
  ON public.generation_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = generation_logs.project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_generation_logs_project_id ON public.generation_logs(project_id);


-- project_modifications: richieste di modifica successive e stato
CREATE TABLE public.project_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  modification_prompt TEXT NOT NULL,
  files_changed JSONB, -- array di path dei file modificati/aggiunti
  status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_modifications"
  ON public.project_modifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_modifications.project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project_modifications"
  ON public.project_modifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_modifications.project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project_modifications"
  ON public.project_modifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_modifications.project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_project_modifications_project_id ON public.project_modifications(project_id);

CREATE TRIGGER set_timestamp_project_modifications
BEFORE UPDATE ON public.project_modifications
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();


-- 2) Colonne non invasive su "projects" per tracciare generazione e output strutturato
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS original_prompt TEXT,
  ADD COLUMN IF NOT EXISTS package_json JSONB,
  ADD COLUMN IF NOT EXISTS generated_files JSONB, -- opzionale: snapshot del manifest dei file generati
  ADD COLUMN IF NOT EXISTS deploy_url TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS generation_status TEXT NOT NULL DEFAULT 'idle'; -- idle|generating|completed|failed

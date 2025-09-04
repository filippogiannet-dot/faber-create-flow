import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogEntry {
  projectId?: string;
  userId?: string;
  phase: 'analyze' | 'generate' | 'validate' | 'build' | 'preview';
  status: 'started' | 'success' | 'error' | 'warning';
  durationMs?: number;
  errors?: any[];
  warnings?: any[];
  depsAdded?: string[];
  filesChanged?: string[];
  metadata?: any;
}

interface PreviewError {
  projectId?: string;
  userId?: string;
  errorType: 'compile' | 'runtime' | 'import' | 'syntax';
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  errorMessage: string;
  stackTrace?: string;
  browserInfo?: any;
}

interface QualityCheck {
  projectId?: string;
  userId?: string;
  checkType: 'typescript' | 'eslint' | 'build' | 'accessibility';
  status: 'pass' | 'fail' | 'warning';
  results: any;
  suggestions?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      supabase.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: ''
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'log-build': {
        const logEntry: LogEntry = await req.json();
        
        // Skip logging for template projectId
        if (logEntry.projectId === ':projectId') {
          return new Response(JSON.stringify({ success: true, message: 'Template project - logging skipped' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const { error } = await supabase
          .from('build_logs')
          .insert({
            project_id: logEntry.projectId,
            user_id: logEntry.userId,
            phase: logEntry.phase,
            status: logEntry.status,
            duration_ms: logEntry.durationMs,
            errors: logEntry.errors || [],
            warnings: logEntry.warnings || [],
            deps_added: logEntry.depsAdded || [],
            files_changed: logEntry.filesChanged || [],
            metadata: logEntry.metadata || {}
          });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'log-preview-error': {
        const errorEntry: PreviewError = await req.json();
        
        const { error } = await supabase
          .from('preview_errors')
          .insert({
            project_id: errorEntry.projectId,
            user_id: errorEntry.userId,
            error_type: errorEntry.errorType,
            file_path: errorEntry.filePath,
            line_number: errorEntry.lineNumber,
            column_number: errorEntry.columnNumber,
            error_message: errorEntry.errorMessage,
            stack_trace: errorEntry.stackTrace,
            browser_info: errorEntry.browserInfo || {}
          });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'log-quality-check': {
        const qualityEntry: QualityCheck = await req.json();
        
        const { error } = await supabase
          .from('quality_checks')
          .insert({
            project_id: qualityEntry.projectId,
            user_id: qualityEntry.userId,
            check_type: qualityEntry.checkType,
            status: qualityEntry.status,
            results: qualityEntry.results,
            suggestions: qualityEntry.suggestions || []
          });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-logs': {
        const projectId = url.searchParams.get('projectId');
        const limit = parseInt(url.searchParams.get('limit') || '50');

        if (!projectId) {
          return new Response(
            JSON.stringify({ error: 'Project ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get build logs
        const { data: buildLogs, error: buildError } = await supabase
          .from('build_logs')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (buildError) throw buildError;

        // Get preview errors  
        const { data: previewErrors, error: previewError } = await supabase
          .from('preview_errors')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (previewError) throw previewError;

        // Get quality checks
        const { data: qualityChecks, error: qualityError } = await supabase
          .from('quality_checks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (qualityError) throw qualityError;

        return new Response(JSON.stringify({ 
          buildLogs,
          previewErrors,
          qualityChecks,
          summary: {
            totalBuildLogs: buildLogs?.length || 0,
            totalErrors: previewErrors?.length || 0,
            totalQualityChecks: qualityChecks?.length || 0,
            lastSuccess: buildLogs?.find(log => log.status === 'success')?.created_at,
            criticalErrors: previewErrors?.filter(err => err.error_type === 'compile').length || 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in logging function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Logging service failed',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
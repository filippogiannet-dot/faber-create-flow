import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log(`Fetching projects for user ${user.id}`);

    // Get URL parameters
    const url = new URL(req.url);
    const projectId = url.searchParams.get('id');
    const status = url.searchParams.get('status') || 'active';

    if (projectId) {
      // Get specific project
      const { data: project, error } = await supabaseClient
        .from('projects')
        .select(`
          *,
          prompts (
            id,
            prompt_text,
            ai_response,
            tokens_used,
            created_at
          ),
          snapshots (
            id,
            version,
            state,
            created_at
          )
        `)
        .eq('id', projectId)
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to fetch project: ${error.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        project
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Get all projects for user
      const { data: projects, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', status)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        projects
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in get-projects function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
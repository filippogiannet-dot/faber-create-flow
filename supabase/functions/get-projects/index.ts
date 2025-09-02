import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Authorization header is required',
        success: false,
        requestId
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ 
        error: 'User not authenticated',
        success: false,
        requestId
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = userData.user;

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
      success: false,
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
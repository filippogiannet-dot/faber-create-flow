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

    // Parse request body
    const { name, description, libraries = [] } = await req.json();

    if (!name) {
      throw new Error('Project name is required');
    }

    console.log(`Creating project for user ${user.id}:`, { name, description, libraries });

    // Create project in database
    const { data: project, error } = await supabaseClient
      .from('projects')
      .insert({
        owner_id: user.id,
        name,
        description,
        libraries,
        state: {
          components: [],
          theme: 'default',
          initialized: false
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to create project: ${error.message}`);
    }

    console.log('Project created successfully:', project.id);

    return new Response(JSON.stringify({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        libraries: project.libraries,
        state: project.state,
        created_at: project.created_at
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Error in create-project function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
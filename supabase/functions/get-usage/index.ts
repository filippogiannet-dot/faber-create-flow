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

    console.log(`Fetching usage for user ${user.id}`);

    // Get user profile with usage data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    // Get project count and usage
    const { data: projects, error: projectsError } = await supabaseClient
      .from('projects')
      .select('id, name, messages_used, created_at')
      .eq('owner_id', user.id)
      .eq('status', 'active');

    if (projectsError) {
      console.error('Projects fetch error:', projectsError);
      throw new Error('Failed to fetch projects');
    }

    // Get recent prompts
    const { data: recentPrompts, error: promptsError } = await supabaseClient
      .from('prompts')
      .select(`
        id,
        prompt_text,
        tokens_used,
        created_at,
        projects (name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (promptsError) {
      console.error('Prompts fetch error:', promptsError);
    }

    const usage = {
      user: {
        plan: profile.plan,
        messagesUsed: profile.messages_used,
        messagesLimit: profile.messages_limit,
        messagesRemaining: profile.messages_limit - profile.messages_used,
        usagePercentage: Math.round((profile.messages_used / profile.messages_limit) * 100)
      },
      projects: {
        total: projects.length,
        list: projects.map(p => ({
          id: p.id,
          name: p.name,
          messagesUsed: p.messages_used,
          createdAt: p.created_at
        }))
      },
      recentActivity: recentPrompts || []
    };

    return new Response(JSON.stringify({
      success: true,
      usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-usage function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
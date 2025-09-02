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
    const { projectId, updates } = await req.json();

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    console.log(`Updating project ${projectId} for user ${user.id}:`, updates);

    // Verify project ownership
    const { data: project, error: fetchError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (fetchError) {
      console.error('Project fetch error:', fetchError);
      throw new Error('Project not found or access denied');
    }

    // Prepare update data
    const updateData: any = {};
    
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    
    if (updates.state !== undefined) {
      updateData.state = {
        ...project.state,
        ...updates.state
      };
    }
    
    if (updates.libraries !== undefined) {
      updateData.libraries = updates.libraries;
    }

    // Update project
    const { data: updatedProject, error: updateError } = await supabaseClient
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Project update error:', updateError);
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    console.log('Project updated successfully:', projectId);

    return new Response(JSON.stringify({
      success: true,
      project: updatedProject
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-project function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    // Check user's usage limits using the database function
    const { data: canProceed, error: limitError } = await supabaseClient
      .rpc('check_user_limits', { user_id: user.id });

    if (limitError) {
      console.error('Error checking limits:', limitError);
      throw new Error('Failed to check usage limits');
    }

    if (!canProceed) {
      return new Response(JSON.stringify({ 
        error: 'Message limit reached for your plan',
        success: false
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { projectId, prompt, isInitial = false } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    console.log(`AI generation for user ${user.id}, project ${projectId}:`, { prompt, isInitial });

    // Get project context
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError) {
      console.error('Project fetch error:', projectError);
      throw new Error('Project not found or access denied');
    }

    // Build system context based on project state
    let systemPrompt = `You are an expert coding assistant that generates modern web applications using React, TypeScript, and Tailwind CSS.

Project Context:
- Libraries: ${project.libraries.join(', ')}
- Current State: ${JSON.stringify(project.state, null, 2)}

Your task is to generate or modify code based on the user's request. Always:
1. Use modern React with TypeScript
2. Use Tailwind CSS for styling
3. Follow best practices and clean code principles
4. Generate functional, responsive components
5. Include proper error handling

${isInitial ? 'This is the initial generation for a new project. Create a complete app structure.' : 'This is an update to an existing project. Make incremental changes based on the current state.'}

Return your response as a JSON object with this structure:
{
  "components": [
    {
      "name": "ComponentName",
      "code": "component code here",
      "type": "component|page|util"
    }
  ],
  "explanation": "Brief explanation of changes made",
  "libraries": ["list", "of", "required", "libraries"]
}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    const tokensUsed = aiData.usage?.total_tokens || 0;

    console.log('AI response received, tokens used:', tokensUsed);

    // Parse AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response
      parsedResponse = {
        components: [],
        explanation: aiResponse,
        libraries: project.libraries
      };
    }

    // Save prompt and response to database
    const { data: promptRecord, error: promptError } = await supabaseClient
      .from('prompts')
      .insert({
        project_id: projectId,
        user_id: user.id,
        prompt_text: prompt,
        ai_response: parsedResponse,
        tokens_used: tokensUsed
      })
      .select()
      .single();

    if (promptError) {
      console.error('Failed to save prompt:', promptError);
    }

    // Update project state
    const newState = {
      ...project.state,
      components: parsedResponse.components || [],
      libraries: parsedResponse.libraries || project.libraries,
      lastModified: new Date().toISOString()
    };

    const { error: updateError } = await supabaseClient
      .from('projects')
      .update({ 
        state: newState,
        libraries: parsedResponse.libraries || project.libraries
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Failed to update project:', updateError);
    }

    // Create snapshot
    const { data: snapshots } = await supabaseClient
      .from('snapshots')
      .select('version')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = (snapshots && snapshots[0]?.version || 0) + 1;

    const { error: snapshotError } = await supabaseClient
      .from('snapshots')
      .insert({
        project_id: projectId,
        version: nextVersion,
        state: newState,
        prompt_id: promptRecord?.id
      });

    if (snapshotError) {
      console.error('Failed to create snapshot:', snapshotError);
    }

    // Increment usage counters
    const { error: usageError } = await supabaseClient
      .rpc('increment_usage', { 
        user_id: user.id, 
        project_id: projectId 
      });

    if (usageError) {
      console.error('Failed to increment usage:', usageError);
    }

    return new Response(JSON.stringify({
      success: true,
      response: parsedResponse,
      version: nextVersion,
      tokensUsed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-generate function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
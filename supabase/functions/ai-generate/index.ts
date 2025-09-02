import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// Logging utility
function log(level: 'INFO' | 'ERROR' | 'DEBUG', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data: data ? JSON.stringify(data, null, 2) : undefined
  };
  console.log(`[${timestamp}] ${level}: ${message}`, data || '');
  return logEntry;
}

// Sleep utility for retries
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Self-diagnostic function
async function runDiagnostics() {
  const diagnostics = {
    openaiKey: !!Deno.env.get('OPENAI_API_KEY'),
    supabaseUrl: !!Deno.env.get('SUPABASE_URL'),
    supabaseKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
    timestamp: new Date().toISOString()
  };
  
  log('DEBUG', 'System diagnostics', diagnostics);
  return diagnostics;
}

// Enhanced OpenAI API call with retries
async function callOpenAI(prompt: string, systemPrompt: string, retryCount = 0): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const openAIModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
  
  if (!openAIApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  try {
    log('DEBUG', `OpenAI API call attempt ${retryCount + 1}`, { 
      promptLength: prompt.length,
      systemPromptLength: systemPrompt.length,
      model: openAIModel
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openAIModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('ERROR', `OpenAI API error - Status: ${response.status}`, { 
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        retryCount 
      });
      
      // Handle rate limits and retryable errors
      if (response.status === 429 || response.status >= 500) {
        if (retryCount < MAX_RETRIES - 1) {
          const delay = RETRY_DELAYS[retryCount];
          log('INFO', `Retrying OpenAI call in ${delay}ms`, { retryCount, delay });
          await sleep(delay);
          return callOpenAI(prompt, systemPrompt, retryCount + 1);
        }
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const aiData = await response.json();
    log('INFO', 'OpenAI API success', { 
      tokensUsed: aiData.usage?.total_tokens || 0,
      retryCount 
    });
    
    return aiData;
  } catch (error) {
    log('ERROR', `OpenAI API call failed`, { error: error.message, retryCount });
    
    if (retryCount < MAX_RETRIES - 1) {
      const delay = RETRY_DELAYS[retryCount];
      log('INFO', `Retrying OpenAI call in ${delay}ms due to error`, { retryCount, delay, error: error.message });
      await sleep(delay);
      return callOpenAI(prompt, systemPrompt, retryCount + 1);
    }
    
    throw error;
  }
}

// Validate request payload
function validateRequest(body: any): { projectId: string; prompt: string; isInitial: boolean } {
  if (!body) {
    throw new Error('Request body is required');
  }
  
  const { projectId, prompt, isInitial = false } = body;
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt is required and must be a non-empty string');
  }
  
  if (!projectId || typeof projectId !== 'string') {
    throw new Error('Project ID is required and must be a string');
  }
  
  return { projectId, prompt: prompt.trim(), isInitial };
}

// Main handler
serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  log('INFO', `Request started`, { 
    requestId, 
    method: req.method, 
    url: req.url,
    userAgent: req.headers.get('user-agent') 
  });

// Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('DEBUG', 'CORS preflight request', { requestId });
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    log('ERROR', `Invalid method: ${req.method}`, { requestId });
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      success: false,
      requestId
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Run diagnostics
    const diagnostics = await runDiagnostics();
    
    // Validate environment
    if (!diagnostics.openaiKey || !diagnostics.supabaseUrl || !diagnostics.supabaseKey) {
      log('ERROR', 'Missing required environment variables', { requestId, diagnostics });
      return new Response(JSON.stringify({ 
        error: 'Server configuration error',
        success: false,
        requestId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {}
        }
      }
    );

    // Validate authentication
    if (!authHeader) {
      log('ERROR', 'No authorization header', { requestId });
      return new Response(JSON.stringify({ 
        error: 'Authorization header is required',
        success: false,
        requestId
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      log('ERROR', 'Authentication failed', { requestId, authError: authError?.message });
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
    log('INFO', 'User authenticated', { requestId, userId: user.id });

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      log('ERROR', 'Invalid JSON in request body', { requestId, error: parseError.message });
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        success: false,
        requestId
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { projectId, prompt, isInitial } = validateRequest(requestBody);
    
    log('INFO', 'Request validated', { 
      requestId, 
      userId: user.id, 
      projectId, 
      promptLength: prompt.length, 
      isInitial 
    });

    // Check user's usage limits
    const { data: canProceed, error: limitError } = await supabaseClient
      .rpc('check_user_limits', { user_id: user.id });

    if (limitError) {
      log('ERROR', 'Failed to check usage limits', { requestId, error: limitError });
      return new Response(JSON.stringify({ 
        error: 'Failed to check usage limits',
        success: false,
        requestId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!canProceed) {
      log('INFO', 'User limit reached', { requestId, userId: user.id });
      return new Response(JSON.stringify({ 
        error: 'Message limit reached for your plan',
        success: false,
        requestId
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get project
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError) {
      log('ERROR', 'Project not found or access denied', { 
        requestId, 
        projectId, 
        userId: user.id, 
        error: projectError 
      });
      return new Response(JSON.stringify({ 
        error: 'Project not found or access denied',
        success: false,
        requestId
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('INFO', 'Project found', { requestId, projectId, projectName: project.name });

    // Build system prompt
    const systemPrompt = `You are an expert coding assistant that generates modern web applications using React, TypeScript, and Tailwind CSS.

Project Context:
- Libraries: ${project.libraries?.join(', ') || 'react, typescript, tailwindcss'}
- Current State: ${JSON.stringify(project.state || {}, null, 2)}

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

    // Call OpenAI API with retries
    const aiData = await callOpenAI(prompt, systemPrompt);
    const aiResponse = aiData.choices[0].message.content;
    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Parse AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      log('INFO', 'AI response parsed successfully', { requestId, tokensUsed });
    } catch (parseError) {
      log('ERROR', 'Failed to parse AI response', { requestId, error: parseError.message, aiResponse });
      // Fallback response
      parsedResponse = {
        components: [{
          name: 'GeneratedComponent',
          code: `// Generated from prompt: ${prompt}\n${aiResponse}`,
          type: 'component'
        }],
        explanation: 'AI response could not be parsed as JSON, returning as component code',
        libraries: project.libraries || ['react', 'typescript', 'tailwindcss']
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
      log('ERROR', 'Failed to save prompt', { requestId, error: promptError });
      // Don't fail the request, just log the error
    }

    // Update project state
    const newState = {
      ...project.state,
      components: parsedResponse.components || [],
      libraries: parsedResponse.libraries || project.libraries || ['react', 'typescript', 'tailwindcss'],
      lastModified: new Date().toISOString()
    };

    const { error: updateError } = await supabaseClient
      .from('projects')
      .update({ 
        state: newState,
        libraries: parsedResponse.libraries || project.libraries || ['react', 'typescript', 'tailwindcss']
      })
      .eq('id', projectId);

    if (updateError) {
      log('ERROR', 'Failed to update project', { requestId, error: updateError });
      // Don't fail the request, just log the error
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
      log('ERROR', 'Failed to create snapshot', { requestId, error: snapshotError });
      // Don't fail the request, just log the error
    }

    // Increment usage counters
    const { error: usageError } = await supabaseClient
      .rpc('increment_usage', { 
        user_id: user.id, 
        project_id: projectId 
      });

    if (usageError) {
      log('ERROR', 'Failed to increment usage', { requestId, error: usageError });
      // Don't fail the request, just log the error
    }

    const response = {
      success: true,
      response: parsedResponse,
      version: nextVersion,
      tokensUsed,
      requestId
    };

    log('INFO', 'Request completed successfully', { 
      requestId, 
      userId: user.id, 
      projectId, 
      tokensUsed, 
      version: nextVersion 
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log('ERROR', 'Unhandled error in ai-generate function', { 
      requestId, 
      error: error.message, 
      stack: error.stack 
    });
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      success: false,
      requestId,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
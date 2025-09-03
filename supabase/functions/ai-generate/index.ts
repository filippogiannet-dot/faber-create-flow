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

// Log step function for tracking
async function logStep(supabaseClient: any, projectId: string, step: string, status: string, details?: any) {
  try {
    await supabaseClient.from('generation_logs').insert({
      project_id: projectId,
      step,
      status,
      details: details ? JSON.stringify(details) : null,
      execution_time_ms: Date.now()
    });
  } catch (error) {
    console.error('Failed to log step:', error);
  }
}

// Extract project name from prompt
function extractProjectName(prompt: string): string {
  const words = prompt.split(' ').slice(0, 3);
  return words.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'generated-app';
}

// Get file type from path
function getFileType(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return 'text';
  const extension = String(filePath).split('.').pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript', 
    'ts': 'typescript',
    'tsx': 'typescript',
    'css': 'css',
    'html': 'html',
    'json': 'json',
    'md': 'markdown'
  };
  return typeMap[extension || ''] || 'text';
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

  // Allow diagnostics via GET and enforce POST for generation
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const ping = url.searchParams.get('ping');
    const diagnostics = await runDiagnostics();

    if (ping === 'openai') {
      try {
        const aiData = await callOpenAI(
          '{"action":"ping"}',
          'You are a healthcheck. Respond with a compact JSON like {"ok":true}.',
        );
        const content = aiData?.choices?.[0]?.message?.content ?? '';
        let parsed: any;
        try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }
        return new Response(JSON.stringify({ success: true, requestId, diagnostics, openai: parsed }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        log('ERROR', 'OpenAI ping failed', { requestId, error: e.message });
        return new Response(JSON.stringify({ success: false, error: `OpenAI ping failed: ${e.message}`, requestId, diagnostics }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, requestId, diagnostics }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Only allow POST requests for generation
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
        status: 200,
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

    // Set project to generating status
    await supabaseClient
      .from('projects')
      .update({ generation_status: 'generating' })
      .eq('id', projectId);

    await logStep(supabaseClient, projectId, 'parsing', 'started');

    // Check user's usage limits
    const { data: canProceed, error: limitError } = await supabaseClient
      .rpc('check_user_limits', { user_id: user.id });

    if (limitError) {
      log('ERROR', 'Failed to check usage limits', { requestId, error: limitError });
      await logStep(supabaseClient, projectId, 'error', 'failed', { error: 'Failed to check usage limits' });
      return new Response(JSON.stringify({ 
        error: 'Failed to check usage limits',
        success: false,
        requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!canProceed) {
      log('INFO', 'User limit reached', { requestId, userId: user.id });
      await logStep(supabaseClient, projectId, 'error', 'failed', { error: 'User limit reached' });
      return new Response(JSON.stringify({ 
        error: 'Message limit reached for your plan',
        success: false,
        requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get project with robust fallback
    let project: any = null;
    let projectError: any = null;

    const firstTry = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    project = firstTry.data;
    projectError = firstTry.error;

    if (projectError || !project) {
      log('DEBUG', 'Primary project fetch failed, retrying without owner filter', { requestId, projectId, userId: user.id, error: projectError });
      const secondTry = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      project = secondTry.data;
      projectError = secondTry.error;
    }

    if (!project || projectError) {
      log('ERROR', 'Project not found or access denied', { requestId, projectId, userId: user.id, error: projectError });
      await logStep(supabaseClient, projectId, 'error', 'failed', { error: 'Project not found' });
      return new Response(JSON.stringify({ 
        error: 'Project not found or access denied',
        success: false,
        requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('INFO', 'Project found', { requestId, projectId, projectName: project.name });
    await logStep(supabaseClient, projectId, 'parsing', 'completed');

    // Analyze the prompt first
    await logStep(supabaseClient, projectId, 'analysis', 'started');
    
    const analysisPrompt = `
Analyze this request and return ONLY valid JSON:
{
  "projectType": "react|nextjs|vanilla|vue",
  "components": ["ComponentName1", "ComponentName2"],
  "dependencies": ["react", "tailwindcss"],
  "styling": "tailwindcss|css|styled-components",
  "complexity": "simple|medium|complex",
  "fileStructure": {
    "src/components/": ["Component.tsx"],
    "src/": ["App.tsx", "index.tsx"],
    "public/": ["index.html"]
  }
}

Request: "${prompt}"
`;

    const analysisData = await callOpenAI(analysisPrompt, 'You are a project analyzer. Respond with only valid JSON.');
    let analysis;
    try {
      analysis = JSON.parse(analysisData.choices[0].message.content);
      await logStep(supabaseClient, projectId, 'analysis', 'completed', analysis);
    } catch (e) {
      analysis = {
        projectType: 'react',
        components: ['App'],
        dependencies: ['react', 'tailwindcss'],
        styling: 'tailwindcss',
        complexity: 'simple',
        fileStructure: { 'src/': ['App.tsx'], 'public/': ['index.html'] }
      };
      await logStep(supabaseClient, projectId, 'analysis', 'completed', { fallback: true });
    }

    // Generate code with the new structured approach
    await logStep(supabaseClient, projectId, 'generation', 'started');

    const codePrompt = `
Generate a complete web application for: ${prompt}

Technical specifications:
${JSON.stringify(analysis)}

RESPOND WITH VALID JSON ONLY:
{
  "files": [
    {
      "path": "package.json",
      "content": "complete package.json content"
    },
    {
      "path": "public/index.html",
      "content": "complete HTML with React setup"
    },
    {
      "path": "src/App.tsx",
      "content": "complete React component code"
    }
  ],
  "explanation": "Brief explanation of what was built"
}

CRITICAL RULES:
- Generate 100% functional code
- Use Tailwind CSS for all styling
- Create clean, modular React components
- Include proper TypeScript types
- Responsive design
- NO placeholders or TODOs
- All code must be complete and ready to run
`;

    const codeData = await callOpenAI(codePrompt, 'You are an expert React developer. Generate complete, functional code. Respond with valid JSON only.');
    let generatedCode;
    try {
      generatedCode = JSON.parse(codeData.choices[0].message.content);
      await logStep(supabaseClient, projectId, 'generation', 'completed');
    } catch (parseError) {
      // Fallback: try to extract JSON from response
      const content = codeData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          generatedCode = JSON.parse(jsonMatch[0]);
          await logStep(supabaseClient, projectId, 'generation', 'completed', { extracted: true });
        } catch (e2) {
          throw new Error('AI response not in correct JSON format');
        }
      } else {
        throw new Error('No JSON found in AI response');
      }
    }

    // Save generated files to the database
    await logStep(supabaseClient, projectId, 'saving', 'started');

    if (generatedCode.files && Array.isArray(generatedCode.files)) {
      const fileInserts = (generatedCode.files as any[])
        .filter((file: any) => file && typeof file.path === 'string' && typeof file.content === 'string')
        .map((file: any) => ({
          project_id: projectId,
          file_path: file.path,
          file_content: file.content,
          file_type: getFileType(file.path)
        }));

      const { error: filesError } = await supabaseClient
        .from('project_files')
        .upsert(fileInserts);

      if (filesError) {
        log('ERROR', 'Failed to save files', { requestId, error: filesError });
        throw new Error(`Failed to save files: ${filesError.message}`);
      }
    }

    // Extract and save package.json
    const packageJsonFile = generatedCode.files?.find((f: any) => f.path === 'package.json');
    let packageJson = {};
    if (packageJsonFile) {
      try {
        packageJson = JSON.parse(packageJsonFile.content);
      } catch (e) {
        packageJson = { name: extractProjectName(prompt), version: '1.0.0' };
      }
    }

    // Update project with structured data
    const updateData = {
      generation_status: 'completed',
      original_prompt: prompt,
      generated_files: { files: generatedCode.files },
      package_json: packageJson,
      state: {
        ...project.state,
        files: generatedCode.files,
        lastModified: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseClient
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      log('ERROR', 'Failed to update project', { requestId, error: updateError });
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    await logStep(supabaseClient, projectId, 'saving', 'completed');

    // Save prompt and response to database
    const { data: promptRecord, error: promptError } = await supabaseClient
      .from('prompts')
      .insert({
        project_id: projectId,
        user_id: user.id,
        prompt_text: prompt,
        ai_response: {
          explanation: generatedCode.explanation || 'Code generated successfully',
          files: generatedCode.files
        },
        tokens_used: codeData.usage?.total_tokens || 0
      })
      .select()
      .single();

    if (promptError) {
      log('ERROR', 'Failed to save prompt', { requestId, error: promptError });
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
        state: updateData.state,
        prompt_id: promptRecord?.id
      });

    if (snapshotError) {
      log('ERROR', 'Failed to create snapshot', { requestId, error: snapshotError });
    }

    // Increment usage counters
    const { error: usageError } = await supabaseClient
      .rpc('increment_usage', { 
        user_id: user.id, 
        project_id: projectId 
      });

    if (usageError) {
      log('ERROR', 'Failed to increment usage', { requestId, error: usageError });
    }

    const response = {
      success: true,
      response: {
        explanation: generatedCode.explanation || 'Application generated successfully',
        files: generatedCode.files
      },
      version: nextVersion,
      tokensUsed: codeData.usage?.total_tokens || 0,
      requestId
    };

    log('INFO', 'Request completed successfully', { 
      requestId,
      userId: user.id, 
      projectId, 
      tokensUsed: response.tokensUsed, 
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
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
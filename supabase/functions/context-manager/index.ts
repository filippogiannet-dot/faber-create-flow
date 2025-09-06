import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationContext {
  projectStructure: Map<string, string>;
  styleGuide: {
    framework: 'react' | 'vue' | 'next';
    styling: 'tailwind' | 'css' | 'styled-components';
  };
  previousGenerations: Array<{
    prompt: string;
    generatedCode: string;
    validationResults: string[];
  }>;
}

class ContextManager {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async getContext(projectId: string): Promise<GenerationContext> {
    const { data: project } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    const { data: files } = await this.supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    const { data: prompts } = await this.supabase
      .from('prompts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5);

    const projectStructure = new Map();
    files?.forEach((file: any) => {
      projectStructure.set(file.name, file.content);
    });

    return {
      projectStructure,
      styleGuide: {
        framework: project?.framework || 'react',
        styling: project?.styling || 'tailwind'
      },
      previousGenerations: prompts?.map((p: any) => ({
        prompt: p.prompt_text,
        generatedCode: p.ai_response,
        validationResults: p.validation_results || []
      })) || []
    };
  }

  enhancePrompt(rawPrompt: string, context: GenerationContext): string {
    const existingComponents = Array.from(context.projectStructure.keys()).join(', ');
    const recentExamples = context.previousGenerations
      .slice(0, 2)
      .map(gen => gen.generatedCode)
      .join('\n\n---EXAMPLE---\n\n');

    return `
PROJECT CONTEXT:
- Framework: ${context.styleGuide.framework}
- Styling: ${context.styleGuide.styling}
- Existing Components: ${existingComponents || 'None yet'}

RECENT CODE EXAMPLES FROM THIS PROJECT:
${recentExamples || 'No previous generations'}

STRICT REQUIREMENTS:
1. Generate COMPLETE, WORKING ${context.styleGuide.framework} component code
2. Use ${context.styleGuide.styling} for styling with semantic color tokens
3. Include ALL necessary imports (React, hooks, etc.)
4. Export the component properly (export default ComponentName)
5. NO placeholder comments or "// Add your code here"
6. Make it responsive, accessible, and production-ready
7. Follow the patterns shown in the examples above
8. Include proper TypeScript types
9. Handle loading states and errors gracefully
10. Use semantic HTML elements

USER REQUEST: ${rawPrompt}

Generate only the component code, no explanations:`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { projectId, prompt } = await req.json();

    const contextManager = new ContextManager(supabaseClient);
    const context = await contextManager.getContext(projectId);
    const enhancedPrompt = contextManager.enhancePrompt(prompt, context);

    return new Response(JSON.stringify({ 
      enhancedPrompt,
      context: {
        componentCount: context.projectStructure.size,
        framework: context.styleGuide.framework,
        styling: context.styleGuide.styling
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Context Manager Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
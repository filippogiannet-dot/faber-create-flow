import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PromptEnhancementRequest {
  projectId: string;
  originalPrompt: string;
  context?: {
    existingFiles?: Array<{ path: string; content: string }>;
    designSystem?: any;
    previousPrompts?: string[];
  };
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

    const { projectId, originalPrompt, context }: PromptEnhancementRequest = await req.json();

    if (!projectId || !originalPrompt) {
      throw new Error('Project ID and prompt are required');
    }

    console.log('🔍 Enhancing prompt for project:', projectId);

    // Get project context
    const { data: project } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Get existing files
    const { data: existingFiles } = await supabaseClient
      .from('project_files')
      .select('file_path, file_content')
      .eq('project_id', projectId)
      .limit(10);

    // Get recent prompts for context
    const { data: recentPrompts } = await supabaseClient
      .from('prompts')
      .select('prompt_text, ai_response')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Build enhanced prompt
    const existingComponents = existingFiles?.map(f => f.file_path).join(', ') || 'None';
    const recentContext = recentPrompts?.map(p => p.prompt_text).join('\n') || '';

    const enhancedPrompt = `
PROGETTO FABER - CONTESTO AVANZATO:
- ID Progetto: ${projectId}
- Nome: ${project?.name || 'App Generata'}
- Framework: React + TypeScript + Tailwind CSS
- Componenti Esistenti: ${existingComponents}

DESIGN SYSTEM REQUIREMENTS:
- Usa token semantici (primary, secondary, background, foreground)
- NO colori hardcoded (evita text-white, bg-black, etc.)
- Segui pattern dai componenti esistenti
- Design responsive (mobile-first)
- Accessibilità completa (ARIA labels, HTML semantico)

CONTESTO PRECEDENTE:
${recentContext}

REGOLE IMPLEMENTAZIONE STRICT:
1. Genera componenti COMPLETI senza placeholder
2. Includi TUTTI gli import necessari (React, hooks, types)
3. Esporta componenti correttamente (export default ComponentName)
4. Usa interfacce TypeScript per props e state
5. Gestisci stati di loading e errori
6. Rendi componenti responsive
7. Segui pattern React moderni (functional components, hooks)
8. Includi gestione errori e validazione
9. Usa classi Tailwind con token design system
10. Assicurati che i componenti siano production-ready

RICHIESTA UTENTE: ${originalPrompt}

Genera un'implementazione completa e funzionante che segua questi requisiti.`;

    console.log('✅ Prompt enhanced successfully');

    return new Response(JSON.stringify({
      success: true,
      enhancedPrompt,
      context: {
        existingFiles: existingFiles?.length || 0,
        recentPrompts: recentPrompts?.length || 0,
        projectName: project?.name
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Prompt enhancement error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      enhancedPrompt: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
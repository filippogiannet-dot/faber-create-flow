import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GenerationParameters {
  model: string;
  temperature: number;
  max_tokens: number;
  response_format?: { type: string };
}

const DEFAULT_PARAMS: GenerationParameters = {
  model: 'gpt-4o-mini',
  temperature: 0.2,
  max_tokens: 4000,
  response_format: { type: "json_object" }
};

const SYSTEM_PROMPT = `Sei Faber, un architetto AI elite che genera applicazioni React production-ready. Crei applicazioni complete e funzionanti che seguono standard enterprise, design system e best practice. Ogni componente che generi è pixel-perfect, accessibile e manutenibile.

REQUISITI CRITICI DI GENERAZIONE:
1. Genera componenti COMPLETI senza placeholder o commenti TODO
2. Includi TUTTI gli import necessari (React, hooks, types, etc.)
3. Esporta componenti correttamente (export default ComponentName)
4. Usa interfacce TypeScript per tutti props e state
5. Gestisci stati di loading, errori e casi edge
6. Rendi componenti responsive usando Tailwind CSS
7. Segui linee guida accessibilità (ARIA labels, HTML semantico)
8. Usa token design system invece di colori hardcoded
9. Implementa error boundaries e validazione corretta
10. Segui pattern React moderni (functional components, hooks)

Devi rispondere con SOLO JSON valido in questo formato esatto:
{
  "files": [
    { "path": "src/App.tsx", "content": "codice componente completo..." }
  ],
  "explanation": "breve riassunto tecnico"
}`;

async function callOpenAIWithRetry(prompt: string, parameters: GenerationParameters, maxRetries = 3): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OPENAI_API_KEY non configurata');
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🤖 OpenAI API call - Tentativo ${attempt + 1}/${maxRetries}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: parameters.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          response_format: parameters.response_format,
          temperature: parameters.temperature,
          max_tokens: parameters.max_tokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OpenAI API error - Status: ${response.status}`, errorText);
        
        // Retry on rate limits or server errors
        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retry in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ OpenAI API success', { 
        tokensUsed: data.usage?.total_tokens || 0,
        attempt: attempt + 1 
      });
      
      return data;
      
    } catch (error) {
      console.error(`❌ Tentativo ${attempt + 1} fallito:`, error.message);
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retry
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function parseAndValidateResponse(rawContent: string): any {
  // Clean response from markdown formatting
  let cleaned = rawContent.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  
  try {
    const parsed = JSON.parse(cleaned);
    
    // Validate structure
    if (!parsed.files || !Array.isArray(parsed.files)) {
      throw new Error('Response must contain files array');
    }
    
    // Validate each file
    for (const file of parsed.files) {
      if (!file.path || !file.content) {
        throw new Error('Each file must have path and content');
      }
      
      if (typeof file.content !== 'string' || file.content.trim().length === 0) {
        throw new Error(`File ${file.path} has empty or invalid content`);
      }
    }
    
    return parsed;
    
  } catch (parseError) {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('❌ Failed to parse extracted JSON:', e);
      }
    }
    
    throw new Error(`Invalid JSON response: ${parseError.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  
  try {
    const { projectId, prompt, parameters = DEFAULT_PARAMS } = await req.json();

    if (!projectId || !prompt) {
      throw new Error('Project ID and prompt are required');
    }

    console.log('🎯 Starting code generation', { requestId, projectId, promptLength: prompt.length });

    // Merge parameters with defaults
    const finalParams = { ...DEFAULT_PARAMS, ...parameters };

    // Call OpenAI with retry logic
    const aiResponse = await callOpenAIWithRetry(prompt, finalParams);
    
    // Parse and validate response
    const rawContent = aiResponse?.choices?.[0]?.message?.content || '';
    const parsedCode = parseAndValidateResponse(rawContent);

    // Validate generated files
    const validFiles = parsedCode.files.filter((file: any) => {
      if (!file.path || !file.content) return false;
      
      // Check for placeholder content
      const hasPlaceholders = file.content.includes('// TODO') || 
                             file.content.includes('// your code here') ||
                             file.content.includes('{...}');
      
      if (hasPlaceholders) {
        console.warn(`⚠️ File ${file.path} contains placeholders`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) {
      throw new Error('No valid files generated');
    }

    console.log('✅ Code generation completed', { 
      requestId, 
      filesGenerated: validFiles.length,
      tokensUsed: aiResponse.usage?.total_tokens || 0
    });

    return new Response(JSON.stringify({
      success: true,
      files: validFiles,
      explanation: parsedCode.explanation || 'Code generated successfully',
      tokensUsed: aiResponse.usage?.total_tokens || 0,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Code generation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Code generation failed',
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
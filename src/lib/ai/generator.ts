import { supabase } from '@/integrations/supabase/client';
import { templates } from './templates';

interface GenerationOptions {
  template?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  style?: 'modern' | 'minimal' | 'corporate' | 'creative';
}

interface GenerationResult {
  success: boolean;
  code?: string;
  tokens?: number;
  error?: string;
  validationScore?: number;
}

const SYSTEM_PROMPT = `
Tu sei un esperto UI/UX developer. Generi SEMPRE codice React + Tailwind CSS funzionante.

REGOLE CRITICHE:
1. Output SEMPRE un componente React completo e funzionante
2. USA SEMPRE Tailwind CSS per lo styling (mai style inline)
3. INCLUDI SEMPRE useState, useEffect quando necessario
4. USA componenti moderni: Card, Button, Input con className Tailwind
5. INCLUDI SEMPRE dati di esempio realistici
6. Il codice deve essere IMMEDIATAMENTE eseguibile

STRUTTURA OBBLIGATORIA:
\`\`\`jsx
import React, { useState } from 'react';

export default function ComponentName() {
  // Stati e logica qui
  
  return (
    <div className="[classi-tailwind]">
      {/* Componente completo */}
    </div>
  );
}
\`\`\`

Per ogni richiesta, genera un componente COMPLETO che include:
- Header/Hero section
- Contenuto principale  
- Call-to-action
- Footer se richiesto
- Responsive design (mobile-first)
- Animazioni hover
- Stati interattivi
`;

export async function generateWithAI(
  prompt: string, 
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  let template: string;
  
  try {
    const { template: templateOption = 'default', complexity = 'medium', style = 'modern' } = options;
    
    // Defensive check to ensure template is valid
    template = (typeof templateOption === 'string' && templateOption in templates) 
      ? templateOption 
      : 'default';
    
    // Usa template come base
    const baseTemplate = templates[template];
    
    const enhancedPrompt = `
      Basandoti su questo template: ${baseTemplate}
      
      Richiesta utente: ${prompt}
      
      Stile richiesto: ${style}
      Complessità: ${complexity}
      
      Genera un componente React completo che:
      1. Sia visivamente stupendo (usa gradients, shadows, animations)
      2. Sia fully responsive 
      3. Abbia tutti gli stati (hover, active, focus)
      4. Includa dati di esempio realistici
      5. Usi le migliori pratiche di UX
      6. Segua il design system con token semantici
      7. Sia accessibile (ARIA labels, semantic HTML)
      8. Includa micro-interazioni e feedback visivo
    `;

    // First attempt: Call AI service
    let { data, error } = await supabase.functions.invoke('ai-generate', {
      body: {
        prompt: enhancedPrompt,
        systemPrompt: SYSTEM_PROMPT,
        options: {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 4000,
        }
      }
    });

    console.log("AI raw response (first attempt):", data);
    console.log("AI error (first attempt):", error);

    if (error) {
      console.error('AI Generation error:', error);
      
      // Fallback to template if AI fails
      return {
        success: true,
        code: templates[template] || templates.default,
        tokens: 0,
        error: 'Using template due to AI error',
        validationScore: 80
      };
    }

    // Extract code from the correct response structure
    const code = data?.code || 
                 data?.response?.code || 
                 data?.response?.files?.[0]?.content ||
                 data?.files?.[0]?.content;
    
    console.log("Extracted code:", code);
    
    // Check if code is empty and retry once
    if (!code || code.trim() === '') {
      console.warn("⚠️ Generated code is empty. Retrying once...");
      
      // Retry with slightly different prompt
      const retryPrompt = `${enhancedPrompt}\n\nIMPORTANTE: Devi restituire SEMPRE codice React valido. Non restituire mai una risposta vuota.`;
      
      const retryResult = await supabase.functions.invoke('ai-generate', {
        body: {
          prompt: retryPrompt,
          systemPrompt: SYSTEM_PROMPT,
          options: {
            model: 'gpt-4o-mini',
            temperature: 0.8, // Slightly higher temperature for retry
            max_tokens: 4000,
          }
        }
      });
      
      console.log("AI retry response:", retryResult.data);
      
      const retryCode = retryResult.data?.code || 
                       retryResult.data?.response?.code || 
                       retryResult.data?.response?.files?.[0]?.content ||
                       retryResult.data?.files?.[0]?.content;
      
      if (!retryCode || retryCode.trim() === '') {
        console.error("❌ AI returned empty code twice. Using fallback template.");
        return {
          success: true,
          code: templates[template] || templates.default,
          tokens: 0,
          error: 'AI returned empty code twice, using template fallback',
          validationScore: 70
        };
      }
      
      // Use retry code
      const cleanedRetryCode = cleanCode(retryCode);
      
      // Basic syntax validation for retry code
      try {
        new Function(cleanedRetryCode);
      } catch (syntaxError) {
        console.error("Syntax error in retry code:", syntaxError);
        return {
          success: true,
          code: templates[template] || templates.default,
          tokens: 0,
          error: 'Retry code had syntax errors, using template fallback',
          validationScore: 65
        };
      }
      
      const retryValidationScore = await validateCode(cleanedRetryCode);
      
      return {
        success: true,
        code: cleanedRetryCode,
        tokens: retryResult.data?.tokens || 0,
        validationScore: retryValidationScore
      };
    }
    
    // Basic syntax validation
    const cleanedCode = cleanCode(code);
    
    // Syntax validation using Function constructor
    try {
      new Function(cleanedCode);
    } catch (syntaxError) {
      console.error("Syntax error in generated code:", syntaxError);
      return {
        success: true,
        code: templates[template] || templates.default,
        tokens: 0,
        error: 'Generated code had syntax errors, using template fallback',
        validationScore: 60
      };
    }

    // Additional structure validation
    if (!cleanedCode.includes('export default') || !cleanedCode.includes('return')) {
      console.warn("Generated code missing required React structure, using template fallback");
      return {
        success: true,
        code: templates[template] || templates.default,
        tokens: 0,
        error: 'Generated code missing React structure, using template fallback',
        validationScore: 65
      };
    }
    
    const validationScore = await validateCode(cleanedCode);

    return {
      success: true,
      code: cleanedCode,
      tokens: data?.tokens || 0,
      validationScore
    };
  } catch (error) {
    console.error('Generation error:', error);
    
    // Final fallback to template if everything fails
    return {
      success: true,
      code: templates[template] || templates.default,
      tokens: 0,
      error: `Generation pipeline failed: ${error.message}`,
      validationScore: 50
    };
  }
}

function cleanCode(code: string): string {
  // Rimuovi markdown se presente
  let cleaned = code.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
  
  // Assicurati che abbia la struttura corretta
  if (!cleaned.includes('import React')) {
    cleaned = "import React, { useState } from 'react';\n\n" + cleaned;
  }
  
  return cleaned;
}

async function validateCode(code: string): Promise<number> {
  try {
    const { data } = await supabase.functions.invoke('validate-code', {
      body: {
        files: [{ path: 'App.tsx', content: code }],
        skipTypeCheck: false
      }
    });

    if (data?.success) {
      return data.score || 100;
    }
    
    return 80; // Default score if validation fails
  } catch (error) {
    console.warn('Validation failed:', error);
    return 75; // Lower score for validation errors
  }
}

// Funzioni di utilità per migliorare la generazione
export function enhancePromptWithContext(
  prompt: string, 
  existingFiles: Array<{ path: string; content: string }> = []
): string {
  const context = existingFiles.length > 0 
    ? `\n\nCONTESTO ESISTENTE:\n${existingFiles.map(f => `${f.path}:\n${f.content.slice(0, 500)}...`).join('\n\n')}`
    : '';
    
  return prompt + context + `
  
REQUISITI AGGIUNTIVI:
- Mantieni coerenza con il design system esistente
- Usa pattern già stabiliti nel progetto
- Migliora l'UX con micro-interazioni
- Assicurati che sia production-ready
- Includi stati di loading e errore
`;
}

export function getTemplateByCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'business': 'dashboard',
    'marketing': 'saas',
    'ecommerce': 'ecommerce',
    'portfolio': 'portfolio',
    'blog': 'blog',
    'landing': 'default'
  };
  
  return categoryMap[category.toLowerCase()] || 'default';
}
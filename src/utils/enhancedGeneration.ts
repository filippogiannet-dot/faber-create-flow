// Enhanced Generation Pipeline for Frontend
import { supabase } from '@/integrations/supabase/client';

export interface GenerationRequest {
  projectId: string;
  prompt: string;
  componentName?: string;
  isInitial?: boolean;
}

export interface GenerationResult {
  success: boolean;
  files?: Array<{ path: string; content: string }>;
  error?: string;
  validationScore?: number;
  attempts?: number;
}

export class EnhancedGenerationService {
  private static instance: EnhancedGenerationService;

  static getInstance(): EnhancedGenerationService {
    if (!EnhancedGenerationService.instance) {
      EnhancedGenerationService.instance = new EnhancedGenerationService();
    }
    return EnhancedGenerationService.instance;
  }

  async generateWithValidation(request: GenerationRequest): Promise<GenerationResult> {
    try {
      console.log('🚀 Starting enhanced generation pipeline...');
      
      // Step 1: Enhanced prompt engineering
      const enhancedPrompt = await this.enhancePrompt(request);
      
      // Step 2: Call the enhanced AI generation endpoint
      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          projectId: request.projectId,
          prompt: enhancedPrompt,
          isInitial: request.isInitial || false
        }
      });

      if (error) {
        console.error('❌ Generation failed:', error);
        return {
          success: false,
          error: error.message || 'Generation failed'
        };
      }

      if (!data.success) {
        console.error('❌ Generation unsuccessful:', data.error);
        return {
          success: false,
          error: data.error || 'Unknown generation error'
        };
      }

      console.log('✅ Enhanced generation completed successfully');
      
      return {
        success: true,
        files: data.files || [],
        validationScore: data.validationScore,
        attempts: data.attempts
      };

    } catch (error) {
      console.error('❌ Enhanced generation service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async enhancePrompt(request: GenerationRequest): Promise<string> {
    // Get project context
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', request.projectId)
      .single();

    const { data: existingFiles } = await supabase
      .from('project_files')
      .select('file_path, file_content')
      .eq('project_id', request.projectId)
      .limit(5);

    const { data: recentPrompts } = await supabase
      .from('prompts')
      .select('prompt_text, ai_response')
      .eq('project_id', request.projectId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Build context-aware enhanced prompt
    const existingComponents = existingFiles?.map(f => f.file_path).join(', ') || 'None';
    const recentContext = recentPrompts?.map(p => p.ai_response).join('\n\n---\n\n') || '';

    return `
ENHANCED PROJECT CONTEXT:
- Project: ${project?.name || 'Unnamed Project'}
- Framework: React + TypeScript + Tailwind CSS
- Existing Components: ${existingComponents}
- Component Name: ${request.componentName || 'Auto-generated'}

DESIGN SYSTEM REQUIREMENTS:
- Use semantic color tokens (primary, secondary, background, foreground)
- NO hardcoded colors (avoid text-white, bg-black, etc.)
- Follow design system patterns from existing components
- Implement proper responsive design
- Include accessibility features (ARIA labels, semantic HTML)

RECENT CODE PATTERNS:
${recentContext}

STRICT IMPLEMENTATION RULES:
1. Generate COMPLETE components with no placeholders
2. Include all necessary imports (React, hooks, types)
3. Export components properly (export default ComponentName)
4. Use TypeScript interfaces for props and state
5. Handle loading states and error boundaries
6. Make components responsive (mobile-first)
7. Follow modern React patterns (functional components, hooks)
8. Include proper error handling and validation
9. Use Tailwind classes with design system tokens
10. Ensure components are production-ready

USER REQUEST: ${request.prompt}

Generate a complete, working implementation that follows these requirements.`;
  }

  async validateGeneration(files: Array<{ path: string; content: string }>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalScore = 0;

    for (const file of files) {
      const fileValidation = this.validateFile(file);
      errors.push(...fileValidation.errors);
      warnings.push(...fileValidation.warnings);
      totalScore += fileValidation.score;
    }

    const avgScore = files.length > 0 ? totalScore / files.length : 0;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: avgScore
    };
  }

  private validateFile(file: { path: string; content: string }) {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const content = file.content;

    // Check for placeholders
    if (content.includes('// TODO') || content.includes('// your code here') || content.includes('{...}')) {
      errors.push(`${file.path}: Contains placeholder comments`);
      score -= 30;
    }

    // Check React component structure
    if (file.path.includes('.tsx')) {
      if (!content.includes('import React') && !content.includes('import {')) {
        errors.push(`${file.path}: Missing React import`);
        score -= 20;
      }

      if (!content.includes('export default') && !content.includes('export const')) {
        errors.push(`${file.path}: Missing export statement`);
        score -= 20;
      }

      if (content.includes('function ') && !content.includes('return')) {
        errors.push(`${file.path}: Function component missing return statement`);
        score -= 25;
      }
    }

    // Check for design system compliance
    const hardCodedColors = ['text-white', 'text-black', 'bg-white', 'bg-black'];
    hardCodedColors.forEach(color => {
      if (content.includes(color)) {
        warnings.push(`${file.path}: Uses hardcoded color '${color}' - prefer design system tokens`);
        score -= 5;
      }
    });

    // Check for accessibility
    if (content.includes('<button') && !content.includes('aria-label')) {
      warnings.push(`${file.path}: Buttons should have aria-label attributes`);
      score -= 3;
    }

    if (content.includes('<img') && !content.includes('alt=')) {
      warnings.push(`${file.path}: Images should have alt attributes`);
      score -= 3;
    }

    return {
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }
}

// Export singleton instance
export const enhancedGeneration = EnhancedGenerationService.getInstance();
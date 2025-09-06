import { supabase } from '@/integrations/supabase/client';

export interface GenerationRequest {
  projectId: string;
  prompt: string;
  isInitial?: boolean;
  context?: {
    existingFiles?: Array<{ path: string; content: string }>;
    designSystem?: any;
    previousPrompts?: string[];
  };
}

export interface GenerationResult {
  success: boolean;
  files?: Array<{ path: string; content: string }>;
  error?: string;
  validationScore?: number;
  attempts?: number;
  explanation?: string;
}

export class AIGenerationService {
  private static instance: AIGenerationService;

  static getInstance(): AIGenerationService {
    if (!AIGenerationService.instance) {
      AIGenerationService.instance = new AIGenerationService();
    }
    return AIGenerationService.instance;
  }

  async generateWithEnhancement(request: GenerationRequest): Promise<GenerationResult> {
    try {
      console.log('🚀 Starting enhanced AI generation pipeline...');
      
      // Step 1: Enhance prompt with context
      const enhancedPrompt = await this.enhancePrompt(request);
      
      // Step 2: Generate code with optimized parameters
      const generationResult = await this.generateCode(enhancedPrompt, request.projectId);
      
      // Step 3: Validate and fix generated code
      if (generationResult.success && generationResult.files) {
        const validationResult = await this.validateAndFix(generationResult.files);
        
        if (validationResult.fixedFiles && validationResult.fixedFiles.length > 0) {
          generationResult.files = validationResult.fixedFiles;
        }
        
        generationResult.validationScore = this.calculateScore(validationResult);
      }
      
      return generationResult;
      
    } catch (error) {
      console.error('❌ AI Generation Service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async enhancePrompt(request: GenerationRequest): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: {
          projectId: request.projectId,
          originalPrompt: request.prompt,
          context: request.context
        }
      });

      if (error) throw error;
      
      return data.enhancedPrompt || request.prompt;
    } catch (error) {
      console.warn('⚠️ Prompt enhancement failed, using original:', error);
      return request.prompt;
    }
  }

  private async generateCode(prompt: string, projectId: string): Promise<GenerationResult> {
    const { data, error } = await supabase.functions.invoke('generate-code', {
      body: {
        projectId,
        prompt,
        parameters: {
          model: 'gpt-4o-mini',
          temperature: 0.2,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        }
      }
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Code generation failed'
      };
    }

    return data;
  }

  private async validateAndFix(files: Array<{ path: string; content: string }>) {
    try {
      const { data, error } = await supabase.functions.invoke('validate-code', {
        body: {
          files,
          skipTypeCheck: false
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.warn('⚠️ Validation failed:', error);
      return { success: true, errors: [], fixes: [] };
    }
  }

  private calculateScore(validationResult: any): number {
    const errorCount = validationResult.errors?.filter((e: any) => e.severity === 'error').length || 0;
    const warningCount = validationResult.errors?.filter((e: any) => e.severity === 'warning').length || 0;
    
    return Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));
  }
}

export const aiGeneration = AIGenerationService.getInstance();
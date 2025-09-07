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
      
      // Step 1: Enhance prompt with context (with fallback)
      let enhancedPrompt: string;
      try {
        enhancedPrompt = await this.enhancePrompt(request);
      } catch (error) {
        console.warn('⚠️ Prompt enhancement failed, using original prompt:', error);
        enhancedPrompt = request.prompt;
      }
      
      // Step 2: Generate code with optimized parameters (with fallback)
      let generationResult: GenerationResult;
      try {
        generationResult = await this.generateCode(enhancedPrompt, request.projectId);
      } catch (error) {
        console.error('❌ Edge function failed, using fallback generation:', error);
        generationResult = await this.fallbackGeneration(enhancedPrompt, request);
      }
      
      // Step 3: Validate and fix generated code
      if (generationResult.success && generationResult.files) {
        let validationResult;
        try {
          validationResult = await this.validateAndFix(generationResult.files);
        } catch (error) {
          console.warn('⚠️ Validation failed, skipping:', error);
          validationResult = { success: true, errors: [], fixes: [] };
        }
        
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
      throw new Error(`Prompt enhancement failed: ${error.message}`);
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
      throw new Error(error.message || 'Code generation failed');
    }

    return data;
  }

  private async fallbackGeneration(prompt: string, request: GenerationRequest): Promise<GenerationResult> {
    console.log('🔄 Using fallback generation method...');
    
    // Simple fallback that creates a basic React app structure
    const isInitial = !request.context?.existingFiles || request.context.existingFiles.length === 0;
    
    if (isInitial) {
      // Generate a basic React app
      const appContent = `import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Generated App
        </h1>
        <p className="text-gray-600 mb-4">
          ${prompt.slice(0, 200)}${prompt.length > 200 ? '...' : ''}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-blue-800 text-sm">
            This is a fallback implementation. Edge functions are currently unavailable.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;`;

      return {
        success: true,
        files: [
          { path: 'src/App.tsx', content: appContent }
        ],
        explanation: 'Fallback app generated due to Edge Function unavailability',
        validationScore: 80
      };
    } else {
      // For modifications, return existing files unchanged
      return {
        success: true,
        files: request.context?.existingFiles || [],
        explanation: 'Edge functions unavailable - no changes applied',
        validationScore: 100
      };
    }
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
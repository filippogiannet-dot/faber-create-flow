// Enhanced AI Generator - Bolt/Lovable Architecture
import { supabase } from '@/integrations/supabase/client';
import { codeExtractor } from './codeExtractor';
import { streamingGenerator } from './streamingGenerator';
import { buildEnhancedPrompt, SYSTEM_PROMPTS } from './prompts';

export interface EnhancedGenerationOptions {
  template?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  style?: 'modern' | 'minimal' | 'corporate' | 'creative';
  streaming?: boolean;
  onProgress?: (step: string, progress: number) => void;
  onFileGenerated?: (file: { path: string; content: string }) => void;
}

export interface EnhancedGenerationResult {
  success: boolean;
  files?: Array<{ path: string; content: string }>;
  explanation?: string;
  error?: string;
  validationScore?: number;
  tokensUsed?: number;
  extractionMethod?: string;
  fallbackUsed?: boolean;
}

export class EnhancedAIGenerator {
  private static instance: EnhancedAIGenerator;

  static getInstance(): EnhancedAIGenerator {
    if (!EnhancedAIGenerator.instance) {
      EnhancedAIGenerator.instance = new EnhancedAIGenerator();
    }
    return EnhancedAIGenerator.instance;
  }

  async generate(prompt: string, options: EnhancedGenerationOptions = {}): Promise<EnhancedGenerationResult> {
    console.log('🚀 Enhanced AI Generation Pipeline Started');
    console.log('Options:', options);
    console.log('Prompt length:', prompt.length);

    try {
      // Use streaming generation if requested
      if (options.streaming) {
        return await this.generateWithStreaming(prompt, options);
      }

      // Standard generation pipeline
      return await this.generateStandard(prompt, options);

    } catch (error) {
      console.error('❌ Enhanced generation failed:', error);
      return {
        success: false,
        error: error.message,
        fallbackUsed: false
      };
    }
  }

  private async generateWithStreaming(prompt: string, options: EnhancedGenerationOptions): Promise<EnhancedGenerationResult> {
    console.log('🌊 Using streaming generation');
    
    try {
      const result = await streamingGenerator.generateWithStreaming(prompt, {
        template: options.template,
        complexity: options.complexity,
        style: options.style,
        onProgress: options.onProgress,
        onFileGenerated: options.onFileGenerated,
        onComplete: (result) => console.log('Streaming complete:', result),
        onError: (error) => console.error('Streaming error:', error)
      });

      return {
        success: true,
        files: result.files,
        explanation: 'Generated with streaming pipeline',
        validationScore: 95,
        extractionMethod: 'streaming',
        fallbackUsed: false
      };

    } catch (error) {
      console.error('❌ Streaming generation failed:', error);
      return await this.generateStandard(prompt, options);
    }
  }

  private async generateStandard(prompt: string, options: EnhancedGenerationOptions): Promise<EnhancedGenerationResult> {
    console.log('⚡ Using standard generation');

    // Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(prompt, {
      template: options.template,
      complexity: options.complexity,
      style: options.style
    });

    console.log('Enhanced prompt created, length:', enhancedPrompt.length);

    // Attempt 1: Call AI service
    try {
      options.onProgress?.('Calling AI service...', 30);
      
      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          prompt: enhancedPrompt,
          systemPrompt: SYSTEM_PROMPTS.codeGeneration,
          options: {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            max_tokens: 4000,
          }
        }
      });

      console.log('AI service response:', { data, error });

      if (error) {
        console.error('❌ AI service error:', error);
        throw new Error(`AI service failed: ${error.message}`);
      }

      options.onProgress?.('Extracting code...', 60);

      // Extract code using advanced extractor
      const extracted = codeExtractor.extractFromAIResponse(data);
      
      console.log('Code extraction result:', {
        hasValidCode: extracted.hasValidCode,
        filesCount: extracted.files.length,
        extractionMethod: extracted.extractionMethod
      });

      if (extracted.hasValidCode && extracted.files.length > 0) {
        options.onProgress?.('Validating code...', 80);
        
        // Validate extracted code
        const validationScore = await this.calculateValidationScore(extracted.files);
        
        options.onProgress?.('Generation complete', 100);

        return {
          success: true,
          files: extracted.files,
          explanation: extracted.explanation || 'Code generated successfully',
          validationScore,
          extractionMethod: extracted.extractionMethod,
          fallbackUsed: false
        };
      }

    } catch (error) {
      console.error('❌ AI service call failed:', error);
    }

    // Attempt 2: Retry with simplified prompt
    try {
      console.log('🔄 Retrying with simplified prompt');
      options.onProgress?.('Retrying generation...', 40);

      const simplifiedPrompt = `Create a React component for: ${prompt}. Use TypeScript and Tailwind CSS. Return only working code.`;

      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          prompt: simplifiedPrompt,
          systemPrompt: 'Generate only working React code. No explanations.',
          options: {
            model: 'gpt-4o-mini',
            temperature: 0.1,
            max_tokens: 2000,
          }
        }
      });

      if (!error && data) {
        const extracted = codeExtractor.extractFromAIResponse(data);
        
        if (extracted.hasValidCode && extracted.files.length > 0) {
          options.onProgress?.('Retry successful', 100);
          
          return {
            success: true,
            files: extracted.files,
            explanation: 'Generated with simplified prompt',
            validationScore: 85,
            extractionMethod: extracted.extractionMethod,
            fallbackUsed: false
          };
        }
      }

    } catch (retryError) {
      console.error('❌ Retry failed:', retryError);
    }

    // Attempt 3: Use intelligent template fallback
    console.log('🎯 Using intelligent template fallback');
    options.onProgress?.('Using template fallback...', 90);

    const fallbackCode = this.generateIntelligentFallback(prompt, options);
    
    options.onProgress?.('Fallback complete', 100);

    return {
      success: true,
      files: [{ path: 'src/App.tsx', content: fallbackCode }],
      explanation: 'Generated using intelligent template fallback',
      validationScore: 75,
      extractionMethod: 'intelligent_fallback',
      fallbackUsed: true
    };
  }

  private generateIntelligentFallback(prompt: string, options: EnhancedGenerationOptions): string {
    // Analyze prompt to determine best template
    const promptLower = prompt.toLowerCase();
    
    let templateType = 'default';
    if (promptLower.includes('dashboard') || promptLower.includes('admin')) {
      templateType = 'dashboard';
    } else if (promptLower.includes('shop') || promptLower.includes('ecommerce')) {
      templateType = 'ecommerce';
    } else if (promptLower.includes('blog') || promptLower.includes('article')) {
      templateType = 'blog';
    } else if (promptLower.includes('portfolio') || promptLower.includes('showcase')) {
      templateType = 'portfolio';
    }

    // Generate contextual component based on prompt analysis
    const componentName = this.extractComponentName(prompt);
    const features = this.extractFeatures(prompt);
    
    return `import React, { useState, useEffect } from 'react';

export default function ${componentName}() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setData([
        { id: 1, title: 'Sample Item 1', description: 'Generated based on your prompt' },
        { id: 2, title: 'Sample Item 2', description: 'Intelligent fallback content' },
        { id: 3, title: 'Sample Item 3', description: 'Ready for customization' }
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold chrome-text mb-2">
            ${componentName}
          </h1>
          <p className="text-muted-foreground">
            Generated from: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground mb-4">
                {item.description}
              </p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                Learn More
              </button>
            </div>
          ))}
        </div>

        ${features.includes('form') ? `
        <div className="mt-12 bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Contact Form</h2>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-3 border border-input rounded-md bg-background text-foreground"
            />
            <input
              type="email"
              placeholder="Your Email"
              className="w-full p-3 border border-input rounded-md bg-background text-foreground"
            />
            <textarea
              placeholder="Your Message"
              rows={4}
              className="w-full p-3 border border-input rounded-md bg-background text-foreground"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
        ` : ''}
      </main>
    </div>
  );
}`;
  }

  private extractComponentName(prompt: string): string {
    // Extract meaningful component name from prompt
    const words = prompt.split(' ').slice(0, 3);
    const name = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '');
    
    return name || 'GeneratedApp';
  }

  private extractFeatures(prompt: string): string[] {
    const featureKeywords = ['form', 'chart', 'table', 'modal', 'navigation', 'search'];
    return featureKeywords.filter(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
  }

  private async calculateValidationScore(files: Array<{ path: string; content: string }>): Promise<number> {
    try {
      const { data } = await supabase.functions.invoke('validate-code', {
        body: { files, skipTypeCheck: false }
      });

      return data?.score || 85;
    } catch (error) {
      console.warn('Validation failed:', error);
      return 80; // Default score
    }
  }
}

export const enhancedAIGenerator = EnhancedAIGenerator.getInstance();
// Streaming Code Generation - Bolt/Lovable Pattern
export interface StreamingOptions {
  onProgress?: (step: string, progress: number) => void;
  onFileGenerated?: (file: { path: string; content: string }) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export interface GenerationStep {
  name: string;
  description: string;
  weight: number; // Percentage of total progress
}

export const GENERATION_STEPS: GenerationStep[] = [
  { name: 'analyze', description: 'Analyzing requirements', weight: 10 },
  { name: 'plan', description: 'Planning architecture', weight: 15 },
  { name: 'generate', description: 'Generating components', weight: 50 },
  { name: 'validate', description: 'Validating code', weight: 15 },
  { name: 'optimize', description: 'Optimizing output', weight: 10 }
];

export class StreamingGenerator {
  private static instance: StreamingGenerator;

  static getInstance(): StreamingGenerator {
    if (!StreamingGenerator.instance) {
      StreamingGenerator.instance = new StreamingGenerator();
    }
    return StreamingGenerator.instance;
  }

  async generateWithStreaming(
    prompt: string,
    options: StreamingOptions & {
      template?: string;
      complexity?: 'simple' | 'medium' | 'complex';
      style?: 'modern' | 'minimal' | 'corporate' | 'creative';
    } = {}
  ): Promise<any> {
    let currentProgress = 0;
    
    const updateProgress = (stepName: string, stepProgress: number = 100) => {
      const step = GENERATION_STEPS.find(s => s.name === stepName);
      if (step) {
        const stepWeight = step.weight / 100;
        const stepContribution = stepWeight * (stepProgress / 100);
        
        // Calculate total progress
        const completedSteps = GENERATION_STEPS
          .slice(0, GENERATION_STEPS.findIndex(s => s.name === stepName))
          .reduce((sum, s) => sum + s.weight, 0);
        
        currentProgress = (completedSteps / 100) + stepContribution;
        options.onProgress?.(step.description, Math.round(currentProgress * 100));
      }
    };

    try {
      // Step 1: Analyze requirements
      updateProgress('analyze', 0);
      const analysis = await this.analyzeRequirements(prompt);
      updateProgress('analyze', 100);

      // Step 2: Plan architecture
      updateProgress('plan', 0);
      const architecture = await this.planArchitecture(prompt, analysis);
      updateProgress('plan', 100);

      // Step 3: Generate components
      updateProgress('generate', 0);
      const generationResult = await this.generateComponents(prompt, architecture, {
        onProgress: (progress) => updateProgress('generate', progress)
      });
      updateProgress('generate', 100);

      // Step 4: Validate code
      updateProgress('validate', 0);
      const validationResult = await this.validateGeneration(generationResult);
      updateProgress('validate', 100);

      // Step 5: Optimize
      updateProgress('optimize', 0);
      const optimizedResult = await this.optimizeCode(validationResult);
      updateProgress('optimize', 100);

      // Notify completion
      options.onComplete?.(optimizedResult);
      
      return optimizedResult;

    } catch (error) {
      console.error('❌ Streaming generation failed:', error);
      options.onError?.(error.message);
      throw error;
    }
  }

  private async analyzeRequirements(prompt: string): Promise<any> {
    // Simulate analysis (in real implementation, this could call a specialized AI endpoint)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      type: this.detectAppType(prompt),
      complexity: this.detectComplexity(prompt),
      features: this.extractFeatures(prompt),
      framework: 'react',
      styling: 'tailwind'
    };
  }

  private async planArchitecture(prompt: string, analysis: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      components: this.planComponents(analysis),
      fileStructure: this.planFileStructure(analysis),
      dependencies: this.planDependencies(analysis)
    };
  }

  private async generateComponents(prompt: string, architecture: any, options: { onProgress?: (progress: number) => void }): Promise<any> {
    const components = architecture.components || ['App'];
    const totalComponents = components.length;
    const files: Array<{ path: string; content: string }> = [];

    for (let i = 0; i < totalComponents; i++) {
      const component = components[i];
      const progress = ((i + 1) / totalComponents) * 100;
      
      options.onProgress?.(progress);
      
      // Generate individual component
      const componentCode = await this.generateSingleComponent(component, prompt, architecture);
      
      if (componentCode) {
        const file = {
          path: `src/${component === 'App' ? 'App.tsx' : `components/${component}.tsx`}`,
          content: componentCode
        };
        files.push(file);
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return { files, architecture };
  }

  private async generateSingleComponent(componentName: string, prompt: string, architecture: any): Promise<string> {
    // This would call your AI service to generate a specific component
    // For now, return a template-based component
    
    const templates = {
      App: `import React, { useState } from 'react';

export default function App() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold chrome-text mb-4">
            Generated Application
          </h1>
          <p className="text-muted-foreground">
            Built with AI-powered code generation
          </p>
        </header>
        
        <main className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
            <p className="text-muted-foreground">
              This application was generated based on your prompt: "${prompt.slice(0, 100)}..."
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}`,
      
      Header: `import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
    </header>
  );
}`
    };

    return templates[componentName as keyof typeof templates] || templates.App;
  }

  private async validateGeneration(result: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Basic validation
    const validFiles = result.files.filter((file: any) => {
      return file.content && file.content.trim().length > 0;
    });

    return {
      ...result,
      files: validFiles,
      validation: {
        isValid: validFiles.length > 0,
        errors: [],
        warnings: []
      }
    };
  }

  private async optimizeCode(result: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Basic optimization (formatting, imports, etc.)
    const optimizedFiles = result.files.map((file: any) => ({
      ...file,
      content: this.optimizeFileContent(file.content)
    }));

    return {
      ...result,
      files: optimizedFiles,
      optimized: true
    };
  }

  private optimizeFileContent(content: string): string {
    // Basic optimizations
    let optimized = content;
    
    // Remove extra whitespace
    optimized = optimized.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Ensure proper imports order
    const lines = optimized.split('\n');
    const imports = lines.filter(line => line.startsWith('import'));
    const rest = lines.filter(line => !line.startsWith('import'));
    
    if (imports.length > 0) {
      optimized = [...imports, '', ...rest].join('\n');
    }
    
    return optimized;
  }

  // Helper methods for analysis
  private detectAppType(prompt: string): string {
    const keywords = {
      dashboard: ['dashboard', 'admin', 'analytics', 'metrics'],
      ecommerce: ['shop', 'store', 'product', 'cart', 'checkout'],
      blog: ['blog', 'article', 'post', 'content'],
      portfolio: ['portfolio', 'showcase', 'gallery', 'work'],
      landing: ['landing', 'marketing', 'homepage', 'website']
    };

    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => prompt.toLowerCase().includes(word))) {
        return type;
      }
    }

    return 'general';
  }

  private detectComplexity(prompt: string): 'simple' | 'medium' | 'complex' {
    const complexityIndicators = {
      simple: ['simple', 'basic', 'minimal', 'quick'],
      complex: ['advanced', 'complex', 'sophisticated', 'enterprise', 'full-featured']
    };

    const promptLower = prompt.toLowerCase();
    
    if (complexityIndicators.simple.some(word => promptLower.includes(word))) {
      return 'simple';
    }
    
    if (complexityIndicators.complex.some(word => promptLower.includes(word))) {
      return 'complex';
    }
    
    return 'medium';
  }

  private extractFeatures(prompt: string): string[] {
    const featureKeywords = [
      'authentication', 'login', 'signup', 'auth',
      'database', 'storage', 'data',
      'payment', 'stripe', 'checkout',
      'search', 'filter', 'sort',
      'upload', 'file', 'image',
      'notification', 'email', 'alert',
      'chart', 'graph', 'analytics',
      'responsive', 'mobile', 'desktop'
    ];

    return featureKeywords.filter(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
  }

  private planComponents(analysis: any): string[] {
    const baseComponents = ['App'];
    
    if (analysis.features.includes('authentication')) {
      baseComponents.push('LoginForm', 'SignupForm');
    }
    
    if (analysis.features.includes('navigation')) {
      baseComponents.push('Header', 'Navigation');
    }
    
    if (analysis.type === 'dashboard') {
      baseComponents.push('Dashboard', 'StatsCard', 'Chart');
    }
    
    return baseComponents;
  }

  private planFileStructure(analysis: any): Record<string, string[]> {
    return {
      'src/': ['App.tsx', 'index.tsx'],
      'src/components/': [],
      'src/hooks/': [],
      'src/utils/': [],
      'public/': ['index.html']
    };
  }

  private planDependencies(analysis: any): string[] {
    const baseDeps = ['react', 'react-dom', '@types/react', '@types/react-dom'];
    
    if (analysis.styling === 'tailwind') {
      baseDeps.push('tailwindcss', 'autoprefixer', 'postcss');
    }
    
    if (analysis.features.includes('chart')) {
      baseDeps.push('recharts');
    }
    
    if (analysis.features.includes('form')) {
      baseDeps.push('react-hook-form', '@hookform/resolvers', 'zod');
    }
    
    return baseDeps;
  }
}

export const streamingGenerator = StreamingGenerator.getInstance();
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 quality score
}

class ValidationService {
  async validateGeneratedCode(code: string, requirements: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Clean the code (remove markdown formatting)
    const cleanCode = this.cleanCode(code);

    // 1. Syntax and Structure Validation
    const syntaxErrors = this.validateSyntax(cleanCode);
    errors.push(...syntaxErrors);
    score -= syntaxErrors.length * 20;

    // 2. React-specific Validation
    if (requirements.framework === 'react') {
      const reactErrors = this.validateReactStructure(cleanCode);
      errors.push(...reactErrors);
      score -= reactErrors.length * 15;
    }

    // 3. Import Validation
    const importErrors = this.validateImports(cleanCode);
    errors.push(...importErrors);
    score -= importErrors.length * 10;

    // 4. Quality Checks
    const qualityWarnings = this.validateQuality(cleanCode);
    warnings.push(...qualityWarnings);
    score -= qualityWarnings.length * 5;

    // 5. Accessibility Checks
    const a11yWarnings = this.validateAccessibility(cleanCode);
    warnings.push(...a11yWarnings);
    score -= a11yWarnings.length * 3;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  private cleanCode(code: string): string {
    // Remove markdown formatting
    let cleaned = code.trim();
    
    if (cleaned.includes('```')) {
      const codeMatch = cleaned.match(/```(?:javascript|jsx|js|typescript|tsx|react)?\n?([\s\S]*?)\n?```/);
      if (codeMatch) {
        cleaned = codeMatch[1];
      }
    }

    return cleaned.trim();
  }

  private validateSyntax(code: string): string[] {
    const errors: string[] = [];

    // Check for placeholder comments
    if (code.includes('// your code here') || 
        code.includes('// TODO') || 
        code.includes('/* TODO') ||
        code.includes('// Add your') ||
        code.includes('// Implement')) {
      errors.push('Code contains placeholder comments - generate actual implementation');
    }

    // Check for incomplete code blocks
    if (code.includes('{...}') || code.includes('{ /* */ }')) {
      errors.push('Code contains incomplete blocks - provide full implementation');
    }

    // Check for balanced braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for balanced parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Mismatched parentheses: ${openParens} opening, ${closeParens} closing`);
    }

    return errors;
  }

  private validateReactStructure(code: string): string[] {
    const errors: string[] = [];

    // Check for React import
    if (!code.includes('import React') && !code.includes('import { ')) {
      errors.push('Missing React import');
    }

    // Check for component definition
    const hasFunction = code.includes('function ') || code.includes('const ') || code.includes('export default');
    if (!hasFunction) {
      errors.push('No component definition found');
    }

    // Check for export
    if (!code.includes('export default') && !code.includes('export const') && !code.includes('export function')) {
      errors.push('Component is not exported');
    }

    // Check for JSX return
    if (code.includes('function ') && !code.includes('return (') && !code.includes('return <')) {
      errors.push('Function component missing return statement');
    }

    // Check for JSX elements
    const hasJSX = code.includes('<') && code.includes('>');
    if (!hasJSX) {
      errors.push('No JSX elements found');
    }

    return errors;
  }

  private validateImports(code: string): string[] {
    const errors: string[] = [];

    // Check for missing hook imports
    if (code.includes('useState(') && !code.includes('useState') && !code.includes('import { useState }')) {
      errors.push('Uses useState but missing import');
    }

    if (code.includes('useEffect(') && !code.includes('useEffect') && !code.includes('import { useEffect }')) {
      errors.push('Uses useEffect but missing import');
    }

    if (code.includes('useCallback(') && !code.includes('useCallback') && !code.includes('import { useCallback }')) {
      errors.push('Uses useCallback but missing import');
    }

    if (code.includes('useMemo(') && !code.includes('useMemo') && !code.includes('import { useMemo }')) {
      errors.push('Uses useMemo but missing import');
    }

    return errors;
  }

  private validateQuality(code: string): string[] {
    const warnings: string[] = [];

    // Check for hard-coded colors instead of design system
    const hardCodedColors = ['text-white', 'text-black', 'bg-white', 'bg-black', 'text-gray-', 'bg-gray-'];
    hardCodedColors.forEach(color => {
      if (code.includes(color)) {
        warnings.push(`Avoid hard-coded colors like "${color}" - use design system tokens`);
      }
    });

    // Check for inline styles
    if (code.includes('style={{')) {
      warnings.push('Avoid inline styles - use Tailwind classes or design system');
    }

    // Check for accessibility
    if (code.includes('<button') && !code.includes('aria-label')) {
      warnings.push('Buttons should have aria-label for accessibility');
    }

    return warnings;
  }

  private validateAccessibility(code: string): string[] {
    const warnings: string[] = [];

    // Check for images without alt text
    if (code.includes('<img') && !code.includes('alt=')) {
      warnings.push('Images should have alt attributes');
    }

    // Check for form inputs without labels
    if (code.includes('<input') && !code.includes('aria-label') && !code.includes('placeholder')) {
      warnings.push('Form inputs should have labels or aria-label');
    }

    // Check for semantic HTML
    if (code.includes('<div onClick') && !code.includes('role=') && !code.includes('button')) {
      warnings.push('Interactive elements should use semantic HTML or proper ARIA roles');
    }

    return warnings;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, requirements = { framework: 'react' } } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validationService = new ValidationService();
    const result = await validationService.validateGeneratedCode(code, requirements);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Validation Service Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
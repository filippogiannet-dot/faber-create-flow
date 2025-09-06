export interface ValidationError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number;
  suggestions: string[];
}

export class CodeValidator {
  private static instance: CodeValidator;

  static getInstance(): CodeValidator {
    if (!CodeValidator.instance) {
      CodeValidator.instance = new CodeValidator();
    }
    return CodeValidator.instance;
  }

  validateFiles(files: Array<{ path: string; content: string }>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];
    let totalScore = 0;

    for (const file of files) {
      const fileResult = this.validateFile(file);
      errors.push(...fileResult.errors);
      warnings.push(...fileResult.warnings);
      suggestions.push(...fileResult.suggestions);
      totalScore += fileResult.score;
    }

    const avgScore = files.length > 0 ? totalScore / files.length : 0;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: avgScore,
      suggestions: Array.from(new Set(suggestions))
    };
  }

  private validateFile(file: { path: string; content: string }): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const { path, content } = file;
    const lines = content.split('\n');

    // Check for placeholders
    lines.forEach((line, index) => {
      if (line.includes('// TODO') || line.includes('// your code here') || line.includes('{...}')) {
        errors.push({
          file: path,
          line: index + 1,
          column: 1,
          message: 'Contains placeholder comments - needs actual implementation',
          severity: 'error',
          code: 'PLACEHOLDER_CODE'
        });
        score -= 30;
      }
    });

    // React component validation
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
      this.validateReactComponent(file, errors, warnings, suggestions);
      score -= errors.length * 10;
      score -= warnings.length * 5;
    }

    // TypeScript validation
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      this.validateTypeScript(file, errors, warnings, suggestions);
    }

    // Accessibility validation
    this.validateAccessibility(file, warnings, suggestions);

    // Design system validation
    this.validateDesignSystem(file, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      suggestions
    };
  }

  private validateReactComponent(
    file: { path: string; content: string },
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: string[]
  ) {
    const { path, content } = file;

    // Check for React import
    if (!content.includes('import React') && !content.includes('import {')) {
      errors.push({
        file: path,
        line: 1,
        column: 1,
        message: 'Missing React import',
        severity: 'error',
        code: 'MISSING_REACT_IMPORT'
      });
    }

    // Check for export
    if (!content.includes('export default') && !content.includes('export const')) {
      errors.push({
        file: path,
        line: 1,
        column: 1,
        message: 'Component is not exported',
        severity: 'error',
        code: 'MISSING_EXPORT'
      });
    }

    // Check for JSX return
    if (content.includes('function ') && !content.includes('return')) {
      errors.push({
        file: path,
        line: 1,
        column: 1,
        message: 'Function component missing return statement',
        severity: 'error',
        code: 'MISSING_RETURN'
      });
    }

    // Check for hooks usage
    if (content.includes('useState(') && !content.includes('import { useState }') && !content.includes('import React')) {
      warnings.push({
        file: path,
        line: 1,
        column: 1,
        message: 'useState used but not imported',
        severity: 'warning',
        code: 'MISSING_HOOK_IMPORT'
      });
    }
  }

  private validateTypeScript(
    file: { path: string; content: string },
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: string[]
  ) {
    const { content } = file;

    // Check for any types
    if (content.includes(': any')) {
      warnings.push({
        file: file.path,
        line: 1,
        column: 1,
        message: 'Avoid using "any" type - use specific types',
        severity: 'warning',
        code: 'ANY_TYPE'
      });
      suggestions.push('Use specific TypeScript types instead of "any"');
    }

    // Check for interface definitions
    if (content.includes('props') && !content.includes('interface') && !content.includes('type ')) {
      suggestions.push('Consider defining TypeScript interfaces for component props');
    }
  }

  private validateAccessibility(
    file: { path: string; content: string },
    warnings: ValidationError[],
    suggestions: string[]
  ) {
    const { content } = file;

    // Check for images without alt
    if (content.includes('<img') && !content.includes('alt=')) {
      warnings.push({
        file: file.path,
        line: 1,
        column: 1,
        message: 'Images should have alt attributes for accessibility',
        severity: 'warning',
        code: 'MISSING_ALT'
      });
    }

    // Check for buttons without labels
    if (content.includes('<button') && !content.includes('aria-label') && !content.includes('title=')) {
      suggestions.push('Consider adding aria-label to buttons for better accessibility');
    }

    // Check for form inputs without labels
    if (content.includes('<input') && !content.includes('aria-label') && !content.includes('placeholder')) {
      suggestions.push('Form inputs should have labels or aria-label attributes');
    }
  }

  private validateDesignSystem(
    file: { path: string; content: string },
    warnings: ValidationError[],
    suggestions: string[]
  ) {
    const { content } = file;

    // Check for hardcoded colors
    const hardcodedColors = ['text-white', 'text-black', 'bg-white', 'bg-black', 'text-gray-', 'bg-gray-'];
    
    hardcodedColors.forEach(color => {
      if (content.includes(color)) {
        warnings.push({
          file: file.path,
          line: 1,
          column: 1,
          message: `Avoid hardcoded color "${color}" - use design system tokens`,
          severity: 'warning',
          code: 'HARDCODED_COLOR'
        });
      }
    });

    // Check for inline styles
    if (content.includes('style={{')) {
      suggestions.push('Consider using Tailwind classes instead of inline styles');
    }

    // Check for responsive design
    if (!content.includes('md:') && !content.includes('lg:') && content.includes('className')) {
      suggestions.push('Consider adding responsive breakpoints (md:, lg:) for better mobile experience');
    }
  }
}

export const codeValidator = CodeValidator.getInstance();
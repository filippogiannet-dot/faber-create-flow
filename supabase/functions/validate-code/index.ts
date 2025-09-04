import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileData {
  path: string;
  content: string;
  language?: string;
}

interface ValidationRequest {
  files: FileData[];
  skipTypeCheck?: boolean;
}

interface ValidationResult {
  success: boolean;
  errors: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
    code?: string;
  }>;
  fixes: Array<{
    file: string;
    type: 'auto-import' | 'format' | 'type-fix';
    description: string;
    applied: boolean;
  }>;
  fixedFiles?: FileData[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, skipTypeCheck = false }: ValidationRequest = await req.json();

    if (!files || !Array.isArray(files)) {
      return new Response(
        JSON.stringify({ error: 'Files array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result: ValidationResult = {
      success: true,
      errors: [],
      fixes: [],
      fixedFiles: []
    };

    // Package allowlist for security
    const allowedPackages = [
      'react', 'react-dom', 'react-router-dom', 'zustand', 'react-hook-form',
      'zod', '@hookform/resolvers', 'framer-motion', 'lucide-react',
      '@radix-ui/', '@mui/', '@mantine/', '@chakra-ui/', '@headlessui/react',
      'tailwindcss', 'class-variance-authority', 'tailwind-merge', 'date-fns', 'uuid'
    ];

    for (const file of files) {
      const validationErrors = await validateFile(file, allowedPackages);
      result.errors.push(...validationErrors);

      // Auto-fix imports
      const fixedContent = await autoFixImports(file, allowedPackages);
      if (fixedContent !== file.content) {
        result.fixedFiles!.push({
          path: file.path,
          content: fixedContent,
          language: file.language
        });
        result.fixes.push({
          file: file.path,
          type: 'auto-import',
          description: 'Fixed missing or invalid imports',
          applied: true
        });
      }

      // Format code (basic formatting)
      const formatted = formatCode(fixedContent || file.content);
      if (formatted !== (fixedContent || file.content)) {
        const existingFixed = result.fixedFiles!.find(f => f.path === file.path);
        if (existingFixed) {
          existingFixed.content = formatted;
        } else {
          result.fixedFiles!.push({
            path: file.path,
            content: formatted,
            language: file.language
          });
        }
        result.fixes.push({
          file: file.path,
          type: 'format',
          description: 'Applied code formatting',
          applied: true
        });
      }
    }

    // TypeScript validation (simplified)
    if (!skipTypeCheck) {
      const typeErrors = await validateTypeScript(files);
      result.errors.push(...typeErrors);
    }

    result.success = result.errors.filter(e => e.severity === 'error').length === 0;

    console.log('Code validation completed:', {
      filesCount: files.length,
      errorsCount: result.errors.length,
      fixesCount: result.fixes.length,
      success: result.success
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in validate-code function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Code validation failed',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function validateFile(file: FileData, allowedPackages: string[]) {
  const errors: ValidationResult['errors'] = [];
  const { path, content } = file;

  // Check for disallowed imports
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  let lineNumber = 1;

  for (const line of content.split('\n')) {
    while ((match = importRegex.exec(line)) !== null) {
      const packageName = match[1];
      
      // Check if package is in allowlist
      const isAllowed = allowedPackages.some(allowed => 
        packageName === allowed || 
        packageName.startsWith(allowed) ||
        packageName.startsWith('./') ||
        packageName.startsWith('../')
      );

      if (!isAllowed) {
        errors.push({
          file: path,
          line: lineNumber,
          column: line.indexOf(match[0]) + 1,
          message: `Package "${packageName}" is not in the allowlist`,
          severity: 'error',
          code: 'DISALLOWED_IMPORT'
        });
      }
    }

    // Check for dangerous patterns
    if (line.includes('eval(') || line.includes('Function(')) {
      errors.push({
        file: path,
        line: lineNumber,
        column: 1,
        message: 'Dynamic code execution (eval/Function) is not allowed',
        severity: 'error',
        code: 'DANGEROUS_CODE'
      });
    }

    if (line.includes('fetch(') && !line.includes('//')) {
      errors.push({
        file: path,
        line: lineNumber,
        column: 1,
        message: 'Network requests in preview are not allowed',
        severity: 'warning',
        code: 'NETWORK_ACCESS'
      });
    }

    lineNumber++;
  }

  return errors;
}

async function autoFixImports(file: FileData, allowedPackages: string[]): Promise<string> {
  let { content } = file;

  // Replace common disallowed imports with allowed alternatives
  const replacements: Record<string, string> = {
    'axios': 'fetch', // Replace axios with fetch
    'lodash': 'Built-in methods', // Suggest built-in alternatives
    'moment': 'date-fns', // Replace moment with date-fns
    'uuid/v4': 'crypto.randomUUID', // Use built-in UUID
  };

  for (const [disallowed, replacement] of Object.entries(replacements)) {
    const importRegex = new RegExp(`import\\s+.*?\\s+from\\s+['"]${disallowed}['"]`, 'g');
    if (importRegex.test(content)) {
      // Add comment suggesting replacement
      content = content.replace(importRegex, `// TODO: Replace ${disallowed} with ${replacement}\n$&`);
    }
  }

  return content;
}

function formatCode(content: string): string {
  // Basic formatting (simplified prettier-like)
  let formatted = content;

  // Normalize line endings
  formatted = formatted.replace(/\r\n/g, '\n');

  // Remove trailing whitespace
  formatted = formatted.replace(/[ \t]+$/gm, '');

  // Ensure single final newline
  formatted = formatted.replace(/\n*$/, '\n');

  // Basic JSX formatting
  formatted = formatted.replace(/>\s*</g, '>\n<');

  return formatted;
}

async function validateTypeScript(files: FileData[]) {
  const errors: ValidationResult['errors'] = [];

  // Simplified TypeScript validation
  for (const file of files) {
    if (!file.path.endsWith('.ts') && !file.path.endsWith('.tsx')) continue;

    const { content, path } = file;
    let lineNumber = 1;

    for (const line of content.split('\n')) {
      // Check for common TypeScript issues
      if (line.includes(': any') && !line.includes('//')) {
        errors.push({
          file: path,
          line: lineNumber,
          column: line.indexOf(': any') + 1,
          message: 'Avoid using "any" type. Use specific types instead.',
          severity: 'warning',
          code: 'ANY_TYPE'
        });
      }

      // Check for missing return types on functions
      if (line.match(/function\s+\w+\s*\([^)]*\)\s*{/) && !line.includes(':')) {
        errors.push({
          file: path,
          line: lineNumber,
          column: 1,
          message: 'Consider adding explicit return type',
          severity: 'warning',
          code: 'MISSING_RETURN_TYPE'
        });
      }

      lineNumber++;
    }
  }

  return errors;
}
// Advanced Code Extraction - Based on Bolt/Lovable Patterns
export interface ExtractedCode {
  files: Array<{ path: string; content: string }>;
  explanation?: string;
  dependencies?: string[];
  hasValidCode: boolean;
  extractionMethod: string;
}

export class CodeExtractor {
  private static instance: CodeExtractor;

  static getInstance(): CodeExtractor {
    if (!CodeExtractor.instance) {
      CodeExtractor.instance = new CodeExtractor();
    }
    return CodeExtractor.instance;
  }

  extractFromAIResponse(response: any): ExtractedCode {
    console.log('🔍 Starting code extraction from AI response');
    console.log('Raw AI response structure:', {
      hasChoices: !!response?.choices,
      choicesLength: response?.choices?.length,
      hasMessage: !!response?.choices?.[0]?.message,
      hasContent: !!response?.choices?.[0]?.message?.content,
      responseKeys: Object.keys(response || {}),
    });

    // Method 1: Direct structured response (Bolt pattern)
    if (response?.files && Array.isArray(response.files)) {
      console.log('✅ Method 1: Direct structured response');
      return this.validateExtractedFiles(response.files, response.explanation, 'direct_structured');
    }

    // Method 2: OpenAI chat completion format
    const content = response?.choices?.[0]?.message?.content;
    if (content) {
      console.log('🔍 Method 2: Extracting from OpenAI chat completion');
      console.log('Content preview:', content.slice(0, 200));
      
      // Try to parse as JSON first
      const jsonExtracted = this.extractFromJSON(content);
      if (jsonExtracted.hasValidCode) {
        return jsonExtracted;
      }

      // Try to extract code blocks
      const codeBlockExtracted = this.extractFromCodeBlocks(content);
      if (codeBlockExtracted.hasValidCode) {
        return codeBlockExtracted;
      }

      // Try to extract single component
      const componentExtracted = this.extractSingleComponent(content);
      if (componentExtracted.hasValidCode) {
        return componentExtracted;
      }
    }

    // Method 3: Alternative response formats
    if (response?.code) {
      console.log('✅ Method 3: Direct code property');
      return this.validateExtractedFiles([{ path: 'src/App.tsx', content: response.code }], response.explanation, 'direct_code');
    }

    if (response?.response?.files) {
      console.log('✅ Method 4: Nested response files');
      return this.validateExtractedFiles(response.response.files, response.response.explanation, 'nested_response');
    }

    console.log('❌ All extraction methods failed');
    return {
      files: [],
      hasValidCode: false,
      extractionMethod: 'failed'
    };
  }

  private extractFromJSON(content: string): ExtractedCode {
    console.log('🔍 Attempting JSON extraction');
    
    // Clean content for JSON parsing
    let cleaned = content.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    
    // Find JSON boundaries
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.log('❌ No valid JSON boundaries found');
      return { files: [], hasValidCode: false, extractionMethod: 'json_failed' };
    }
    
    const jsonCandidate = cleaned.slice(firstBrace, lastBrace + 1);
    
    try {
      const parsed = JSON.parse(jsonCandidate);
      console.log('✅ JSON parsed successfully');
      
      if (parsed.files && Array.isArray(parsed.files)) {
        return this.validateExtractedFiles(parsed.files, parsed.explanation, 'json_extraction');
      }
      
      // Handle single file responses
      if (parsed.code || parsed.content) {
        const code = parsed.code || parsed.content;
        return this.validateExtractedFiles([{ path: 'src/App.tsx', content: code }], parsed.explanation, 'json_single_file');
      }
      
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError.message);
      
      // Try fixing common JSON issues
      const fixed = jsonCandidate
        .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"'); // Convert single quotes to double
      
      try {
        const parsed = JSON.parse(fixed);
        console.log('✅ JSON parsed after fixes');
        
        if (parsed.files && Array.isArray(parsed.files)) {
          return this.validateExtractedFiles(parsed.files, parsed.explanation, 'json_fixed');
        }
      } catch (fixError) {
        console.log('❌ JSON fixing failed:', fixError.message);
      }
    }
    
    return { files: [], hasValidCode: false, extractionMethod: 'json_failed' };
  }

  private extractFromCodeBlocks(content: string): ExtractedCode {
    console.log('🔍 Attempting code block extraction');
    
    // Extract all code blocks
    const codeBlockRegex = /```(?:typescript|tsx|javascript|jsx|react)?\n([\s\S]*?)\n```/g;
    const matches = Array.from(content.matchAll(codeBlockRegex));
    
    if (matches.length === 0) {
      console.log('❌ No code blocks found');
      return { files: [], hasValidCode: false, extractionMethod: 'codeblock_failed' };
    }
    
    console.log(`✅ Found ${matches.length} code blocks`);
    
    const files = matches.map((match, index) => ({
      path: `src/Component${index === 0 ? 'App' : index}.tsx`,
      content: match[1].trim()
    }));
    
    return this.validateExtractedFiles(files, 'Extracted from code blocks', 'codeblock_extraction');
  }

  private extractSingleComponent(content: string): ExtractedCode {
    console.log('🔍 Attempting single component extraction');
    
    // Look for React component patterns
    const componentPatterns = [
      /export\s+default\s+function\s+\w+[\s\S]*?(?=\n\n|\n$|$)/,
      /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?(?=\n\n|\n$|$)/,
      /function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?(?=\n\n|\n$|$)/
    ];
    
    for (const pattern of componentPatterns) {
      const match = content.match(pattern);
      if (match) {
        console.log('✅ Found component pattern');
        let componentCode = match[0];
        
        // Ensure proper imports
        if (!componentCode.includes('import React')) {
          componentCode = `import React from 'react';\n\n${componentCode}`;
        }
        
        // Ensure proper export
        if (!componentCode.includes('export default')) {
          componentCode = componentCode.replace(/^(function|const)\s+(\w+)/, 'export default $1 $2');
        }
        
        return this.validateExtractedFiles([{ path: 'src/App.tsx', content: componentCode }], 'Single component extracted', 'single_component');
      }
    }
    
    console.log('❌ No component patterns found');
    return { files: [], hasValidCode: false, extractionMethod: 'component_failed' };
  }

  private validateExtractedFiles(files: any[], explanation?: string, method?: string): ExtractedCode {
    console.log(`🔍 Validating ${files.length} extracted files using method: ${method}`);
    
    const validFiles = files.filter(file => {
      if (!file || typeof file !== 'object') {
        console.log('❌ Invalid file object:', file);
        return false;
      }
      
      if (!file.path || typeof file.path !== 'string') {
        console.log('❌ Invalid file path:', file.path);
        return false;
      }
      
      if (!file.content || typeof file.content !== 'string' || file.content.trim().length === 0) {
        console.log('❌ Invalid file content for:', file.path);
        return false;
      }
      
      // Check for placeholder content
      const hasPlaceholders = file.content.includes('// TODO') || 
                             file.content.includes('// Add your code here') ||
                             file.content.includes('/* TODO */') ||
                             file.content.includes('// Implementation needed');
      
      if (hasPlaceholders) {
        console.log('⚠️ File contains placeholders:', file.path);
        return false;
      }
      
      // Basic React component validation for .tsx files
      if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
        const hasReactImport = file.content.includes('import React') || file.content.includes('import {');
        const hasExport = file.content.includes('export default') || file.content.includes('export const');
        const hasJSX = file.content.includes('<') && file.content.includes('>');
        
        if (!hasReactImport || !hasExport || !hasJSX) {
          console.log('❌ Invalid React component structure:', file.path, {
            hasReactImport,
            hasExport,
            hasJSX
          });
          return false;
        }
      }
      
      console.log('✅ File validated:', file.path);
      return true;
    });
    
    console.log(`✅ Validation complete: ${validFiles.length}/${files.length} files valid`);
    
    return {
      files: validFiles,
      explanation,
      hasValidCode: validFiles.length > 0,
      extractionMethod: method || 'unknown'
    };
  }

  // Enhanced code cleaning for better compatibility
  cleanCode(code: string): string {
    let cleaned = code.trim();
    
    // Remove markdown formatting
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/gm, '').replace(/\n?```$/gm, '');
    
    // Fix common formatting issues
    cleaned = cleaned.replace(/\r\n/g, '\n'); // Normalize line endings
    cleaned = cleaned.replace(/\t/g, '  '); // Convert tabs to spaces
    
    // Ensure proper React imports
    if (cleaned.includes('useState') || cleaned.includes('useEffect')) {
      if (!cleaned.includes('import React') && !cleaned.includes('import {')) {
        cleaned = `import React, { useState, useEffect } from 'react';\n\n${cleaned}`;
      }
    } else if (!cleaned.includes('import React')) {
      cleaned = `import React from 'react';\n\n${cleaned}`;
    }
    
    return cleaned;
  }
}

export const codeExtractor = CodeExtractor.getInstance();
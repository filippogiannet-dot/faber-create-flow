import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle, Code, RefreshCw } from 'lucide-react';

interface LivePreviewProps {
  code: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ code, onError, onSuccess }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const addDebugInfo = useCallback((type: 'info' | 'warn' | 'error', message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugEntry = { type, message, data, timestamp };
    console.log(`[Preview ${type.toUpperCase()}]`, message, data || '');
    setDebugInfo(prev => [...prev.slice(-20), debugEntry]); // Keep last 20 entries
  }, []);

  const validateAndCleanCode = useCallback((rawCode: string): { isValid: boolean; cleanCode: string; errors: string[] } => {
    const errors: string[] = [];
    let cleanCode = rawCode.trim();

    addDebugInfo('info', 'Starting code validation');

    // Remove markdown formatting
    if (cleanCode.includes('```')) {
      const codeMatch = cleanCode.match(/```(?:javascript|jsx|js|typescript|tsx)?\n([\s\S]*?)\n```/);
      if (codeMatch) {
        cleanCode = codeMatch[1];
        addDebugInfo('info', 'Removed markdown formatting');
      }
    }

    // Normalize for browser execution: remove module imports/exports
    cleanCode = cleanCode
      .replace(/^[\t ]*import[^\n]*\n/gm, '')
      .replace(/^[\t ]*export\s+default\s+/gm, '')
      .replace(/^[\t ]*export\s+(const|function|class)\s+/gm, '$1 ');
    addDebugInfo('info', 'Stripped module imports/exports for browser execution');

    // Basic component presence check
    if (!cleanCode.includes('const App') && !cleanCode.includes('function App')) {
      errors.push('No App component found');
    }

    // Check for basic JSX syntax
    const hasJSX = cleanCode.includes('<') && cleanCode.includes('>');
    if (!hasJSX) {
      errors.push('No JSX elements found');
    }

    // Check for common syntax errors
    const unclosedBraces = (cleanCode.match(/\{/g) || []).length - (cleanCode.match(/\}/g) || []).length;
    if (unclosedBraces !== 0) {
      errors.push(`Mismatched braces: ${unclosedBraces > 0 ? 'unclosed' : 'extra closing'} braces`);
    }

    addDebugInfo(errors.length > 0 ? 'error' : 'info', 'Code validation complete', { errors, codeLength: cleanCode.length });

    return {
      isValid: errors.length === 0,
      cleanCode,
      errors
    };
  }, [addDebugInfo]);

  const createPreviewHTML = useCallback((componentCode: string) => {
    addDebugInfo('info', 'Creating preview HTML');

    const validation = validateAndCleanCode(componentCode);
    
    if (!validation.isValid) {
      addDebugInfo('error', 'Code validation failed', validation.errors);
      throw new Error(`Code validation failed: ${validation.errors.join(', ')}`);
    }

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <script>
    // Early resource error reporting for external scripts/styles
    window.addEventListener('error', function(e) {
      const t = e.target || e.srcElement;
      const isRes = t && (t.tagName === 'SCRIPT' || t.tagName === 'LINK' || t.tagName === 'IMG');
      if (isRes) {
        const src = t.tagName === 'LINK' ? t.href : t.src;
        window.parent.postMessage({ type: 'PREVIEW_ERROR', error: 'Failed to load resource: ' + (src || t.tagName) }, '*');
      }
    }, true);
  </script>
  <script crossorigin="anonymous" src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/@babel/standalone@7.23.4/babel.min.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/tailwindcss@3.4.0/lib/index.js" onerror="this.onerror=null;this.src='https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/lib/index.js'"></script>
  <script>
    // Fallback Tailwind configuration
    if (typeof tailwind === 'undefined') {
      window.tailwind = { config: {} };
    }
  </script>
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 0; 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f8fafc;
    }
    .preview-error { 
      color: #dc2626; 
      background: #fef2f2; 
      padding: 20px; 
      border-radius: 12px; 
      margin: 20px;
      border: 1px solid #fecaca;
      font-family: monospace;
      white-space: pre-wrap;
      max-height: 300px;
      overflow-y: auto;
    }
    .preview-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #6b7280;
      font-size: 16px;
    }
    .preview-success {
      color: #059669;
      background: #ecfdf5;
      padding: 10px 20px;
      border-radius: 8px;
      margin: 10px;
      border: 1px solid #a7f3d0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="preview-loading">
      <div>🔄 Initializing component...</div>
    </div>
  </div>
  
  <script>
    // Enhanced error handling with detailed logging
    const debugLog = (type, message, data) => {
      console.log(\`[Preview \${type.toUpperCase()}] \${message}\`, data || '');
      window.parent.postMessage({ 
        type: 'PREVIEW_DEBUG', 
        debugType: type,
        message: message,
        data: data,
        timestamp: new Date().toISOString()
      }, '*');
    };

    window.onerror = function(msg, url, lineNo, columnNo, error) {
      const errorMsg = \`JavaScript Error: \${msg} at line \${lineNo}:\${columnNo}\`;
      debugLog('error', errorMsg, { url, lineNo, columnNo, stack: error?.stack });
      
      document.getElementById('root').innerHTML = \`
        <div class="preview-error">
          <strong>❌ JavaScript Error:</strong>
          \${msg}
          
          <strong>Location:</strong> Line \${lineNo}, Column \${columnNo}
          
          <strong>Stack Trace:</strong>
          \${error?.stack || 'No stack trace available'}
        </div>
      \`;
      
      window.parent.postMessage({ 
        type: 'PREVIEW_ERROR', 
        error: errorMsg,
        details: { msg, url, lineNo, columnNo, stack: error?.stack }
      }, '*');
      return true;
    };
    
    window.addEventListener('unhandledrejection', function(event) {
      const errorMsg = \`Unhandled Promise Rejection: \${event.reason}\`;
      debugLog('error', errorMsg, event.reason);
      
      document.getElementById('root').innerHTML = \`
        <div class="preview-error">
          <strong>❌ Unhandled Promise Rejection:</strong>
          \${event.reason}
        </div>
      \`;
      
      window.parent.postMessage({ 
        type: 'PREVIEW_ERROR', 
        error: errorMsg
      }, '*');
    });

    debugLog('info', 'Preview environment initialized');
  </script>
  
  <script type="text/babel" data-type="module" data-presets="typescript,react">
    try {
      debugLog('info', 'Starting Babel compilation');
      
      const { useState, useEffect, useRef, createElement, Fragment } = React;
      
      debugLog('info', 'React hooks imported successfully');
      
      // Enhanced UI component library with better error handling
      const Button = React.forwardRef(({ children, className = "", variant = "default", size = "default", onClick, disabled, ...props }, ref) => {
        const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
        
        const variants = {
          default: "bg-slate-900 text-slate-50 hover:bg-slate-800 focus-visible:ring-slate-950",
          secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-950",
          outline: "border border-slate-200 bg-white hover:bg-slate-100 focus-visible:ring-slate-950",
          ghost: "hover:bg-slate-100 focus-visible:ring-slate-950",
          destructive: "bg-red-500 text-slate-50 hover:bg-red-600 focus-visible:ring-red-950"
        };
        
        const sizes = {
          default: "h-10 px-4 py-2 text-sm",
          sm: "h-9 px-3 text-sm",
          lg: "h-11 px-8 text-base",
          icon: "h-10 w-10"
        };
        
        return createElement('button', {
          ref,
          className: \`\${baseClasses} \${variants[variant]} \${sizes[size]} \${className}\`,
          onClick: (e) => {
            try {
              onClick?.(e);
            } catch (error) {
              debugLog('error', 'Button click error', error);
            }
          },
          disabled,
          ...props
        }, children);
      });

      const Card = ({ children, className = "" }) =>
        createElement('div', { 
          className: \`rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm \${className}\`
        }, children);
      
      const CardHeader = ({ children, className = "" }) =>
        createElement('div', { className: \`flex flex-col space-y-1.5 p-6 \${className}\` }, children);
      
      const CardTitle = ({ children, className = "" }) =>
        createElement('h3', { className: \`text-2xl font-semibold leading-none tracking-tight \${className}\` }, children);
      
      const CardContent = ({ children, className = "" }) =>
        createElement('div', { className: \`p-6 pt-0 \${className}\` }, children);
      
      const Input = React.forwardRef(({ className = "", type = "text", onChange, ...props }, ref) => 
        createElement('input', {
          ref,
          type,
          className: \`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 \${className}\`,
          onChange: (e) => {
            try {
              onChange?.(e);
            } catch (error) {
              debugLog('error', 'Input change error', error);
            }
          },
          ...props
        })
      );
      
      const Badge = ({ children, className = "", variant = "default" }) => {
        const variants = {
          default: "bg-slate-900 text-slate-50 hover:bg-slate-800",
          secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
          outline: "border border-slate-200 text-slate-900 hover:bg-slate-100",
          destructive: "bg-red-500 text-slate-50 hover:bg-red-600"
        };
        
        return createElement('div', {
          className: \`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 \${variants[variant]} \${className}\`
        }, children);
      };
      
      const Progress = ({ value = 0, className = "" }) => {
        const clampedValue = Math.min(100, Math.max(0, value));
        
        return createElement('div', {
          className: \`relative w-full overflow-hidden rounded-full bg-slate-100 \${className}\`,
          style: { height: '8px' }
        }, createElement('div', {
          className: 'h-full bg-slate-900 transition-all duration-500 ease-in-out',
          style: { 
            width: \`\${clampedValue}%\`,
            transform: \`translateX(-\${100 - clampedValue}%)\`,
            transition: 'transform 0.5s ease-in-out'
          }
        }));
      };

      // Common Lucide icons as React components
      const iconProps = { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
      
      const Heart = ({ className = "", ...props }) => 
        createElement('svg', { ...iconProps, className: \`w-4 h-4 \${className}\`, ...props },
          createElement('path', { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })
        );
      
      const Star = ({ className = "", ...props }) =>
        createElement('svg', { ...iconProps, className: \`w-4 h-4 \${className}\`, ...props },
          createElement('path', { d: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" })
        );

      const User = ({ className = "", ...props }) =>
        createElement('svg', { ...iconProps, className: \`w-4 h-4 \${className}\`, ...props },
          createElement('path', { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
          createElement('circle', { cx: "12", cy: "7", r: "4" })
        );

      const ShoppingCart = ({ className = "", ...props }) =>
        createElement('svg', { ...iconProps, className: \`w-4 h-4 \${className}\`, ...props },
          createElement('circle', { cx: "8", cy: "21", r: "1" }),
          createElement('circle', { cx: "19", cy: "21", r: "1" }),
          createElement('path', { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" })
        );

      const Plus = ({ className = "", ...props }) =>
        createElement('svg', { ...iconProps, className: \`w-4 h-4 \${className}\`, ...props },
          createElement('path', { d: "M5 12h14" }),
          createElement('path', { d: "M12 5v14" })
        );

      const Trash2 = ({ className = "", ...props }) =>
        createElement('svg', { ...iconProps, className: \`w-4 h-4 \${className}\`, ...props },
          createElement('path', { d: "M3 6h18" }),
          createElement('path', { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
          createElement('path', { d: "M8 6V4c0-1 1-2 2-2h4c-1 0 2 1 2 2v2" })
        );

      debugLog('info', 'UI components defined successfully');

      // Error boundary component
      const ErrorBoundary = ({ children }) => {
        const [hasError, setHasError] = useState(false);
        const [error, setError] = useState(null);
        
        useEffect(() => {
          const handleError = (errorEvent) => {
            debugLog('error', 'Error boundary caught error', errorEvent.error);
            setHasError(true);
            setError(errorEvent.error);
          };
          
          window.addEventListener('error', handleError);
          return () => window.removeEventListener('error', handleError);
        }, []);
        
        if (hasError) {
          return createElement('div', {
            className: 'preview-error'
          }, [
            createElement('strong', { key: 'title' }, '❌ Component Error'),
            createElement('br', { key: 'br1' }),
            createElement('br', { key: 'br2' }),
            error?.message || 'An error occurred in the component',
            createElement('br', { key: 'br3' }),
            createElement('br', { key: 'br4' }),
            createElement('strong', { key: 'stack-title' }, 'Stack Trace:'),
            createElement('br', { key: 'br5' }),
            error?.stack || 'No stack trace available'
          ]);
        }
        
        return children;
      };

      debugLog('info', 'Error boundary defined');
      debugLog('info', 'Compiling user component...');

      // User's component code will be inserted here
      ${validation.cleanCode}
      
      debugLog('info', 'User component compiled successfully');
      
      // Find the component to render
      let ComponentToRender;
      
      if (typeof App !== 'undefined') {
        ComponentToRender = App;
        debugLog('info', 'Found App component');
      } else if (typeof Component !== 'undefined') {
        ComponentToRender = Component;
        debugLog('info', 'Found Component');
      } else {
        // Search for any component
        const possibleComponents = Object.keys(globalThis).filter(key => 
          typeof globalThis[key] === 'function' && 
          key[0] === key[0].toUpperCase() &&
          key !== 'ErrorBoundary'
        );
        
        if (possibleComponents.length > 0) {
          ComponentToRender = globalThis[possibleComponents[0]];
          debugLog('info', \`Found component: \${possibleComponents[0]}\`);
        } else {
          throw new Error('No valid React component found. Make sure to export a component named "App".');
        }
      }
      
      debugLog('info', 'Rendering component to DOM...');
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      
      root.render(
        createElement(ErrorBoundary, {}, 
          createElement(ComponentToRender)
        )
      );
      
      debugLog('info', 'Component rendered successfully');
      
      // Signal successful render after a short delay
      setTimeout(() => {
        document.body.insertAdjacentHTML('afterbegin', '<div class="preview-success">✅ Component loaded successfully</div>');
        
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
        debugLog('info', 'Ready signal sent to parent');
        
        // Remove success message after 2 seconds
        setTimeout(() => {
          const successEl = document.querySelector('.preview-success');
          if (successEl) successEl.remove();
        }, 2000);
      }, 500);
      
    } catch (error) {
      debugLog('error', 'Preview compilation failed', error);
      
      const errorMessage = \`
❌ Compilation Error:
\${error.message}

📍 Error Details:
- Type: \${error.name || 'Unknown'}
- Stack: \${error.stack || 'No stack trace'}

🔧 Common Solutions:
- Check for missing imports
- Verify component syntax
- Ensure proper JSX structure
- Check for typos in component names
      \`;
      
      document.getElementById('root').innerHTML = \`<div class="preview-error">\${errorMessage}</div>\`;
      
      window.parent.postMessage({ 
        type: 'PREVIEW_ERROR', 
        error: error.message,
        details: {
          name: error.name,
          stack: error.stack,
          line: error.lineNumber,
          column: error.columnNumber
        }
      }, '*');
    }
  </script>
</body>
</html>`;
  }, [addDebugInfo, validateAndCleanCode]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setDebugInfo([]);
    setIsLoading(true);
    addDebugInfo('info', `Retry attempt #${retryCount + 1}`);
  }, [retryCount, addDebugInfo]);

  useEffect(() => {
    if (!code || !iframeRef.current) {
      addDebugInfo('warn', 'No code or iframe ref available');
      return;
    }

    const iframe = iframeRef.current;
    setIsLoading(true);
    setError(null);
    
    addDebugInfo('info', 'Starting preview generation', { codeLength: code.length, retryCount });

    const timeoutId = setTimeout(() => {
      addDebugInfo('error', 'Preview timeout reached');
      setIsLoading(false);
      setError('Preview timeout - component took too long to load. This usually indicates a compilation error.');
    }, 20000); // Increased timeout to 20 seconds

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      
      const { type, debugType, message, data, error: errorMsg, details } = event.data;
      
      if (type === 'PREVIEW_DEBUG') {
        addDebugInfo(debugType, message, data);
      } else if (type === 'PREVIEW_READY') {
        addDebugInfo('info', '✅ Preview loaded successfully');
        clearTimeout(timeoutId);
        setIsLoading(false);
        setError(null);
        onSuccess?.();
      } else if (type === 'PREVIEW_ERROR') {
        addDebugInfo('error', `❌ Preview error: ${errorMsg}`, details);
        clearTimeout(timeoutId);
        setIsLoading(false);
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    window.addEventListener('message', handleMessage);
    
    try {
      addDebugInfo('info', 'Creating preview HTML...');
      const previewHTML = createPreviewHTML(code);
      addDebugInfo('info', 'Setting iframe content...');
      iframe.srcdoc = previewHTML;
      addDebugInfo('info', 'Iframe content set, waiting for load...');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create preview';
      addDebugInfo('error', `❌ Failed to create preview: ${errorMessage}`);
      clearTimeout(timeoutId);
      setIsLoading(false);
      setError(errorMessage);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, [code, retryCount, onError, onSuccess, addDebugInfo, createPreviewHTML]);

  return (
    <div className="relative w-full h-full min-h-[500px] border rounded-lg overflow-hidden bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div className="text-center">
              <div className="font-medium">Loading preview...</div>
              <div className="text-xs text-gray-500 mt-1">
                {debugInfo.length > 0 && debugInfo[debugInfo.length - 1]?.message}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-10 max-h-64 overflow-y-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-red-800">Preview Error</h4>
              <p className="text-sm text-red-700 mt-1 break-words">{error}</p>
              
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry ({retryCount})
                </button>
                
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                >
                  <Code className="h-3 w-3" />
                  {showDebug ? 'Hide' : 'Show'} Debug ({debugInfo.length})
                </button>
              </div>
              
              {showDebug && (
                <div className="mt-3 p-3 bg-red-100 rounded-md max-h-40 overflow-y-auto">
                  <h5 className="text-xs font-medium text-red-800 mb-2">Debug Timeline:</h5>
                  <div className="text-xs text-red-700 space-y-1">
                    {debugInfo.slice(-10).map((log, index) => (
                      <div key={index} className="font-mono flex items-start gap-2">
                        <span className="text-red-500 flex-shrink-0">{log.timestamp}</span>
                        <span className={`font-semibold ${
                          log.type === 'error' ? 'text-red-700' : 
                          log.type === 'warn' ? 'text-yellow-700' : 'text-gray-600'
                        }`}>
                          [{log.type.toUpperCase()}]
                        </span>
                        <span className="break-words">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
        title="Live Preview"
        style={{ border: 'none' }}
        onError={(e) => {
          console.error('Iframe error:', e);
          addDebugInfo('error', 'Iframe failed to load');
        }}
      />
      
      {/* Debug info panel */}
      {debugInfo.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              debugInfo.some(log => log.type === 'error') 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-800 text-white'
            }`}
          >
            <Code className="h-3 w-3" />
            Debug ({debugInfo.length})
            {debugInfo.some(log => log.type === 'error') && ' ❌'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LivePreview;
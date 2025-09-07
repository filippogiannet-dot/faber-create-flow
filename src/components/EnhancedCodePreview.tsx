import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle, Code, RefreshCw, Monitor, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface EnhancedCodePreviewProps {
  code: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  className?: string;
  showControls?: boolean;
}

interface PreviewState {
  status: 'loading' | 'success' | 'error';
  error?: string;
  loadTime?: number;
}

export default function EnhancedCodePreview({ 
  code, 
  onError, 
  onSuccess, 
  className,
  showControls = true 
}: EnhancedCodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<PreviewState>({ status: 'loading' });
  const [retryCount, setRetryCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const { toast } = useToast();

  const createPreviewHTML = useCallback((componentCode: string) => {
    // Pulisci il codice da markdown
    let cleanCode = componentCode.trim();
    if (cleanCode.includes('```')) {
      const codeMatch = cleanCode.match(/```(?:javascript|jsx|js|typescript|tsx)?\n([\s\S]*?)\n```/);
      if (codeMatch) {
        cleanCode = codeMatch[1];
      }
    }

    // Assicurati che abbia export default
    if (!cleanCode.includes('export default')) {
      cleanCode = cleanCode.replace(/^(const|function)\s+(\w+)/, 'export default $1 $2');
    }

    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faber Preview</title>
  
  <!-- React CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  
  <!-- Babel for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Tailwind Config for Faber Design System -->
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            background: 'hsl(0 0% 0%)',
            foreground: 'hsl(0 0% 100%)',
            primary: {
              DEFAULT: 'hsl(217 91% 80%)',
              foreground: 'hsl(222 47% 8%)'
            },
            secondary: {
              DEFAULT: 'hsl(222 43% 15%)',
              foreground: 'hsl(217 91% 95%)'
            },
            muted: {
              DEFAULT: 'hsl(222 43% 15%)',
              foreground: 'hsl(217 91% 80%)'
            },
            accent: {
              DEFAULT: 'hsl(217 91% 85%)',
              foreground: 'hsl(222 47% 8%)'
            },
            card: {
              DEFAULT: 'hsl(222 43% 11%)',
              foreground: 'hsl(217 91% 95%)'
            },
            border: 'hsl(222 43% 15%)',
            input: 'hsl(222 43% 15%)',
            ring: 'hsl(217 91% 85%)'
          },
          backgroundImage: {
            'gradient-card': 'linear-gradient(135deg, hsl(222, 43%, 11%) 0%, hsl(217, 91%, 12%) 100%)',
            'gradient-button': 'linear-gradient(135deg, hsl(217, 91%, 58%) 0%, hsl(217, 91%, 70%) 100%)',
            'gradient-mesh': 'conic-gradient(from 0deg at 50% 50%, hsl(217, 91%, 0%) 0deg, hsl(215, 88%, 1%) 60deg, hsl(220, 85%, 0%) 120deg, hsl(217, 91%, 2%) 180deg, hsl(218, 82%, 0%) 240deg, hsl(215, 90%, 1%) 300deg, hsl(217, 91%, 0%) 360deg)'
          },
          boxShadow: {
            'faber-card': '0 8px 32px hsl(222 47% 4% / 0.4)',
            'faber-button': '0 4px 16px hsl(217 91% 60% / 0.3)',
            'faber-glow': '0 0 40px hsl(217 91% 60% / 0.3)'
          }
        }
      }
    }
  </script>
  
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: hsl(0 0% 0%);
      color: hsl(0 0% 100%);
    }
    
    .chrome-text {
      background: linear-gradient(135deg, hsl(217, 100%, 70%) 0%, hsl(280, 100%, 70%) 25%, hsl(217, 100%, 80%) 50%, hsl(280, 100%, 80%) 75%, hsl(217, 100%, 70%) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .preview-error {
      color: #dc2626;
      background: #fef2f2;
      padding: 20px;
      border-radius: 8px;
      margin: 20px;
      border: 1px solid #fecaca;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root">
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #6b7280;">
      <div style="text-align: center;">
        <div style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
        <div>Caricamento componente...</div>
      </div>
    </div>
  </div>

  <script>
    // Enhanced error handling
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      const errorMsg = \`JavaScript Error: \${msg} at line \${lineNo}:\${columnNo}\`;
      console.error(errorMsg, error);
      
      document.getElementById('root').innerHTML = \`
        <div class="preview-error">
          <strong>❌ JavaScript Error:</strong>
          \${msg}
          
          <strong>Location:</strong> Line \${lineNo}, Column \${columnNo}
          
          <strong>Stack:</strong>
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
      const errorMsg = \`Promise Rejection: \${event.reason}\`;
      console.error(errorMsg);
      
      document.getElementById('root').innerHTML = \`
        <div class="preview-error">
          <strong>❌ Promise Rejection:</strong>
          \${event.reason}
        </div>
      \`;
      
      window.parent.postMessage({ 
        type: 'PREVIEW_ERROR', 
        error: errorMsg
      }, '*');
    });

    // Add spin animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    // Signal load start
    window.parent.postMessage({ type: 'PREVIEW_LOAD_START' }, '*');
  </script>

  <script type="text/babel" data-presets="typescript,react">
    try {
      console.log('🚀 Starting component compilation...');
      
      const { useState, useEffect, useRef, createElement, Fragment } = React;
      
      // Enhanced UI component library
      const Button = React.forwardRef(({ children, className = "", variant = "default", size = "default", onClick, disabled, ...props }, ref) => {
        const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
        
        const variants = {
          default: "bg-primary text-primary-foreground hover:bg-primary/90",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          destructive: "bg-red-500 text-white hover:bg-red-600"
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
              console.error('Button click error:', error);
            }
          },
          disabled,
          ...props
        }, children);
      });

      const Card = ({ children, className = "" }) =>
        createElement('div', { 
          className: \`rounded-lg border bg-card text-card-foreground shadow-sm \${className}\`
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
          className: \`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 \${className}\`,
          onChange: (e) => {
            try {
              onChange?.(e);
            } catch (error) {
              console.error('Input change error:', error);
            }
          },
          ...props
        })
      );
      
      const Badge = ({ children, className = "", variant = "default" }) => {
        const variants = {
          default: "bg-primary text-primary-foreground hover:bg-primary/80",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          outline: "border border-input text-foreground hover:bg-accent",
          destructive: "bg-red-500 text-white hover:bg-red-600"
        };
        
        return createElement('div', {
          className: \`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors \${variants[variant]} \${className}\`
        }, children);
      };

      const Progress = ({ value = 0, className = "" }) => {
        const clampedValue = Math.min(100, Math.max(0, value));
        
        return createElement('div', {
          className: \`relative w-full overflow-hidden rounded-full bg-secondary \${className}\`,
          style: { height: '8px' }
        }, createElement('div', {
          className: 'h-full bg-primary transition-all duration-500 ease-in-out',
          style: { width: \`\${clampedValue}%\` }
        }));
      };

      // Common Lucide icons
      const Heart = ({ className = "", ...props }) => 
        createElement('svg', { 
          className: \`w-4 h-4 \${className}\`, 
          fill: "none", 
          stroke: "currentColor", 
          viewBox: "0 0 24 24", 
          strokeWidth: 2,
          ...props 
        },
          createElement('path', { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })
        );
      
      const Star = ({ className = "", ...props }) =>
        createElement('svg', { 
          className: \`w-4 h-4 \${className}\`, 
          fill: "none", 
          stroke: "currentColor", 
          viewBox: "0 0 24 24", 
          strokeWidth: 2,
          ...props 
        },
          createElement('path', { d: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" })
        );

      const User = ({ className = "", ...props }) =>
        createElement('svg', { 
          className: \`w-4 h-4 \${className}\`, 
          fill: "none", 
          stroke: "currentColor", 
          viewBox: "0 0 24 24", 
          strokeWidth: 2,
          ...props 
        },
          createElement('path', { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
          createElement('circle', { cx: "12", cy: "7", r: "4" })
        );

      const ShoppingCart = ({ className = "", ...props }) =>
        createElement('svg', { 
          className: \`w-4 h-4 \${className}\`, 
          fill: "none", 
          stroke: "currentColor", 
          viewBox: "0 0 24 24", 
          strokeWidth: 2,
          ...props 
        },
          createElement('circle', { cx: "8", cy: "21", r: "1" }),
          createElement('circle', { cx: "19", cy: "21", r: "1" }),
          createElement('path', { d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" })
        );

      // Additional icons
      const Check = ({ className = "", ...props }) =>
        createElement('svg', { 
          className: \`w-4 h-4 \${className}\`, 
          fill: "none", 
          stroke: "currentColor", 
          viewBox: "0 0 24 24", 
          strokeWidth: 2,
          ...props 
        },
          createElement('path', { d: "M20 6L9 17l-5-5" })
        );

      const Calendar = ({ className = "", ...props }) =>
        createElement('svg', { 
          className: \`w-4 h-4 \${className}\`, 
          fill: "none", 
          stroke: "currentColor", 
          viewBox: "0 0 24 24", 
          strokeWidth: 2,
          ...props 
        },
          createElement('rect', { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
          createElement('line', { x1: "16", y1: "2", x2: "16", y2: "6" }),
          createElement('line', { x1: "8", y1: "2", x2: "8", y2: "6" }),
          createElement('line', { x1: "3", y1: "10", x2: "21", y2: "10" })
        );

      console.log('📦 UI components loaded successfully');

      // User's component code
      ${cleanCode}
      
      console.log('✅ Component compiled successfully');
      
      // Render component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      
      if (typeof App !== 'undefined') {
        root.render(createElement(App));
        console.log('🎨 App component rendered');
      } else {
        throw new Error('App component not found');
      }
      
      // Signal success
      setTimeout(() => {
        window.parent.postMessage({ 
          type: 'PREVIEW_READY',
          loadTime: Date.now() - window.startTime
        }, '*');
        console.log('📡 Ready signal sent');
      }, 500);
      
    } catch (error) {
      console.error('❌ Preview compilation failed:', error);
      
      const errorMessage = \`
❌ Compilation Error:
\${error.message}

📍 Error Details:
- Type: \${error.name || 'Unknown'}
- Stack: \${error.stack || 'No stack trace'}

🔧 Common Solutions:
- Check component syntax
- Verify JSX structure
- Ensure proper exports
      \`;
      
      document.getElementById('root').innerHTML = \`<div class="preview-error">\${errorMessage}</div>\`;
      
      window.parent.postMessage({ 
        type: 'PREVIEW_ERROR', 
        error: error.message,
        details: {
          name: error.name,
          stack: error.stack
        }
      }, '*');
    }
  </script>
</body>
</html>`;
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setState({ status: 'loading' });
    setStartTime(Date.now());
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Codice copiato",
      description: "Il codice è stato copiato negli appunti",
    });
  }, [code, toast]);

  const handleDownloadHTML = useCallback(() => {
    const html = createPreviewHTML(code);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faber-component.html';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download avviato",
      description: "Il file HTML è stato scaricato",
    });
  }, [code, createPreviewHTML, toast]);

  useEffect(() => {
    if (!code || !iframeRef.current) return;

    const iframe = iframeRef.current;
    setState({ status: 'loading' });
    setStartTime(Date.now());

    const timeoutId = setTimeout(() => {
      setState({ status: 'error', error: 'Preview timeout - component took too long to load' });
      onError?.('Preview timeout');
    }, 15000);

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      
      const { type, error: errorMsg, loadTime } = event.data;
      
      if (type === 'PREVIEW_READY') {
        clearTimeout(timeoutId);
        setState({ 
          status: 'success', 
          loadTime: loadTime || (Date.now() - startTime)
        });
        onSuccess?.();
      } else if (type === 'PREVIEW_ERROR') {
        clearTimeout(timeoutId);
        setState({ status: 'error', error: errorMsg });
        onError?.(errorMsg);
      } else if (type === 'PREVIEW_LOAD_START') {
        window.startTime = Date.now();
      }
    };

    window.addEventListener('message', handleMessage);
    
    try {
      const previewHTML = createPreviewHTML(code);
      iframe.srcdoc = previewHTML;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create preview';
      clearTimeout(timeoutId);
      setState({ status: 'error', error: errorMessage });
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, [code, retryCount, onError, onSuccess, createPreviewHTML, startTime]);

  return (
    <div className={`relative w-full h-full min-h-[500px] border rounded-lg overflow-hidden bg-background ${className}`}>
      {/* Status Bar */}
      <div className="h-10 bg-card border-b border-border flex items-center px-4 text-sm">
        <div className="flex items-center gap-2">
          {state.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {state.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {state.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
          
          <span className="text-foreground">
            {state.status === 'loading' && 'Compilazione → Build → Rendering'}
            {state.status === 'success' && `Build riuscita • ${state.loadTime}ms`}
            {state.status === 'error' && 'Build fallita'}
          </span>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {showControls && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-8 px-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadHTML}
                className="h-8 px-2"
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Error Overlay */}
      {state.status === 'error' && (
        <div className="absolute top-10 left-4 right-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4 z-10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-destructive">Preview Error</h4>
              <p className="text-sm text-destructive/80 mt-1 break-words">{state.error}</p>
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry ({retryCount})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview iframe */}
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        style={{ height: 'calc(100% - 40px)' }}
        sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
        title="Enhanced Live Preview"
        onError={(e) => {
          console.error('Iframe error:', e);
        }}
      />
    </div>
  );
}
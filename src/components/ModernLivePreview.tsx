import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface LivePreviewProps {
  files: Array<{ path: string; content: string }>;
  onError?: (error: string) => void;
  className?: string;
}

export const ModernLivePreview: React.FC<LivePreviewProps> = ({ files, onError, className }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderTime, setRenderTime] = useState<number | null>(null);

  const createPreviewHTML = (files: Array<{ path: string; content: string }>) => {
    // Find the main App component
    const appFile = files.find(f => f.path.includes('App.tsx') || f.path.includes('app.tsx'));
    const appCode = appFile?.content || '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.23.4/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // Configure Tailwind
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#eff6ff',
              500: '#3b82f6',
              600: '#2563eb',
              700: '#1d4ed8',
              900: '#1e3a8a'
            },
            secondary: {
              50: '#f8fafc',
              100: '#f1f5f9',
              500: '#64748b',
              600: '#475569'
            }
          }
        }
      }
    }
  </script>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #000;
      color: #fff;
      overflow-x: hidden;
    }
    .error { 
      color: #ef4444; 
      background: #7f1d1d; 
      padding: 16px; 
      border-radius: 8px; 
      margin: 16px;
      border: 1px solid #dc2626;
    }
    .success {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #065f46;
      color: #d1fae5;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #059669;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useCallback, useMemo } = React;
    const startTime = performance.now();
    
    // Mock shadcn/ui components for preview
    const Button = ({ children, className = "", onClick, variant = "default", size = "default", ...props }) => {
      const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
      
      const variants = {
        default: "bg-primary-600 text-white hover:bg-primary-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100 hover:text-gray-900",
        secondary: "bg-secondary-100 text-secondary-600 hover:bg-secondary-200",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-primary-600 underline-offset-4 hover:underline"
      };
      
      const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      };
      
      return React.createElement('button', {
        className: \`\${baseClasses} \${variants[variant]} \${sizes[size]} \${className}\`,
        onClick,
        ...props
      }, children);
    };
    
    const Card = ({ children, className = "", ...props }) =>
      React.createElement('div', { 
        className: \`rounded-lg border border-gray-200 bg-white shadow-sm \${className}\`,
        ...props
      }, children);
    
    const CardHeader = ({ children, className = "", ...props }) =>
      React.createElement('div', { 
        className: \`flex flex-col space-y-1.5 p-6 \${className}\`,
        ...props
      }, children);
    
    const CardTitle = ({ children, className = "", ...props }) =>
      React.createElement('h3', { 
        className: \`text-2xl font-semibold leading-none tracking-tight text-gray-900 \${className}\`,
        ...props
      }, children);
    
    const CardContent = ({ children, className = "", ...props }) =>
      React.createElement('div', { 
        className: \`p-6 pt-0 \${className}\`,
        ...props
      }, children);

    const CardDescription = ({ children, className = "", ...props }) =>
      React.createElement('p', { 
        className: \`text-sm text-gray-600 \${className}\`,
        ...props
      }, children);

    const CardFooter = ({ children, className = "", ...props }) =>
      React.createElement('div', { 
        className: \`flex items-center p-6 pt-0 \${className}\`,
        ...props
      }, children);
    
    const Input = ({ className = "", ...props }) =>
      React.createElement('input', {
        className: \`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 \${className}\`,
        ...props
      });

    const Badge = ({ children, className = "", variant = "default", ...props }) => {
      const variants = {
        default: "bg-primary-600 text-white",
        secondary: "bg-secondary-100 text-secondary-600",
        destructive: "bg-red-600 text-white",
        outline: "border border-gray-300 text-gray-700"
      };
      
      return React.createElement('div', {
        className: \`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors \${variants[variant]} \${className}\`,
        ...props
      }, children);
    };

    const Progress = ({ value = 0, className = "", ...props }) =>
      React.createElement('div', {
        className: \`relative h-4 w-full overflow-hidden rounded-full bg-secondary-100 \${className}\`,
        ...props
      }, React.createElement('div', {
        className: "h-full bg-primary-600 transition-all",
        style: { width: \`\${Math.min(100, Math.max(0, value))}%\` }
      }));

    // Mock Lucide icons
    const iconStyle = { width: '1em', height: '1em', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
    
    const Heart = (props) => React.createElement('svg', { ...iconStyle, viewBox: '0 0 24 24', ...props },
      React.createElement('path', { d: "m19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" })
    );
    
    const Star = (props) => React.createElement('svg', { ...iconStyle, viewBox: '0 0 24 24', ...props },
      React.createElement('polygon', { points: "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" })
    );
    
    const User = (props) => React.createElement('svg', { ...iconStyle, viewBox: '0 0 24 24', ...props },
      React.createElement('path', { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
      React.createElement('circle', { cx: "12", cy: "7", r: "4" })
    );
    
    const Settings = (props) => React.createElement('svg', { ...iconStyle, viewBox: '0 0 24 24', ...props },
      React.createElement('path', { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }),
      React.createElement('circle', { cx: "12", cy: "12", r: "3" })
    );

    const Check = (props) => React.createElement('svg', { ...iconStyle, viewBox: '0 0 24 24', ...props },
      React.createElement('path', { d: "M20 6 9 17l-5-5" })
    );

    const Plus = (props) => React.createElement('svg', { ...iconStyle, viewBox: '0 0 24 24', ...props },
      React.createElement('path', { d: "M5 12h14" }),
      React.createElement('path', { d: "m12 5v14" })
    );

    const Trash2 = (props) => React.createElement('svg', { ...iconStyle, viewBox: '0 0 24 24', ...props },
      React.createElement('path', { d: "M3 6h18" }),
      React.createElement('path', { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
      React.createElement('path', { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }),
      React.createElement('line', { x1: "10", x2: "10", y1: "11", y2: "17" }),
      React.createElement('line', { x1: "14", x2: "14", y1: "11", y2: "17" })
    );

    try {
      ${appCode}
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      
      // Render with error boundary
      const ErrorBoundary = class extends React.Component {
        constructor(props) {
          super(props);
          this.state = { hasError: false, error: null };
        }
        
        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }
        
        componentDidCatch(error, errorInfo) {
          console.error('Component error:', error, errorInfo);
          window.parent.postMessage({ 
            type: 'PREVIEW_ERROR', 
            error: \`\${error.message}\\n\\nStack: \${error.stack}\` 
          }, '*');
        }
        
        render() {
          if (this.state.hasError) {
            return React.createElement('div', { 
              className: 'min-h-screen flex items-center justify-center bg-gray-900 p-6' 
            }, React.createElement('div', {
              className: 'bg-red-900/20 border border-red-500/50 rounded-lg p-8 max-w-md w-full text-center'
            }, [
              React.createElement('div', { className: 'text-red-400 text-6xl mb-4', key: 'icon' }, '⚠️'),
              React.createElement('h2', { className: 'text-xl font-semibold text-white mb-2', key: 'title' }, 'Component Error'),
              React.createElement('p', { className: 'text-gray-300 mb-4 text-sm', key: 'message' }, this.state.error?.message || 'Something went wrong'),
              React.createElement('button', {
                key: 'retry',
                className: 'bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors',
                onClick: () => this.setState({ hasError: false, error: null })
              }, 'Retry')
            ]));
          }
          
          return this.props.children;
        }
      };
      
      const AppComponent = () => {
        const AppToRender = App || (() => React.createElement('div', { 
          className: 'min-h-screen flex items-center justify-center bg-gray-900' 
        }, React.createElement('div', {
          className: 'text-center text-white'
        }, [
          React.createElement('div', { className: 'text-6xl mb-4', key: 'icon' }, '🚀'),
          React.createElement('h1', { className: 'text-2xl font-bold mb-2', key: 'title' }, 'App Generated!'),
          React.createElement('p', { className: 'text-gray-400', key: 'desc' }, 'Your React component is ready')
        ])));
        
        return React.createElement(ErrorBoundary, {}, React.createElement(AppToRender));
      };
      
      root.render(React.createElement(AppComponent));
      
      // Signal successful render
      const renderTime = performance.now() - startTime;
      setTimeout(() => {
        window.parent.postMessage({ 
          type: 'PREVIEW_READY', 
          renderTime: Math.round(renderTime)
        }, '*');
        
        // Show success notification
        const successEl = document.createElement('div');
        successEl.className = 'success';
        successEl.innerHTML = \`✅ Rendered in \${Math.round(renderTime)}ms\`;
        document.body.appendChild(successEl);
        
        setTimeout(() => {
          if (successEl.parentNode) {
            successEl.parentNode.removeChild(successEl);
          }
        }, 3000);
      }, 100);
      
    } catch (error) {
      console.error('Render error:', error);
      document.getElementById('root').innerHTML = \`
        <div class="error">
          <strong>Render Error:</strong> \${error.message}
          <br><br>
          <small>Check console for details</small>
        </div>
      \`;
      window.parent.postMessage({ 
        type: 'PREVIEW_ERROR', 
        error: \`\${error.message}\\n\\nStack: \${error.stack}\`
      }, '*');
    }
  </script>
</body>
</html>`;
  };

  useEffect(() => {
    if (!files || files.length === 0 || !iframeRef.current) return;

    const iframe = iframeRef.current;
    setIsLoading(true);
    setError(null);
    setRenderTime(null);

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('Preview timeout - component took too long to load');
      onError?.('Preview timeout - component took too long to load');
    }, 15000);

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      
      clearTimeout(timeoutId);
      
      if (event.data.type === 'PREVIEW_READY') {
        setIsLoading(false);
        setError(null);
        setRenderTime(event.data.renderTime || null);
      } else if (event.data.type === 'PREVIEW_ERROR') {
        setIsLoading(false);
        setError(event.data.error);
        onError?.(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    
    try {
      const previewHTML = createPreviewHTML(files);
      iframe.srcdoc = previewHTML;
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to create preview');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, [files, onError]);

  if (files.length === 0) {
    return (
      <div className={`relative w-full h-full min-h-[400px] border border-gray-800 rounded-lg overflow-hidden bg-black ${className || ''}`}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white">Ready to create something amazing?</h3>
            <p className="text-gray-400">Describe your app and watch it come to life</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[400px] border border-gray-800 rounded-lg overflow-hidden bg-black ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 text-white">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <div>
              <div className="font-medium">Loading preview...</div>
              <div className="text-sm text-gray-400">Compiling React components</div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-900/90 border border-red-500/50 rounded-lg p-4 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-red-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="font-medium">Preview Error</div>
              <div className="text-sm text-red-200 mt-1 font-mono">{error}</div>
            </div>
          </div>
        </div>
      )}

      {renderTime && !isLoading && !error && (
        <div className="absolute top-4 right-4 bg-green-900/90 border border-green-500/50 rounded-lg px-3 py-1.5 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-green-300 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Rendered in {renderTime}ms</span>
            <Zap className="h-3 w-3" />
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        sandbox="allow-scripts allow-same-origin"
        title="Live Preview"
        style={{ colorScheme: 'dark' }}
      />
    </div>
  );
};
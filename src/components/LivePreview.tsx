import { SandpackProvider, SandpackPreview, SandpackLayout, SandpackConsole } from "@codesandbox/sandpack-react";
import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";

interface FileData {
  path: string;
  content: string;
}

interface LivePreviewProps {
  files: FileData[];
  onValidationChange?: (isValid: boolean, errors: any[]) => void;
}

interface ValidationStatus {
  status: 'idle' | 'validating' | 'success' | 'error';
  errors: any[];
  lastCheck: Date | null;
}

export default function LivePreview({ files, onValidationChange }: LivePreviewProps) {
  const [sandpackFiles, setSandpackFiles] = useState<Record<string, { code: string }>>({});
  const [validation, setValidation] = useState<ValidationStatus>({
    status: 'idle',
    errors: [],
    lastCheck: null
  });

  // Auto-validation when files change
  useEffect(() => {
    if (files.length > 0) {
      validateFiles();
    }
  }, [files]);

  const validateFiles = async () => {
    setValidation(prev => ({ ...prev, status: 'validating' }));
    
    try {
      const { data, error } = await supabase.functions.invoke("validate-code", {
        body: { files, skipTypeCheck: false },
      });

      if (error) throw error;

      const isValid = data.success;
      const errors = data.errors || [];

      setValidation({
        status: isValid ? 'success' : 'error',
        errors,
        lastCheck: new Date()
      });

      onValidationChange?.(isValid, errors);

      // Apply auto-fixes if available
      if (data.fixedFiles && data.fixedFiles.length > 0) {
        console.log('Auto-fixes applied:', data.fixes);
      }

    } catch (error) {
      console.error('Validation failed:', error);
      setValidation({
        status: 'error',
        errors: [{ message: 'Validation service error', severity: 'error' }],
        lastCheck: new Date()
      });
    }
  };

  useEffect(() => {
    // Build a safe default sandbox with Router + Tailwind and a loading UI
    const defaultIndexHtml = `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Live Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      /* Inline Tailwind Base for immediate styling */
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      :root {
        --background: 0 0% 0%;
        --foreground: 0 0% 100%;
        --primary: 217 91% 80%;
        --primary-foreground: 222 47% 8%;
        --card: 222 43% 11%;
        --card-foreground: 217 91% 95%;
        --border: 222 43% 15%;
        --radius: 0.75rem;
      }
      html, body, #root { height: 100%; min-height: 100vh; }
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 0;
        background: hsl(var(--background));
        color: hsl(var(--foreground));
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

    const defaultAppTsx = `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-900 text-white">
      <div className="text-center space-y-4 p-8">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
        <h1 className="text-2xl font-semibold">Preview in caricamento…</h1>
        <p className="text-gray-400">L'AI sta preparando l'app e i componenti UI</p>
      </div>
    </div>
  );
}`;

    const errorBoundaryCode = `import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Qualcosa è andato storto
            </h2>
            <p className="text-muted-foreground mb-6">
              Si è verificato un errore durante il rendering.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}`;

    const mainIndexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 0%;
    --foreground: 0 0% 100%;
    --card: 222 43% 11%;
    --card-foreground: 217 91% 95%;
    --primary: 217 91% 80%;
    --primary-foreground: 222 47% 8%;
    --secondary: 222 43% 15%;
    --secondary-foreground: 217 91% 95%;
    --border: 222 43% 15%;
    --input: 222 43% 15%;
    --ring: 217 91% 85%;
    --radius: 0.75rem;
  }
  html, body, #root { height: 100%; min-height: 100vh; }
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}`;

    const ensureMain = (appImportPath: string) => `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import * as AppModule from '${appImportPath}'

const ResolvedApp = (AppModule as any)?.default ?? (AppModule as any)?.App;

function IsolatedApp() {
  if (!ResolvedApp) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-900 text-white">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-xl font-semibold">App component not found</h2>
          <p className="text-gray-400">Ensure you export a default component or named export "App".</p>
        </div>
      </div>
    );
  }
  const Comp = ResolvedApp as React.ComponentType;
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Comp />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IsolatedApp />
  </React.StrictMode>
)`;

    if (!files || files.length === 0) {
      setSandpackFiles({
        "/index.html": { code: defaultIndexHtml },
        "/src/index.css": { code: mainIndexCss },
        "/src/main.tsx": { code: ensureMain('./App') },
        "/src/index.tsx": { code: ensureMain('./App') },
        "/src/App.tsx": { code: defaultAppTsx },
      });
      return;
    }

    // Map incoming files and inject missing boilerplate
    const mapped: Record<string, { code: string }> = {};
    files.forEach((f) => {
      const path = f.path.startsWith('/') ? f.path : `/${f.path}`;
      mapped[path] = { code: f.content };
    });

    // Ensure index.html exists
    if (!mapped['/index.html']) {
      mapped['/index.html'] = { code: defaultIndexHtml };
    }

    // Ensure index.css exists with Tailwind
    if (!mapped['/src/index.css']) {
      mapped['/src/index.css'] = { code: mainIndexCss };
    }

    // Note: ErrorBoundary is handled at component level, not needed in sandbox

    // Inject basic UI fallbacks (shadcn-like) only if missing, so imports like "@/components/ui/button" won't break
    const ensureFallback = (p: string, code: string) => {
      if (!mapped[p]) mapped[p] = { code };
    };

    ensureFallback('/src/components/ui/button.tsx', `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`);

    ensureFallback('/src/components/ui/card.tsx', `import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`);

    ensureFallback('/src/components/ui/input.tsx', `import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }`);

    ensureFallback('/src/components/ui/badge.tsx', `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }`);

    // Add essential utility functions that shadcn components need
    ensureFallback('/src/lib/utils.ts', `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`);

    // Detect App path case-insensitively and ensure main.tsx wraps with BrowserRouter
    const appKey = Object.keys(mapped).find(
      (k) => k.toLowerCase() === '/src/app.tsx' || k.toLowerCase() === '/app.tsx'
    );

    // If no App provided at all, add a safe default
    if (!appKey) {
      mapped['/src/App.tsx'] = { code: defaultAppTsx };
    }

    const chosenKey = appKey ?? '/src/App.tsx';
    const appImport = chosenKey.startsWith('/src/')
      ? './' + chosenKey.slice('/src/'.length).replace(/\.(t|j)sx?$/, '')
      : '../' + chosenKey.slice(1).replace(/\.(t|j)sx?$/, '');

    // Always enforce a Router-wrapped entry for the sandbox to prevent useRoutes errors
    mapped['/src/main.tsx'] = { code: ensureMain(appImport) };
    // Sandpack react-ts template expects /src/index.tsx as entry; provide it too to override default Hello World
    mapped['/src/index.tsx'] = { code: ensureMain(appImport) };

    setSandpackFiles(mapped);
  }, [files]);

  const dependencies = useMemo(() => ({
    // Core React stack
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    
    // TypeScript support
    typescript: "^5.0.0",
    "@types/react": "^18.3.0", 
    "@types/react-dom": "^18.3.0",
    
    // Styling & UI libraries (AppSpec standard)
    tailwindcss: "^3.4.0",
    "@radix-ui/react-slot": "^1.2.3",
    "class-variance-authority": "^0.7.1",
    "tailwind-merge": "^2.6.0",
    clsx: "^2.1.1",
    
    // State management
    zustand: "^4.5.0",
    
    // Form handling
    "react-hook-form": "^7.53.0",
    zod: "^3.22.0",
    "@hookform/resolvers": "^3.9.0",
    
    // Icons & animations  
    "lucide-react": "^0.462.0",
    "framer-motion": "^11.0.0",
    
    // UI component libraries (available for selection)
    "@rewind-ui/core": "^0.20.0",
    "keep-react": "latest",
  }), []);

  // Status Bar Component
  const StatusBar = () => {
    const getStatusIcon = () => {
      switch (validation.status) {
        case 'validating': return <Clock className="h-4 w-4 animate-spin text-blue-400" />;
        case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
        case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />;
        default: return <Zap className="h-4 w-4 text-gray-400" />;
      }
    };

    const getStatusText = () => {
      switch (validation.status) {
        case 'validating': return 'Analisi → Generazione → Fix → Build → Aggiornamento';
        case 'success': return `Build riuscita • ${validation.errors.filter(e => e.severity === 'warning').length} warnings`;
        case 'error': return `${validation.errors.filter(e => e.severity === 'error').length} errori • ${validation.errors.filter(e => e.severity === 'warning').length} warnings`;
        default: return 'Pronto per la generazione';
      }
    };

    return (
      <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-4 text-sm">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-gray-200">{getStatusText()}</span>
        </div>
        {validation.lastCheck && (
          <div className="ml-auto text-xs text-gray-400">
            Last check: {validation.lastCheck.toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  // Error Overlay Component
  const ErrorOverlay = () => {
    if (validation.status !== 'error' || validation.errors.length === 0) return null;

    const criticalErrors = validation.errors.filter(e => e.severity === 'error');
    if (criticalErrors.length === 0) return null;

    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-red-900/90 border border-red-600 rounded-lg p-6 max-w-2xl mx-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Build Errors</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {criticalErrors.slice(0, 5).map((error, index) => (
              <div key={index} className="bg-black/30 rounded p-3 text-sm">
                <div className="text-red-300 font-medium">
                  {error.file}:{error.line}:{error.column}
                </div>
                <div className="text-gray-200 mt-1">{error.message}</div>
                {error.code && (
                  <div className="text-xs text-gray-400 mt-1">Code: {error.code}</div>
                )}
              </div>
            ))}
            {criticalErrors.length > 5 && (
              <div className="text-gray-400 text-sm text-center">
                +{criticalErrors.length - 5} more errors...
              </div>
            )}
          </div>
          <button 
            onClick={validateFiles}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Retry Validation
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 w-full bg-black flex flex-col">
      <StatusBar />
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <SandpackProvider
            template="react-ts"
            theme="dark"
            files={sandpackFiles}
            customSetup={{
              dependencies,
              entry: "/src/index.tsx"
            }}
            options={{
              autorun: true,
              autoReload: true,
              recompileMode: "immediate",
              recompileDelay: 100
            }}
          >
            <SandpackLayout style={{ height: "100%", width: "100%", backgroundColor: "hsl(0 0% 0%)" }}>
              {/* Preview with Error Overlay */}
              <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
                <SandpackPreview 
                  style={{ 
                    flex: 1,
                    height: "100%",
                    width: "100%",
                    backgroundColor: "hsl(0 0% 0%)",
                    border: "none"
                  }} 
                  showNavigator={false}
                  showRefreshButton={true}
                  showOpenInCodeSandbox={false}
                />
                <ErrorOverlay />
              </div>
            </SandpackLayout>
          </SandpackProvider>
        </div>
      </div>
    </div>
  );
}

import { SandpackProvider, SandpackPreview, SandpackLayout, SandpackConsole } from "@codesandbox/sandpack-react";
import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface FileData {
  path: string;
  content: string;
}

interface LivePreviewProps {
  files: FileData[];
}

export default function LivePreview({ files }: LivePreviewProps) {
  const [sandpackFiles, setSandpackFiles] = useState<Record<string, { code: string }>>({});

  useEffect(() => {
    // Build a safe default sandbox with Router + Tailwind and a loading UI
    const defaultIndexHtml = `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Live Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
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

    const ensureMain = (appImportPath: string) => `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'
import * as AppModule from '${appImportPath}'

const ResolvedApp = (AppModule as any)?.default ?? (AppModule as any)?.App;

function IsolatedApp() {
  if (!ResolvedApp) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'black', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>App component not found</h2>
          <p>Ensure you export a default component or a named export "App".</p>
        </div>
      </div>
    );
  }
  const Comp = ResolvedApp as React.ComponentType;
  return (
    <BrowserRouter>
      <Comp />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <IsolatedApp />
    </ErrorBoundary>
  </React.StrictMode>
)`;

    if (!files || files.length === 0) {
      setSandpackFiles({
        "/index.html": { code: defaultIndexHtml },
        "/src/main.tsx": { code: ensureMain('./App') },
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

    // Always inject ErrorBoundary
    mapped['/src/ErrorBoundary.tsx'] = { code: errorBoundaryCode };

    // Inject basic UI fallbacks (shadcn-like) only if missing, so imports like "@/components/ui/button" won't break
    const ensureFallback = (p: string, code: string) => {
      if (!mapped[p]) mapped[p] = { code };
    };

    ensureFallback('/src/components/ui/button.tsx', `import React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default' | 'outline' | 'ghost'; }
export const Button = ({ className = '', variant = 'default', ...props }: ButtonProps) => {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 h-10 px-4 py-2';
  const variants: Record<string, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-100 hover:bg-gray-800',
    ghost: 'text-gray-100 hover:bg-gray-800',
  };
  const cls = base + ' ' + (variants[variant] || variants.default) + ' ' + className;
  return <button className={cls} {...props} />;
};
export default Button;`);

    ensureFallback('/src/components/ui/card.tsx', `import React from 'react';
export const Card = ({ className = '', children }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={'rounded-lg border border-gray-800 bg-gray-900 p-6 ' + className}>{children}</div>
);
export const CardHeader = ({ className = '', children }: any) => (<div className={'mb-4 ' + className}>{children}</div>);
export const CardTitle = ({ className = '', children }: any) => (<h3 className={'text-lg font-semibold text-white ' + className}>{children}</h3>);
export const CardContent = ({ className = '', children }: any) => (<div className={className}>{children}</div>);
export default Card;`);

    ensureFallback('/src/components/ui/input.tsx', `import React from 'react';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = ({ className = '', ...props }: InputProps) => (
  <input className={'w-full rounded-md border border-gray-700 bg-black text-white px-3 py-2 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ' + className} {...props} />
);
export default Input;`);

    ensureFallback('/src/components/ui/textarea.tsx', `import React from 'react';
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const Textarea = ({ className = '', ...props }: TextareaProps) => (
  <textarea className={'w-full rounded-md border border-gray-700 bg-black text-white px-3 py-2 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ' + className} {...props} />
);
export default Textarea;`);

    ensureFallback('/src/components/ui/badge.tsx', `import React from 'react';
export const Badge = ({ className = '', children }: React.PropsWithChildren<{ className?: string }>) => (
  <span className={'inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-gray-200 ' + className}>{children}</span>
);
export default Badge;`);

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

    setSandpackFiles(mapped);
  }, [files]);

  const dependencies = useMemo(() => ({
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "@rewind-ui/core": "^0.20.0",
    "keep-react": "latest",
    "lucide-react": "^0.462.0",
    clsx: "^2.1.1",
    tailwindcss: "^3.4.0",
  }), []);

  return (
    <div className="h-full w-full bg-black">
      <ErrorBoundary>
        <SandpackProvider
          template="react-ts"
          theme="dark"
          files={sandpackFiles}
          customSetup={{
            dependencies,
          }}
          options={{
            autorun: true,
            autoReload: true,
            recompileMode: "immediate",
            recompileDelay: 300
          }}
        >
          <SandpackLayout style={{ height: "100vh", width: "100%", backgroundColor: "hsl(0 0% 0%)" }}>
            {/* Preview only - full height */}
            <div style={{ flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
              <SandpackPreview 
                style={{ 
                  height: "100vh", 
                  width: "100%",
                  backgroundColor: "hsl(0 0% 0%)",
                  border: "none"
                }} 
                showNavigator={false}
                showRefreshButton={false}
                showOpenInCodeSandbox={false}
              />
              <SandpackConsole
                standalone={false}
                showHeader={false}
                resetOnPreviewRestart
                style={{ height: 200, backgroundColor: "hsl(0 0% 5%)", borderTop: "1px solid hsl(0 0% 15%)" }}
              />
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </ErrorBoundary>
    </div>
  );
}

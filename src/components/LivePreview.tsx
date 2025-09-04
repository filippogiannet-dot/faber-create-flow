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
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <div className="text-center space-y-4 p-8">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <h1 className="text-2xl font-semibold">Preview in caricamento…</h1>
        <p className="text-muted-foreground">L'AI sta preparando l'app e i componenti UI</p>
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
import App from '${appImportPath}'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
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

    // Detect App path and ensure main.tsx wraps with BrowserRouter
    const hasSrcApp = Boolean(mapped['/src/App.tsx']);
    const hasRootApp = Boolean(mapped['/App.tsx']);

    // If no App provided at all, add a safe default
    if (!hasSrcApp && !hasRootApp) {
      mapped['/src/App.tsx'] = { code: defaultAppTsx };
    }

    const appImport = hasSrcApp || mapped['/src/App.tsx'] ? './App' : hasRootApp ? '../App' : './App';
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
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </ErrorBoundary>
    </div>
  );
}

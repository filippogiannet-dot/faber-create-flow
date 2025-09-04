import { SandpackProvider, SandpackPreview, SandpackLayout, SandpackConsole } from "@codesandbox/sandpack-react";
import { useEffect, useMemo, useState } from "react";

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
    <div className="min-h-screen grid place-items-center bg-black text-white">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        <h1 className="text-xl font-semibold">Preview in caricamento…</h1>
        <p className="text-sm opacity-70">L'AI sta preparando l'app e i componenti UI</p>
      </div>
    </div>
  );
}`;

    const ensureMain = (appImportPath: string) => `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '${appImportPath}'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
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
    <div className="h-full w-full">
      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={sandpackFiles}
        customSetup={{
          dependencies,
        }}
      >
        <SandpackLayout style={{ height: "100%" }}>
          {/* Preview only by default; code editor is handled by Monaco outside */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <SandpackPreview style={{ height: "100%" }} showNavigator />
          </div>
        </SandpackLayout>
        <SandpackConsole style={{ height: 180 }} />
      </SandpackProvider>
    </div>
  );
}

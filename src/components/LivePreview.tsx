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
    if (!files || files.length === 0) {
      setSandpackFiles({
        "/App.tsx": {
          code: `export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Benvenuto nella Live Preview</h1>
      <p className="mt-4 text-muted-foreground">Genera del codice per vedere l'anteprima qui.</p>
    </div>
  );
}`,
        },
      });
      return;
    }

    const mapped: Record<string, { code: string }> = {};
    files.forEach((f) => {
      const path = f.path.startsWith("/") ? f.path : `/${f.path}`;
      mapped[path] = { code: f.content };
    });
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

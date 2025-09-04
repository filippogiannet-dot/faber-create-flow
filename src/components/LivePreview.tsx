import { Sandpack } from "@codesandbox/sandpack-react";
import { useEffect, useState } from "react";

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
        "/App.js": {
          code: `export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to Live Preview!</h1>
      <p className="mt-4 text-gray-600">Generate some code to see it live here.</p>
    </div>
  );
}`,
        },
      });
      return;
    }

    const mapped: Record<string, { code: string }> = {};
    files.forEach((f) => {
      mapped[f.path] = { code: f.content };
    });
    setSandpackFiles(mapped);
  }, [files]);

  return (
    <div className="h-full w-full">
      <Sandpack
        template="react-ts"
        theme="dark"
        files={sandpackFiles}
        options={{
          showTabs: true,
          showConsole: true,
          editorHeight: 400,
          autorun: true,
          showNavigator: true,
        }}
        customSetup={{
          dependencies: {
            "react": "^18.3.1",
            "react-dom": "^18.3.1",
            "tailwindcss": "^3.4.0",
          },
        }}
      />
    </div>
  );
}
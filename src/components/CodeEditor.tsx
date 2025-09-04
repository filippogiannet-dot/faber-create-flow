import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function CodeEditor({ code, onChange, language = "javascript" }: CodeEditorProps) {
  return (
    <div className="h-full w-full bg-black overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language}
        theme="vs-dark"
        value={code}
        onChange={(val) => onChange(val ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",
          tabSize: 2,
          insertSpaces: true,
          contextmenu: false,
          quickSuggestions: false,
          parameterHints: { enabled: false },
          suggest: { enabled: false },
          hover: { enabled: false },
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          renderLineHighlight: "none",
          scrollbar: {
            vertical: "hidden",
            horizontal: "hidden"
          },
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          renderValidationDecorations: "off"
        }}
      />
    </div>
  );
}
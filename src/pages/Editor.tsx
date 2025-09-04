import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Code, Eye, Loader2, Monitor, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LivePreview from "@/components/LivePreview";
import CodeEditor from "@/components/CodeEditor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StatusMessages, StatusMessage } from "@/components/StatusMessages";

export default function Editor() {
  const { projectId } = useParams();
  const [prompt, setPrompt] = useState(() => {
    // Try to load the last prompt from localStorage
    return localStorage.getItem(`editor-prompt-${projectId}`) || "";
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ path: string; content: string }>>([]);
  const [currentView, setCurrentView] = useState<"preview" | "code">("preview");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);

  const addStatusMessage = (text: string, type: 'loading' | 'success' | 'error' = 'loading') => {
    const message: StatusMessage = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date()
    };
    setStatusMessages(prev => [...prev, message]);
    return message.id;
  };

  const updateStatusMessage = (id: string, text: string, type: 'loading' | 'success' | 'error') => {
    setStatusMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, text, type } : msg
    ));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setStatusMessages([]);
    
    // Save the prompt to localStorage
    localStorage.setItem(`editor-prompt-${projectId}`, prompt);

    try {
      const initId = addStatusMessage("Inizializzo la generazione...", 'loading');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStatusMessage(initId, "Inizializzazione completata", 'success');
      
      const parseId = addStatusMessage("Analizzo il prompt...", 'loading');
      
      const { data, error } = await supabase.functions.invoke("generate", {
        body: { prompt },
      });

      if (error) throw error;

      updateStatusMessage(parseId, "Prompt analizzato", 'success');
      const genId = addStatusMessage("Genero i componenti...", 'loading');
      
      await new Promise(resolve => setTimeout(resolve, 300));

      if (data?.files && Array.isArray(data.files)) {
        updateStatusMessage(genId, "Componenti generati", 'success');
        const previewId = addStatusMessage("Aggiorno la preview...", 'loading');
        
        setGeneratedFiles(data.files);
        setCurrentView("preview");
        
        await new Promise(resolve => setTimeout(resolve, 300));
        updateStatusMessage(previewId, "Preview aggiornata con successo!", 'success');
        
        toast({
          title: "App generata!",
          description: "L'applicazione è stata generata con successo.",
        });
      } else {
        throw new Error("Formato risposta non valido");
      }
    } catch (error) {
      console.error("Errore durante la generazione:", error);
      addStatusMessage("Errore durante la generazione", 'error');
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la generazione dell'app.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen bg-background flex overflow-hidden">
        {/* Chat Panel - Fixed Width 1/4 */}
        <div className="w-1/4 min-w-[300px] bg-background border-r border-border flex flex-col">
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Chat Editor</h2>
              <Badge variant="secondary" className="text-xs">AI</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Genera la tua app con un prompt
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Descrivi l'applicazione che vuoi creare...
              </div>
              
              {/* Status Messages */}
              <StatusMessages messages={statusMessages} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card">
            <div className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Scrivi il tuo prompt qui..."
                className="min-h-[100px] resize-none bg-background border-border text-foreground placeholder:text-muted-foreground"
                disabled={isGenerating}
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Genera App
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Panel - Fixed Width 3/4 */}
        <div className="w-3/4 flex flex-col bg-background">
          {/* Header with toggle */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  {currentView === "preview" ? "Live Preview" : "Code Editor"}
                </h3>
              </div>
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <Button
                  variant={currentView === "preview" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("preview")}
                  className="h-8 px-3"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant={currentView === "code" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("code")}
                  className="h-8 px-3"
                >
                  <Code className="h-4 w-4 mr-1" />
                  Code
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area - Full Height */}
          <div className="flex-1 flex overflow-hidden">
            {currentView === "preview" ? (
              <div className="flex-1 bg-background">
                <ErrorBoundary
                  fallback={
                    <div className="h-full flex items-center justify-center bg-card/50">
                      <div className="text-center p-8">
                        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Errore nella Preview</h3>
                        <p className="text-muted-foreground mb-4">
                          Si è verificato un errore durante il rendering dell'applicazione.
                        </p>
                        <Button onClick={() => window.location.reload()} variant="outline">
                          Ricarica
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <LivePreview files={generatedFiles} />
                </ErrorBoundary>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden">
                {/* File Tree */}
                <div className="w-64 bg-card border-r border-border flex flex-col">
                  <div className="p-3 border-b border-border">
                    <h4 className="font-medium text-sm text-foreground">File del Progetto</h4>
                  </div>
                  <div className="flex-1 p-2 overflow-y-auto">
                    {generatedFiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">Nessun file generato</p>
                    ) : (
                      <div className="space-y-1">
                        {generatedFiles.map((file) => (
                          <button
                            key={file.path}
                            onClick={() => {
                              setSelectedFile(file.path);
                              setFileContent(file.content);
                            }}
                            className={`w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors ${
                              selectedFile === file.path ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
                            }`}
                          >
                            {file.path}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Editor */}
                <div className="flex-1">
                  {selectedFile ? (
                    <ErrorBoundary
                      fallback={
                        <div className="h-full flex items-center justify-center bg-card/50">
                          <div className="text-center p-8">
                            <Code className="h-12 w-12 text-destructive mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Errore nell'Editor</h3>
                            <p className="text-muted-foreground">
                              Si è verificato un errore durante il caricamento dell'editor.
                            </p>
                          </div>
                        </div>
                      }
                    >
                      <CodeEditor
                        code={fileContent}
                        onChange={(newContent) => {
                          setFileContent(newContent);
                          // Update the file in generatedFiles
                          setGeneratedFiles(prev => 
                            prev.map(file => 
                              file.path === selectedFile 
                                ? { ...file, content: newContent }
                                : file
                            )
                          );
                        }}
                        language={selectedFile.endsWith('.tsx') || selectedFile.endsWith('.ts') ? 'typescript' : 'javascript'}
                      />
                    </ErrorBoundary>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground bg-card/30">
                      <div className="text-center">
                        <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Seleziona un file per visualizzare il codice</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
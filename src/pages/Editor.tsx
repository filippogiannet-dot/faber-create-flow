import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Code, Eye, Loader2, Monitor, AlertTriangle, User, Bot, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LivePreview from "@/components/LivePreview";
import CodeEditor from "@/components/CodeEditor";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'assistant' | 'status';
  timestamp: Date;
}

export default function Editor() {
  const { projectId } = useParams();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ path: string; content: string }>>([]);
  const [currentView, setCurrentView] = useState<"preview" | "code">("preview");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    // Load chat history from localStorage
    const saved = localStorage.getItem(`chat-messages-${projectId}`);
    const parsed: any[] = saved ? JSON.parse(saved) : [];
    return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Save chat messages to localStorage
  useEffect(() => {
    localStorage.setItem(`chat-messages-${projectId}`, JSON.stringify(chatMessages));
  }, [chatMessages, projectId]);

  const genId = (() => {
    let c = 0;
    return () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `${Date.now()}-${c++}-${Math.random().toString(36).slice(2, 8)}`;
  })();

  const addChatMessage = (text: string, type: 'user' | 'assistant' | 'status' = 'status') => {
    const id = genId();
    const message: ChatMessage = {
      id,
      text,
      type,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, message]);
    return id;
  };

  const updateChatMessage = (id: string, text: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, text } : msg
    ));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const isInitialRun = !hasGeneratedOnce && generatedFiles.length === 0;

    setLoading(true);
    setCompleted(false);
    setIsGenerating(true);
    
    // Add user message to chat
    addChatMessage(prompt, 'user');
    const rawPrompt = prompt;
    
    // Clear the prompt input
    setPrompt("");

    try {
      const initId = addChatMessage("🔄 Inizializzo la generazione...", 'status');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      updateChatMessage(initId, "✅ Inizializzazione completata");
      
      const parseId = addChatMessage(isInitialRun ? "🔍 Analizzo il prompt per generare l'app..." : "🔧 Analizzo le modifiche richieste...", 'status');
      
      const preparedPrompt = isInitialRun
        ? `Genera un’app completa con queste caratteristiche:\n\n${rawPrompt}`
        : `Applica le seguenti modifiche al codice esistente senza rigenerare l’app da zero. Mantieni la struttura e aggiorna solo i file necessari.\n\nModifiche:\n${rawPrompt}`;
      
      const { data, error } = await supabase.functions.invoke("generate", {
        body: { prompt: preparedPrompt },
      });

      if (error) throw error;

      updateChatMessage(parseId, "✅ Analisi completata");
      const genId = addChatMessage(isInitialRun ? "⚡ Genero i componenti..." : "✏️ Applico le modifiche ai file...", 'status');
      
      await new Promise(resolve => setTimeout(resolve, 200));

      if (data?.files && Array.isArray(data.files)) {
        updateChatMessage(genId, isInitialRun ? "✅ Componenti generati" : "✅ Modifiche applicate");
        const previewId = addChatMessage("🎨 Aggiorno la preview...", 'status');

        if (isInitialRun || generatedFiles.length === 0) {
          setGeneratedFiles(data.files);
        } else {
          // Merge by path: overwrite changed paths, keep others
          setGeneratedFiles((prev) => {
            const incomingMap = new Map<string, string>(data.files.map((f: any) => [f.path, f.content]));
            const next = prev.map((f) => incomingMap.has(f.path) ? { path: f.path, content: incomingMap.get(f.path)! } : f);
            // add new files not present before
            data.files.forEach((f: any) => {
              if (!prev.some((p) => p.path === f.path)) next.push({ path: f.path, content: f.content });
            });
            return next;
          });
        }
        setCurrentView("preview");

        await new Promise(resolve => setTimeout(resolve, 200));
        updateChatMessage(previewId, isInitialRun ? "🚀 Preview aggiornata con successo!" : "🔄 Preview aggiornata.");

        if (isInitialRun) {
          addChatMessage("App generata con successo! Ora puoi visualizzarla nella preview.", 'assistant');
          setHasGeneratedOnce(true);
          toast({
            title: "App generata!",
            description: "L'applicazione è stata generata con successo.",
          });
        } else {
          addChatMessage("Modifica applicata, preview aggiornata.", 'assistant');
          toast({
            title: "Modifica applicata",
            description: "La preview è stata aggiornata.",
          });
        }

        setCompleted(true);
      } else {
        throw new Error("Formato risposta non valido");
      }
    } catch (error) {
      console.error("Errore durante la generazione:", error);
      addChatMessage("❌ Errore durante la generazione dell'app", 'status');
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la generazione dell'app.",
      });
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const MessageIcon = ({ message }: { message: ChatMessage }) => {
    if (message.type === 'user') return <User className="h-4 w-4 text-primary" />;
    if (message.type === 'assistant') return <Bot className="h-4 w-4 text-green-500" />;
    // status: pick icon based on content
    const t = message.text || '';
    if (t.startsWith('✅') || /successo|completata|aggiornata/i.test(t)) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (t.startsWith('❌') || /errore|failed|impossibile/i.test(t)) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
  };
  return (
    <ErrorBoundary>
      <div className="h-screen w-screen bg-black flex overflow-hidden">
        {/* Chat Panel - 30% */}
        <div className="flex-none w-[30%] bg-black border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-white" />
              <h2 className="font-semibold text-white">Chat Editor</h2>
              <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-200">AI</Badge>
            </div>
            <div className="text-xs text-gray-400">
              Genera la tua app con un prompt
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-black">
            <div className="space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-sm text-gray-400 mb-4">
                  Descrivi l'applicazione che vuoi creare...
                </div>
              )}
              
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-blue-900/30 border border-blue-700/50' 
                      : message.type === 'assistant'
                      ? 'bg-green-900/30 border border-green-700/50'
                      : 'bg-gray-800/50 border border-gray-700/50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <MessageIcon message={message} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white break-words">
                      {message.text}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-800 bg-gray-900">
            <div className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Scrivi il tuo prompt qui..."
                className="min-h-[100px] resize-none bg-black border-gray-700 text-white placeholder:text-gray-400"
                disabled={isGenerating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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

        {/* Preview Panel - 70% */}
        <div className="flex-none w-[70%] flex flex-col bg-black">
          {/* Header with toggle */}
          <div className="p-4 border-b border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-white" />
                <h3 className="font-semibold text-white">
                  {currentView === "preview" ? "Live Preview" : "Code Tree"}
                </h3>
                {isGenerating && (
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                )}
              </div>
              <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
                <Button
                  variant={currentView === "preview" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("preview")}
                  className="h-8 px-3 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant={currentView === "code" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("code")}
                  className="h-8 px-3 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  <Code className="h-4 w-4 mr-1" />
                  Code Tree
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area - Full Height */}
          <div className="flex-1 flex overflow-hidden">
            {currentView === "preview" ? (
              <div className="flex-1 bg-black">
                <ErrorBoundary
                  fallback={
                    <div className="h-full flex items-center justify-center bg-gray-900/50">
                      <div className="text-center p-8">
                        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-white">Errore nella Preview</h3>
                        <p className="text-gray-400 mb-4">
                          Si è verificato un errore durante il rendering dell'applicazione.
                        </p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
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
                <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                  <div className="p-3 border-b border-gray-800">
                    <h4 className="font-medium text-sm text-white">File del Progetto</h4>
                  </div>
                  <div className="flex-1 p-2 overflow-y-auto">
                    {generatedFiles.length === 0 ? (
                      <p className="text-sm text-gray-400 p-2">Nessun file generato</p>
                    ) : (
                      <div className="space-y-1">
                        {generatedFiles.map((file) => (
                          <button
                            key={file.path}
                            onClick={() => {
                              setSelectedFile(file.path);
                              setFileContent(file.content);
                            }}
                            className={`w-full text-left text-sm p-2 rounded hover:bg-gray-700 transition-colors ${
                              selectedFile === file.path ? "bg-gray-700 text-white font-medium" : "text-gray-300"
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
                        <div className="h-full flex items-center justify-center bg-gray-900/50">
                          <div className="text-center p-8">
                            <Code className="h-12 w-12 text-red-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2 text-white">Errore nell'Editor</h3>
                            <p className="text-gray-400">
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
                    <div className="flex items-center justify-center h-full text-gray-400 bg-black">
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
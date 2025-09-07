import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Code, Eye, Loader2, Monitor, AlertTriangle, User, Bot, CheckCircle, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import EnhancedLivePreview from "@/components/EnhancedLivePreview";
import CodeEditor from "@/components/CodeEditor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LivePreview from "@/components/ModernLivePreview";
import { aiGeneration } from "@/services/aiGeneration";

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
  const [currentView, setCurrentView] = useState<"preview" | "code" | "logs">("preview");
  const [validationStatus, setValidationStatus] = useState<{ isValid: boolean; errors: any[] }>({ isValid: true, errors: [] });
  const [projectLogs, setProjectLogs] = useState<any[]>([]);
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

  // Logging utility
  const logBuildPhase = async (phase: string, status: string, durationMs?: number, errors?: any[], warnings?: any[], depsAdded?: string[], filesChanged?: string[]) => {
    try {
      await supabase.functions.invoke("logging", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          action: 'log-build',
          projectId,
          phase,
          status,
          durationMs,
          errors: errors || [],
          warnings: warnings || [],
          depsAdded: depsAdded || [],
          filesChanged: filesChanged || [],
          metadata: { timestamp: new Date().toISOString() }
        }
      });
    } catch (error) {
      console.error('Logging failed:', error);
    }
  };

  const loadProjectLogs = async () => {
    try {
      const { data } = await supabase.functions.invoke("logging", {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (data) {
        setProjectLogs(data.buildLogs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  // Load logs on component mount
  useEffect(() => {
    if (projectId) {
      loadProjectLogs();
    }
  }, [projectId]);

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
      
      updateChatMessage(initId, "✅ Inizializzazione completata");
      
      const parseId = addChatMessage(isInitialRun ? "🔍 Analizzo il prompt per generare l'app..." : "🔧 Analizzo le modifiche richieste...", 'status');
      
      // Use enhanced AI generation service
      const result = await aiGeneration.generateWithEnhancement({
        projectId: projectId!,
        prompt: rawPrompt,
        isInitial: isInitialRun,
        context: {
          existingFiles: generatedFiles,
          previousPrompts: chatMessages.filter(m => m.type === 'user').map(m => m.text)
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      updateChatMessage(parseId, "✅ Analisi completata");
      const genId = addChatMessage(isInitialRun ? "⚡ Genero i componenti..." : "✏️ Applico le modifiche ai file...", 'status');
      

      if (result.files && Array.isArray(result.files)) {
        updateChatMessage(genId, isInitialRun ? "✅ Componenti generati" : "✅ Modifiche applicate");
        const previewId = addChatMessage("🎨 Aggiorno la preview...", 'status');


        setGeneratedFiles(result.files);
        setCurrentView("preview");

        updateChatMessage(previewId, isInitialRun ? "🚀 Preview aggiornata con successo!" : "🔄 Preview aggiornata.");

        if (isInitialRun) {
          addChatMessage(`App generata con successo! Qualità: ${result.validationScore || 100}/100`, 'assistant');
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
      
      // More specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Edge Function')) {
        addChatMessage("⚠️ Servizi AI temporaneamente non disponibili - usando modalità fallback", 'status');
      }
      
      toast({
        variant: "destructive",
        title: "Errore",
        description: errorMessage.includes('Failed to fetch') 
          ? "Servizi AI non disponibili. Prova più tardi o contatta il supporto."
          : "Si è verificato un errore durante la generazione dell'app.",
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
        <div className="flex-none w-[70%] flex flex-col bg-black min-h-0">
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
                {!validationStatus.isValid && (
                  <Badge variant="destructive" className="text-xs">
                    {validationStatus.errors.filter(e => e.severity === 'error').length} errors
                  </Badge>
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
                <Button
                  variant={currentView === "logs" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("logs")}
                  className="h-8 px-3 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Logs
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area - Full Height */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {currentView === "preview" ? (
              <div className="flex flex-col flex-1 bg-black relative min-h-0">
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
                  <LivePreview 
                    code={(generatedFiles.find(f => f.path.toLowerCase().endsWith('app.tsx'))?.content) || `import React from 'react';\nconst App = () => <div className="min-h-screen grid place-items-center bg-black text-white p-8">No App.tsx found</div>;\nexport default App;`}
                    onError={(error) => {
                      setValidationStatus({ isValid: false, errors: [{ message: error, severity: 'error' }] });
                      addChatMessage(`❌ Preview Error: ${error}`, 'status');
                    }}
                    onSuccess={() => {
                      setValidationStatus({ isValid: true, errors: [] });
                    }}
                  />
                </ErrorBoundary>
              </div>
            ) : currentView === "code" ? (
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
                      <EnhancedLivePreview 
                        files={generatedFiles}
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
            ) : (
              /* Logs View */
              <div className="flex-1 bg-black p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white mb-2">Build Logs</h2>
                    <p className="text-gray-400">Telemetria completa delle generazioni e build</p>
                  </div>
                  
                  <div className="space-y-4">
                    {projectLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Nessun log disponibile</p>
                        <p className="text-gray-500 text-sm">I log appariranno dopo la prima generazione</p>
                      </div>
                    ) : (
                      projectLogs.map((log, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                log.status === 'success' ? 'bg-green-500' :
                                log.status === 'error' ? 'bg-red-500' :
                                log.status === 'warning' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}></div>
                              <span className="text-white font-medium capitalize">{log.phase}</span>
                              <Badge variant={
                                log.status === 'success' ? 'default' :
                                log.status === 'error' ? 'destructive' :
                                'secondary'
                              }>
                                {log.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4">
                              {log.duration_ms && (
                                <span className="text-gray-400 text-sm">{log.duration_ms}ms</span>
                              )}
                              <span className="text-gray-400 text-sm">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          
                          {log.errors && log.errors.length > 0 && (
                            <div className="mt-3 p-3 bg-red-900/20 border border-red-700/50 rounded">
                              <h4 className="text-red-400 font-medium mb-2">Errori:</h4>
                              {log.errors.map((error: any, idx: number) => (
                                <p key={idx} className="text-red-300 text-sm">{error.message}</p>
                              ))}
                            </div>
                          )}
                          
                          {log.warnings && log.warnings.length > 0 && (
                            <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded">
                              <h4 className="text-yellow-400 font-medium mb-2">Avvisi:</h4>
                              {log.warnings.map((warning: any, idx: number) => (
                                <p key={idx} className="text-yellow-300 text-sm">{warning.message}</p>
                              ))}
                            </div>
                          )}
                          
                          {log.files_changed && log.files_changed.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-gray-300 font-medium mb-2">File modificati ({log.files_changed.length}):</h4>
                              <div className="flex flex-wrap gap-1">
                                {log.files_changed.map((file: string, idx: number) => (
                                  <span key={idx} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
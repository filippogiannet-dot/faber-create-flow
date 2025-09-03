import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Settings, 
  HelpCircle, 
  Monitor, 
  Code, 
  RotateCcw, 
  ExternalLink, 
  Smartphone, 
  Tablet, 
  Send,
  Github,
  Database,
  ChevronDown,
  User,
  Bot,
  Edit3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  tokens_used?: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  state: any;
  messages_used: number;
  created_at: string;
  updated_at: string;
}

interface Snapshot {
  id: string;
  project_id: string;
  version: number;
  state: any;
  created_at: string;
}

type ViewMode = 'preview' | 'code';
type DeviceSize = 'mobile' | 'tablet' | 'desktop';

const Editor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<Snapshot | null>(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch project data and setup realtime subscriptions
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchProjectData = async () => {
      try {
        // Fetch project metadata
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('owner_id', user.id)
          .single();

        if (projectError) {
          console.error('Project fetch error:', projectError);
          toast({
            variant: "destructive",
            title: "Errore",
            description: "Progetto non trovato",
          });
          navigate('/dashboard');
          return;
        }

        setProject(projectData);
        setProjectName(projectData.name);

        // Fetch snapshots
        const { data: snapshotsData, error: snapshotsError } = await supabase
          .from('snapshots')
          .select('*')
          .eq('project_id', projectId)
          .order('version', { ascending: false });

        if (snapshotsError) {
          console.error('Snapshots fetch error:', snapshotsError);
        } else {
          setSnapshots(snapshotsData || []);
          if (snapshotsData && snapshotsData.length > 0) {
            setCurrentSnapshot(snapshotsData[0]);
          }
        }

        // Fetch prompts for chat history
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (promptsError) {
          console.error('Prompts fetch error:', promptsError);
        } else {
          const messages: ChatMessage[] = [];
          promptsData?.forEach((prompt) => {
            messages.push({
              id: `user-${prompt.id}`,
              type: 'user',
              content: prompt.prompt_text,
              timestamp: new Date(prompt.created_at),
              tokens_used: prompt.tokens_used
            });

            if (prompt.ai_response) {
              messages.push({
                id: `ai-${prompt.id}`,
                type: 'ai',
                content: prompt.ai_response.explanation || 'Aggiornamento del codice generato.',
                timestamp: new Date(prompt.created_at)
              });
            }
          });
          setChatMessages(messages);
        }

      } catch (error) {
        console.error('Error fetching project data:', error);
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Errore nel caricamento del progetto",
        });
      }
    };

    fetchProjectData();

    // Set up realtime subscription for snapshots
    const snapshotSubscription = supabase
      .channel('snapshots')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'snapshots',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        const newSnapshot = payload.new as Snapshot;
        setSnapshots(prev => [newSnapshot, ...prev]);
        setCurrentSnapshot(newSnapshot);
        setPreviewKey(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(snapshotSubscription);
    };
  }, [projectId, user, navigate, toast]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendPrompt = async () => {
    if (!newPrompt.trim() || isGenerating || !projectId) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: newPrompt,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    const promptText = newPrompt;
    setNewPrompt("");

    try {
      const { data: result, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          projectId,
          prompt: promptText,
          isInitial: false
        }
      });

      if (error) throw error;

      if (result.success) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: result.response?.explanation || 'Codice generato con successo!',
          timestamp: new Date(),
          tokens_used: result.tokensUsed
        };
        setChatMessages(prev => [...prev, aiMessage]);

        toast({
          title: "Codice aggiornato",
          description: "L'applicazione è stata modificata con successo",
        });
      } else {
        throw new Error(result.error || 'Generazione fallita');
      }
    } catch (error) {
      console.error('Error sending prompt:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: `Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Errore durante la generazione",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProjectNameSave = async () => {
    if (!project || !projectName.trim()) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: projectName })
        .eq('id', project.id)
        .eq('owner_id', user?.id);

      if (error) throw error;

      setProject({ ...project, name: projectName });
      setIsEditingName(false);
      toast({
        title: "Nome aggiornato",
        description: "Il nome del progetto è stato modificato",
      });
    } catch (error) {
      console.error('Error updating project name:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiornare il nome del progetto",
      });
    }
  };

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const openInNewTab = () => {
    if (currentSnapshot?.state) {
      const htmlContent = extractHtml(currentSnapshot.state);
      if (htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    }
  };

  const getDeviceWidth = () => {
    switch (deviceSize) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };

  const buildPreviewHtml = (state: any): string | null => {
    const components = state?.components;
    if (!Array.isArray(components) || components.length === 0) return null;

    const main: any =
      components.find((c: any) => c.name === 'App') ||
      components.find((c: any) => c.type === 'page') ||
      components[0];

    const componentCodes = components
      .map((c: any) => `// ${c.name}\n${c.code}`)
      .join('\n\n');

    return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Preview</title>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="min-h-screen bg-white">
<div id="root"></div>
<script type="text/babel" data-presets="typescript,react">
${componentCodes}

const Root = () => {
  try {
    return React.createElement(${main.name});
  } catch (e) {
    return React.createElement('pre', null, 'Render error: ' + e.message);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(Root));
</script>
</body>
</html>`;
  };

  const extractHtml = (state: any): string | null => {
    if (!state) return null;
    if (typeof state === 'string') return state;
    if (typeof state.html === 'string') return state.html;
    if (typeof state.generatedCode === 'string') return state.generatedCode;
    if (typeof state.code === 'string') return state.code;
    const built = buildPreviewHtml(state);
    if (built) return built;
    return null;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Progetto non trovato</p>
      </div>
    );
  }

  const currentCode = extractHtml(currentSnapshot?.state) ?? '';
  const displayCode = currentCode || (currentSnapshot?.state ? JSON.stringify(currentSnapshot.state, null, 2) : '');

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-foreground hover:text-primary">
                {isEditingName ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onBlur={handleProjectNameSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleProjectNameSave();
                        } else if (e.key === 'Escape') {
                          setProjectName(project.name);
                          setIsEditingName(false);
                        }
                      }}
                      className="w-48 h-7"
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <span className="max-w-48 truncate">{project.name}</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Rinomina progetto
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Impostazioni
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Aiuto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center section */}
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          <Button
            variant={viewMode === 'preview' ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode('preview')}
            className="text-xs"
          >
            <Monitor className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            variant={viewMode === 'code' ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode('code')}
            className="text-xs"
          >
            <Code className="w-4 h-4 mr-1" />
            Code
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto">
          {viewMode === 'preview' && (
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                variant={deviceSize === 'mobile' ? "default" : "ghost"}
                size="sm"
                onClick={() => setDeviceSize('mobile')}
                className="text-xs"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceSize === 'tablet' ? "default" : "ghost"}
                size="sm"
                onClick={() => setDeviceSize('tablet')}
                className="text-xs"
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceSize === 'desktop' ? "default" : "ghost"}
                size="sm"
                onClick={() => setDeviceSize('desktop')}
                className="text-xs"
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <Button variant="ghost" size="sm" onClick={refreshPreview}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={openInNewTab}>
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Github className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Database className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Chat */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.type !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {message.type === 'ai' ? (
                        <Bot className="w-4 h-4 text-primary" />
                      ) : (
                        <span className="text-xs text-muted-foreground">!</span>
                      )}
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3 text-sm",
                      message.type === 'user'
                        ? "bg-card text-foreground border border-border"
                        : message.type === 'ai'
                        ? "bg-muted text-foreground border border-border"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {message.tokens_used && (
                        <span className="ml-2">• {message.tokens_used} token</span>
                      )}
                    </p>
                  </div>
                  
                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-foreground" />
                      </div>
                    )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Descrivi le modifiche che vuoi apportare..."
                className="min-h-[60px] max-h-32 resize-none bg-background"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                disabled={isGenerating}
              />
              <Button
                onClick={handleSendPrompt}
                disabled={!newPrompt.trim() || isGenerating}
                size="sm"
                className="h-auto self-end bg-gradient-button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Main Area - Preview/Code */}
        <div className="flex-1 bg-background">
          {viewMode === 'preview' ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 p-4">
                <div 
                  className="h-full border border-border rounded-lg overflow-hidden bg-card"
                  style={{ width: getDeviceWidth(), margin: '0 auto' }}
                >
                  {currentCode ? (
                    <iframe
                      key={previewKey}
                      ref={iframeRef}
                      srcDoc={currentCode}
                      className="w-full h-full border-0"
                      title="Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nessun contenuto da visualizzare</p>
                        <p className="text-sm mt-2">Invia un prompt per generare l'applicazione</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full p-4">
              <ScrollArea className="h-full">
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{displayCode || '// Nessun codice generato ancora'}</code>
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
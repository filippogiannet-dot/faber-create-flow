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
import JSZip from "jszip";

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
  generation_status?: string;
  error_message?: string;
}

interface ProjectFile {
  id: string;
  project_id: string;
  file_path: string;
  file_content: string;
  file_type: string;
  created_at: string;
  updated_at: string;
}

type ViewMode = 'preview' | 'code';
type DeviceSize = 'mobile' | 'tablet' | 'desktop';

const Editor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [optimisticHtml, setOptimisticHtml] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch project files
  const fetchProjectFiles = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data: files, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('file_path');

      if (error) {
        console.error('Error fetching project files:', error);
        return;
      }

      setProjectFiles(files || []);
    } catch (error) {
      console.error('Error fetching project files:', error);
    }
  }, [projectId]);

  // Generate preview HTML from project files
  const generatePreviewHtml = useCallback((files: ProjectFile[]): string => {
    if (!files || files.length === 0) {
      // Check if project is still generating
      if (project?.generation_status === 'generating') {
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Generazione in corso...</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @keyframes sparkle {
                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.2); }
              }
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
              }
              .sparkle { animation: sparkle 2s ease-in-out infinite; }
              .float { animation: float 3s ease-in-out infinite; }
              .gradient-bg {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
            </style>
          </head>
          <body class="gradient-bg min-h-screen flex items-center justify-center">
            <div class="text-center text-white p-8">
              <div class="float mb-8">
                <div class="w-24 h-24 mx-auto mb-6 relative">
                  <div class="absolute inset-0 bg-white/20 rounded-full"></div>
                  <div class="absolute inset-2 bg-white/30 rounded-full sparkle"></div>
                  <div class="absolute inset-4 bg-white/40 rounded-full"></div>
                  <div class="absolute inset-6 bg-white/60 rounded-full sparkle" style="animation-delay: 0.5s;"></div>
                  <div class="absolute inset-8 bg-white/80 rounded-full" style="animation-delay: 1s;"></div>
                </div>
              </div>
              <h1 class="text-4xl font-bold mb-4">✨ Stiamo creando qualcosa di magico ✨</h1>
              <p class="text-xl text-white/90 mb-6">La tua applicazione sta prendendo vita...</p>
              <div class="flex justify-center items-center space-x-2">
                <div class="w-3 h-3 bg-white rounded-full sparkle"></div>
                <div class="w-3 h-3 bg-white rounded-full sparkle" style="animation-delay: 0.3s;"></div>
                <div class="w-3 h-3 bg-white rounded-full sparkle" style="animation-delay: 0.6s;"></div>
              </div>
              <p class="text-sm text-white/70 mt-4">Questo potrebbe richiedere qualche momento...</p>
            </div>
          </body>
          </html>
        `;
      }

      // Check if generation failed
      if (project?.generation_status === 'failed') {
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Errore di generazione</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-red-50 min-h-screen flex items-center justify-center">
            <div class="text-center p-8">
              <div class="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-red-800 mb-4">Errore durante la generazione</h1>
              <p class="text-red-600 mb-6">${project?.error_message || 'Si è verificato un errore imprevisto'}</p>
              <button onclick="window.location.reload()" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Riprova
              </button>
            </div>
          </body>
          </html>
        `;
      }

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div id="root">
            <div class="flex items-center justify-center h-screen bg-gray-100">
              <div class="text-center">
                <h1 class="text-2xl font-bold text-gray-800 mb-4">Nessuna preview disponibile</h1>
                <p class="text-gray-600">Prova a generare del codice per vedere l'anteprima</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Get the HTML file for the base structure
    const htmlFile = files.find(f => f.file_path === 'public/index.html');
    const appFile = files.find(f => 
      f.file_path.includes('App.') && 
      (f.file_path.endsWith('.tsx') || f.file_path.endsWith('.jsx'))
    );
    
    if (htmlFile && appFile) {
      // Use the generated HTML and inject the app component
      let html = htmlFile.file_content;
      
      // If HTML doesn't have React setup, add it
      if (!html.includes('react')) {
        const headCloseIndex = html.indexOf('</head>');
        if (headCloseIndex !== -1) {
          const reactScripts = `
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
          `;
          html = html.slice(0, headCloseIndex) + reactScripts + html.slice(headCloseIndex);
        }
      }

      // Add the app component script
      const bodyCloseIndex = html.lastIndexOf('</body>');
      if (bodyCloseIndex !== -1) {
        const appScript = `
          <script type="text/babel">
            const { useState, useEffect, useCallback } = React;
            
            ${appFile.file_content}
            
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
          </script>
        `;
        html = html.slice(0, bodyCloseIndex) + appScript + html.slice(bodyCloseIndex);
      }
      
      return html;
    }

    // Fallback: create HTML from app component only
    const componentFile = appFile || files.find(f => 
      f.file_type === 'typescript' || f.file_type === 'javascript'
    );

    if (!componentFile) {
      // Check if project is still generating
      if (project?.generation_status === 'generating') {
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Generazione in corso...</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @keyframes sparkle {
                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.2); }
              }
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
              }
              .sparkle { animation: sparkle 2s ease-in-out infinite; }
              .float { animation: float 3s ease-in-out infinite; }
              .gradient-bg {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
            </style>
          </head>
          <body class="gradient-bg min-h-screen flex items-center justify-center">
            <div class="text-center text-white p-8">
              <div class="float mb-8">
                <div class="w-24 h-24 mx-auto mb-6 relative">
                  <div class="absolute inset-0 bg-white/20 rounded-full"></div>
                  <div class="absolute inset-2 bg-white/30 rounded-full sparkle"></div>
                  <div class="absolute inset-4 bg-white/40 rounded-full"></div>
                  <div class="absolute inset-6 bg-white/60 rounded-full sparkle" style="animation-delay: 0.5s;"></div>
                  <div class="absolute inset-8 bg-white/80 rounded-full" style="animation-delay: 1s;"></div>
                </div>
              </div>
              <h1 class="text-4xl font-bold mb-4">✨ Stiamo creando qualcosa di magico ✨</h1>
              <p class="text-xl text-white/90 mb-6">La tua applicazione sta prendendo vita...</p>
              <div class="flex justify-center items-center space-x-2">
                <div class="w-3 h-3 bg-white rounded-full sparkle"></div>
                <div class="w-3 h-3 bg-white rounded-full sparkle" style="animation-delay: 0.3s;"></div>
                <div class="w-3 h-3 bg-white rounded-full sparkle" style="animation-delay: 0.6s;"></div>
              </div>
              <p class="text-sm text-white/70 mt-4">Questo potrebbe richiedere qualche momento...</p>
            </div>
          </body>
          </html>
        `;
      }

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div id="root">
            <div class="flex items-center justify-center h-screen bg-gray-100">
              <div class="text-center">
                <h1 class="text-2xl font-bold text-gray-800 mb-4">Generazione in Corso</h1>
                <p class="text-gray-600">Attendere mentre l'applicazione viene generata...</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          const { useState, useEffect, useCallback } = React;
          
          ${componentFile.file_content}
          
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(<App />);
        </script>
      </body>
      </html>
    `;
  }, []);

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
          navigate('/');
          return;
        }

        setProject(projectData);
        setProjectName(projectData.name);

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
              const aiResponse = prompt.ai_response as any;
              const explanation = (typeof aiResponse === 'object' && aiResponse?.explanation) 
                ? aiResponse.explanation 
                : 'Aggiornamento del codice generato.';
              
              messages.push({
                id: `ai-${prompt.id}`,
                type: 'ai',
                content: explanation,
                timestamp: new Date(prompt.created_at)
              });
            }
          });
          setChatMessages(messages);
        }

        // Fetch project files
        await fetchProjectFiles();

        // Load latest snapshot compiled HTML, if available
        const { data: latestSnap, error: snapError } = await supabase
          .from('snapshots')
          .select('state')
          .eq('project_id', projectId)
          .order('version', { ascending: false })
          .limit(1)
          .single();
        if (!snapError && latestSnap?.state?.html) {
          setOptimisticHtml(latestSnap.state.html as string);
          setPreviewKey(prev => prev + 1);
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

    // Set up realtime subscription for project files and status
    const filesSubscription = supabase
      .channel('project_files')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_files',
        filter: `project_id=eq.${projectId}`
      }, () => {
        fetchProjectFiles();
        setPreviewKey(prev => prev + 1);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`
      }, (payload) => {
        // Update project data when generation status changes
        const updatedProject = payload.new as Project;
        setProject(updatedProject);
        setPreviewKey(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(filesSubscription);
    };
  }, [projectId, user, navigate, toast, fetchProjectFiles]);

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
        const aiResponse = result.response as any;
        const explanation = (typeof aiResponse === 'object' && aiResponse?.explanation) 
          ? aiResponse.explanation 
          : 'Codice generato con successo!';
          
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: explanation,
          timestamp: new Date(),
          tokens_used: result.tokensUsed || 0
        };
        setChatMessages(prev => [...prev, aiMessage]);

        toast({
          title: "Codice aggiornato",
          description: "L'applicazione è stata modificata con successo",
        });

        // Optimistic preview update with compiled html (if provided)
        if (result.html) {
          setOptimisticHtml(result.html);
          setPreviewKey(prev => prev + 1);
        }

        // Refresh files after generation
        await fetchProjectFiles();
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
    if (projectFiles.length > 0) {
      const htmlContent = generatePreviewHtml(projectFiles);
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

  const exportAsZip = async () => {
    if (!projectFiles || projectFiles.length === 0) return;
    const zip = new JSZip();
    for (const file of projectFiles) {
      zip.file(file.file_path, file.file_content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (project?.name || 'project').toLowerCase().replace(/[^a-z0-9-_.]+/g, '-');
    a.href = url;
    a.download = `${safeName}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const getCurrentCode = () => {
    if (projectFiles.length === 0) return '';
    
    // Get main app file or first file
    const appFile = projectFiles.find(f => 
      f.file_path.includes('App.') && 
      (f.file_path.endsWith('.tsx') || f.file_path.endsWith('.jsx'))
    ) || projectFiles[0];
    
    return appFile?.file_content || '';
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

  const currentHtml = optimisticHtml || generatePreviewHtml(projectFiles);
  const displayCode = getCurrentCode();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
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
              <DropdownMenuItem onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla home
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

          <Button
            size="sm"
            onClick={exportAsZip}
            className="text-xs"
          >
            Esporta ZIP
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPreview}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left panel - Chat */}
        <div className="w-96 border-r border-border bg-card flex flex-col">
          {/* Chat messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-[280px]",
                    message.type === 'user' ? "ml-auto" : "",
                    message.type === 'system' ? "justify-center" : ""
                  )}
                >
                  {message.type !== 'user' && message.type !== 'system' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm break-words",
                      message.type === 'user'
                        ? "bg-primary text-primary-foreground ml-auto"
                        : message.type === 'system'
                        ? "bg-destructive text-destructive-foreground text-center"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.tokens_used && (
                      <div className="text-xs opacity-70 mt-1">
                        {message.tokens_used} tokens
                      </div>
                    )}
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex gap-3 max-w-[280px]">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">Generazione in corso...</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Chat input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Descrivi le modifiche che vuoi apportare..."
                className="flex-1 min-h-[80px] resize-none"
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
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel - Preview/Code */}
        <div className="flex-1 flex flex-col bg-muted/20">
          {viewMode === 'preview' ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div 
                className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
                style={{ 
                  width: getDeviceWidth(),
                  height: deviceSize === 'mobile' ? '667px' : deviceSize === 'tablet' ? '1024px' : '100%',
                  maxHeight: '100%'
                }}
              >
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  srcDoc={currentHtml}
                  className="w-full h-full border-0"
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <pre className="p-4 text-sm font-mono bg-muted/50 min-h-full">
                <code>{displayCode || 'Nessun codice generato ancora...'}</code>
              </pre>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
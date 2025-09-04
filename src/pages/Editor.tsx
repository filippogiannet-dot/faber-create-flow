import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeEditor from "@/components/CodeEditor";
import LivePreview from "@/components/LivePreview";
import { ArrowLeft, Settings, HelpCircle, Monitor, Code, RotateCcw, ExternalLink, Smartphone, Tablet, Send, Github, Database, ChevronDown, User, Bot, Edit3, Eye, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
interface FileData {
  path: string;
  content: string;
}
const Editor = () => {
  const {
    projectId
  } = useParams<{
    projectId: string;
  }>();
  const navigate = useNavigate();
  const {
    user,
    session,
    loading
  } = useAuth();
  const {
    toast
  } = useToast();
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
  const [currentFile, setCurrentFile] = useState<ProjectFile | null>(null);
  const [sandpackFiles, setSandpackFiles] = useState<FileData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ripristina l'ultimo prompt usato dall'utente
  useEffect(() => {
    const stored = localStorage.getItem('last_prompt');
    if (stored && !newPrompt) setNewPrompt(stored);
  }, []);
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
      const {
        data: files,
        error
      } = await supabase.from('project_files').select('*').eq('project_id', projectId).order('file_path');
      if (error) {
        console.error('Error fetching project files:', error);
        return;
      }
      setProjectFiles(files || []);

      // Convert to Sandpack format and set current file
      const sandpackFilesData: FileData[] = (files || []).map(file => ({
        path: file.file_path.startsWith('/') ? file.file_path : `/${file.file_path}`,
        content: file.file_content
      }));
      setSandpackFiles(sandpackFilesData);

      // Set the first file as current if none selected
      if (!currentFile && files && files.length > 0) {
        setCurrentFile(files[0]);
      }
    } catch (error) {
      console.error('Error fetching project files:', error);
    }
  }, [projectId, currentFile]);

  // Fetch project data and setup realtime subscriptions
  useEffect(() => {
    if (!projectId || !user) return;
    const fetchProjectData = async () => {
      try {
        // Fetch project metadata
        const {
          data: projectData,
          error: projectError
        } = await supabase.from('projects').select('*').eq('id', projectId).eq('owner_id', user.id).single();
        if (projectError) {
          console.error('Project fetch error:', projectError);
          toast({
            variant: "destructive",
            title: "Errore",
            description: "Progetto non trovato"
          });
          navigate('/');
          return;
        }
        setProject(projectData);
        setProjectName(projectData.name);

        // Fetch prompts for chat history
        const {
          data: promptsData,
          error: promptsError
        } = await supabase.from('prompts').select('*').eq('project_id', projectId).order('created_at', {
          ascending: true
        });
        if (promptsError) {
          console.error('Prompts fetch error:', promptsError);
        } else {
          const messages: ChatMessage[] = [];
          promptsData?.forEach(prompt => {
            messages.push({
              id: `user-${prompt.id}`,
              type: 'user',
              content: prompt.prompt_text,
              timestamp: new Date(prompt.created_at),
              tokens_used: prompt.tokens_used
            });
            if (prompt.ai_response) {
              const aiResponse = prompt.ai_response as any;
              messages.push({
                id: `ai-${prompt.id}`,
                type: 'ai',
                content: typeof aiResponse === 'string' ? aiResponse : aiResponse.content || 'Risposta AI non disponibile',
                timestamp: new Date(prompt.created_at)
              });
            }
          });
          setChatMessages(messages);
        }

        // Fetch project files
        await fetchProjectFiles();
      } catch (error) {
        console.error('Error in fetchProjectData:', error);
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Errore nel caricamento del progetto"
        });
      }
    };
    fetchProjectData();

    // Set up real-time subscriptions for project updates
    const projectSubscription = supabase.channel(`project-${projectId}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects',
      filter: `id=eq.${projectId}`
    }, payload => {
      setProject(payload.new as Project);
      const newProject = payload.new as any;
      if (newProject?.generation_status !== 'generating') {
        fetchProjectFiles();
        setPreviewKey(prev => prev + 1);
      }
    }).subscribe();
    const filesSubscription = supabase.channel(`project-files-${projectId}`).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'project_files',
      filter: `project_id=eq.${projectId}`
    }, () => {
      fetchProjectFiles();
      setPreviewKey(prev => prev + 1);
    }).subscribe();
    return () => {
      projectSubscription.unsubscribe();
      filesSubscription.unsubscribe();
    };
  }, [projectId, user, navigate, toast, fetchProjectFiles]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [chatMessages]);
  const handleSaveName = async () => {
    if (!project || !projectName.trim()) {
      setIsEditingName(false);
      return;
    }
    try {
      const {
        error
      } = await supabase.functions.invoke('update-project', {
        body: {
          projectId: project.id,
          updates: {
            name: projectName.trim()
          }
        }
      });
      if (error) throw error;
      setProject(prev => prev ? {
        ...prev,
        name: projectName.trim()
      } : null);
      setIsEditingName(false);
      toast({
        title: "Nome del progetto aggiornato",
        description: "Il nome è stato salvato con successo"
      });
    } catch (error) {
      console.error('Error updating project name:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiornare il nome del progetto"
      });
      setProjectName(project.name);
      setIsEditingName(false);
    }
  };
  const downloadProject = async () => {
    if (!project || !projectFiles.length) return;
    try {
      const zip = new JSZip();
      projectFiles.forEach(file => {
        zip.file(file.file_path, file.file_content);
      });
      const content = await zip.generateAsync({
        type: "blob"
      });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Download completato",
        description: "Il progetto è stato scaricato con successo"
      });
    } catch (error) {
      console.error('Error downloading project:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile scaricare il progetto"
      });
    }
  };
  const handleGenerateApp = async () => {
    if (!newPrompt.trim() || !project || !user || isGenerating) return;

    // Ricorda l'ultimo prompt dell'utente
    localStorage.setItem('last_prompt', newPrompt.trim());

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: newPrompt.trim(),
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setNewPrompt("");

    // Messaggi di progresso in tempo reale
    const timeouts: number[] = [];
    const addSystem = (text: string) => setChatMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      type: 'system',
      content: text,
      timestamp: new Date()
    }]);
    timeouts.push(window.setTimeout(() => addSystem('Inizializzo boilerplate React + Tailwind…'), 100));
    timeouts.push(window.setTimeout(() => addSystem('Aggiungo router e dipendenze UI (react-router-dom, Rewind-UI, Keep React)…'), 700));
    timeouts.push(window.setTimeout(() => addSystem('Genero componenti base: layout, pulsanti, form, tabella, modale…'), 1400));
    timeouts.push(window.setTimeout(() => addSystem('Aggiorno i file e preparo la Live Preview…'), 2100));

    try {
      // Update project status to generating
      await supabase.functions.invoke('update-project', {
        body: {
          projectId: project.id,
          updates: { generation_status: 'generating' }
        }
      });

      // Generate new code
      const { data: generateData, error: generateError } = await supabase.functions.invoke('generate', {
        body: { prompt: userMessage.content }
      });
      if (generateError) throw generateError;

      // Save generated files to database
      if (generateData.files && Array.isArray(generateData.files)) {
        const fileInserts = generateData.files.map((file: any) => ({
          project_id: project.id,
          file_path: file.path.startsWith('/') ? file.path.slice(1) : file.path,
          file_content: file.content,
          file_type:
            file.path.endsWith('.tsx') || file.path.endsWith('.ts') ? 'typescript' :
            file.path.endsWith('.jsx') || file.path.endsWith('.js') ? 'javascript' :
            file.path.endsWith('.html') ? 'html' :
            file.path.endsWith('.css') ? 'css' : 'text'
        }));
        const { error: filesError } = await supabase.from('project_files').upsert(fileInserts, { onConflict: 'project_id,file_path' });
        if (filesError) console.error('Error saving files:', filesError);
      }

      // Add AI result to chat
      setChatMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: 'Codice generato! Aggiorno la preview…',
        timestamp: new Date()
      }]);

      // Save prompt record
      const { error: promptError } = await supabase.from('prompts').insert({
        project_id: project.id,
        user_id: user.id,
        prompt_text: userMessage.content,
        ai_response: { content: 'Codice generato con successo!' },
        tokens_used: 100
      });
      if (promptError) console.error('Error saving prompt:', promptError);

      // Complete status
      await supabase.functions.invoke('update-project', {
        body: {
          projectId: project.id,
          updates: { generation_status: 'completed', error_message: null }
        }
      });
    } catch (error) {
      console.error('Generation error:', error);
      setChatMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'Si è verificato un errore durante la generazione del codice. Riprova.',
        timestamp: new Date()
      }]);
      await supabase.functions.invoke('update-project', {
        body: {
          projectId: project.id,
          updates: { generation_status: 'failed', error_message: error instanceof Error ? error.message : 'Errore sconosciuto' }
        }
      });
      toast({ variant: 'destructive', title: 'Errore di generazione', description: 'Si è verificato un errore. Riprova.' });
    } finally {
      // Clear scheduled progress updates
      timeouts.forEach(t => clearTimeout(t));
      setIsGenerating(false);
    }
  };
  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      default:
        return 'typescript';
    }
  };
  if (loading || !project) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento progetto...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai progetti
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            {isEditingName ? <div className="flex items-center space-x-2">
                <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-8 max-w-xs" autoFocus onBlur={handleSaveName} onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSaveName();
              } else if (e.key === 'Escape') {
                setProjectName(project?.name || '');
                setIsEditingName(false);
              }
            }} />
                <Button size="sm" variant="ghost" onClick={handleSaveName} className="h-8 w-8 p-0">
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div> : <button onClick={() => setIsEditingName(true)} className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors group">
                <h1 className="text-lg font-semibold">{project?.name}</h1>
                <Edit3 className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`/projects/${projectId}`, '_blank')} className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-4 w-4 mr-2" />
              Apri in nuova scheda
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadProject}>
                  <Github className="h-4 w-4 mr-2" />
                  Scarica progetto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Database className="h-4 w-4 mr-2" />
                  Impostazioni account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Layout - Two Columns */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Chat */}
        <div className="w-1/3 border-r bg-card flex flex-col">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4 bg-background">
            {chatMessages.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Inizia una nuova conversazione</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Descrivi cosa vuoi creare e l'AI genererà il codice per te
                </p>
              </div> : <div className="space-y-4">
                {chatMessages.map(message => <div key={message.id} className={cn("flex gap-3 max-w-full", message.type === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium", message.type === 'user' ? "bg-primary" : "bg-secondary")}>
                      {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn("flex-1 px-4 py-3 rounded-lg max-w-[85%]", message.type === 'user' ? "bg-primary text-primary-foreground ml-auto" : "bg-muted")}>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      {message.tokens_used && <div className="text-xs opacity-70 mt-2">
                          Token utilizzati: {message.tokens_used}
                        </div>}
                    </div>
                  </div>)}
                <div ref={messagesEndRef} />
              </div>}
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="Descrivi cosa vuoi creare o modificare..." className="flex-1 min-h-[80px] resize-none" onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleGenerateApp();
              }
            }} disabled={isGenerating} />
              <Button onClick={handleGenerateApp} disabled={!newPrompt.trim() || isGenerating} size="sm" className="self-end">
                {isGenerating ? <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generando...</span>
                  </div> : <>
                    <Send className="h-4 w-4" />
                  </>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
          </p>
          </div>
        </div>

        {/* Right Panel - Code Editor & Preview */}
        <div className="flex-1 flex flex-col">
          {/* Tabs for Preview/Code */}
          <Tabs value={viewMode} onValueChange={value => setViewMode(value as ViewMode)} className="flex-1 flex flex-col">
            <div className="border-b bg-background px-4 py-2">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-48 grid-cols-2">
                  <TabsTrigger value="preview" className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Codice</span>
                  </TabsTrigger>
                </TabsList>
                
                {viewMode === 'preview' && <div className="flex items-center space-x-2">
                    <div className="flex items-center border rounded-md">
                      <Button variant={deviceSize === 'mobile' ? 'default' : 'ghost'} size="sm" onClick={() => setDeviceSize('mobile')} className="rounded-r-none">
                        <Smartphone className="h-4 w-4" />
                      </Button>
                      <Button variant={deviceSize === 'tablet' ? 'default' : 'ghost'} size="sm" onClick={() => setDeviceSize('tablet')} className="rounded-none border-x">
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button variant={deviceSize === 'desktop' ? 'default' : 'ghost'} size="sm" onClick={() => setDeviceSize('desktop')} className="rounded-l-none">
                        <Monitor className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>}
              </div>
            </div>

            <TabsContent value="preview" className="flex-1 m-0 p-4">
              <div className="h-full flex items-center justify-center bg-muted/20 rounded-lg">
                <div className={cn("bg-card rounded-lg shadow-faber-card overflow-hidden border border-border", deviceSize === 'mobile' && "w-[375px] h-[667px]", deviceSize === 'tablet' && "w-[768px] h-[1024px]", deviceSize === 'desktop' && "w-full h-full")}>
                  <LivePreview key={previewKey} files={sandpackFiles} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex-1 m-0 flex">
              {/* File Tree */}
              <div className="w-64 border-r bg-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  File del progetto
                </h3>
                <ScrollArea className="h-full">
                  <div className="space-y-1">
                    {projectFiles.map(file => <button key={file.id} onClick={() => setCurrentFile(file)} className={cn("w-full text-left text-sm px-2 py-1 rounded-md hover:bg-muted/50 transition-colors", currentFile?.id === file.id && "bg-muted text-foreground font-medium")}>
                        {file.file_path}
                      </button>)}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Code Editor */}
              <div className="flex-1">
                {currentFile ? <CodeEditor code={currentFile.file_content} onChange={newCode => {
                // Update the current file content
                setCurrentFile(prev => prev ? {
                  ...prev,
                  file_content: newCode
                } : null);

                // Update sandpack files for live preview
                setSandpackFiles(prev => prev.map(f => f.path === (currentFile.file_path.startsWith('/') ? currentFile.file_path : `/${currentFile.file_path}`) ? {
                  ...f,
                  content: newCode
                } : f));
              }} language={getLanguageFromPath(currentFile.file_path)} /> : <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Seleziona un file per modificarlo</p>
                    </div>
                  </div>}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>;
};
export default Editor;
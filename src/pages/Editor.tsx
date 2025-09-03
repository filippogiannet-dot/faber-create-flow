import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Bot
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          console.error('Error fetching project:', projectError);
          toast({
            title: "Error",
            description: "Failed to load project. Redirecting to dashboard.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        setProject(projectData);
        setProjectName(projectData.name);

        // Fetch chat history from prompts table
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (promptsError) {
          console.error('Error fetching prompts:', promptsError);
        } else {
          // Convert prompts to chat messages (text only, no code)
          const tempMessages: ChatMessage[] = [];
          promptsData.forEach((prompt: any) => {
            // User message
            tempMessages.push({
              id: `user-${prompt.id}`,
              type: 'user',
              content: prompt.prompt_text,
              timestamp: new Date(prompt.created_at)
            });
            
            // AI response (extract explanation only, not code)
            if (prompt.ai_response) {
              try {
                const response = typeof prompt.ai_response === 'string' 
                  ? JSON.parse(prompt.ai_response) 
                  : prompt.ai_response;
                
                // Extract only explanation/content, not the generated code
                const aiContent = response.explanation || response.content || "Code generated successfully!";
                
                tempMessages.push({
                  id: `ai-${prompt.id}`,
                  type: 'ai',
                  content: aiContent,
                  timestamp: new Date(prompt.created_at),
                  tokens_used: prompt.tokens_used
                });
              } catch {
                tempMessages.push({
                  id: `ai-${prompt.id}`,
                  type: 'ai',
                  content: "Code generated successfully!",
                  timestamp: new Date(prompt.created_at),
                  tokens_used: prompt.tokens_used
                });
              }
            }
          });
          setChatMessages(tempMessages);
        }

        // Fetch snapshots and get the latest one for preview
        const { data: snapshotsData, error: snapshotsError } = await supabase
          .from('snapshots')
          .select('*')
          .eq('project_id', projectId)
          .order('version', { ascending: false });

        if (snapshotsError) {
          console.error('Error fetching snapshots:', snapshotsError);
        } else {
          setSnapshots(snapshotsData);
          if (snapshotsData.length > 0) {
            setCurrentSnapshot(snapshotsData[0]); // Latest snapshot
          }
        }

      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load project",
          variant: "destructive"
        });
      }
    };

    fetchProjectData();

    // Setup realtime subscription for snapshots
    const snapshotsChannel = supabase
      .channel('snapshots-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'snapshots',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const newSnapshot = payload.new as Snapshot;
          setSnapshots(prev => [newSnapshot, ...prev]);
          setCurrentSnapshot(newSnapshot);
          setPreviewKey(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(snapshotsChannel);
    };
  }, [projectId, user, navigate, toast]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendPrompt = async () => {
    if (!newPrompt.trim() || !project || !session || isGenerating) return;

    setIsGenerating(true);
    
    // Add user message to chat immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: newPrompt.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const promptText = newPrompt.trim();
    setNewPrompt("");

    try {
      const response = await fetch(`https://rzbtrvceflkvrhphbksx.supabase.co/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          prompt: promptText,
          isInitial: chatMessages.length === 0
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      // Add AI explanation to chat (not the code)
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: data.explanation || data.content || 'Code generated successfully!',
        timestamp: new Date(),
        tokens_used: data.tokensUsed
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Add system message for applied changes
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `Applied changes • Version ${data.version || 'unknown'}`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, systemMessage]);

      toast({
        title: "Success",
        description: `Generated with ${data.tokensUsed || 0} tokens`,
      });

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: `Error: ${error instanceof Error ? error.message : 'Generation failed'}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to generate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateProjectName = async () => {
    if (!project || !projectName.trim()) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: projectName.trim() })
        .eq('id', project.id);

      if (error) throw error;

      setProject(prev => prev ? { ...prev, name: projectName.trim() } : null);
      setIsEditingName(false);
      
      toast({
        title: "Success",
        description: "Project name updated"
      });
    } catch (error) {
      console.error('Error updating project name:', error);
      toast({
        title: "Error",
        description: "Failed to update project name",
        variant: "destructive"
      });
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

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const openInNewTab = () => {
    if (currentSnapshot?.state) {
      try {
        const htmlContent = currentSnapshot.state.html || currentSnapshot.state.generatedCode || currentSnapshot.state;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (error) {
        console.error('Error opening in new tab:', error);
        toast({
          title: "Error",
          description: "Failed to open preview in new tab",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Safely extract HTML/code string from snapshot.state
  const extractHtml = (state: any): string | null => {
    if (!state) return null;
    if (typeof state === 'string') return state;
    if (typeof state.html === 'string') return state.html;
    if (typeof state.generatedCode === 'string') return state.generatedCode;
    if (typeof state.code === 'string') return state.code;
    return null;
  };

  const currentCode = extractHtml(currentSnapshot?.state) ?? '';
  const displayCode = currentCode || (currentSnapshot?.state ? JSON.stringify(currentSnapshot.state, null, 2) : '');

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 flex-shrink-0 z-10">
        {/* Left - Project Menu */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-left flex items-center space-x-2 max-w-xs">
                {isEditingName ? (
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onBlur={handleUpdateProjectName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateProjectName();
                      if (e.key === 'Escape') {
                        setProjectName(project.name);
                        setIsEditingName(false);
                      }
                    }}
                    className="bg-transparent border-none outline-none text-sm font-medium"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="truncate font-medium">{project.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                Rename Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center - View Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('preview')}
          >
            <Monitor className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={viewMode === 'code' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('code')}
          >
            <Code className="w-4 h-4 mr-2" />
            Code
          </Button>
        </div>

        {/* Right - Tools */}
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Smartphone className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setDeviceSize('mobile')}>
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile (375px)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeviceSize('tablet')}>
                <Tablet className="w-4 h-4 mr-2" />
                Tablet (768px)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeviceSize('desktop')}>
                <Monitor className="w-4 h-4 mr-2" />
                Desktop
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Chat (fixed width, independent scroll) */}
        <div className="w-96 border-r border-border flex flex-col bg-card/30 flex-shrink-0">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>Start a conversation to generate your app</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={`space-y-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.type === 'system' ? (
                      <div className="text-center py-2">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {message.content}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className={`inline-flex items-start space-x-2 max-w-[85%] ${
                          message.type === 'user' ? 'flex-row-reverse space-x-reverse ml-auto' : ''
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.type === 'user' ? 'bg-primary' : 'bg-muted'
                          }`}>
                            {message.type === 'user' ? (
                              <User className="w-3 h-3 text-primary-foreground" />
                            ) : (
                              <Bot className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className={`p-3 rounded-lg ${
                            message.type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                            {message.tokens_used && (
                              <div className="text-xs opacity-70 mt-2">
                                {message.tokens_used} tokens
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`text-xs text-muted-foreground ${
                          message.type === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
              {isGenerating && (
                <div className="text-left">
                  <div className="inline-flex items-start space-x-2 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-sm">Generating...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="space-y-2">
              <Textarea
                placeholder="Describe what you want to build..."
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center justify-end">
                <Button 
                  onClick={handleSendPrompt} 
                  disabled={!newPrompt.trim() || isGenerating}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Area - Preview/Code (fills remaining space) */}
        <div className="flex-1 flex flex-col min-w-0">
          {viewMode === 'preview' ? (
            <div className="flex-1 p-6 bg-muted/20 flex items-center justify-center">
              <div 
                className="h-full mx-auto bg-background rounded-lg border border-border overflow-hidden shadow-lg"
                style={{ width: getDeviceWidth(), maxHeight: 'calc(100vh - 120px)' }}
              >
                {currentCode ? (
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    srcDoc={currentCode}
                    className="w-full h-full"
                    title="App Preview"
                    sandbox="allow-scripts allow-forms allow-same-origin"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No preview available</p>
                      <p className="text-sm">Start generating to see your app</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4">
              <div className="h-full bg-card rounded-lg border border-border">
                <div className="h-full p-4">
                  {currentCode ? (
                    <ScrollArea className="h-full">
                      <pre className="text-sm bg-muted/50 p-4 rounded">
                        <code>{currentCode}</code>
                      </pre>
                    </ScrollArea>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No code generated yet</p>
                        <p className="text-sm">Start a conversation to generate code</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
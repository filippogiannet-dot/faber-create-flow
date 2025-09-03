import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Settings, 
  HelpCircle, 
  Monitor, 
  Code, 
  RefreshCw, 
  ExternalLink, 
  Smartphone, 
  Tablet, 
  Maximize, 
  Send, 
  Paperclip,
  Github,
  Database,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  type: 'user' | 'ai';
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

type ViewMode = 'preview' | 'code';
type DeviceSize = 'mobile' | 'tablet' | 'desktop';

const Editor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch project data
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            prompts (
              id,
              prompt_text,
              ai_response,
              tokens_used,
              created_at
            )
          `)
          .eq('id', projectId)
          .eq('owner_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching project:', error);
          toast({
            title: "Error",
            description: "Failed to load project. Redirecting to dashboard.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        setProject(data);
        setProjectName(data.name);
        
        // Convert prompts to messages
        const projectMessages: Message[] = [];
        if (data.prompts && data.prompts.length > 0) {
          data.prompts.forEach((prompt: any) => {
            // Add user message
            projectMessages.push({
              id: `user-${prompt.id}`,
              type: 'user',
              content: prompt.prompt_text,
              timestamp: new Date(prompt.created_at)
            });
            
            // Add AI response if exists
            if (prompt.ai_response) {
              let aiContent = '';
              try {
                const response = typeof prompt.ai_response === 'string' 
                  ? JSON.parse(prompt.ai_response) 
                  : prompt.ai_response;
                aiContent = response.content || response.generatedCode || JSON.stringify(response);
                
                // Update generated code with latest response
                if (response.generatedCode) {
                  setGeneratedCode(response.generatedCode);
                }
              } catch {
                aiContent = prompt.ai_response.toString();
              }
              
              projectMessages.push({
                id: `ai-${prompt.id}`,
                type: 'ai',
                content: aiContent,
                timestamp: new Date(prompt.created_at),
                tokens_used: prompt.tokens_used
              });
            }
          });
        }
        
        setMessages(projectMessages);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load project",
          variant: "destructive"
        });
      }
    };

    fetchProject();
  }, [projectId, user, navigate, toast]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendPrompt = async () => {
    if (!newPrompt.trim() || !project || !session || isGenerating) return;

    setIsGenerating(true);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: newPrompt.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
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
          prompt: newPrompt.trim(),
          isInitial: messages.length === 0
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      // Add AI response message
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: data.content || data.generatedCode || 'Code generated successfully!',
        timestamp: new Date(),
        tokens_used: data.tokensUsed
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update generated code
      if (data.generatedCode) {
        setGeneratedCode(data.generatedCode);
        setPreviewKey(prev => prev + 1); // Force preview refresh
      }

      toast({
        title: "Success",
        description: `Generated with ${data.tokensUsed || 0} tokens`,
      });

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: `Error: ${error instanceof Error ? error.message : 'Generation failed'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
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
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const openInNewTab = () => {
    if (generatedCode) {
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
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
            <RefreshCw className="w-4 h-4" />
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
      <div className="flex-1 flex">
        {/* Sidebar - Chat */}
        <div className="w-96 border-r border-border flex flex-col bg-card/30">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Start a conversation to generate your app</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`space-y-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-[85%] p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {message.content}
                    </pre>
                    {message.tokens_used && (
                      <div className="text-xs opacity-70 mt-2">
                        {message.tokens_used} tokens
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
            {isGenerating && (
              <div className="text-left">
                <div className="inline-block bg-muted p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm">Generating...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
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
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
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

        {/* Main Area - Preview/Code */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'preview' ? (
            <div className="flex-1 p-4 bg-muted/20">
              <div 
                className="h-full mx-auto bg-background rounded-lg border border-border overflow-hidden"
                style={{ width: getDeviceWidth() }}
              >
                {generatedCode ? (
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    srcDoc={generatedCode}
                    className="w-full h-full"
                    title="Preview"
                    sandbox="allow-scripts allow-forms"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No preview available</p>
                      <p className="text-sm">Start generating to see preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4">
              <Card className="h-full">
                <div className="h-full p-4">
                  {generatedCode ? (
                    <pre className="h-full overflow-auto text-sm bg-muted/50 p-4 rounded">
                      <code>{generatedCode}</code>
                    </pre>
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
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
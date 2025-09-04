import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeEditor from "@/components/CodeEditor";
import LivePreview from "@/components/LivePreview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Code, Eye } from "lucide-react";

interface FileData {
  path: string;
  content: string;
}

export default function CodeEditorPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [currentFile, setCurrentFile] = useState<FileData>({
    path: "/App.tsx",
    content: `export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Hello World!</h1>
      <p className="mt-4 text-gray-600">Start coding...</p>
    </div>
  );
}`,
  });
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate', {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;

      if (data && data.files) {
        setFiles(data.files);
        if (data.files.length > 0) {
          setCurrentFile(data.files[0]);
        }
        toast({
          title: "Success",
          description: "Code generated successfully!",
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Error", 
        description: "Failed to generate code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    const updatedFile = { ...currentFile, content: newCode };
    setCurrentFile(updatedFile);
    
    const updatedFiles = files.map(f => 
      f.path === currentFile.path ? updatedFile : f
    );
    setFiles(updatedFiles);
  };

  const selectFile = (file: FileData) => {
    setCurrentFile(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Code Editor & Live Preview</h1>
          <p className="text-muted-foreground">Generate and edit React components with live preview</p>
        </div>

        {/* Prompt Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Generate Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Describe what you want to build... (e.g., 'Create a todo app with add/delete functionality')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
          {/* Code Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Code Editor
              </CardTitle>
              {files.length > 0 && (
                <Tabs value={currentFile.path} onValueChange={(path) => {
                  const file = files.find(f => f.path === path);
                  if (file) selectFile(file);
                }}>
                  <TabsList>
                    {files.map((file) => (
                      <TabsTrigger key={file.path} value={file.path}>
                        {file.path.split('/').pop()}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              <CodeEditor
                code={currentFile.content}
                onChange={handleCodeChange}
                language="typescript"
              />
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              <LivePreview files={files} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
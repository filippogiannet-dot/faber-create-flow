import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Paperclip, Sparkles } from "lucide-react";

const HeroSection = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    // Check if user is logged in (placeholder logic)
    const isLoggedIn = false; // This would come from auth context
    
    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }
    
    // Handle generation logic here
    console.log("Generating with prompt:", prompt);
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Planet Effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[150%] h-[150%] bg-gradient-planet pointer-events-none opacity-60" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">
        {/* Hero Title */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Che cosa vorresti{" "}
            <span className="bg-gradient-to-r from-faber-blue to-faber-blue-light bg-clip-text text-transparent">
              creare oggi?
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Crea app e siti web straordinari chattando con l'AI.
          </p>
        </div>

        {/* Prompt Box */}
        <div className="relative max-w-4xl mx-auto mb-8 animate-scale-in">
          <div className="relative bg-faber-surface border border-border rounded-2xl p-1 shadow-faber-card">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Scrivi la tua idea e la costruiremo insieme..."
              className="min-h-[120px] bg-transparent border-0 text-lg placeholder:text-muted-foreground resize-none focus:ring-0 focus:outline-none p-6"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            
            {/* Bottom Actions */}
            <div className="flex items-center justify-between px-6 pb-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Allega
                </Button>
              </div>
              
              <Button 
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="bg-gradient-button hover:shadow-faber-button transition-all duration-300 transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Genera
              </Button>
            </div>
          </div>
        </div>

        {/* Import Options */}
        <div className="text-center text-muted-foreground">
          <span className="text-sm">oppure importa da</span>
          <div className="flex items-center justify-center space-x-6 mt-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Figma
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
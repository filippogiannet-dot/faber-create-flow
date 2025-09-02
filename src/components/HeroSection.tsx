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
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden flex flex-col items-center justify-center pt-40">
      {/* Enhanced Background Effects */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[150%] h-[150%] bg-gradient-planet pointer-events-none opacity-70" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-accent pointer-events-none opacity-30" />
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none opacity-10" />
      <div className="absolute inset-0 chrome-bg opacity-8 pointer-events-none" />
      
      {/* Floating Orbs for Additional Depth */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-accent/8 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-primary/12 rounded-full blur-2xl animate-pulse delay-1000" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">
        {/* Hero Title */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-hero font-bold chrome-text mb-6 leading-tight">
            Che cosa vorresti{" "}
            <span className="chrome-text">
              creare oggi?
            </span>
          </h1>
          <p className="text-subtitle text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Crea app e siti web straordinari chattando con l'AI.
          </p>
        </div>

        {/* Prompt Box */}
        <div className="relative max-w-4xl mx-auto mb-8 animate-scale-in">
          <div className="relative bg-faber-surface border border-border rounded-2xl p-1 shadow-faber-card hover:shadow-chrome transition-all duration-300">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Scrivi la tua idea e la costruiremo insieme..."
              className="min-h-[100px] bg-transparent border-0 text-body placeholder:text-muted-foreground resize-none focus:ring-0 focus:outline-none p-6"
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
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Allega
                </Button>
              </div>
              
              <Button 
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="text-sm bg-gradient-button hover:shadow-faber-button transition-all duration-300 transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Genera
              </Button>
            </div>
          </div>
        </div>

        {/* Import Options */}
        <div className="text-center mb-16">
          <p className="text-sm text-muted-foreground mb-4">oppure importa da</p>
          <div className="flex items-center justify-center space-x-8">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm-.882 1.471H7.265c-2.476 0-4.49-2.014-4.49-4.49S4.789 0 7.265 0h4.588v8.981zm-4.588-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V1.471H7.265zm4.588 15.019H7.265c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zm-4.588-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117v-6.038H7.265zm8.176 7.509c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49 4.49 2.014 4.49 4.49-2.014 4.49-4.49 4.49zm0-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019 3.019-1.355 3.019-3.019-1.355-3.019-3.019-3.019z"/>
              </svg>
              <span>Figma</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </Button>
          </div>
        </div>

        {/* Italian AI Assistant Section */}
        <div className="text-center max-w-3xl mx-auto animate-fade-in mb-24">
          <h2 className="text-2xl font-semibold chrome-text mb-4">
            Il primo assistente AI italiano per il coding
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Faber è più veloce, più intelligente e più conveniente rispetto agli altri strumenti sul mercato. 
            Progettato specificamente per sviluppatori italiani che vogliono creare applicazioni straordinarie 
            con la potenza dell'intelligenza artificiale.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
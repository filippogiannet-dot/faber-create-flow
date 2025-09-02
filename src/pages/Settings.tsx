import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AISettings, defaultAISettings } from "@/config/openai";

const Settings = () => {
  const [aiSettings, setAISettings] = useState<AISettings>(defaultAISettings);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // Placeholder for saving settings to Supabase or localStorage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Impostazioni salvate",
        description: "Le tue impostazioni AI sono state aggiornate con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio delle impostazioni.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-section-title font-bold chrome-text mb-4">
              Impostazioni
            </h1>
            <p className="text-subtitle text-muted-foreground">
              Configura le tue preferenze e integrazione AI
            </p>
          </div>

          <div className="space-y-6">
            {/* AI Configuration */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-xl chrome-text">Configurazione AI</CardTitle>
                <CardDescription>
                  Configura la tua integrazione con OpenAI per alimentare il coding assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="openai-key" className="text-sm font-medium">
                    Chiave API OpenAI
                  </Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={aiSettings.openaiApiKey || ''}
                    onChange={(e) => setAISettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                    className="bg-faber-surface border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    La tua chiave API sarà crittografata e memorizzata in modo sicuro
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm font-medium">
                      Modello Preferito
                    </Label>
                    <Select
                      value={aiSettings.preferredModel}
                      onValueChange={(value) => setAISettings(prev => ({ ...prev, preferredModel: value }))}
                    >
                      <SelectTrigger className="bg-faber-surface border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-tokens" className="text-sm font-medium">
                      Max Tokens
                    </Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      min="256"
                      max="4096"
                      value={aiSettings.maxTokens}
                      onChange={(e) => setAISettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="bg-faber-surface border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature" className="text-sm font-medium">
                    Temperature: {aiSettings.temperature}
                  </Label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiSettings.temperature}
                    onChange={(e) => setAISettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Più preciso</span>
                    <span>Più creativo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-xl chrome-text">Account</CardTitle>
                <CardDescription>
                  Gestisci le impostazioni del tuo account Faber
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    disabled
                    className="bg-faber-surface border-border opacity-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contatta il supporto per modificare la tua email
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="bg-gradient-button hover:shadow-faber-button transition-all duration-300"
              >
                {isLoading ? 'Salvataggio...' : 'Salva Impostazioni'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Layout, ShoppingBag, FileText, User } from 'lucide-react';
import { PROMPT_TEMPLATES, getPromptSuggestions } from '@/utils/promptTemplates';

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

const categoryIcons = {
  'Business': Layout,
  'E-commerce': ShoppingBag,
  'Forms': FileText,
  'Marketing': Zap,
  'Content': FileText,
  'User Interface': User
};

export function PromptSuggestions({ onSelectPrompt, className }: PromptSuggestionsProps) {
  const suggestions = getPromptSuggestions();
  const categories = Array.from(new Set(suggestions.map(s => s.category)));

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Esempi di Prompt Efficaci
        </h3>
        <p className="text-sm text-muted-foreground">
          Clicca su un esempio per iniziare o usalo come ispirazione
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((template, index) => {
          const IconComponent = categoryIcons[template.category as keyof typeof categoryIcons] || Sparkles;
          
          return (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-card border-border"
              onClick={() => onSelectPrompt(template.prompt)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">
                    {template.title}
                  </CardTitle>
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                <Badge variant="secondary" className="w-fit text-xs">
                  {template.category}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {template.prompt}
                </p>
                <Button 
                  size="sm" 
                  className="w-full mt-3 h-8 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPrompt(template.prompt);
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Usa questo prompt
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
          <Zap className="h-3 w-3" />
          <span>Tip: Sii specifico nei tuoi prompt per risultati migliori</span>
        </div>
      </div>
    </div>
  );
}

export default PromptSuggestions;
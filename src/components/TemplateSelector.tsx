import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { templates, getTemplateByCategory } from '@/lib/ai/templates';
import { Layout, ShoppingBag, FileText, BarChart3, User, Palette } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateSelect: (template: string) => void;
  onPromptSuggestion?: (prompt: string) => void;
  className?: string;
}

const templateCategories = [
  {
    id: 'default',
    name: 'Landing Page',
    description: 'Modern landing page with hero section and features',
    icon: Layout,
    color: 'text-blue-500',
    prompts: [
      'Crea una landing page per una startup di AI',
      'Landing page per app di fitness con pricing',
      'Homepage per agenzia di design'
    ]
  },
  {
    id: 'saas',
    name: 'SaaS Website',
    description: 'Complete SaaS website with pricing and testimonials',
    icon: BarChart3,
    color: 'text-green-500',
    prompts: [
      'Sito SaaS per tool di project management',
      'Landing page per piattaforma di analytics',
      'Website per servizio di email marketing'
    ]
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Analytics dashboard with charts and metrics',
    icon: BarChart3,
    color: 'text-purple-500',
    prompts: [
      'Dashboard admin con grafici e statistiche',
      'Analytics dashboard per e-commerce',
      'Dashboard CRM con lead tracking'
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Product catalog with shopping cart functionality',
    icon: ShoppingBag,
    color: 'text-orange-500',
    prompts: [
      'App di gestione inventario',
      'Sistema di prenotazioni online',
      'Piattaforma di recensioni prodotti'
    ]
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Professional portfolio with projects showcase',
    icon: User,
    color: 'text-indigo-500',
    prompts: [
      'Portfolio per web developer',
      'Portfolio fotografo con galleria',
      'Portfolio designer con case studies'
    ]
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Blog layout with articles and categories',
    icon: FileText,
    color: 'text-pink-500',
    prompts: [
      'Blog tech con articoli e categorie',
      'Blog di cucina con ricette',
      'Blog di viaggio con foto'
    ]
  }
];

export default function TemplateSelector({ 
  selectedTemplate, 
  onTemplateSelect, 
  onPromptSuggestion,
  className 
}: TemplateSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Scegli un Template
        </h3>
        <p className="text-sm text-muted-foreground">
          Seleziona un template come punto di partenza per la tua generazione
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templateCategories.map((template) => {
          const IconComponent = template.icon;
          const isSelected = selectedTemplate === template.id;
          const isHovered = hoveredTemplate === template.id;
          
          return (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-gradient-card border-border ${
                isSelected 
                  ? 'ring-2 ring-primary shadow-faber-glow' 
                  : 'hover:shadow-faber-card'
              }`}
              onClick={() => onTemplateSelect(template.id)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-background/50 ${template.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-foreground">
                        {template.name}
                      </CardTitle>
                      {isSelected && (
                        <Badge variant="default" className="mt-1 text-xs">
                          Selezionato
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {template.description}
                </p>
              </CardHeader>
              
              {(isHovered || isSelected) && onPromptSuggestion && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">Prompt suggeriti:</p>
                    {template.prompts.slice(0, 2).map((prompt, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full text-left justify-start h-auto p-2 text-xs hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPromptSuggestion(prompt);
                        }}
                      >
                        <Palette className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{prompt}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">
              Anteprima Template: {templateCategories.find(t => t.id === selectedTemplate)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <pre className="text-xs text-muted-foreground overflow-x-auto">
                <code>
                  {templates[selectedTemplate]?.slice(0, 300)}...
                </code>
              </pre>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Template pronto per la personalizzazione
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const template = templateCategories.find(t => t.id === selectedTemplate);
                  if (template && onPromptSuggestion) {
                    onPromptSuggestion(template.prompts[0]);
                  }
                }}
              >
                Usa Prompt Esempio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
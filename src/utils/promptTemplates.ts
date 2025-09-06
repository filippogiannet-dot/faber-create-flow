export const PROMPT_TEMPLATES = {
  dashboard: {
    title: "Dashboard Admin",
    prompt: "Crea una dashboard admin completa con sidebar, header, cards statistiche e grafici. Usa colori blu e design moderno con Tailwind CSS.",
    category: "Business"
  },
  
  ecommerce: {
    title: "E-commerce Product Card",
    prompt: "Genera una card prodotto per e-commerce con immagine, titolo, descrizione, prezzo e pulsanti aggiungi al carrello. Stile moderno e responsive.",
    category: "E-commerce"
  },
  
  form: {
    title: "Form di Login",
    prompt: "Crea un form di login elegante con email, password, pulsante 'Accedi' e link 'Password dimenticata'. Design moderno con validazione.",
    category: "Forms"
  },
  
  landing: {
    title: "Landing Page",
    prompt: "Genera una landing page moderna con hero section, features, testimonials e CTA. Design accattivante e responsive con Tailwind.",
    category: "Marketing"
  },
  
  blog: {
    title: "Blog Post Card",
    prompt: "Crea una card per blog post con immagine, titolo, excerpt, data e autore. Design pulito e leggibile con hover effects.",
    category: "Content"
  },
  
  profile: {
    title: "User Profile",
    prompt: "Genera un componente profilo utente con avatar, informazioni personali, statistiche e pulsanti azione. Design professionale.",
    category: "User Interface"
  }
};

export const ENHANCEMENT_PATTERNS = {
  responsive: "Assicurati che il design sia completamente responsive con breakpoints mobile, tablet e desktop.",
  
  accessibility: "Includi attributi ARIA, semantic HTML e supporto per screen reader. Gestisci focus e navigazione da tastiera.",
  
  animations: "Aggiungi micro-animazioni eleganti con Tailwind (hover, focus, transitions) per migliorare l'UX.",
  
  darkMode: "Implementa supporto per dark mode usando le variabili CSS del design system.",
  
  performance: "Ottimizza per performance con lazy loading, memoization e gestione efficiente dello state.",
  
  validation: "Includi validazione completa dei form con messaggi di errore user-friendly e feedback visivo."
};

export function enhancePromptWithPatterns(prompt: string, patterns: string[] = []): string {
  let enhanced = prompt;
  
  patterns.forEach(pattern => {
    if (ENHANCEMENT_PATTERNS[pattern as keyof typeof ENHANCEMENT_PATTERNS]) {
      enhanced += `\n\n${ENHANCEMENT_PATTERNS[pattern as keyof typeof ENHANCEMENT_PATTERNS]}`;
    }
  });
  
  return enhanced;
}

export function getPromptSuggestions(category?: string): typeof PROMPT_TEMPLATES[keyof typeof PROMPT_TEMPLATES][] {
  const templates = Object.values(PROMPT_TEMPLATES);
  
  if (category) {
    return templates.filter(t => t.category === category);
  }
  
  return templates;
}
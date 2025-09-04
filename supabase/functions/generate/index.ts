import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = `You are an expert React developer. Generate clean, functional React components based on the user's prompt.

IMPORTANT: Always return a valid JSON response in this exact format:
{
  "files": [
    {
      "path": "/App.tsx",
      "content": "// React component code here"
    }
  ]
}

Rules:
- Use TypeScript and modern React (function components with hooks)
- Use Tailwind CSS utility classes for styling
- Prefer UI components from @rewind-ui/core. If something is missing, you may use keep-react as a fallback
- When using UI libraries, actually render basic components (Button, Input, Card, Table, Modal) so the preview is complete
- Include react-router-dom when you add routes and show a simple Router setup (BrowserRouter + Routes) in /App.tsx
- Always include at least: /index.html (with <script src=\"https://cdn.tailwindcss.com\"></script>), /main.tsx, and /App.tsx so the app runs in the sandbox
- Make components responsive and accessible
- Include proper TypeScript types
- Keep components clean and well-structured
- For complex apps, split into multiple files (e.g., /src/CustomerList.tsx, /src/AddCustomerForm.tsx)
- Include boilerplate files when needed

Example imports for UI components:
import { Button, Input, Modal, Table, Card, Badge } from '@rewind-ui/core';
// or
import { Button, Input, Modal, Table, Card, Badge } from 'keep-react';

Generate practical, working code that demonstrates the requested functionality with complete UI components and routes when appropriate.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Try to parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(generatedContent);
    } catch (parseError) {
      // If parsing fails, wrap the content as a single file
      parsedResponse = {
        files: [
          {
            path: "/App.tsx",
            content: generatedContent
          }
        ]
      };
    }

    console.log('Generated code successfully:', { 
      promptLength: prompt.length,
      filesCount: parsedResponse.files?.length || 0
    });

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate code',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
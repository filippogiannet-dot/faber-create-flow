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

    const systemPrompt = `You are an expert React + TypeScript generator. Output ONLY strict JSON (no prose, no code fences), in this exact shape:
{
  "files": [
    { "path": "/index.html", "content": "..." },
    { "path": "/src/main.tsx", "content": "..." },
    { "path": "/src/App.tsx", "content": "..." }
  ]
}

Strong rules:
- Build a working Vite-like React 18 + TS app with Tailwind and react-router-dom v6.
- /index.html MUST include <script src=\"https://cdn.tailwindcss.com\"></script> and a <div id=\"root\"></div>.
- /src/main.tsx MUST render BrowserRouter + App (Routes inside App).
- /src/App.tsx MUST:
  - Use a full-screen responsive layout (min-h-screen, flex, fills viewport).
  - Include a basic shell (header/nav + main content) and at least one route.
  - Render real UI using @rewind-ui/core (preferred) or keep-react (fallback). DO NOT use shadcn or Next.js.
- All imports must be relative (e.g. "./components/Header") – DO NOT use path aliases like "@/...".
- Place components under /src/components and use JSX with valid imports (no placeholders).
- Keep code compilable (TS strict), responsive, and avoid server-only APIs.
- Do not include explanations or backticks; return JSON only.`;
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
        temperature: 0.4,
        max_tokens: 2200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    // Robust JSON extraction (handles fenced blocks and extra prose)
    function tryParseJson(input: string): any | null {
      const candidates: string[] = [];
      const fenceRegex = /```(?:json)?\n([\s\S]*?)```/gi;
      let m: RegExpExecArray | null;
      while ((m = fenceRegex.exec(input)) !== null) {
        candidates.push(m[1]);
      }
      // If no fenced code, add whole content
      if (candidates.length === 0) candidates.push(input);

      // Also try to extract an object that contains a "files" array
      const objectWithFiles = input.match(/\{[\s\S]*?"files"[\s\S]*?\}/);
      if (objectWithFiles) candidates.unshift(objectWithFiles[0]);

      for (const c of candidates) {
        try {
          const parsed = JSON.parse(c);
          if (parsed && Array.isArray(parsed.files)) return parsed;
        } catch (_) { /* continue */ }
      }
      return null;
    }

    let parsedResponse = tryParseJson(raw);

    // Build a safe default app if parsing failed
    if (!parsedResponse) {
      parsedResponse = {
        files: [
          {
            path: '/index.html',
            content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>App</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>`
          },
          {
            path: '/src/App.tsx',
            content: `import React from 'react';\nexport default function App() {\n  return (\n    <div className=\"min-h-screen grid place-items-center bg-black text-white\">\n      <div className=\"text-center space-y-4 p-8\">\n        <h1 className=\"text-2xl font-semibold\">Generation parsing failed</h1>\n        <p className=\"text-gray-400\">Ho caricato un'app di fallback per mantenere la preview attiva.</p>\n      </div>\n    </div>\n  );\n}`
          },
          {
            path: '/src/main.tsx',
            content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`
          }
        ]
      };
    }

    // Normalize file paths and ensure required files
    const files = (parsedResponse.files as Array<{ path: string; content: string }> )
      .filter(f => f && typeof f.path === 'string' && typeof f.content === 'string')
      .map(f => {
        let path = f.path.startsWith('/') ? f.path : '/' + f.path;
        // Move runtime files under /src
        if (path.toLowerCase() === '/app.tsx') path = '/src/App.tsx';
        if (path.toLowerCase() === '/main.tsx') path = '/src/main.tsx';
        return { path, content: f.content };
      });

    const hasIndex = files.some(f => f.path === '/index.html');
    const hasApp = files.some(f => f.path.toLowerCase() === '/src/app.tsx');
    const hasMain = files.some(f => f.path.toLowerCase() === '/src/main.tsx');

    if (!hasIndex) {
      files.unshift({
        path: '/index.html',
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>App</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body>\n  <div id=\"root\"></div>\n</body>\n</html>`
      });
    }

    if (!hasApp) {
      files.push({
        path: '/src/App.tsx',
        content: `import React from 'react';\nexport default function App() {\n  return (\n    <div className=\"min-h-screen grid place-items-center bg-black text-white\">\n      <h1 className=\"text-2xl\">Hello from fallback App</h1>\n    </div>\n  );\n}`
      });
    }

    if (!hasMain) {
      files.push({
        path: '/src/main.tsx',
        content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`
      });
    }

    const normalized = { files };

    console.log('Generated code successfully:', { 
      promptLength: prompt.length,
      filesCount: normalized.files.length
    });

    return new Response(JSON.stringify(normalized), {
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
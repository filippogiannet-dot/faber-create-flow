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

    const systemPrompt = `You are an expert React + TypeScript application architect. Generate complete, production-ready applications following AppSpec v1 format.

Output ONLY strict JSON in this exact AppSpec v1 shape:
{
  "app_meta": {
    "name": "string",
    "description": "string", 
    "design_system": "shadcn|mui|mantine|chakra|headless+radix",
    "theme": "light|dark|system"
  },
  "dependencies": {
    "prod": { "package": "exact-version" },
    "dev": { "package": "exact-version" }
  },
  "routes": [
    { "path": "/", "component": "Home" },
    { "path": "/about", "component": "About" }
  ],
  "files": [
    {
      "path": "/index.html",
      "language": "html", 
      "content": "<!DOCTYPE html>..."
    },
    {
      "path": "/src/App.tsx",
      "language": "tsx",
      "content": "import React from 'react'..."
    }
  ]
}

CRITICAL ARCHITECTURE RULES:
- Generate COMPLETE, FUNCTIONAL applications matching user requirements
- Select design_system intelligently:
  * dashboard/B2B/CRM/admin → "shadcn" 
  * material/android/google → "mui"
  * marketing/landing → "shadcn" 
  * mobile-first/modern → "mantine"
- Include ALL necessary dependencies with exact versions:
  * Core: react@18.3.1, react-dom@18.3.1, react-router-dom@6.30.1
  * TypeScript: typescript@5.0.0, @types/react@18.3.0, @types/react-dom@18.3.0  
  * Styling: tailwindcss@3.4.0 (always), shadcn components when selected
  * State: zustand@4.5.0 for client state
  * Forms: react-hook-form@7.53.0, zod@3.22.0, @hookform/resolvers@3.9.0
  * Icons: lucide-react@0.462.0
  * Animation: framer-motion@11.0.0 when needed
- Build responsive, accessible applications with proper routing
- Use semantic HTML, TypeScript interfaces, proper error handling
- Include realistic content and data, not placeholders
- NEVER generate "Hello World" - create full functional applications
- All imports relative paths (./components/Header) - NO path aliases
- Return only JSON, no explanations or markdown`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    // Enhanced JSON parsing for AppSpec v1 format
    function tryParseAppSpec(input: string): any | null {
      const candidates: string[] = [];
      const fenceRegex = /```(?:json)?\n([\s\S]*?)```/gi;
      let m: RegExpExecArray | null;
      while ((m = fenceRegex.exec(input)) !== null) {
        candidates.push(m[1]);
      }
      if (candidates.length === 0) candidates.push(input);

      // Try to extract AppSpec object 
      const appSpecRegex = /\{[\s\S]*?"app_meta"[\s\S]*?\}/;
      const appSpecMatch = input.match(appSpecRegex);
      if (appSpecMatch) candidates.unshift(appSpecMatch[0]);

      for (const c of candidates) {
        try {
          const parsed = JSON.parse(c);
          // Validate AppSpec v1 structure
          if (parsed && parsed.app_meta && Array.isArray(parsed.files)) {
            return parsed;
          }
          // Fallback: convert old format to new
          if (parsed && Array.isArray(parsed.files)) {
            return {
              app_meta: {
                name: "Generated App",
                description: "AI Generated Application", 
                design_system: "shadcn",
                theme: "system"
              },
              dependencies: {
                prod: {
                  "react": "18.3.1",
                  "react-dom": "18.3.1", 
                  "react-router-dom": "6.30.1"
                }
              },
              routes: [],
              files: parsed.files
            };
          }
        } catch (_) { /* continue */ }
      }
      return null;
    }

    let parsedResponse = tryParseAppSpec(raw);

    // Build a comprehensive default app if parsing failed
    if (!parsedResponse) {
      parsedResponse = {
        files: [
          {
            path: '/index.html',
            content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Generated App</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>`
          },
          {
            path: '/src/App.tsx',
            content: `import React from 'react';\nimport { Routes, Route } from 'react-router-dom';\nimport Navigation from './components/Navigation';\nimport Home from './components/Home';\nimport About from './components/About';\nimport Contact from './components/Contact';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-gray-50">\n      <Navigation />\n      <main className="container mx-auto px-4 py-8">\n        <Routes>\n          <Route path="/" element={<Home />} />\n          <Route path="/about" element={<About />} />\n          <Route path="/contact" element={<Contact />} />\n        </Routes>\n      </main>\n    </div>\n  );\n}`
          },
          {
            path: '/src/main.tsx',
            content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { BrowserRouter } from 'react-router-dom';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <BrowserRouter>\n      <App />\n    </BrowserRouter>\n  </React.StrictMode>\n);`
          },
          {
            path: '/src/components/Navigation.tsx',
            content: `import React from 'react';\nimport { Link, useLocation } from 'react-router-dom';\n\nexport default function Navigation() {\n  const location = useLocation();\n  \n  return (\n    <nav className="bg-white shadow-lg">\n      <div className="container mx-auto px-4">\n        <div className="flex justify-between items-center py-4">\n          <Link to="/" className="text-2xl font-bold text-blue-600">MyApp</Link>\n          <div className="flex space-x-6">\n            <Link to="/" className={\`px-3 py-2 rounded-md transition-colors \${location.pathname === '/' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'}\`}>Home</Link>\n            <Link to="/about" className={\`px-3 py-2 rounded-md transition-colors \${location.pathname === '/about' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'}\`}>About</Link>\n            <Link to="/contact" className={\`px-3 py-2 rounded-md transition-colors \${location.pathname === '/contact' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'}\`}>Contact</Link>\n          </div>\n        </div>\n      </div>\n    </nav>\n  );\n}`
          },
          {
            path: '/src/components/Home.tsx',
            content: `import React from 'react';\n\nexport default function Home() {\n  return (\n    <div className="text-center">\n      <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to MyApp</h1>\n      <p className="text-xl text-gray-600 mb-8">A modern React application built with TypeScript and Tailwind CSS</p>\n      <div className="grid md:grid-cols-3 gap-8 mt-12">\n        <div className="bg-white p-6 rounded-lg shadow-md">\n          <h3 className="text-xl font-semibold mb-3">Fast</h3>\n          <p className="text-gray-600">Built with modern React and optimized for performance</p>\n        </div>\n        <div className="bg-white p-6 rounded-lg shadow-md">\n          <h3 className="text-xl font-semibold mb-3">Responsive</h3>\n          <p className="text-gray-600">Works beautifully on all devices and screen sizes</p>\n        </div>\n        <div className="bg-white p-6 rounded-lg shadow-md">\n          <h3 className="text-xl font-semibold mb-3">Modern</h3>\n          <p className="text-gray-600">Uses the latest web technologies and best practices</p>\n        </div>\n      </div>\n    </div>\n  );\n}`
          },
          {
            path: '/src/components/About.tsx',
            content: `import React from 'react';\n\nexport default function About() {\n  return (\n    <div className="max-w-4xl mx-auto">\n      <h1 className="text-4xl font-bold text-gray-800 mb-6">About Us</h1>\n      <div className="bg-white p-8 rounded-lg shadow-md">\n        <p className="text-lg text-gray-600 mb-6">\n          We are a team of passionate developers dedicated to creating amazing web applications.\n          Our mission is to build software that makes a difference in people's lives.\n        </p>\n        <div className="grid md:grid-cols-2 gap-8">\n          <div>\n            <h3 className="text-2xl font-semibold mb-4">Our Vision</h3>\n            <p className="text-gray-600">\n              To empower businesses and individuals with cutting-edge technology solutions\n              that drive innovation and growth.\n            </p>\n          </div>\n          <div>\n            <h3 className="text-2xl font-semibold mb-4">Our Values</h3>\n            <ul className="text-gray-600 space-y-2">\n              <li>• Innovation and creativity</li>\n              <li>• Quality and excellence</li>\n              <li>• Customer satisfaction</li>\n              <li>• Continuous learning</li>\n            </ul>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}`
          },
          {
            path: '/src/components/Contact.tsx',
            content: `import React, { useState } from 'react';\n\nexport default function Contact() {\n  const [formData, setFormData] = useState({ name: '', email: '', message: '' });\n  const [submitted, setSubmitted] = useState(false);\n\n  const handleSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    setSubmitted(true);\n    // Simulate form submission\n    setTimeout(() => setSubmitted(false), 3000);\n  };\n\n  return (\n    <div className="max-w-2xl mx-auto">\n      <h1 className="text-4xl font-bold text-gray-800 mb-6">Contact Us</h1>\n      {submitted ? (\n        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">\n          Thank you for your message! We'll get back to you soon.\n        </div>\n      ) : (\n        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">\n          <div className="mb-6">\n            <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>\n            <input\n              type="text"\n              required\n              value={formData.name}\n              onChange={(e) => setFormData({...formData, name: e.target.value})}\n              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"\n            />\n          </div>\n          <div className="mb-6">\n            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>\n            <input\n              type="email"\n              required\n              value={formData.email}\n              onChange={(e) => setFormData({...formData, email: e.target.value})}\n              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"\n            />\n          </div>\n          <div className="mb-6">\n            <label className="block text-gray-700 text-sm font-bold mb-2">Message</label>\n            <textarea\n              required\n              rows={4}\n              value={formData.message}\n              onChange={(e) => setFormData({...formData, message: e.target.value})}\n              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"\n            />\n          </div>\n          <button\n            type="submit"\n            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"\n          >\n            Send Message\n          </button>\n        </form>\n      )}\n    </div>\n  );\n}`
          }
        ]
      };
    }

    // Extract files from AppSpec format
    const files = (parsedResponse.files as Array<{ path: string; content: string; language?: string }> )
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

    const normalized = { 
      files,
      meta: parsedResponse.app_meta || { name: "Generated App", description: "AI Generated", design_system: "shadcn" }
    };

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
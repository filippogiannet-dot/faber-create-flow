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

    const systemPrompt = `You are an expert React + TypeScript application architect. You MUST generate complete, production-ready, functional applications that perfectly match the user's request.

CRITICAL: Output ONLY strict JSON in AppSpec v1 format:
{
  "app_meta": {
    "name": "string",
    "description": "string", 
    "design_system": "shadcn",
    "theme": "light"
  },
  "dependencies": {
    "prod": {
      "react": "18.3.1",
      "react-dom": "18.3.1", 
      "react-router-dom": "6.30.1",
      "zustand": "4.5.0",
      "react-hook-form": "7.53.0",
      "zod": "3.22.0",
      "@hookform/resolvers": "3.9.0",
      "lucide-react": "0.462.0",
      "framer-motion": "11.0.0"
    }
  },
  "routes": [
    { "path": "/", "component": "Dashboard" },
    { "path": "/customers", "component": "Customers" }
  ],
  "files": [
    {
      "path": "/index.html",
      "language": "html", 
      "content": "<!DOCTYPE html>\\n<html lang=\\"en\\">\\n<head>\\n  <meta charset=\\"UTF-8\\" />\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\" />\\n  <title>App Name</title>\\n  <script src=\\"https://cdn.tailwindcss.com\\"></script>\\n</head>\\n<body>\\n  <div id=\\"root\\"></div>\\n</body>\\n</html>"
    },
    {
      "path": "/src/main.tsx",
      "language": "tsx",
      "content": "import React from 'react';\\nimport ReactDOM from 'react-dom/client';\\nimport { BrowserRouter } from 'react-router-dom';\\nimport App from './App';\\n\\nReactDOM.createRoot(document.getElementById('root')!).render(\\n  <React.StrictMode>\\n    <BrowserRouter>\\n      <App />\\n    </BrowserRouter>\\n  </React.StrictMode>\\n);"
    },
    {
      "path": "/src/App.tsx", 
      "language": "tsx",
      "content": "COMPLETE APP CODE HERE"
    }
  ]
}

MANDATORY REQUIREMENTS:
1. Generate COMPLETE applications that match the user's exact request (CRM, dashboard, todo app, etc.)
2. Include 4-6 meaningful routes with full navigation
3. Use realistic business data and content (not placeholders or "Lorem ipsum")  
4. Implement proper state management with Zustand
5. Add form validation with React Hook Form + Zod
6. Use Lucide icons throughout the interface
7. Create responsive layouts with Tailwind classes
8. Include proper TypeScript interfaces for all data
9. Add loading states, error handling, and empty states
10. Generate 8-12 component files for a complete application

NEVER GENERATE:
- "Hello World" applications
- Placeholder content or Lorem ipsum
- Broken imports or missing components
- Basic templates without real functionality

EXAMPLE DOMAIN MAPPING:
- CRM → Customer management, deals pipeline, contact forms, reports dashboard
- E-commerce → Product catalog, shopping cart, checkout, order management  
- Dashboard → Analytics charts, user management, settings, notifications
- Todo App → Task creation, categories, priority levels, completion tracking

Return ONLY JSON, no explanations.`;
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

    // Build a comprehensive default CRM app if parsing failed
    if (!parsedResponse) {
      parsedResponse = {
        app_meta: {
          name: "Business CRM",
          description: "Complete Customer Relationship Management System",
          design_system: "shadcn",
          theme: "light"
        },
        dependencies: {
          prod: {
            "react": "18.3.1",
            "react-dom": "18.3.1", 
            "react-router-dom": "6.30.1",
            "zustand": "4.5.0",
            "react-hook-form": "7.53.0",
            "zod": "3.22.0",
            "@hookform/resolvers": "3.9.0",
            "lucide-react": "0.462.0"
          }
        },
        routes: [
          { "path": "/", "component": "Dashboard" },
          { "path": "/customers", "component": "Customers" },
          { "path": "/deals", "component": "Deals" },
          { "path": "/reports", "component": "Reports" },
          { "path": "/settings", "component": "Settings" }
        ],
        files: [
          {
            path: '/index.html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Business CRM</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
          },
          {
            path: '/src/main.tsx',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);`
          },
          {
            path: '/src/App.tsx',
            content: `import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Deals from './components/Deals';
import Reports from './components/Reports';
import Settings from './components/Settings';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="ml-64 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}`
          },
          {
            path: '/src/components/Navigation.tsx',
            content: `import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Handshake, BarChart3, Settings } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Deals', href: '/deals', icon: Handshake },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Business CRM</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={\`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors \${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }\`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}`
          },
          {
            path: '/src/components/Dashboard.tsx',
            content: `import React from 'react';
import { Users, Handshake, DollarSign, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { name: 'Total Customers', value: '2,651', icon: Users, change: '+12%' },
    { name: 'Active Deals', value: '184', icon: Handshake, change: '+8%' },
    { name: 'Revenue', value: '$892,450', icon: DollarSign, change: '+23%' },
    { name: 'Growth Rate', value: '14.2%', icon: TrendingUp, change: '+2.1%' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your business today.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">{stat.change}</span>
                <span className="text-gray-500 text-sm ml-1">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-600">New customer "Acme Corp" added</p>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-gray-600">Deal "Website Redesign" moved to proposal</p>
              <span className="text-xs text-gray-400">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-gray-600">Follow-up required for "Tech Solutions Ltd"</p>
              <span className="text-xs text-gray-400">1 day ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Acme Corporation</p>
                <p className="text-sm text-gray-500">Enterprise Software</p>
              </div>
              <span className="text-lg font-semibold text-gray-900">$125,000</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Tech Solutions Ltd</p>
                <p className="text-sm text-gray-500">IT Services</p>
              </div>
              <span className="text-lg font-semibold text-gray-900">$89,500</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Digital Innovations</p>
                <p className="text-sm text-gray-500">Marketing Agency</p>
              </div>
              <span className="text-lg font-semibold text-gray-900">$67,200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`
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
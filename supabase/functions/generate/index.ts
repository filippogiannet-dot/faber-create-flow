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

    // Pattern-breaking system prompt focusing on SINGLE React component generation
    const RANDOM_SEED = Math.random().toString(36).substring(7);
    const SYSTEM_PROMPT = `🔥 CRITICAL INSTRUCTIONS - READ CAREFULLY 🔥

You are a MODERN REACT DEVELOPER, not an HTML developer. You MUST follow these rules EXACTLY:

❌ ABSOLUTELY FORBIDDEN - NEVER GENERATE:
- ANY HTML files (index.html, etc.)
- Multi-file projects with file structures
- CRM applications, dashboards, or business management tools
- Customer management, deals, reports, or settings pages
- Any project with Navigation.tsx, Dashboard.tsx, Customers.tsx components
- The word "CRM", "Customer", "Dashboard", "Management" anywhere in your code

✅ YOU MUST GENERATE:
- ONE SINGLE React functional component
- Modern, creative, FUN applications
- Something completely different every time
- Interactive and engaging user experiences

🎯 GENERATION RULES:
1. Generate EXACTLY ONE React component file
2. Component must be named "App" and exported as default
3. Use ONLY React hooks (useState, useEffect) - NO class components
4. Style with Tailwind CSS utility classes
5. Make it interactive with buttons, forms, animations
6. Create something UNIQUE and CREATIVE each time

🎨 REQUIRED OUTPUT FORMAT:
\`\`\`javascript
import React, { useState, useEffect } from 'react';

const App = () => {
  // Your creative component logic here
  const [state, setState] = useState();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Your unique, creative content here */}
      </div>
    </div>
  );
};

export default App;
\`\`\`

🎲 RANDOMIZATION REQUIREMENT:
Add this random number to your component: ${RANDOM_SEED}
Use this number somewhere in your component to ensure uniqueness.

USER REQUEST: {prompt}

Generate ONE creative React component that fulfills this request. BE CREATIVE AND UNIQUE!`;

    // Validation to prevent CRM/HTML pattern regressions
    const validateGeneration = (generatedCode: string): boolean => {
      const forbiddenPatterns = [
        'index.html', 'main.tsx', '/src/', 'Navigation.tsx', 'Dashboard.tsx', 'Customers.tsx',
        'Deals.tsx', 'Reports.tsx', 'Settings.tsx', 'CRM', 'Customer', 'Management', 'Dashboard', 'Business', 'Sales'
      ];
      const requiredPatterns = ['import React', 'const App', 'export default', 'useState', 'className'];
      for (const p of forbiddenPatterns) {
        if (generatedCode.toLowerCase().includes(p.toLowerCase())) {
          console.log(`❌ REJECTED: Contains forbidden pattern "${p}"`);
          return false;
        }
      }
      for (const p of requiredPatterns) {
        if (!generatedCode.includes(p)) {
          console.log(`❌ REJECTED: Missing required pattern "${p}"`);
          return false;
        }
      }
      // Ensure it's a single file-like output (not embedding multiple files)
      const fileCount = (generatedCode.match(/\.(tsx|html|js)/g) || []).length;
      if (fileCount > 1) {
        console.log(`❌ REJECTED: Multiple files detected (${fileCount})`);
        return false;
      }
      console.log('✅ VALIDATED: Code passes all checks');
      return true;
    };

    // Variety injection templates
    const VARIETY_TEMPLATES = {
      game: {
        concepts: ['tic-tac-toe', 'memory game', 'word guessing', 'number puzzle', 'rock paper scissors'],
        colors: ['from-green-400 to-blue-500', 'from-purple-400 to-pink-500', 'from-yellow-400 to-red-500']
      },
      tool: {
        concepts: ['color picker', 'unit converter', 'password generator', 'qr code generator', 'text formatter'],
        colors: ['from-indigo-400 to-purple-600', 'from-teal-400 to-cyan-600', 'from-orange-400 to-pink-500']
      },
      creative: {
        concepts: ['drawing app', 'photo filters', 'music visualizer', 'pattern generator', 'gradient maker'],
        colors: ['from-pink-400 to-purple-600', 'from-blue-400 to-indigo-600', 'from-green-400 to-teal-600']
      }
    } as const;

    const injectVariety = (basePrompt: string): string => {
      const categories = Object.keys(VARIETY_TEMPLATES) as Array<keyof typeof VARIETY_TEMPLATES>;
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const template = VARIETY_TEMPLATES[randomCategory];
      const randomConcept = template.concepts[Math.floor(Math.random() * template.concepts.length)];
      const randomColor = template.colors[Math.floor(Math.random() * template.colors.length)];
      return `${basePrompt}

VARIETY INJECTION:
- Inspiration concept: ${randomConcept}
- Color scheme: bg-gradient-to-br ${randomColor}
- Make it unique and different from any business/CRM application
- Random seed: ${Math.random().toString(36).substring(7)}`;
    };

    const getFallbackComponent = (userPrompt: string): string => {
      const randomId = Math.random().toString(36).substring(7);
      return `
import React, { useState } from 'react';

const App = () => {
  const [clicks, setClicks] = useState(0);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 p-8 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6">
          Custom App for: ${userPrompt}
        </h1>
        <div className="mb-6">
          <p className="text-lg text-white/80 mb-4">Clicks: {clicks}</p>
          <button 
            onClick={() => setClicks(clicks + 1)}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-white/30"
          >
            Click Me!
          </button>
        </div>
        <p className="text-sm text-white/60">ID: ${randomId}</p>
      </div>
    </div>
  );
};

export default App;
`;
    };

    // Model selection + parameter compatibility
    const selectModel = () => Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
    const isNewerModel = (m: string) => /^(gpt-5|gpt-4\.1|o3|o4)/.test(m);

    // Core generation loop with validation and retries
    const generateWithValidation = async (baseUserPrompt: string, maxAttempts = 5): Promise<string> => {
      const model = selectModel();
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔄 Generation attempt ${attempt}/${maxAttempts}`);
        const varietyPrompts = [
          'Create something completely different from a business application.',
          'Build a fun, interactive experience.',
          'Make a creative tool or game.',
          'Design something colorful and engaging.',
          'Build an entertainment or utility app.'
        ];
        const randomVariety = varietyPrompts[Math.floor(Math.random() * varietyPrompts.length)];
        const enhancedPrompt = injectVariety(`${baseUserPrompt}\n\nIMPORTANT: ${randomVariety} Random ID: ${Math.random()}`);

        try {
          const body: any = {
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT.replace('{prompt}', enhancedPrompt) }
            ],
          };
          if (isNewerModel(model)) {
            body.max_completion_tokens = 3000;
            // temperature unsupported on newer models
          } else {
            body.temperature = 0.8;
            body.max_tokens = 3000;
            body.presence_penalty = 0.7;
            body.frequency_penalty = 0.8;
          }

          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          if (!resp.ok) {
            const t = await resp.text();
            throw new Error(`OpenAI API error ${resp.status}: ${t}`);
          }

          const json = await resp.json();
          let generatedCode = json.choices?.[0]?.message?.content?.trim() || '';
          if (!generatedCode) throw new Error('Empty generation');

          // Strip markdown fences
          if (generatedCode.includes('```')) {
            const m = generatedCode.match(/```(?:javascript|jsx|tsx|js|ts)?\n([\s\S]*?)\n```/);
            if (m && m[1]) generatedCode = m[1];
          }

          if (validateGeneration(generatedCode)) {
            console.log(`✅ SUCCESS: Valid React component generated on attempt ${attempt}`);
            return generatedCode;
          }

          console.log(`❌ ATTEMPT ${attempt} FAILED: Regenerating...`);
          await new Promise((r) => setTimeout(r, 800));
        } catch (err) {
          console.error(`❌ ATTEMPT ${attempt} ERROR:`, err);
        }
      }
      console.log('🛑 ALL ATTEMPTS FAILED: Returning fallback component');
      return getFallbackComponent(baseUserPrompt);
    };

    // Generate validated single-file React component and return early
    const validatedCode = await generateWithValidation(prompt);

    console.log('✅ Generation successful', {
      promptLength: prompt.length,
      codeLength: validatedCode.length,
      hasReact: validatedCode.includes('import React'),
      hasApp: /const\s+App|function\s+App/.test(validatedCode),
      hasExport: validatedCode.includes('export default'),
    });

    const result = { files: [{ path: '/src/App.tsx', content: validatedCode }] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: appSpecSystemPrompt },
          { role: 'user', content: enhancedPrompt }
        ],
        temperature: 0.1, // Low temperature for consistent, high-quality output
        top_p: 0.95,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
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

      // Try to extract object that contains a "files" array
      const objectWithFiles = input.match(/\{[\s\S]*?"files"[\s\S]*?\}/);
      if (objectWithFiles) candidates.unshift(objectWithFiles[0]);

      for (const c of candidates) {
        try {
          const parsed = JSON.parse(c);
          if (parsed && (Array.isArray(parsed.files) || (parsed.files && typeof parsed.files === 'object'))) {
            // Validate that response contains React code
            const firstFile = Array.isArray(parsed.files) ? parsed.files[0]?.content : Object.values(parsed.files)[0];
            if (typeof firstFile === 'string' && (!firstFile.includes('import React') && !firstFile.includes('useState'))) {
              console.log('AI generated non-React content, retrying...');
              continue;
            }
            return parsed;
          }
        } catch (_) { /* continue */ }
      }
      return null;
    }

    let parsedResponse = tryParseAppSpec(raw);

    // Build a comprehensive default CRM app if parsing failed
    if (!parsedResponse) {
      parsedResponse = {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex">
        <Navigation />
        <main className="flex-1 ml-64 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
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
import { Users, Handshake, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Dashboard() {
  const stats = [
    { name: 'Total Customers', value: '2,651', icon: Users, change: '+12%', color: 'bg-blue-500' },
    { name: 'Active Deals', value: '184', icon: Handshake, change: '+8%', color: 'bg-green-500' },
    { name: 'Revenue', value: '$892,450', icon: DollarSign, change: '+23%', color: 'bg-purple-500' },
    { name: 'Growth Rate', value: '14.2%', icon: TrendingUp, change: '+2.1%', color: 'bg-orange-500' },
  ];

  const revenueData = [
    { name: 'Jan', revenue: 65000, deals: 42 },
    { name: 'Feb', revenue: 78000, deals: 38 },
    { name: 'Mar', revenue: 82000, deals: 45 },
    { name: 'Apr', revenue: 71000, deals: 41 },
    { name: 'May', revenue: 89000, deals: 52 },
    { name: 'Jun', revenue: 94000, deals: 48 },
  ];

  const activityData = [
    { name: 'Mon', calls: 24, emails: 45, meetings: 8 },
    { name: 'Tue', calls: 28, emails: 52, meetings: 12 },
    { name: 'Wed', calls: 35, emails: 38, meetings: 15 },
    { name: 'Thu', calls: 31, emails: 42, meetings: 10 },
    { name: 'Fri', calls: 29, emails: 48, meetings: 14 },
    { name: 'Sat', calls: 18, emails: 25, meetings: 6 },
    { name: 'Sun', calls: 12, emails: 18, meetings: 3 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your business today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={\`p-3 rounded-full \${stat.color}\`}>
                  <Icon className="h-6 w-6 text-white" />
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="emails" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="meetings" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-100">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New customer "Acme Corp" added</p>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Deal "Website Redesign" moved to proposal</p>
                <span className="text-xs text-gray-500">4 hours ago</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Follow-up required for "Tech Solutions Ltd"</p>
                <span className="text-xs text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Customers</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Acme Corporation</p>
                  <p className="text-sm text-gray-500">Enterprise Software</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900">$125,000</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tech Solutions Ltd</p>
                  <p className="text-sm text-gray-500">IT Services</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900">$89,500</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Digital Innovations</p>
                  <p className="text-sm text-gray-500">Marketing Agency</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900">$67,200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`
          },
          {
            path: '/src/components/Customers.tsx',
            content: `import React, { useState } from 'react';
import { Users, Plus, Search, Edit, Trash2 } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'active' | 'inactive';
  value: string;
}

export default function Customers() {
  const [customers] = useState<Customer[]>([
    { id: 1, name: 'John Smith', email: 'john@acme.com', company: 'Acme Corp', phone: '+1 234-567-8900', status: 'active', value: '$125,000' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@techsol.com', company: 'Tech Solutions Ltd', phone: '+1 234-567-8901', status: 'active', value: '$89,500' },
    { id: 3, name: 'Mike Davis', email: 'mike@digital.com', company: 'Digital Innovations', phone: '+1 234-567-8902', status: 'inactive', value: '$67,200' },
    { id: 4, name: 'Lisa Wilson', email: 'lisa@startup.io', company: 'Startup Inc', phone: '+1 234-567-8903', status: 'active', value: '$45,300' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">Manage your customer relationships</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={\`inline-flex px-2 py-1 text-xs font-semibold rounded-full \${
                      customer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }\`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`
          },
          {
            path: '/src/components/Deals.tsx',
            content: `import React, { useState } from 'react';
import { Handshake, DollarSign, Calendar, User } from 'lucide-react';

interface Deal {
  id: number;
  title: string;
  customer: string;
  value: string;
  stage: 'lead' | 'proposal' | 'negotiation' | 'closed';
  closeDate: string;
  probability: number;
}

export default function Deals() {
  const [deals] = useState<Deal[]>([
    { id: 1, title: 'Website Redesign', customer: 'Acme Corp', value: '$25,000', stage: 'proposal', closeDate: '2024-02-15', probability: 75 },
    { id: 2, title: 'CRM Implementation', customer: 'Tech Solutions Ltd', value: '$45,000', stage: 'negotiation', closeDate: '2024-02-28', probability: 60 },
    { id: 3, title: 'Mobile App Development', customer: 'Digital Innovations', value: '$80,000', stage: 'lead', closeDate: '2024-03-15', probability: 30 },
    { id: 4, title: 'Cloud Migration', customer: 'Startup Inc', value: '$35,000', stage: 'closed', closeDate: '2024-01-30', probability: 100 },
  ]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'bg-gray-100 text-gray-800';
      case 'proposal': return 'bg-blue-100 text-blue-800';
      case 'negotiation': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals Pipeline</h1>
          <p className="mt-2 text-gray-600">Track your sales opportunities</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Handshake className="h-4 w-4 mr-2" />
          New Deal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {['lead', 'proposal', 'negotiation', 'closed'].map(stage => {
          const stageDeals = deals.filter(deal => deal.stage === stage);
          const stageValue = stageDeals.reduce((sum, deal) => sum + parseInt(deal.value.replace(/[$,]/g, '')), 0);
          
          return (
            <div key={stage} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 capitalize mb-2">{stage}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Count</span>
                  <span className="font-medium">{stageDeals.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Value</span>
                  <span className="font-medium">\${stageValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Deals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Handshake className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{deal.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{deal.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{deal.value}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={\`inline-flex px-2 py-1 text-xs font-semibold rounded-full \${getStageColor(deal.stage)}\`}>
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">{deal.closeDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: \`\${deal.probability}%\` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">{deal.probability}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`
          },
          {
            path: '/src/components/Reports.tsx',
            content: `import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

export default function Reports() {
  const metrics = [
    { name: 'Total Revenue', value: '$892,450', change: '+23%', trend: 'up' },
    { name: 'New Customers', value: '156', change: '+12%', trend: 'up' },
    { name: 'Conversion Rate', value: '14.2%', change: '+2.1%', trend: 'up' },
    { name: 'Avg Deal Size', value: '$12,450', change: '-5.2%', trend: 'down' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-2 text-gray-600">Insights into your business performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                {index === 0 && <DollarSign className="h-6 w-6 text-blue-600" />}
                {index === 1 && <Users className="h-6 w-6 text-blue-600" />}
                {index === 2 && <TrendingUp className="h-6 w-6 text-blue-600" />}
                {index === 3 && <BarChart3 className="h-6 w-6 text-blue-600" />}
              </div>
            </div>
            <div className="mt-4">
              <span className={\`text-sm font-medium \${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}\`}>
                {metric.change}
              </span>
              <span className="text-gray-500 text-sm ml-1">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Detailed analytics dashboard coming soon...</p>
      </div>
    </div>
  );
}`
          },
          {
            path: '/src/components/Settings.tsx',
            content: `import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account preferences and system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={\`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors \${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }\`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {activeTab === 'profile' ? 'Profile Settings' : 
               activeTab === 'notifications' ? 'Notification Preferences' : 'Security Settings'}
            </h3>
            <div className="text-center py-8">
              <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Settings for {activeTab} coming soon...</p>
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

    // Extract files from parsed response (support both array and object map)
    let files: Array<{ path: string; content: string }> = [];

    const normalizeToSrc = (p: string) => {
      const norm = p.startsWith('/') ? p : `/${p}`;
      if (/^\/(src|public|assets)\//i.test(norm) || norm === '/package.json' || norm === '/tailwind.config.js' || norm === '/postcss.config.js') {
        return norm;
      }
      return norm.startsWith('/src/') ? norm : `/src${norm}`;
    };

    if (Array.isArray((parsedResponse as any).files)) {
      files = (parsedResponse.files as Array<{ path: string; content: string; language?: string }>)
        .filter(f => f && typeof f.path === 'string' && typeof f.content === 'string')
        .map(f => {
          let path = f.path.startsWith('/') ? f.path : '/' + f.path;
          // Move runtime files under /src
          if (path.toLowerCase() === '/app.tsx') path = '/src/App.tsx';
          if (path.toLowerCase() === '/main.tsx') path = '/src/main.tsx';
          return { path, content: f.content };
        });
    } else if (parsedResponse && (parsedResponse as any).files && typeof (parsedResponse as any).files === 'object') {
      const entries = Object.entries((parsedResponse as any).files as Record<string, string>);
      files = entries
        .filter(([, content]) => typeof content === 'string')
        .map(([path, content]) => ({ path: normalizeToSrc(path), content }));
    } else {
      files = [];
    }

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
        content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { BrowserRouter } from 'react-router-dom';\nimport App from './App';\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <BrowserRouter>\n      <App />\n    </BrowserRouter>\n  </React.StrictMode>\n);`
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
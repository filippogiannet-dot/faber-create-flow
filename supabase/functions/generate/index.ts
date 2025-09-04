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

CRITICAL: Output ONLY strict JSON in this format:
{
  "files": [
    {
      "path": "/index.html",
      "content": "<!DOCTYPE html>\\n<html lang=\\"en\\">\\n<head>\\n  <meta charset=\\"UTF-8\\" />\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\" />\\n  <title>App Name</title>\\n  <script src=\\"https://cdn.tailwindcss.com\\"></script>\\n</head>\\n<body>\\n  <div id=\\"root\\"></div>\\n</body>\\n</html>"
    },
    {
      "path": "/src/main.tsx",
      "content": "import React from 'react';\\nimport ReactDOM from 'react-dom/client';\\nimport { BrowserRouter } from 'react-router-dom';\\nimport App from './App';\\n\\nReactDOM.createRoot(document.getElementById('root')!).render(\\n  <React.StrictMode>\\n    <BrowserRouter>\\n      <App />\\n    </BrowserRouter>\\n  </React.StrictMode>\\n);"
    },
    {
      "path": "/src/App.tsx", 
      "content": "COMPLETE APP CODE HERE"
    }
  ]
}

MANDATORY REQUIREMENTS:
1. Generate COMPLETE applications that match the user's exact request (CRM, dashboard, todo app, etc.)
2. Include 4-6 meaningful routes with full navigation
3. Use realistic business data and content (not placeholders or "Lorem ipsum")  
4. Create ALL necessary component files - never reference missing components
5. Use Lucide icons throughout the interface
6. Create responsive layouts with Tailwind classes
7. Include proper TypeScript interfaces for all data
8. Add loading states, error handling, and empty states
9. Generate 8-12 component files for a complete application

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

      // Try to extract object that contains a "files" array
      const objectWithFiles = input.match(/\{[\s\S]*?"files"[\s\S]*?\}/);
      if (objectWithFiles) candidates.unshift(objectWithFiles[0]);

      for (const c of candidates) {
        try {
          const parsed = JSON.parse(c);
          if (parsed && Array.isArray(parsed.files)) {
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

    // Extract files from parsed response
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
export const templates = {
  default: `import React from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="container mx-auto px-6 py-8">
        <nav className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">YourBrand</h1>
          <button className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </nav>
      </header>
      <main className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">Build Something Amazing</h2>
        <p className="text-xl text-gray-300 mb-8">Transform your ideas into reality</p>
        <button className="px-8 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          Start Building
        </button>
      </main>
    </div>
  );
}`,
  
  saas: `import React, { useState } from 'react';

export default function SaaSLanding() {
  const [email, setEmail] = useState('');
  
  const plans = [
    { name: 'Starter', price: '$9', features: ['10 Projects', 'Email Support'] },
    { name: 'Pro', price: '$29', features: ['Unlimited Projects', 'Priority Support'] }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submitted:', email);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Launch Your SaaS</h1>
          <p className="text-xl mb-8">Everything you need to build and scale</p>
          <form onSubmit={handleSubmit} className="flex justify-center gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-6 py-3 rounded-lg text-gray-900"
              required
            />
            <button type="submit" className="px-8 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              Start Free Trial
            </button>
          </form>
        </div>
      </section>
      
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className="border rounded-lg p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-4xl font-bold my-4">{plan.price}/mo</p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}`,
  
  dashboard: `import React, { useState } from 'react';

export default function Dashboard() {
  const [stats] = useState([
    { id: 1, label: 'Total Users', value: '12,345', change: '+12%' },
    { id: 2, label: 'Revenue', value: '$45,678', change: '+8%' },
    { id: 3, label: 'Orders', value: '1,234', change: '+15%' },
    { id: 4, label: 'Conversion', value: '3.2%', change: '+2%' }
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>
      
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
              <div className="flex items-center justify-between mt-2">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <span className="text-sm text-green-600">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {['User registered', 'New order placed', 'Payment received'].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{activity}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Create New Project
              </button>
              <button className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                View Reports
              </button>
              <button className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                Manage Users
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}`,
  
  ecommerce: `import React, { useState, useCallback } from 'react';

export default function EcommercePage() {
  const [cart, setCart] = useState([]);
  
  const products = [
    { id: 1, name: 'Premium Headphones', price: 299, image: '🎧', rating: 4.8 },
    { id: 2, name: 'Wireless Speaker', price: 199, image: '🔊', rating: 4.6 },
    { id: 3, name: 'Smart Watch', price: 399, image: '⌚', rating: 4.9 },
    { id: 4, name: 'Laptop Stand', price: 79, image: '💻', rating: 4.5 }
  ];

  const addToCart = useCallback((product) => {
    setCart((prevCart) => [...prevCart, product]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">TechStore</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Cart ({cart.length})</span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Checkout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">{product.image}</div>
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                <div className="flex justify-center mb-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                  <span className="ml-1 text-sm text-gray-600">({product.rating})</span>
                </div>
                <p className="text-2xl font-bold mb-4">${product.price}</p>
                <button 
                  onClick={() => addToCart(product)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}`,
  
  portfolio: `import React, { useState } from 'react';

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState('projects');
  
  const projects = [
    { id: 1, title: 'E-commerce Platform', tech: 'React, Node.js', image: '🛒' },
    { id: 2, title: 'Mobile App Design', tech: 'React Native, Figma', image: '📱' },
    { id: 3, title: 'Dashboard Analytics', tech: 'Vue.js, D3.js', image: '📊' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="w-32 h-32 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">
            👨‍💻
          </div>
          <h1 className="text-4xl font-bold mb-4">John Developer</h1>
          <p className="text-xl">Full Stack Developer & UI/UX Designer</p>
        </div>
      </header>
      
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {['projects', 'about', 'contact'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={\`py-4 px-2 border-b-2 font-medium transition-colors \${
                  activeTab === tab 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }\`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-6 py-12">
        {activeTab === 'projects' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div key={project.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6 text-center">
                  <div className="text-6xl mb-4">{project.image}</div>
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.tech}</p>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'about' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">About Me</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              I'm a passionate full-stack developer with 5+ years of experience creating 
              beautiful and functional web applications. I specialize in React, Node.js, 
              and modern web technologies.
            </p>
          </div>
        )}
        
        {activeTab === 'contact' && (
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Get In Touch</h2>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="Your Message"
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Send Message
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}`,
  
  blog: `import React, { useState } from 'react';

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const posts = [
    { 
      id: 1, 
      title: 'Getting Started with React', 
      excerpt: 'Learn the basics of React development...',
      category: 'React',
      date: '2024-01-15',
      readTime: '5 min'
    },
    { 
      id: 2, 
      title: 'Advanced TypeScript Tips', 
      excerpt: 'Improve your TypeScript skills with these tips...',
      category: 'TypeScript',
      date: '2024-01-10',
      readTime: '8 min'
    },
    { 
      id: 3, 
      title: 'CSS Grid vs Flexbox', 
      excerpt: 'When to use Grid and when to use Flexbox...',
      category: 'CSS',
      date: '2024-01-05',
      readTime: '6 min'
    }
  ];

  const categories = ['all', ...Array.from(new Set(posts.map(p => p.category)))];
  
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-center mb-4">Tech Blog</h1>
          <p className="text-xl text-gray-600 text-center">
            Insights, tutorials, and thoughts on web development
          </p>
        </div>
      </header>
      
      <nav className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={\`px-4 py-2 rounded-full transition-colors \${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }\`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500">{post.readTime}</span>
                </div>
                <h2 className="text-xl font-bold mb-3 hover:text-blue-600 cursor-pointer transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{post.date}</span>
                  <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    Read More →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}`
};

export function getTemplateByCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'business': 'dashboard',
    'marketing': 'saas',
    'ecommerce': 'ecommerce',
    'portfolio': 'portfolio',
    'blog': 'blog',
    'landing': 'default'
  };
  
  return categoryMap[category.toLowerCase()] || 'default';
}

export function getAvailableTemplates(): string[] {
  return Object.keys(templates);
}

export function validateTemplate(templateId: string): boolean {
  return templateId in templates;
}
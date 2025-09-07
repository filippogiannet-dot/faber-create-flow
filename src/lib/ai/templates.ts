export const templates = {
  default: `
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="container mx-auto px-6 py-8">
        <nav className="flex justify-between items-center">
          <h1 className="text-2xl font-bold chrome-text">YourBrand</h1>
          <Button className="bg-gradient-button hover:shadow-faber-button transition-all duration-300">
            Get Started
          </Button>
        </nav>
      </header>
      
      <main className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold chrome-text mb-6 leading-tight">
          Build Something Amazing
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Transform your ideas into reality with our powerful platform
        </p>
        
        <div className="flex justify-center gap-4 mb-16">
          <Button 
            size="lg"
            className="bg-gradient-button hover:shadow-faber-button transition-all duration-300 transform hover:scale-105"
          >
            Start Building
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-border hover:bg-accent transition-all duration-300"
          >
            Learn More
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { title: "Fast", desc: "Lightning fast performance", icon: "⚡" },
            { title: "Secure", desc: "Enterprise-grade security", icon: "🔒" },
            { title: "Scalable", desc: "Grows with your business", icon: "📈" }
          ].map((feature, i) => (
            <Card 
              key={i}
              className="bg-gradient-card border-border hover:shadow-faber-card transition-all duration-300 hover:scale-105"
            >
              <CardHeader>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle className="text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
  `,
  
  saas: `
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Shield, Rocket } from 'lucide-react';

export default function SaaSLanding() {
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  
  const plans = [
    { 
      id: 'starter',
      name: 'Starter', 
      price: '$9', 
      period: '/month',
      features: ['10 Projects', 'Email Support', 'Basic Templates', 'Export HTML'],
      popular: false
    },
    { 
      id: 'pro',
      name: 'Pro', 
      price: '$29', 
      period: '/month',
      features: ['Unlimited Projects', 'Priority Support', 'Advanced Templates', 'Export React', 'API Access'],
      popular: true
    },
    { 
      id: 'enterprise',
      name: 'Enterprise', 
      price: '$99', 
      period: '/month',
      features: ['Everything in Pro', 'Custom Templates', 'White-label', 'Dedicated Support', 'SLA'],
      popular: false
    }
  ];

  const testimonials = [
    { name: 'Sarah Chen', role: 'Product Manager', text: 'This tool saved us weeks of development time!', rating: 5 },
    { name: 'Marco Rossi', role: 'Startup Founder', text: 'Perfect for rapid prototyping and MVP development.', rating: 5 },
    { name: 'Lisa Wang', role: 'Designer', text: 'The AI understands design principles better than most humans.', rating: 5 }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Development
            </Badge>
            
            <h1 className="text-6xl font-bold chrome-text mb-6 leading-tight">
              Launch Your SaaS
              <span className="block text-primary">10x Faster</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Everything you need to build, deploy and scale your SaaS application. 
              From idea to production in minutes, not months.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="max-w-sm bg-card border-border"
              />
              <Button 
                size="lg"
                className="bg-gradient-button hover:shadow-faber-button transition-all duration-300 transform hover:scale-105"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </div>
            
            <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold chrome-text mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to accelerate your development workflow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-yellow-500" />,
                title: "AI-Powered Generation",
                description: "Generate complete UI components with natural language prompts"
              },
              {
                icon: <Rocket className="w-8 h-8 text-blue-500" />,
                title: "Instant Deployment",
                description: "Deploy your applications to production with one click"
              },
              {
                icon: <Shield className="w-8 h-8 text-green-500" />,
                title: "Enterprise Security",
                description: "Bank-level security with SOC 2 compliance"
              }
            ].map((feature, i) => (
              <Card 
                key={i}
                className="bg-gradient-card border-border hover:shadow-faber-card transition-all duration-300 hover:scale-105 group"
              >
                <CardHeader>
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold chrome-text mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, scale as you grow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={\`relative bg-gradient-card border-border transition-all duration-300 hover:shadow-faber-card hover:scale-105 \${
                  plan.popular ? 'ring-2 ring-primary shadow-faber-glow' : ''
                }\`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-button text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-card-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={\`w-full \${
                      plan.popular 
                        ? 'bg-gradient-button hover:shadow-faber-button' 
                        : 'bg-secondary hover:bg-secondary/80'
                    } transition-all duration-300 transform hover:scale-105\`}
                    size="lg"
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    Choose {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold chrome-text mb-4">
              Loved by Developers
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our customers are saying
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <Card 
                key={i}
                className="bg-gradient-card border-border hover:shadow-faber-card transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-card-foreground mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold chrome-text mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers building the future
          </p>
          <Button 
            size="lg"
            className="bg-gradient-button hover:shadow-faber-button transition-all duration-300 transform hover:scale-105"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Start Your Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
}
  `,
  
  dashboard: `
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, TrendingUp, DollarSign, Activity, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const analyticsData = [
    { id: '1', title: "Total Revenue", value: "$45,231", change: "+20.1%", icon: DollarSign, color: "text-green-500" },
    { id: '2', title: "New Users", value: "1,234", change: "+15.3%", icon: Users, color: "text-blue-500" },
    { id: '3', title: "Conversion Rate", value: "2.4%", change: "+5.2%", icon: BarChart3, color: "text-purple-500" },
    { id: '4', title: "Active Sessions", value: "573", change: "+12.5%", icon: Activity, color: "text-orange-500" }
  ];

  const recentActivity = [
    { user: 'John Doe', action: 'Created new project', time: '2 min ago', type: 'create' },
    { user: 'Jane Smith', action: 'Updated dashboard', time: '5 min ago', type: 'update' },
    { user: 'Mike Johnson', action: 'Deployed to production', time: '10 min ago', type: 'deploy' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold chrome-text">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, here's what's happening</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Calendar className="w-4 h-4 mr-2" />
                Last 30 days
              </Badge>
              <Button className="bg-gradient-button hover:shadow-faber-button transition-all duration-300">
                <TrendingUp className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analyticsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.id} 
                className="bg-gradient-card border-border hover:shadow-faber-card transition-all duration-300 hover:scale-105 group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                      <Badge variant="secondary" className={\`mt-2 \${stat.color}\`}>
                        {stat.change}
                      </Badge>
                    </div>
                    <Icon className={\`w-8 h-8 \${stat.color} group-hover:scale-110 transition-transform duration-300\`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Revenue Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => (
                  <div key={month} className="flex items-center space-x-4">
                    <span className="w-12 text-sm text-muted-foreground font-medium">{month}</span>
                    <Progress 
                      value={(index + 1) * 15} 
                      className="flex-1 h-3"
                    />
                    <span className="text-sm font-medium text-foreground w-16 text-right">
                      ${(index + 1) * 5000}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg hover:bg-background/80 transition-colors">
                    <div className={\`w-2 h-2 rounded-full mt-2 \${
                      activity.type === 'create' ? 'bg-green-500' :
                      activity.type === 'update' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }\`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8">
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Page Load Time', value: '1.2s', target: '< 2s', progress: 85 },
                  { label: 'Uptime', value: '99.9%', target: '> 99%', progress: 99 },
                  { label: 'Error Rate', value: '0.1%', target: '< 1%', progress: 95 },
                  { label: 'User Satisfaction', value: '4.8/5', target: '> 4.5', progress: 96 }
                ].map((metric, index) => (
                  <div key={index} className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <Progress value={metric.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">Target: {metric.target}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
  `,
  
  ecommerce: `
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Star, Search, Filter, Plus, Minus } from 'lucide-react';

export default function EcommercePage() {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);

  const products = [
    { 
      id: 1, 
      name: 'Premium Wireless Headphones', 
      price: 299, 
      originalPrice: 399,
      rating: 4.8, 
      reviews: 124,
      image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300',
      category: 'Electronics', 
      inStock: true,
      badge: 'Best Seller'
    },
    { 
      id: 2, 
      name: 'Smart Fitness Watch', 
      price: 199, 
      originalPrice: 249,
      rating: 4.6, 
      reviews: 89,
      image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300',
      category: 'Wearables', 
      inStock: true,
      badge: 'New'
    },
    { 
      id: 3, 
      name: 'Ergonomic Office Chair', 
      price: 399, 
      originalPrice: 499,
      rating: 4.9, 
      reviews: 203,
      image: 'https://images.pexels.com/photos/586996/pexels-photo-586996.jpeg?auto=compress&cs=tinysrgb&w=300',
      category: 'Furniture', 
      inStock: false,
      badge: 'Sale'
    }
  ];

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const toggleFavorite = (productId) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold chrome-text">TechStore</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {products.length} Products
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-10 w-64 bg-background border-border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button variant="outline" className="relative border-border hover:bg-accent">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cartItems})
                {cartItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs">
                    {cartItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={\`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 \${
                      selectedCategory === category 
                        ? 'bg-primary text-primary-foreground font-medium' 
                        : 'hover:bg-accent text-foreground'
                    }\`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Shopping Cart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {cart.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-background/50 rounded-lg">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">${item.price}</p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-destructive hover:text-destructive/80"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{cart.length - 3} more items
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-foreground">Total:</span>
                      <span className="font-bold text-lg text-foreground">${cartTotal}</span>
                    </div>
                    <Button className="w-full bg-gradient-button hover:shadow-faber-button transition-all duration-300">
                      Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-3xl font-bold chrome-text mb-2">Featured Products</h2>
              <p className="text-muted-foreground">Discover our latest and greatest tech products</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-faber-card transition-all duration-300 hover:scale-[1.02] bg-gradient-card border-border overflow-hidden"
                >
                  <div className="relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.badge && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                        {product.badge}
                      </Badge>
                    )}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                    >
                      <Heart 
                        className={\`w-4 h-4 \${
                          favorites.includes(product.id) 
                            ? 'text-red-500 fill-current' 
                            : 'text-muted-foreground'
                        }\`} 
                      />
                    </button>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="mb-3">
                      <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground mb-2">
                        {product.category}
                      </Badge>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={\`w-4 h-4 \${
                              i < Math.floor(product.rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-muted-foreground'
                            }\`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({product.rating}) • {product.reviews} reviews
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-foreground">${product.price}</span>
                        {product.originalPrice > product.price && (
                          <span className="ml-2 text-sm text-muted-foreground line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => addToCart(product)}
                        disabled={!product.inStock}
                        className={\`\${
                          product.inStock 
                            ? 'bg-primary hover:bg-primary/90' 
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        } transition-all duration-200\`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
  `,

  portfolio: `
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, ExternalLink, Mail, Linkedin, Download, Code, Palette, Smartphone } from 'lucide-react';

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isContactOpen, setIsContactOpen] = useState(false);

  const projects = [
    {
      id: 1,
      title: 'E-commerce Platform',
      description: 'Full-stack e-commerce solution with React, Node.js, and Stripe integration',
      image: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      category: 'web',
      github: '#',
      live: '#'
    },
    {
      id: 2,
      title: 'Mobile Banking App',
      description: 'Secure mobile banking application with biometric authentication',
      image: 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['React Native', 'Firebase', 'TypeScript'],
      category: 'mobile',
      github: '#',
      live: '#'
    },
    {
      id: 3,
      title: 'Brand Identity Design',
      description: 'Complete brand identity package for tech startup',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
      tags: ['Figma', 'Illustrator', 'Branding'],
      category: 'design',
      github: '#',
      live: '#'
    }
  ];

  const skills = [
    { name: 'React', level: 95, category: 'Frontend' },
    { name: 'TypeScript', level: 90, category: 'Language' },
    { name: 'Node.js', level: 85, category: 'Backend' },
    { name: 'UI/UX Design', level: 80, category: 'Design' },
    { name: 'AWS', level: 75, category: 'Cloud' }
  ];

  const categories = [
    { id: 'all', name: 'All Projects', icon: Code },
    { id: 'web', name: 'Web Apps', icon: Code },
    { id: 'mobile', name: 'Mobile Apps', icon: Smartphone },
    { id: 'design', name: 'Design', icon: Palette }
  ];

  const filteredProjects = activeFilter === 'all' 
    ? projects 
    : projects.filter(p => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 py-20">
        <div className="absolute inset-0 bg-gradient-mesh opacity-20" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <img 
                src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200" 
                alt="Profile"
                className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-primary/20 shadow-faber-glow"
              />
              <h1 className="text-5xl font-bold chrome-text mb-4">
                Alex Developer
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Full-Stack Developer & UI/UX Designer
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                I create beautiful, functional digital experiences that solve real problems. 
                Passionate about clean code, great design, and user-centered development.
              </p>
            </div>
            
            <div className="flex justify-center gap-4 mb-8">
              <Button 
                className="bg-gradient-button hover:shadow-faber-button transition-all duration-300"
                onClick={() => setIsContactOpen(true)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Get In Touch
              </Button>
              <Button variant="outline" className="border-border hover:bg-accent">
                <Download className="w-4 h-4 mr-2" />
                Download CV
              </Button>
            </div>
            
            <div className="flex justify-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold chrome-text mb-4">Skills & Expertise</h2>
            <p className="text-xl text-muted-foreground">Technologies I work with</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {skills.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{skill.name}</span>
                    <Badge variant="secondary" className="bg-secondary/50">
                      {skill.category}
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: \`\${skill.level}%\` }}
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">{skill.level}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold chrome-text mb-4">Featured Projects</h2>
            <p className="text-xl text-muted-foreground">Some of my recent work</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-12">
            <div className="flex gap-2 p-1 bg-card rounded-lg border border-border">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveFilter(category.id)}
                    className={\`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 \${
                      activeFilter === category.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }\`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id}
                className="group hover:shadow-faber-card transition-all duration-300 hover:scale-[1.02] bg-gradient-card border-border overflow-hidden"
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" asChild>
                        <a href={project.github} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button size="sm" variant="secondary" asChild>
                        <a href={project.live} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <CardTitle className="text-foreground mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </CardTitle>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="bg-secondary/50 text-secondary-foreground text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold chrome-text mb-4">
            Let's Work Together
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Have a project in mind? I'd love to hear about it and discuss how we can bring your ideas to life.
          </p>
          <Button 
            size="lg"
            className="bg-gradient-button hover:shadow-faber-button transition-all duration-300 transform hover:scale-105"
            onClick={() => setIsContactOpen(true)}
          >
            <Mail className="w-5 h-5 mr-2" />
            Start a Conversation
          </Button>
        </div>
      </section>
    </div>
  );
}
  `,

  blog: `
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Search, Tag, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const posts = [
    {
      id: 1,
      title: 'The Future of Web Development: AI-Powered Coding',
      excerpt: 'Explore how artificial intelligence is revolutionizing the way we write code and build applications.',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      author: 'Sarah Johnson',
      date: '2024-01-15',
      readTime: '5 min read',
      category: 'Technology',
      tags: ['AI', 'Web Development', 'Future'],
      image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400',
      featured: true
    },
    {
      id: 2,
      title: 'Building Scalable React Applications',
      excerpt: 'Best practices and patterns for creating maintainable React applications that scale.',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      author: 'Mike Chen',
      date: '2024-01-12',
      readTime: '8 min read',
      category: 'Development',
      tags: ['React', 'JavaScript', 'Architecture'],
      image: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=400',
      featured: false
    },
    {
      id: 3,
      title: 'Design Systems That Actually Work',
      excerpt: 'How to create and maintain design systems that teams love to use.',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      author: 'Emma Wilson',
      date: '2024-01-10',
      readTime: '6 min read',
      category: 'Design',
      tags: ['Design Systems', 'UI/UX', 'Figma'],
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
      featured: false
    }
  ];

  const categories = ['all', ...Array.from(new Set(posts.map(p => p.category)))];
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags)));

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = posts.find(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold chrome-text mb-4">
              Tech Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Insights, tutorials, and thoughts on modern web development
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Search and Filters */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            
            <div className="flex gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="transition-all duration-200"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Post */}
        {featuredPost && selectedCategory === 'all' && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Featured Article</h2>
            <Card className="bg-gradient-card border-border hover:shadow-faber-card transition-all duration-300 overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <Badge className="mb-4 bg-primary/10 text-primary">
                    Featured
                  </Badge>
                  <h3 className="text-2xl font-bold text-foreground mb-4 leading-tight">
                    {featuredPost.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {featuredPost.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(featuredPost.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredPost.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-secondary/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button className="bg-gradient-button hover:shadow-faber-button transition-all duration-300">
                    Read Article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {selectedCategory === 'all' ? 'Latest Articles' : \`\${selectedCategory} Articles\`}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <Card 
                key={post.id}
                className="group hover:shadow-faber-card transition-all duration-300 hover:scale-[1.02] bg-gradient-card border-border overflow-hidden"
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 left-4 bg-card/90 text-foreground">
                    {post.category}
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-secondary/50 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-border hover:bg-accent group-hover:border-primary transition-all duration-200"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-border">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold chrome-text mb-4">
              Stay Updated
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get the latest articles and insights delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                placeholder="Your email address"
                className="bg-background border-border"
              />
              <Button className="bg-gradient-button hover:shadow-faber-button transition-all duration-300">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
  `
};

export function getTemplateByCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'business': 'dashboard',
    'marketing': 'saas',
    'ecommerce': 'ecommerce',
    'portfolio': 'portfolio',
    'blog': 'blog',
    'landing': 'saas',
    'dashboard': 'dashboard',
    'admin': 'dashboard'
  };
  
  return categoryMap[category.toLowerCase()] || 'default';
}

export function enhanceTemplateWithPrompt(template: string, prompt: string): string {
  // Analizza il prompt per personalizzare il template
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('dark') || lowerPrompt.includes('nero')) {
    template = template.replace(/bg-background/g, 'bg-gray-900');
    template = template.replace(/text-foreground/g, 'text-white');
  }
  
  if (lowerPrompt.includes('colorful') || lowerPrompt.includes('colorato')) {
    template = template.replace(/bg-gradient-button/g, 'bg-gradient-to-r from-pink-500 to-purple-600');
  }
  
  return template;
}
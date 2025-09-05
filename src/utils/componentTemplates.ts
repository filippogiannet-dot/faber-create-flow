export const COMPONENT_TEMPLATES = {
  dashboard: `
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, TrendingUp, DollarSign } from "lucide-react";

interface AnalyticsData {
  id: string;
  title: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const analyticsData: AnalyticsData[] = [
    { id: '1', title: "Total Revenue", value: "$45,231", change: "+20.1%", icon: DollarSign, color: "text-green-600" },
    { id: '2', title: "New Users", value: "1,234", change: "+15.3%", icon: Users, color: "text-blue-600" },
    { id: '3', title: "Conversion Rate", value: "2.4%", change: "+5.2%", icon: BarChart3, color: "text-purple-600" },
    { id: '4', title: "Active Sessions", value: "573", change: "+12.5%", icon: TrendingUp, color: "text-orange-600" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Welcome back, here's what's happening</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
            <TrendingUp className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <Badge variant="secondary" className={stat.color}>
                        {stat.change}
                      </Badge>
                    </div>
                    <Icon className={\`w-8 h-8 \${stat.color}\`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month, index) => (
                  <div key={month} className="flex items-center space-x-4">
                    <span className="w-12 text-sm text-gray-600">{month}</span>
                    <Progress value={(index + 1) * 20} className="flex-1" />
                    <span className="text-sm font-medium">$\{(index + 1) * 5000}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Top Performing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['React Dashboard', 'Analytics Pro', 'Data Viz', 'Admin Panel'].map((item, index) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium">{item}</span>
                    <Badge>{90 - index * 10}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default App;
`,

  ecommerce: `
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star, Search, Filter } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: string;
  inStock: boolean;
}

const App = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<number[]>([]);

  const products: Product[] = [
    { id: 1, name: "Premium Headphones", price: 299, rating: 4.8, image: "🎧", category: "Electronics", inStock: true },
    { id: 2, name: "Wireless Speaker", price: 199, rating: 4.6, image: "🔊", category: "Electronics", inStock: true },
    { id: 3, name: "Smart Watch", price: 399, rating: 4.9, image: "⌚", category: "Wearables", inStock: false },
    { id: 4, name: "Laptop Stand", price: 79, rating: 4.5, image: "💻", category: "Accessories", inStock: true },
    { id: 5, name: "USB-C Hub", price: 89, rating: 4.7, image: "🔌", category: "Accessories", inStock: true },
    { id: 6, name: "Wireless Mouse", price: 49, rating: 4.4, image: "🖱️", category: "Electronics", inStock: true }
  ];

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const toggleFavorite = (productId: number) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TechStore
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {products.length} Products
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-10 w-64 border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="relative border-gray-200">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cart.length})
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={\`w-full text-left px-3 py-2 rounded-lg transition-colors \${
                      selectedCategory === category 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'hover:bg-gray-50'
                    }\`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </CardContent>
            </Card>

            {cart.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Shopping Cart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {cart.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{item.image}</span>
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="font-medium">$\{item.price}</span>
                      </div>
                    ))}
                    {cart.length > 3 && (
                      <p className="text-xs text-gray-500">+{cart.length - 3} more items</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">$\{cart.reduce((sum, item) => sum + item.price, 0)}</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    Checkout
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-gray-600">Discover our latest and greatest tech products</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-4">{product.image}</div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          {product.category}
                        </Badge>
                        {product.inStock ? (
                          <Badge className="bg-green-100 text-green-700">In Stock</Badge>
                        ) : (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                    </div>
                    
                    <div className="flex items-center justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={\`w-4 h-4 \${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}\`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({product.rating})</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">$\{product.price}</span>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleFavorite(product.id)}
                          className={\`\${favorites.includes(product.id) ? 'text-red-500 border-red-200' : ''}\`}
                        >
                          <Heart className={\`w-4 h-4 \${favorites.includes(product.id) ? 'fill-current' : ''}\`} />
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => addToCart(product)}
                          disabled={!product.inStock}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
`,

  todoApp: `
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Trash2, Calendar, Filter } from "lucide-react";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: Date;
  dueDate?: Date;
}

const App = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedCategory, setSelectedCategory] = useState('Personal');

  const categories = ['Personal', 'Work', 'Shopping', 'Health', 'Learning'];
  const priorities = ['low', 'medium', 'high'] as const;

  useEffect(() => {
    // Load todos from localStorage
    const saved = localStorage.getItem('modern-todos');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTodos(parsed.map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
      })));
    }
  }, []);

  useEffect(() => {
    // Save todos to localStorage
    localStorage.setItem('modern-todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: crypto.randomUUID(),
        title: newTodo.trim(),
        completed: false,
        priority: 'medium',
        category: selectedCategory,
        createdAt: new Date(),
      };
      setTodos(prev => [todo, ...prev]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const updatePriority = (id: string, priority: Todo['priority']) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, priority } : todo
    ));
  };

  const filteredTodos = todos.filter(todo => {
    const statusMatch = filter === 'all' || 
      (filter === 'active' && !todo.completed) || 
      (filter === 'completed' && todo.completed);
    
    const priorityMatch = priorityFilter === 'all' || todo.priority === priorityFilter;
    
    return statusMatch && priorityMatch;
  });

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
    high: todos.filter(t => t.priority === 'high' && !t.completed).length
  };

  const getPriorityColor = (priority: Todo['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Personal': 'bg-blue-100 text-blue-700',
      'Work': 'bg-purple-100 text-purple-700',
      'Shopping': 'bg-orange-100 text-orange-700',
      'Health': 'bg-green-100 text-green-700',
      'Learning': 'bg-indigo-100 text-indigo-700'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Modern Todo App
          </h1>
          <p className="text-gray-600">Stay organized and productive</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.high}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Todo Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="What needs to be done?"
                className="flex-1 border-gray-200"
              />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md bg-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Button onClick={addTodo} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {(['all', 'active', 'completed'] as const).map(filterType => (
                  <Button
                    key={filterType}
                    size="sm"
                    variant={filter === filterType ? "default" : "outline"}
                    onClick={() => setFilter(filterType)}
                    className="h-8"
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </Button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-700">Priority:</span>
                {(['all', 'high', 'medium', 'low'] as const).map(priority => (
                  <Button
                    key={priority}
                    size="sm"
                    variant={priorityFilter === priority ? "default" : "outline"}
                    onClick={() => setPriorityFilter(priority)}
                    className="h-8"
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600">
                  {filter === 'all' ? 'Add a task to get started!' : \`No \${filter} tasks to show.\`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map(todo => (
              <Card
                key={todo.id}
                className={\`border-0 shadow-md transition-all duration-200 hover:shadow-lg \${
                  todo.completed ? 'bg-gray-50' : 'bg-white hover:scale-[1.01]'
                }\`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 \${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }\`}
                    >
                      {todo.completed && <Check className="w-4 h-4" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={\`font-medium \${
                          todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }\`}>
                          {todo.title}
                        </span>
                        <Badge className={\`text-xs \${getCategoryColor(todo.category)}\`}>
                          {todo.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {todo.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={todo.priority}
                        onChange={(e) => updatePriority(todo.id, e.target.value as Todo['priority'])}
                        className={\`text-xs px-2 py-1 rounded border \${getPriorityColor(todo.priority)}\`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Progress Summary */}
        {todos.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Progress Overview</h3>
                <Badge className="bg-blue-100 text-blue-700">
                  {Math.round((stats.completed / stats.total) * 100)}% Complete
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: \`\${(stats.completed / stats.total) * 100}%\` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-semibold text-gray-900">{stats.total}</div>
                  <div className="text-gray-600">Total</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600">{stats.active}</div>
                  <div className="text-gray-600">Remaining</div>
                </div>
                <div>
                  <div className="font-semibold text-green-600">{stats.completed}</div>
                  <div className="text-gray-600">Done</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default App;
`
};

export const injectVariety = (prompt: string): string => {
  const templates = Object.keys(COMPONENT_TEMPLATES);
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  const uniquenessPrompt = `\nCREATE SOMETHING UNIQUE: Avoid generating typical CRM applications. Be creative and original. 

INSPIRATION (create something different but high-quality like this): Use this as inspiration for modern patterns but create something completely different:
${COMPONENT_TEMPLATES[randomTemplate as keyof typeof COMPONENT_TEMPLATES].substring(0, 800)}...

Make your creation unique and avoid copying this example directly. Focus on: modern design, interactive features, proper state management, and beautiful UI.`;

  return prompt + uniquenessPrompt;
};

export const validateGeneratedCode = (code: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for React imports
  if (!code.includes('import React')) {
    errors.push('Missing React import');
  }
  
  // Check for proper component structure
  if (!code.includes('const App') && !code.includes('function App')) {
    errors.push('Missing App component');
  }
  
  // Check for modern patterns
  if (code.includes('class ') && code.includes('extends React.Component')) {
    errors.push('Using class components instead of functional components');
  }
  
  // Check for proper styling
  if (!code.includes('className') && !code.includes('tailwind')) {
    errors.push('Missing Tailwind CSS styling');
  }
  
  // Check for interactivity
  if (!code.includes('useState') && !code.includes('onClick')) {
    errors.push('Component appears to be non-interactive');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
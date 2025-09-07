# Faber - AI-Powered UI/UX Generator

## 🚀 Overview

Faber is a professional SaaS platform that generates beautiful, production-ready React components using AI. Transform your ideas into stunning UI/UX with natural language prompts.

## ✨ Features

- **AI-Powered Generation**: Create complete React components with natural language
- **Professional Templates**: Dashboard, SaaS, E-commerce, Portfolio, Blog templates
- **Live Preview**: Real-time preview with error handling and validation
- **Multi-User Support**: User authentication and project management
- **Credit System**: Flexible usage-based pricing with multiple plans
- **Export Options**: Download HTML, copy code, or integrate with your projects
- **Design System**: Consistent, accessible components with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **AI**: OpenAI GPT-4o-mini for code generation
- **Payments**: Stripe (ready for integration)
- **Deployment**: Vercel/Netlify ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (already configured)
- OpenAI API key

### Installation
```sh
# Clone the repository
git clone <your-repo-url>
cd faber-ai-generator

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your OpenAI API key to .env.local
# OPENAI_API_KEY=sk-your-key-here

# Start development server
npm run dev
```

### Environment Setup

1. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Supabase**: Already configured with the project
3. **Stripe** (optional): For payment processing

## 📁 Project Structure

```
src/
├── lib/
│   ├── ai/
│   │   ├── generator.ts      # Enhanced AI generation system
│   │   └── templates.ts      # Professional component templates
│   └── plans.ts              # Credit system and pricing plans
├── components/
│   ├── EnhancedCodePreview.tsx  # Advanced preview with error handling
│   ├── TemplateSelector.tsx     # Template selection interface
│   ├── CreditsDisplay.tsx       # User credits and usage display
│   └── ui/                      # shadcn/ui components
├── pages/
│   ├── Index.tsx             # Main landing page
│   ├── Editor.tsx            # Code generation interface
│   ├── Pricing.tsx           # Pricing plans page
│   └── Auth.tsx              # Authentication
└── integrations/supabase/    # Database integration
```

## 🎯 Key Features

### AI Code Generation
- **Smart Templates**: Pre-built templates for common use cases
- **Context-Aware**: Learns from existing code patterns
- **Validation**: Automatic code validation and error fixing
- **Multiple Styles**: Modern, minimal, corporate, creative themes

### User Management
- **Authentication**: Secure user auth with Supabase
- **Project Management**: Save and organize generated components
- **Usage Tracking**: Credit-based system with plan limits
- **Real-time Updates**: Live collaboration and updates

### Developer Experience
- **Live Preview**: Instant preview with hot reloading
- **Error Handling**: Comprehensive error reporting and debugging
- **Export Options**: Multiple export formats (HTML, React, etc.)
- **Code Editor**: Syntax highlighting and editing capabilities

## 💳 Pricing Plans

- **Free**: 10 generations/month, basic templates
- **Starter**: €9/month, 50 generations, all templates
- **Pro**: €29/month, 200 generations, advanced features
- **Enterprise**: €99/month, unlimited generations, white-label

## 🚀 Deployment

### Vercel (Recommended)
```sh
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Production
- `OPENAI_API_KEY`: Your OpenAI API key
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key
- `STRIPE_PUBLIC_KEY`: Stripe publishable key (optional)
- `STRIPE_SECRET_KEY`: Stripe secret key (optional)

## 🔧 Configuration

### Adding New Templates

1. Add your template to `src/lib/ai/templates.ts`
2. Update the category mapping in `getTemplateByCategory()`
3. Add the template to `TemplateSelector.tsx`

### Customizing AI Generation

Edit `src/lib/ai/generator.ts` to:
- Modify the system prompt
- Adjust generation parameters
- Add custom validation rules
- Implement new enhancement patterns

## 📊 Analytics & Monitoring

The platform includes comprehensive logging:
- **Generation Logs**: Track AI generation performance
- **Preview Errors**: Monitor component rendering issues
- **Quality Checks**: Code quality and validation metrics
- **Usage Analytics**: User engagement and credit usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.faber.ai](https://docs.faber.ai)
- **Email**: support@faber.ai
- **Discord**: [Join our community](https://discord.gg/faber)

---

Built with ❤️ by the Faber team
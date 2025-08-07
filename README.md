# Eugene Intelligence

> AI-powered search engine and intelligence platform

Eugene Intelligence is a comprehensive AI-powered search and research platform that brings together multiple search capabilities, AI models, and intelligent analysis tools in one unified interface.

## ✨ Features

### 🔍 Multi-Modal Search
- **Web Search** - Comprehensive web crawling with AI-enhanced results
- **Academic Research** - Access to scholarly articles and research papers
- **Social Media** - Search across Reddit, Twitter, and other platforms
- **News Search** - Real-time news aggregation and analysis
- **Visual Search** - Image and video content discovery
- **Code Search** - Programming resources and code execution
- **Financial Data** - Market analysis and financial information

### 🤖 AI Response Generation
- **6 AI Models** - Claude 4, GPT-4o, Grok 3, Gemini 2.5, Qwen 2.5, Llama 4
- **Streaming Responses** - Real-time AI generation with cancellation
- **Smart Citations** - Automatic referencing of search results [1], [2], etc.
- **Multi-turn Chat** - Contextual conversations with memory
- **Intelligent Analysis** - Synthesizes multiple sources with fact-checking

### 🌟 Smart Features
- **Weather Integration** - Real-time weather and forecasts
- **Maps & Location** - Geographic search and location services
- **Code Execution** - Run and analyze code in multiple languages
- **Multi-Step Research** - Complex query processing
- **Conversation Memory** - Contextual chat sessions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- API keys for desired services (see Environment Variables)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/eugene-intelligence.git
   cd eugene-intelligence
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys (see [Environment Variables](#environment-variables))

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript checks
```

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **AI**: Vercel AI SDK
- **State Management**: React Hooks + TanStack Query
- **Package Manager**: pnpm

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# AI Provider API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
XAI_API_KEY=your_xai_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key

# Search APIs
EXA_API_KEY=your_exa_api_key
SERPER_API_KEY=your_serper_api_key

# Social Media APIs
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Other Services
OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key

# Optional
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_nextauth_secret
VERCEL_ANALYTICS_ID=your_analytics_id
```

## 📁 Project Structure

```
eugene-intelligence/
├── app/                     # Next.js App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── search/             # Search-related components
│   ├── chat/               # Chat interface components
│   └── shared/             # Shared components
├── lib/                    # Utility functions
│   ├── ai/                 # AI provider integrations
│   ├── search/             # Search utilities
│   └── utils.ts            # General utilities
├── types/                  # TypeScript type definitions
├── hooks/                  # Custom React hooks
├── providers/              # React context providers
└── public/                 # Static assets
```

## 🎯 Status & Features

### ✅ Completed Features
- [x] **Real search API integrations** - Tavily & Exa AI
- [x] **AI response generation** - 6 models with streaming
- [x] **Citation system** - Automatic source referencing
- [x] **Multi-provider search** - Automatic failover
- [x] **Professional UI** - Responsive design with error handling

### 🚧 Planned Features
- [ ] User authentication system
- [ ] Conversation history & persistence
- [ ] Advanced filtering options
- [ ] Export functionality (PDF, markdown)

### Future Enhancements
- [ ] Mobile app (React Native)
- [ ] Plugin system
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Custom AI model training

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Scira](https://github.com/Matthew-Anyiam/scira) by Matthew Anyiam
- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- AI integration via [Vercel AI SDK](https://sdk.vercel.ai/)

## 📞 Support

- 📧 Email: info@eugene-intelligence.com
- 💬 Discord: [Join our community](https://discord.gg/eugene-intelligence)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/eugene-intelligence/issues)

---

<p align="center">
  <strong>Eugene Intelligence</strong> - Powered by AI, Built for Research
</p>
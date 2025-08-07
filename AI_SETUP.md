# AI Response Generation Setup Guide

This guide will help you set up the AI response generation system in Eugene Intelligence with support for 6 major AI providers.

## 🤖 Supported AI Models

### Available Models

1. **Claude 4** (Anthropic) - Most advanced reasoning
2. **GPT-4o** (OpenAI) - Multimodal capabilities  
3. **Grok 3** (xAI) - Real-time information access
4. **Gemini 2.5** (Google) - Long context understanding
5. **Qwen 2.5** (Groq) - Ultra-fast inference
6. **Llama 4** (Groq) - Open-source AI power

## 🔑 Getting API Keys

### 1. Anthropic (Claude)
- Visit [Anthropic Console](https://console.anthropic.com)
- Sign up and create an API key
- **Free tier**: $5 free credit
- **Best for**: Complex reasoning, analysis, writing

### 2. OpenAI (GPT)
- Visit [OpenAI API](https://platform.openai.com/api-keys)
- Create account and generate API key
- **Free tier**: $5 free credit for new accounts
- **Best for**: General tasks, multimodal inputs

### 3. xAI (Grok)
- Visit [xAI Console](https://console.x.ai)
- Sign up for API access
- **Free tier**: Limited free credits
- **Best for**: Real-time information, current events

### 4. Google (Gemini)
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Generate API key
- **Free tier**: Generous free usage limits
- **Best for**: Long documents, large context windows

### 5. Groq (Qwen & Llama)
- Visit [Groq Console](https://console.groq.com)
- Create account and get API key
- **Free tier**: High rate limits, fast inference
- **Best for**: Speed, open-source models

## 🛠️ Configuration

### 1. Environment Setup

Add your AI provider API keys to `.env.local`:

```env
# AI Provider API Keys (add at least one)
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-openai-key-here
XAI_API_KEY=your-xai-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key-here
GROQ_API_KEY=gsk_your-groq-key-here

# Search API Keys (required for AI responses)
TAVILY_API_KEY=tvly-your-tavily-key-here
```

### 2. Model Selection

The system automatically detects available models based on your API keys:

- **Available models** are shown in the model selector
- **Unavailable models** are grayed out with error messages
- **Fallback system** tries alternative models if primary fails

## 🚀 Features

### 1. Streaming Responses
- **Real-time generation** - See responses as they're written
- **Cancellation support** - Stop generation at any time
- **Low latency** - Optimized for speed

### 2. Citation System
- **Automatic citations** - AI references search results with [1], [2], etc.
- **Source links** - Click citations to visit original sources
- **Smart referencing** - Only cites relevant, used sources

### 3. Multi-Turn Conversations
- **Context awareness** - AI remembers conversation history
- **Follow-up questions** - Ask clarifying questions
- **Session management** - Clear chat, manage history

### 4. Smart Analysis
- **Search synthesis** - Combines multiple search results
- **Fact checking** - Cross-references information
- **Balanced perspectives** - Shows different viewpoints when relevant

## 🧪 Testing AI Features

### 1. Basic AI Response Test

1. **Start the app**: `pnpm dev`
2. **Search for something**: e.g., "latest AI developments"
3. **Wait for search results** to load
4. **Watch AI analysis** appear in the right column
5. **Verify citations** link back to search results

### 2. Model Switching Test

1. **Change AI model** in the dropdown
2. **Perform same search**
3. **Compare responses** between models
4. **Note performance differences**

### 3. Streaming Test

1. **Watch real-time generation** as AI writes
2. **Test cancellation** with stop button
3. **Verify complete response** includes citations

## 🔧 API Usage

### Direct API Testing

Test AI endpoints directly:

```bash
# Test AI models status
curl http://localhost:3000/api/ai/models

# Test AI chat (non-streaming)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest AI trends?",
    "searchResults": [],
    "model": "claude-4",
    "stream": false
  }'
```

### Streaming Response Test

```javascript
// Test streaming in browser console
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Explain quantum computing',
    searchResults: [],
    model: 'claude-4',
    stream: true
  })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
```

## 🎯 Best Practices

### 1. Model Selection Guide

**For Analysis & Reasoning:**
- **Claude 4** - Best for complex analysis, academic topics
- **GPT-4o** - Good all-around choice, handles images

**For Speed:**
- **Qwen 2.5** - Fastest responses via Groq
- **Llama 4** - Good balance of speed and quality

**For Specific Use Cases:**
- **Grok 3** - Current events, real-time information
- **Gemini 2.5** - Long documents, large context

### 2. Query Optimization

**Good Queries:**
- "Analyze the impact of AI on healthcare based on recent research"
- "Compare different approaches to renewable energy"
- "Explain the latest developments in quantum computing"

**Avoid:**
- Single word queries
- Overly broad topics without context
- Requests for harmful content

### 3. Citation Usage

- **Click citations** to verify sources
- **Check publication dates** for recency
- **Cross-reference** multiple sources for accuracy
- **Be aware** that AI may have limitations in interpretation

## 🔄 Troubleshooting

### Common Issues

**1. "No AI models available"**
- Check API keys in `.env.local`
- Verify key format and validity
- Restart development server
- Check network connectivity

**2. "AI response generation failed"**
- Try different AI model
- Check API quota/billing
- Verify search results are available
- Check browser console for errors

**3. Slow responses**
- Try Groq models for speed
- Reduce query complexity
- Check network connection
- Consider model's typical response time

**4. Citations not working**
- Ensure search results loaded first
- Check search API configuration
- Verify results have valid URLs
- Try refreshing the page

### Rate Limiting

Each provider has different limits:
- **Anthropic**: ~50 requests/minute
- **OpenAI**: Varies by tier
- **Google**: Very generous free tier
- **Groq**: High rate limits
- **xAI**: Limited free usage

## 📊 Monitoring Usage

### Built-in Metrics

The system tracks:
- **Token usage** per request
- **Response times** 
- **Model availability**
- **Error rates**

### External Monitoring

Check your usage in provider dashboards:
- **Anthropic**: console.anthropic.com
- **OpenAI**: platform.openai.com/usage
- **Google**: makersuite.google.com
- **Groq**: console.groq.com
- **xAI**: console.x.ai

## 💡 Advanced Configuration

### Custom System Prompts

Modify `lib/ai/config.ts` to customize:
- Analysis style
- Citation format
- Response length
- Tone and personality

### Model Parameters

Adjust in the code:
- **Temperature**: 0.1-1.0 (creativity)
- **Max tokens**: Response length limit
- **Top-p**: Nucleus sampling

### Provider Priorities

Change fallback order in:
- `lib/ai/ai-response-generator.ts`
- Add custom retry logic
- Implement custom load balancing

## 🎉 Complete Integration

With both search and AI systems configured, Eugene Intelligence provides:

1. **Comprehensive search** across multiple sources
2. **Intelligent AI analysis** with citations
3. **Real-time streaming** responses
4. **Multi-model support** with automatic fallbacks
5. **Professional UI** with proper error handling

The system is now ready for production use with powerful AI-enhanced search capabilities!
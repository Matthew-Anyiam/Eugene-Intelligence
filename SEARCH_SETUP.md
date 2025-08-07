# Search API Setup Guide

This guide will help you set up the search functionality in Eugene Intelligence using Tavily AI and Exa AI.

## 🔑 Getting API Keys

### Tavily AI (Recommended)

1. **Visit [Tavily AI](https://tavily.com)**
2. **Sign up** for a free account
3. **Navigate to the API section** in your dashboard
4. **Generate an API key**
5. **Free tier includes**: 1,000 searches per month

### Exa AI (Alternative)

1. **Visit [Exa AI](https://exa.ai)**
2. **Sign up** for an account
3. **Go to the API Keys section**
4. **Create a new API key**
5. **Free tier includes**: 1,000 searches per month

## 🛠️ Configuration

### 1. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local
```

### 2. Add Your API Keys

Edit `.env.local` and add your API keys:

```env
# Search API Keys (add at least one)
TAVILY_API_KEY=tvly-your-actual-api-key-here
EXA_API_KEY=your-exa-api-key-here

# Optional: Set development mode
NEXT_PUBLIC_ENV=development
```

### 3. Test the Setup

```bash
# Start the development server
pnpm dev

# The app will be available at http://localhost:3000
```

## 🧪 Testing Search Functionality

### 1. Web Interface Testing

1. **Open** http://localhost:3000 in your browser
2. **Enter a search query** (e.g., "latest AI developments")
3. **Select search type** (Web is default)
4. **Click Search** button
5. **Verify** that results are displayed

### 2. API Testing

You can also test the search API directly:

```bash
# Test with curl
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence news",
    "type": "web",
    "numResults": 5
  }'
```

### 3. Provider Status Check

Check if your API keys are working:

```bash
curl http://localhost:3000/api/search/status
```

## 🔧 Troubleshooting

### No Results Returned

**Problem**: Search returns empty results
**Solutions**:
- Check API keys are valid
- Verify network connection
- Check browser console for errors
- Try different search terms

### API Key Errors

**Problem**: "Search service configuration error"
**Solutions**:
- Verify API keys in `.env.local`
- Check API key format (no extra spaces)
- Ensure `.env.local` is in project root
- Restart development server after adding keys

### Network/Timeout Errors

**Problem**: Search requests timeout
**Solutions**:
- Check internet connection
- Try different search provider
- Verify API service status

### Rate Limiting

**Problem**: "Too many requests" error
**Solutions**:
- Wait for rate limit reset
- Use different API key
- Reduce search frequency

## 📊 Search Types Supported

1. **Web Search** - General internet search
2. **Academic** - Research papers and scholarly content
3. **News** - Latest news articles
4. **Social** - Reddit, Twitter content
5. **Code** - Programming resources
6. **Financial** - Market and financial data
7. **Images** - Visual content (where supported)
8. **Videos** - Video content
9. **Weather** - Weather information
10. **Maps** - Location-based search

## 🚀 Advanced Configuration

### Provider Priority

The search system uses Tavily as the primary provider with Exa as fallback. To change this, modify:

```typescript
// In your search request
{
  "query": "your search",
  "provider": "exa" // Force use of Exa
}
```

### Custom Search Options

```typescript
// Example search request with advanced options
{
  "query": "climate change research",
  "type": "academic",
  "numResults": 20,
  "provider": "tavily"
}
```

## 📈 Monitoring Usage

Both providers offer dashboard to monitor your API usage:

- **Tavily**: Check your dashboard at tavily.com
- **Exa**: Monitor usage at exa.ai dashboard

## 💡 Tips for Best Results

1. **Use specific queries** for better results
2. **Choose appropriate search types** for your use case
3. **Academic searches** work best with research-related terms
4. **News searches** are optimized for recent events
5. **Social searches** excel at finding community discussions

## 🔄 Fallback System

Eugene Intelligence implements automatic failover:

1. **Primary**: Attempts search with preferred provider
2. **Fallback**: If primary fails, tries secondary provider
3. **Error**: If both fail, displays helpful error message

This ensures maximum reliability and uptime for your search functionality.
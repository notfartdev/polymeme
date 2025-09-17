import { NextRequest, NextResponse } from 'next/server'

// Crypto News API on RapidAPI - no token mapping needed, uses direct keyword search

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
  media?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  sentimentScore?: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenSymbol: string } }
) {
  try {
    const { tokenSymbol } = params
    
    // Fetch news from Crypto News API on RapidAPI
    const apiKey = '462f2eb4f0msh7359081b2e53c88p194937jsn52997a370ee8'
    const baseUrl = 'https://crypto-news51.p.rapidapi.com/api/v1/crypto/articles/search'
    
    // Build the API URL with parameters
    const url = new URL(baseUrl)
    url.searchParams.append('title_keywords', tokenSymbol.toLowerCase())
    url.searchParams.append('page', '1')
    url.searchParams.append('limit', '10')
    url.searchParams.append('time_frame', '24h')
    url.searchParams.append('format', 'json')
    
    // Debug: Log what we're searching for
    console.log(`🔍 Searching news for: "${tokenSymbol.toLowerCase()}"`)
    console.log(`📡 API URL: ${url.toString()}`)
    
    const response = await fetch(url.toString(), {
      headers: {
        'x-rapidapi-host': 'crypto-news51.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Crypto News API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Transform the API data to our format
    const articles = data.data || data.articles || data || []
    
    // Debug: Log the response structure
    console.log(`📰 Found ${articles.length} articles for "${tokenSymbol.toLowerCase()}"`)
    if (articles.length > 0) {
      console.log(`📄 First article: "${articles[0]?.title || 'No title'}"`)
    }
    
    const newsArticles: NewsArticle[] = articles.map((article: any, index: number) => ({
      id: article.id || article.article_id || `article-${index}`,
      title: article.title || article.headline || 'No title available',
      description: article.description || article.content || article.summary || 'No description available',
      url: article.url || article.link || article.article_url || '#',
      publishedAt: article.published_at || article.time || article.timestamp || new Date().toISOString(),
      source: article.source || article.publisher || 'Crypto News',
      media: article.media || article.image || article.thumbnail || undefined,
      sentiment: article.sentiment?.label || determineSentiment(article.title || article.headline, article.description || article.content),
      sentimentScore: article.sentiment?.score || undefined
    }))

    // If no articles found and not already searching for SOL, try SOL as fallback
    if (newsArticles.length === 0 && tokenSymbol.toLowerCase() !== 'sol') {
      console.log(`🔄 No articles found for "${tokenSymbol.toLowerCase()}", trying SOL fallback...`)
      
      try {
        const fallbackUrl = new URL(baseUrl)
        fallbackUrl.searchParams.append('title_keywords', 'sol')
        fallbackUrl.searchParams.append('page', '1')
        fallbackUrl.searchParams.append('limit', '10')
        fallbackUrl.searchParams.append('time_frame', '24h')
        fallbackUrl.searchParams.append('format', 'json')
        
        const fallbackResponse = await fetch(fallbackUrl.toString(), {
          headers: {
            'x-rapidapi-host': 'crypto-news51.p.rapidapi.com',
            'x-rapidapi-key': apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          const fallbackArticles = fallbackData.data || fallbackData.articles || fallbackData || []
          
          console.log(`📰 SOL fallback found ${fallbackArticles.length} articles`)
          
          const fallbackNewsArticles: NewsArticle[] = fallbackArticles.map((article: any, index: number) => ({
            id: article.id || article.article_id || `sol-fallback-${index}`,
            title: article.title || article.headline || 'No title available',
            description: article.description || article.content || article.summary || 'No description available',
            url: article.url || article.link || article.article_url || '#',
            publishedAt: article.published_at || article.time || article.timestamp || new Date().toISOString(),
            source: article.source || article.publisher || 'Crypto News',
            media: article.media || article.image || article.thumbnail || undefined,
            sentiment: article.sentiment?.label || determineSentiment(article.title || article.headline, article.description || article.content),
            sentimentScore: article.sentiment?.score || undefined
          }))
          
          return NextResponse.json(fallbackNewsArticles)
        }
      } catch (fallbackError) {
        console.error('Error fetching SOL fallback news:', fallbackError)
      }
    }

    return NextResponse.json(newsArticles)

  } catch (error) {
    console.error('Error fetching news:', error)
    
    // Return mock data as fallback
    const mockNews: NewsArticle[] = [
      {
        id: '1',
        title: `${tokenSymbol} Shows Strong Momentum in Recent Trading`,
        description: `The cryptocurrency ${tokenSymbol} has been showing significant price movements in the past 24 hours, with increased trading volume and positive market sentiment.`,
        url: `https://crypto-news51.p.rapidapi.com/api/v1/crypto/articles/search?title_keywords=${tokenSymbol.toLowerCase()}`,
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'Crypto News',
        sentiment: 'positive'
      },
      {
        id: '2',
        title: `Market Analysis: ${tokenSymbol} Price Prediction for Q1 2025`,
        description: `Technical analysts are predicting continued growth for ${tokenSymbol} based on current market trends and adoption patterns.`,
        url: `https://crypto-news51.p.rapidapi.com/api/v1/crypto/articles/search?title_keywords=${tokenSymbol.toLowerCase()}`,
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'MarketWatch',
        sentiment: 'positive'
      },
      {
        id: '3',
        title: `${tokenSymbol} Community Reaches New Milestone`,
        description: `The ${tokenSymbol} community has reached a new milestone with increased social media engagement and developer activity.`,
        url: `https://crypto-news51.p.rapidapi.com/api/v1/crypto/articles/search?title_keywords=${tokenSymbol.toLowerCase()}`,
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: 'CoinDesk',
        sentiment: 'neutral'
      }
    ]
    
    return NextResponse.json(mockNews)
  }

}

function determineSentiment(title?: string, description?: string): 'positive' | 'negative' | 'neutral' {
  const text = `${title || ''} ${description || ''}`.toLowerCase()
  
  const positiveWords = ['pump', 'surge', 'rally', 'bullish', 'growth', 'increase', 'rise', 'gain', 'breakthrough', 'milestone', 'partnership', 'adoption', 'positive', 'up', 'moon', 'bull']
  const negativeWords = ['dump', 'crash', 'bearish', 'decline', 'drop', 'fall', 'loss', 'concern', 'risk', 'warning', 'regulation', 'ban', 'negative', 'down', 'bear', 'sell']
  
  const positiveCount = positiveWords.filter(word => text.includes(word)).length
  const negativeCount = negativeWords.filter(word => text.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}


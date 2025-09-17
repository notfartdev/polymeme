"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Calendar, TrendingUp } from 'lucide-react'

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

interface TokenNewsProps {
  tokenSymbol: string
  tokenName: string
}

export function TokenNews({ tokenSymbol, tokenName }: TokenNewsProps) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()
  }, [tokenSymbol])

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch real news from our API endpoint
      const response = await fetch(`/api/news/${tokenSymbol}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`)
      }
      
      const newsData = await response.json()
      setNews(newsData)
    } catch (err) {
      console.error('Error fetching news:', err)
      setError('Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200'
      case 'negative': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Latest News</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Latest News</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={fetchNews}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Latest News</h3>
        <Badge variant="outline" className="ml-auto">
          {news.length} articles
        </Badge>
      </div>

      <div className="space-y-4">
        {news.map((article) => (
          <div key={article.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  {article.media && (
                    <img 
                      src={article.media} 
                      alt={article.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTimeAgo(article.publishedAt)}
                      </div>
                      <span>•</span>
                      <span>{article.source}</span>
                      {article.sentiment && (
                        <>
                          <span>•</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0.5 ${getSentimentColor(article.sentiment)}`}
                          >
                            {article.sentiment}
                            {article.sentimentScore && (
                              <span className="ml-1 opacity-70">
                                ({Math.round(article.sentimentScore * 100)}%)
                              </span>
                            )}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                title="Read full article"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        ))}
      </div>

    </Card>
  )
}

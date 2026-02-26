import axios from 'axios';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = (import.meta as any).env?.VITE_FINNHUB_API_KEY || 'd6g9gjhr01qt49322b30d6g9gjhr01qt49322b3g';

export interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubCompanyNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubSentiment {
  buzz: {
    buzz: number;
    weeklyAverage: number;
  };
  companyNewsScore: number;
  sectorAverageBullishPercent: number;
  sectorAverageNewsScore: number;
  sentiment: {
    bearishPercent: number;
    bullishPercent: number;
  };
}

class FinnhubService {
  private apiKey: string;

  constructor() {
    this.apiKey = API_KEY || '';
    if (!this.apiKey) {
      console.warn('Finnhub API key not found. Please set VITE_FINNHUB_API_KEY in your .env file');
    }
  }

  async getMarketNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'): Promise<FinnhubNewsItem[]> {
    try {
      // For GitHub Pages, we need to use a public CORS proxy or fallback
      const apiUrl = `${FINNHUB_BASE_URL}/news?category=${category}&token=${this.apiKey}`;
      
      // Try multiple CORS proxies in order
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`,
        `https://cors-anywhere.herokuapp.com/${apiUrl}`
      ];

      for (const proxyUrl of proxies) {
        try {
          console.log(`Trying proxy: ${proxyUrl}`);
          const response = await axios.get(proxyUrl, {
            timeout: 10000,
            headers: {
              'Origin': window.location.origin
            }
          });

          // Handle different proxy response formats
          let data;
          if (response.data.contents) {
            // allorigins.win format
            data = JSON.parse(response.data.contents);
          } else if (Array.isArray(response.data)) {
            // Direct response or corsproxy.io
            data = response.data;
          } else {
            // Try to parse as JSON
            data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          }

          if (Array.isArray(data) && data.length > 0) {
            console.log('Successfully fetched news via proxy');
            return data;
          }
        } catch (proxyError) {
          console.warn(`Proxy ${proxyUrl} failed:`, proxyError instanceof Error ? proxyError.message : 'Unknown error');
          continue;
        }
      }

      // All proxies failed, use fallback
      console.warn('All proxies failed, using fallback data');
      return this.getFallbackNews(category);

    } catch (error) {
      console.error('Error fetching market news:', error);
      return this.getFallbackNews(category);
    }
  }

  private getFallbackNews(category: string = 'general'): FinnhubNewsItem[] {
    // Return realistic mock data based on category
    const categoryNews = {
      general: [
        {
          category: "general",
          datetime: Math.floor(Date.now() / 1000),
          headline: "Federal Reserve Signals Potential Rate Changes Amid Economic Uncertainty",
          id: 1,
          image: "https://picsum.photos/seed/fed-news/400/200",
          related: "AAPL,GOOGL,MSFT,JPM",
          source: "Reuters",
          summary: "The Federal Reserve indicated possible adjustments to interest rates as economic data shows mixed signals about inflation and growth.",
          url: "#"
        },
        {
          category: "general",
          datetime: Math.floor(Date.now() / 1000) - 1800,
          headline: "Tech Giants Report Strong Earnings Despite Market Volatility",
          id: 2,
          image: "https://picsum.photos/seed/tech-earnings/400/200",
          related: "AAPL,MSFT,GOOGL,META",
          source: "Bloomberg",
          summary: "Major technology companies exceeded earnings expectations, providing a boost to investor confidence in the sector.",
          url: "#"
        }
      ],
      forex: [
        {
          category: "forex",
          datetime: Math.floor(Date.now() / 1000),
          headline: "USD Strengthens Against Major Currencies Following Fed Comments",
          id: 3,
          image: "https://picsum.photos/seed/forex-usd/400/200",
          related: "EUR,GBP,JPY",
          source: "Forex.com",
          summary: "The US dollar gained ground as Federal Reserve officials hinted at maintaining current monetary policy stance.",
          url: "#"
        }
      ],
      crypto: [
        {
          category: "crypto",
          datetime: Math.floor(Date.now() / 1000),
          headline: "Bitcoin Surges Past $45,000 as Institutional Interest Grows",
          id: 4,
          image: "https://picsum.photos/seed/bitcoin-rally/400/200",
          related: "BTC,ETH,ADA",
          source: "CoinDesk",
          summary: "Bitcoin reached new monthly highs as major financial institutions announced increased cryptocurrency exposure.",
          url: "#"
        }
      ],
      merger: [
        {
          category: "merger",
          datetime: Math.floor(Date.now() / 1000),
          headline: "Major Tech Acquisition Deal Worth $50 Billion Announced",
          id: 5,
          image: "https://picsum.photos/seed/merger-deal/400/200",
          related: "AAPL,MSFT,GOOGL",
          source: "Wall Street Journal",
          summary: "A significant merger agreement was announced today, potentially reshaping the competitive landscape in the technology sector.",
          url: "#"
        }
      ]
    };

    return categoryNews[category as keyof typeof categoryNews] || categoryNews.general;
  }

  async getCompanyNews(symbol: string, from: string, to: string): Promise<FinnhubCompanyNews[]> {
    try {
      const response = await axios.get(`${FINNHUB_BASE_URL}/company-news`, {
        params: {
          symbol,
          from,
          to,
          token: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching company news:', error);
      return [];
    }
  }

  async getNewsSentiment(symbol: string): Promise<FinnhubSentiment | null> {
    try {
      const response = await axios.get(`${FINNHUB_BASE_URL}/news-sentiment`, {
        params: {
          id: symbol,
          token: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching news sentiment:', error);
      return null;
    }
  }

  // Convert Finnhub news to app's NewsItem format
  convertFinnhubNewsToAppFormat(finnhubNews: FinnhubNewsItem[] | FinnhubCompanyNews[]): any[] {
    return finnhubNews.map((item, index) => ({
      id: `finnhub-${item.id || index}`,
      title: item.headline,
      source: item.source,
      url: item.url,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      sentiment: this.calculateSentiment(item.headline, item.summary),
      sentimentLabel: this.getSentimentLabel(item.headline, item.summary),
      impactScore: Math.random() * 10, // Calculate based on content
      relatedStocks: item.related ? item.related.split(',').map(s => s.trim()) : [],
      summary: item.summary,
      imageUrl: item.image,
    }));
  }

  private calculateSentiment(headline: string, summary: string): number {
    // Simple sentiment calculation based on keywords
    const positiveWords = ['up', 'rise', 'gain', 'growth', 'positive', 'bull', 'strong', 'high', 'increase'];
    const negativeWords = ['down', 'fall', 'loss', 'decline', 'negative', 'bear', 'weak', 'low', 'decrease'];
    
    const text = `${headline} ${summary}`.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) score += 0.1;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) score -= 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  private getSentimentLabel(headline: string, summary: string): 'positive' | 'neutral' | 'negative' {
    const sentiment = this.calculateSentiment(headline, summary);
    if (sentiment > 0.1) return 'positive';
    if (sentiment < -0.1) return 'negative';
    return 'neutral';
  }
}

export const finnhubService = new FinnhubService();

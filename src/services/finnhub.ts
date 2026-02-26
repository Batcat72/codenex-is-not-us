import axios from 'axios';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

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
      const response = await axios.get(`${FINNHUB_BASE_URL}/news`, {
        params: {
          category,
          token: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching market news:', error);
      return [];
    }
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

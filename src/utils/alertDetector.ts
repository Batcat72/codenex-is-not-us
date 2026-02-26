export interface MarketAlert {
  id: string;
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  detectedAt: Date;
  keywords: string[];
  source: string;
}

export class AlertDetector {
  private static readonly HIGH_IMPACT_KEYWORDS = [
    'inflation',
    'interest rate',
    'interest rates',
    'federal reserve',
    'fed',
    'recession',
    'economic downturn',
    'market crash',
    'financial crisis',
    'bankruptcy',
    'regulation',
    'regulatory',
    'sec investigation',
    'antitrust',
    'monopoly',
    'ai breakthrough',
    'artificial intelligence breakthrough',
    'quantum computing',
    'technological breakthrough',
    'earnings beat',
    'earnings miss',
    'quarterly earnings',
    'merger',
    'acquisition',
    'takeover',
    'ipo',
    'initial public offering',
    'stock split',
    'dividend cut',
    'dividend increase',
    'ceo resignation',
    'leadership change',
    'cyber attack',
    'data breach',
    'supply chain',
    'inflation data',
    'cpi',
    'consumer price index',
    'gdp',
    'gross domestic product',
    'unemployment',
    'jobless claims',
    'market volatility',
    'volatility index',
    'vix'
  ];

  private static readonly MEDIUM_IMPACT_KEYWORDS = [
    'earnings',
    'profit',
    'revenue',
    'sales',
    'growth',
    'expansion',
    'downgrade',
    'upgrade',
    'rating',
    'outlook',
    'forecast',
    'guidance',
    'partnership',
    'collaboration',
    'investment',
    'funding',
    'valuation',
    'market share',
    'competition',
    'innovation',
    'research',
    'development',
    'patent',
    'launch',
    'release',
    'product',
    'service',
    'customer',
    'client',
    'contract',
    'deal',
    'agreement'
  ];

  private static readonly LOW_IMPACT_KEYWORDS = [
    'announcement',
    'update',
    'report',
    'analysis',
    'commentary',
    'opinion',
    'prediction',
    'estimate',
    'expectation',
    'trend',
    'pattern',
    'strategy',
    'plan',
    'initiative',
    'program',
    'project',
    'campaign',
    'event',
    'conference',
    'meeting',
    'presentation',
    'interview',
    'statement',
    'response',
    'reaction',
    'impact',
    'effect',
    'influence',
    'change',
    'shift',
    'movement',
    'fluctuation'
  ];

  static detectAlerts(newsItems: any[]): MarketAlert[] {
    const alerts: MarketAlert[] = [];
    
    newsItems.forEach((item, index) => {
      const alert = this.analyzeNewsItem(item, index);
      if (alert) {
        alerts.push(alert);
      }
    });

    return alerts.sort((a, b) => {
      // Sort by impact level first, then by detection time
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;
      
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });
  }

  private static analyzeNewsItem(item: any, index: number): MarketAlert | null {
    const textToAnalyze = `${item.title || ''} ${item.summary || ''} ${item.headline || ''}`.toLowerCase();
    
    // Check for high impact keywords first
    const highImpactMatches = this.findKeywords(textToAnalyze, this.HIGH_IMPACT_KEYWORDS);
    if (highImpactMatches.length > 0) {
      return this.createAlert(item, 'high', highImpactMatches, index);
    }

    // Check for medium impact keywords
    const mediumImpactMatches = this.findKeywords(textToAnalyze, this.MEDIUM_IMPACT_KEYWORDS);
    if (mediumImpactMatches.length > 1) { // Require at least 2 medium keywords
      return this.createAlert(item, 'medium', mediumImpactMatches, index);
    }

    // Check for low impact keywords
    const lowImpactMatches = this.findKeywords(textToAnalyze, this.LOW_IMPACT_KEYWORDS);
    if (lowImpactMatches.length > 2) { // Require at least 3 low keywords
      return this.createAlert(item, 'low', lowImpactMatches, index);
    }

    return null;
  }

  private static findKeywords(text: string, keywords: string[]): string[] {
    const matches: string[] = [];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    });

    return matches;
  }

  private static createAlert(item: any, impact: 'high' | 'medium' | 'low', keywords: string[], index: number): MarketAlert {
    return {
      id: `alert-${Date.now()}-${index}`,
      title: item.title || item.headline || 'Market Alert',
      summary: item.summary || 'High-impact market news detected',
      impact,
      category: item.category || 'general',
      detectedAt: new Date(),
      keywords,
      source: item.source || 'Unknown'
    };
  }

  static getImpactColor(impact: 'high' | 'medium' | 'low'): string {
    switch (impact) {
      case 'high':
        return '#ef4444'; // red
      case 'medium':
        return '#f59e0b'; // amber
      case 'low':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  }

  static getImpactIcon(impact: 'high' | 'medium' | 'low'): string {
    switch (impact) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '📢';
    }
  }
}

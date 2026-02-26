import React, { useState, useEffect, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter
} from 'recharts';
import {
  Wallet, TrendingUp, BookOpen, Brain, MessageSquare, Users,
  BarChart3, Shield, Zap, ChevronRight, Star, Award, Target,
  Activity, Clock, CheckCircle, XCircle, AlertCircle, Info,
  Menu, X, User, LogOut, Settings, Bell, Search, Plus,
  ArrowUpRight, ArrowDownRight, DollarSign, Percent, Calendar,
  Globe, Lock, Mail, Key, Smartphone, RefreshCw, Download,
  ExternalLink, Play, Pause, Volume2, VolumeX, Heart, Share2,
  Filter, SortAsc, MoreHorizontal, Edit, Trash2, Eye, EyeOff,
  Copy, Check, TrendingDown, DollarSign as DollarSignIcon,
  PieChart as PieChartIcon, LineChart as LineChartIcon,
  BarChart as BarChartIcon, Sun, Moon, Home, GraduationCap,
  BrainCircuit, Newspaper, MessageCircle, ShieldCheck, Rocket
} from 'lucide-react';
import { finnhubService } from './services/finnhub';
import { AlertDetector, MarketAlert } from './utils/alertDetector';

// ============================================
// TYPES & INTERFACES
// ============================================

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  walletAddress?: string;
  avatar?: string;
  createdAt: string;
}

interface UserProfile {
  userId: string;
  learningProgress: number;
  completedLessons: string[];
  quizScores: QuizAttempt[];
  predictionHistory: Prediction[];
  portfolio: PortfolioItem[];
  totalPoints: number;
  rank: number;
  badges: Badge[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessons: Lesson[];
  progress: number;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  duration: string;
  order: number;
  completed: boolean;
  videoUrl?: string;
}

interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  questions: Question[];
  timeLimit?: number;
  passingScore: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; selected: number; correct: number }[];
  completedAt: string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  peRatio: number;
  high52: number;
  low52: number;
  historicalData: PricePoint[];
}

interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Prediction {
  id: string;
  symbol: string;
  direction: 'up' | 'down';
  confidence: number;
  targetPrice: number;
  submittedAt: string;
  actualDirection?: 'up' | 'down';
  actualPrice?: number;
  accuracy?: number;
  explanation?: string;
}

interface AIPrediction {
  symbol: string;
  direction: 'up' | 'down';
  confidence: number;
  targetPrice: number;
  factors: { name: string; impact: number; weight: number }[];
  shapValues: { feature: string; value: number }[];
  explanation: string;
  generatedAt: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  impactScore: number;
  relatedStocks: string[];
  summary: string;
  imageUrl?: string;
}

interface SentimentAnalysis {
  symbol: string;
  overallSentiment: number;
  newsCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  trend: number[];
  correlation: number;
}

interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface PortfolioAnalysis {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  allocation: { name: string; value: number; percent: number }[];
  riskScore: number;
  sharpeRatio: number;
  beta: number;
  volatility: number;
  maxDrawdown: number;
  dailyReturns: { date: string; return: number }[];
  riskReturnScatter: { risk: number; return: number; name: string }[];
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  room: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  lastMessage?: string;
}

interface AdvisorResponse {
  query: string;
  response: string;
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  positionSizing?: { symbol: string; recommendedShares: number; reasoning: string }[];
  educationalInsights: string[];
  relevantNews: NewsItem[];
  generatedAt: string;
}

// ============================================
// CONTEXT
// ============================================

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  web3Login: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generateHistoricalData = (symbol: string, days: number = 90): PricePoint[] => {
  const data: PricePoint[] = [];
  let basePrice = symbol === 'AAPL' ? 175 : symbol === 'GOOGL' ? 140 : symbol === 'MSFT' ? 380 : symbol === 'TSLA' ? 250 : 100;
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
    basePrice += change;
    const open = basePrice + (Math.random() - 0.5) * 5;
    const high = Math.max(open, basePrice) + Math.random() * 3;
    const low = Math.min(open, basePrice) - Math.random() * 3;
    const close = basePrice;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000
    });
  }
  return data;
};

const generateNewsData = (): NewsItem[] => {
  const sources = ['Bloomberg', 'Reuters', 'CNBC', 'MarketWatch', 'Yahoo Finance', 'The Wall Street Journal'];
  const stocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA'];
  
  return Array.from({ length: 20 }, (_, i) => {
    const stock = stocks[Math.floor(Math.random() * stocks.length)];
    const sentiment = Math.random() - 0.3;
    const sentimentLabel = sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral';
    
    const titles = {
      positive: [`${stock} surges on strong earnings report`, `${stock} announces breakthrough technology`, `${stock} exceeds analyst expectations`],
      negative: [`${stock} faces regulatory challenges`, `${stock} misses revenue targets`, `${stock} stock drops amid market concerns`],
      neutral: [`${stock} reports quarterly results`, `${stock} announces leadership changes`, `${stock} market analysis`]
    };
    
    const titleList = titles[sentimentLabel as keyof typeof titles];
    
    return {
      id: `news-${i}`,
      title: titleList[Math.floor(Math.random() * titleList.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      url: '#',
      publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      sentiment: parseFloat(sentiment.toFixed(2)),
      sentimentLabel,
      impactScore: parseFloat((Math.random() * 10).toFixed(1)),
      relatedStocks: [stock, ...stocks.filter(s => s !== stock).slice(0, 2)],
      summary: `This article discusses the latest developments affecting ${stock} and its potential impact on the market...`,
      imageUrl: 'https://picsum.photos/seed/' + i + '/400/200'
    };
  });
};

const generateCourses = (): Course[] => [
  {
    id: 'course-1',
    title: 'Introduction to Stock Market',
    description: 'Learn the fundamentals of stock market investing, from basic concepts to first trades.',
    thumbnail: 'https://picsum.photos/seed/course1/400/250',
    difficulty: 'beginner',
    duration: '4 hours',
    progress: 75,
    lessons: [
      { id: 'lesson-1-1', courseId: 'course-1', title: 'What is a Stock?', content: 'A stock represents ownership in a company...', duration: '15 min', order: 1, completed: true },
      { id: 'lesson-1-2', courseId: 'course-1', title: 'How Stock Markets Work', content: 'Stock markets are exchanges where shares are traded...', duration: '20 min', order: 2, completed: true },
      { id: 'lesson-1-3', courseId: 'course-1', title: 'Types of Orders', content: 'Market orders, limit orders, and stop orders...', duration: '25 min', order: 3, completed: true },
      { id: 'lesson-1-4', courseId: 'course-1', title: 'Reading Stock Charts', content: 'Understanding candlestick patterns and technical indicators...', duration: '30 min', order: 4, completed: false },
    ]
  },
  {
    id: 'course-2',
    title: 'Technical Analysis Mastery',
    description: 'Master chart patterns, indicators, and technical trading strategies.',
    thumbnail: 'https://picsum.photos/seed/course2/400/250',
    difficulty: 'intermediate',
    duration: '6 hours',
    progress: 40,
    lessons: [
      { id: 'lesson-2-1', courseId: 'course-2', title: 'Support and Resistance', content: 'Learn to identify key price levels...', duration: '25 min', order: 1, completed: true },
      { id: 'lesson-2-2', courseId: 'course-2', title: 'Moving Averages', content: 'Understanding SMA, EMA, and their trading signals...', duration: '30 min', order: 2, completed: true },
      { id: 'lesson-2-3', courseId: 'course-2', title: 'RSI and Momentum', content: 'Using RSI, MACD, and other momentum indicators...', duration: '35 min', order: 3, completed: false },
    ]
  },
  {
    id: 'course-3',
    title: 'AI-Powered Trading',
    description: 'Leverage machine learning and AI for smarter investment decisions.',
    thumbnail: 'https://picsum.photos/seed/course3/400/250',
    difficulty: 'advanced',
    duration: '8 hours',
    progress: 15,
    lessons: [
      { id: 'lesson-3-1', courseId: 'course-3', title: 'Introduction to ML in Finance', content: 'How machine learning transforms investing...', duration: '30 min', order: 1, completed: true },
      { id: 'lesson-3-2', courseId: 'course-3', title: 'Predictive Models', content: 'Understanding LSTM, regression, and classification...', duration: '45 min', order: 2, completed: false },
    ]
  }
];

const generatePortfolio = (): PortfolioItem[] => [
  { id: 'port-1', symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avgPrice: 165.50, currentPrice: 178.25, marketValue: 8912.50, costBasis: 8275, gainLoss: 637.50, gainLossPercent: 7.70 },
  { id: 'port-2', symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 25, avgPrice: 135.00, currentPrice: 142.80, marketValue: 3570, costBasis: 3375, gainLoss: 195, gainLossPercent: 5.78 },
  { id: 'port-3', symbol: 'MSFT', name: 'Microsoft Corp.', shares: 30, avgPrice: 365.00, currentPrice: 385.50, marketValue: 11565, costBasis: 10950, gainLoss: 615, gainLossPercent: 5.62 },
  { id: 'port-4', symbol: 'TSLA', name: 'Tesla Inc.', shares: 20, avgPrice: 245.00, currentPrice: 238.75, marketValue: 4775, costBasis: 4900, gainLoss: -125, gainLossPercent: -2.55 },
];

const generatePortfolioAnalysis = (): PortfolioAnalysis => {
  const portfolio = generatePortfolio();
  const totalValue = portfolio.reduce((sum, item) => sum + item.marketValue, 0);
  const totalCost = portfolio.reduce((sum, item) => sum + item.costBasis, 0);
  const totalGainLoss = totalValue - totalCost;
  
  return {
    totalValue,
    totalGainLoss,
    totalGainLossPercent: (totalGainLoss / totalCost) * 100,
    allocation: portfolio.map(item => ({
      name: item.symbol,
      value: item.marketValue,
      percent: (item.marketValue / totalValue) * 100
    })),
    riskScore: 6.5,
    sharpeRatio: 1.42,
    beta: 1.15,
    volatility: 18.5,
    maxDrawdown: -12.3,
    dailyReturns: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      return: (Math.random() - 0.45) * 4
    })).reverse(),
    riskReturnScatter: portfolio.map(item => ({
      risk: Math.random() * 20 + 10,
      return: Math.random() * 30 + 5,
      name: item.symbol
    }))
  };
};

const generateAIPrediction = (symbol: string): AIPrediction => {
  const direction = Math.random() > 0.45 ? 'up' : 'down';
  const confidence = Math.random() * 30 + 60;
  
  return {
    symbol,
    direction,
    confidence: parseFloat(confidence.toFixed(1)),
    targetPrice: parseFloat((Math.random() * 50 + 150).toFixed(2)),
    factors: [
      { name: 'Technical Indicators', impact: 0.35, weight: 0.30 },
      { name: 'Market Sentiment', impact: 0.25, weight: 0.25 },
      { name: 'News Analysis', impact: 0.20, weight: 0.20 },
      { name: 'Volume Patterns', impact: 0.15, weight: 0.15 },
      { name: 'Historical Patterns', impact: 0.05, weight: 0.10 }
    ],
    shapValues: [
      { feature: 'RSI', value: 0.25 },
      { feature: 'MACD', value: 0.18 },
      { feature: 'Volume', value: 0.15 },
      { feature: 'Moving Avg', value: 0.12 },
      { feature: 'News Sentiment', value: 0.10 }
    ],
    explanation: `Based on our LSTM model analysis, ${symbol} shows ${direction} momentum with ${confidence.toFixed(1)}% confidence. Technical indicators suggest ${direction === 'up' ? 'bullish' : 'bearish'} conditions driven by strong volume patterns and positive news sentiment. The RSI indicates the stock is ${direction === 'up' ? 'emerging from oversold' : 'approaching overbought'} territory.`,
    generatedAt: new Date().toISOString()
  };
};

// ============================================
// AUTH PROVIDER
// ============================================

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newUser: User = {
      id: 'user-1',
      email,
      name: email.split('@')[0],
      role: 'user',
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const register = async (email: string, password: string, name: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newUser: User = {
      id: 'user-' + Date.now(),
      email,
      name,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const web3Login = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newUser: User = {
      id: 'user-web3-' + Date.now(),
      email: 'web3@wallet.com',
      name: 'Web3 User',
      role: 'user',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, web3Login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// UI COMPONENTS
// ============================================

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; size?: 'sm' | 'md' | 'lg' }> = 
  ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
      secondary: 'bg-gray-800 hover:bg-gray-700 text-white',
      outline: 'border-2 border-gray-300 hover:border-blue-500 hover:text-blue-500 text-gray-700',
      ghost: 'hover:bg-gray-100 text-gray-700'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    
    return (
      <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {children}
      </button>
    );
  };

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`} onClick={onClick}>
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }> = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; max?: number; className?: string }> = ({ value, max = 100, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
    <div 
      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-500"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {children}
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <input
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// ============================================
// AUTH SCREENS
// ============================================

const LoginScreen: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <BrainCircuit className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <Button variant="outline" className="w-full" onClick={() => {}}>
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet (Web3)
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={onSwitch} className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const RegisterScreen: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await register(email, password, name);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Start your AI-powered finance journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={onSwitch} className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
};

// ============================================
// NAVIGATION
// ============================================

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const Navigation: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'learning', label: 'Learning', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'prediction', label: 'Prediction Playground', icon: <Brain className="w-5 h-5" /> },
    { id: 'news', label: 'News Intelligence', icon: <Newspaper className="w-5 h-5" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'advisor', label: 'AI Advisor', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'community', label: 'Community', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FinEdu AI
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t"
          >
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
              {user && (
                <div className="pt-4 mt-4 border-t">
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout}>
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// ============================================
// DASHBOARD
// ============================================

const Dashboard: React.FC<any> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const courses = generateCourses();
  const portfolio = generatePortfolio();
  const recentPredictions: Prediction[] = [
    { id: 'pred-1', symbol: 'AAPL', direction: 'up', confidence: 78.5, targetPrice: 195, submittedAt: new Date(Date.now() - 3600000).toISOString(), actualDirection: 'up', accuracy: 100 },
    { id: 'pred-2', symbol: 'TSLA', direction: 'down', confidence: 65.2, targetPrice: 230, submittedAt: new Date(Date.now() - 7200000).toISOString(), actualDirection: 'up', accuracy: 0 },
    { id: 'pred-3', symbol: 'GOOGL', direction: 'up', confidence: 82.1, targetPrice: 155, submittedAt: new Date(Date.now() - 14400000).toISOString(), actualDirection: 'up', accuracy: 100 },
  ];

  const stats = [
    { label: 'Learning Progress', value: '63%', icon: <BookOpen className="w-6 h-6" />, color: 'from-blue-500 to-blue-600' },
    { label: 'Predictions Made', value: '47', icon: <Brain className="w-6 h-6" />, color: 'from-purple-500 to-purple-600' },
    { label: 'Portfolio Value', value: '$28,822', icon: <DollarSign className="w-6 h-6" />, color: 'from-green-500 to-green-600' },
    { label: 'Accuracy Rate', value: '67%', icon: <Target className="w-6 h-6" />, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Investor'}! 👋</h1>
        <p className="text-blue-100 mb-6">Continue your journey to financial intelligence</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-800 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Prediction</h3>
              <p className="text-sm text-gray-500">Make your next prediction</p>
            </div>
          </div>
          <Button className="w-full" onClick={() => setActiveTab('prediction')}>Start Predicting</Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Continue Learning</h3>
              <p className="text-sm text-gray-500">Resume your course</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => setActiveTab('learning')}>Go to Learning</Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Ask AI Advisor</h3>
              <p className="text-sm text-gray-500">Get personalized advice</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setActiveTab('advisor')}>Chat Now</Button>
        </Card>
      </div>

      {/* Courses Progress */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Courses</h2>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <img src={course.thumbnail} alt={course.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={course.difficulty === 'beginner' ? 'success' : course.difficulty === 'intermediate' ? 'warning' : 'error'}>
                      {course.difficulty}
                    </Badge>
                    <span className="text-sm text-gray-500">{course.duration}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <ProgressBar value={course.progress} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Predictions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Predictions</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentPredictions.map((pred) => (
                  <tr key={pred.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{pred.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center ${pred.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {pred.direction === 'up' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                        {pred.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${pred.confidence > 75 ? 'bg-green-500' : pred.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${pred.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm">{pred.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">${pred.targetPrice}</td>
                    <td className="px-6 py-4">
                      {pred.actualDirection ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          pred.actualDirection === pred.direction 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pred.actualDirection.toUpperCase()}
                        </span>
                      ) : (
                        <Badge>Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {pred.accuracy !== undefined ? (
                        <span className={`font-medium ${pred.accuracy === 100 ? 'text-green-600' : 'text-red-600'}`}>
                          {pred.accuracy}%
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================
// LEARNING MODULE
// ============================================

const LearningModule: React.FC = () => {
  const courses = generateCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const quizzes: Quiz[] = [
    {
      id: 'quiz-1',
      lessonId: 'lesson-1-1',
      title: 'Stock Market Basics',
      timeLimit: 300,
      passingScore: 70,
      questions: [
        {
          id: 'q1',
          text: 'What does owning a stock represent?',
          options: ['Debt in the company', 'Ownership in the company', 'A loan to the company', 'A guarantee of profits'],
          correctAnswer: 1,
          explanation: 'Owning a stock represents partial ownership (equity) in the company.'
        },
        {
          id: 'q2',
          text: 'Which of the following is NOT a type of stock order?',
          options: ['Market Order', 'Limit Order', 'Stop Order', 'Fixed Order'],
          correctAnswer: 3,
          explanation: 'Fixed Order is not a standard stock order type. Common types include Market, Limit, and Stop orders.'
        },
        {
          id: 'q3',
          text: 'What is the primary purpose of a stock exchange?',
          options: ['To print money', 'To facilitate buying and selling of securities', 'To issue stocks', 'To set stock prices'],
          correctAnswer: 1,
          explanation: 'Stock exchanges provide a marketplace where securities can be bought and sold efficiently.'
        },
      ]
    },
  ];

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const handleQuizSubmit = () => {
    if (!activeQuiz) return;
    let correct = 0;
    activeQuiz.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) correct++;
    });
    const score = (correct / activeQuiz.questions.length) * 100;
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Center</h1>
          <p className="text-gray-600 mt-1">Master finance with AI-powered courses</p>
        </div>
        <Button>
          <Play className="w-5 h-5 mr-2" />
          Start Learning
        </Button>
      </div>

      {/* Course Grid */}
      {!selectedCourse && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden cursor-pointer" onClick={() => setSelectedCourse(course)}>
                <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={course.difficulty === 'beginner' ? 'success' : course.difficulty === 'intermediate' ? 'warning' : 'error'}>
                      {course.difficulty}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-blue-600">{course.progress}%</span>
                    </div>
                    <ProgressBar value={course.progress} />
                  </div>
                  <div className="mt-4 flex items-center text-blue-600 font-medium">
                    {course.progress > 0 ? 'Continue' : 'Start'} Learning
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Course Detail */}
      {selectedCourse && !selectedLesson && (
        <div>
          <Button variant="ghost" onClick={() => setSelectedCourse(null)} className="mb-4">
            ← Back to Courses
          </Button>
          <Card className="p-6">
            <div className="flex items-start space-x-6">
              <img src={selectedCourse.thumbnail} alt={selectedCourse.title} className="w-64 h-40 object-cover rounded-lg" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCourse.title}</h2>
                <p className="text-gray-600 mb-4">{selectedCourse.description}</p>
                <div className="flex items-center space-x-4 mb-6">
                  <Badge>{selectedCourse.difficulty}</Badge>
                  <span className="text-sm text-gray-500">{selectedCourse.duration}</span>
                  <span className="text-sm text-gray-500">{selectedCourse.lessons.length} lessons</span>
                </div>
                <div className="space-y-3">
                  {selectedCourse.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lesson.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {lesson.completed ? <CheckCircle className="w-5 h-5 text-white" /> : <span className="text-sm font-medium">{lesson.order}</span>}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                          <p className="text-sm text-gray-500">{lesson.duration}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Lesson View */}
      {selectedLesson && (
        <div>
          <Button variant="ghost" onClick={() => setSelectedLesson(null)} className="mb-4">
            ← Back to Course
          </Button>
          <Card className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedLesson.title}</h2>
                  <p className="text-gray-600">{selectedLesson.duration}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Watch Video
                  </Button>
                  <Button onClick={() => setActiveQuiz(quizzes.find(q => q.lessonId === selectedLesson.id) || null)}>
                    <Award className="w-4 h-4 mr-2" />
                    Take Quiz
                  </Button>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed">{selectedLesson.content}</p>
                <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Key Takeaways</h3>
                  <ul className="list-disc list-inside text-blue-800 space-y-1">
                    <li>Understanding the fundamentals is crucial for success</li>
                    <li>Practice makes perfect - apply what you learn</li>
                    <li>Stay updated with market news and trends</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quiz Modal */}
      <Modal
        isOpen={!!activeQuiz}
        onClose={() => { setActiveQuiz(null); setQuizSubmitted(false); setQuizScore(null); setQuizAnswers({}); }}
        title={activeQuiz?.title || 'Quiz'}
      >
        {!quizSubmitted ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{activeQuiz?.questions.length} questions</span>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                {activeQuiz?.timeLimit ? `${Math.floor(activeQuiz.timeLimit / 60)} min` : 'No time limit'}
              </div>
            </div>
            {activeQuiz?.questions.map((question, qIndex) => (
              <div key={question.id} className="space-y-3">
                <p className="font-medium text-gray-900">{qIndex + 1}. {question.text}</p>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <label
                      key={oIndex}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        quizAnswers[question.id] === oIndex
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={oIndex}
                        checked={quizAnswers[question.id] === oIndex}
                        onChange={() => setQuizAnswers({ ...quizAnswers, [question.id]: oIndex })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                        quizAnswers[question.id] === oIndex ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {quizAnswers[question.id] === oIndex && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={handleQuizSubmit} className="w-full" disabled={Object.keys(quizAnswers).length !== activeQuiz?.questions.length}>
              Submit Answers
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${quizScore && quizScore >= 70 ? 'bg-green-100' : 'bg-red-100'}`}>
              {quizScore && quizScore >= 70 ? (
                <Award className="w-12 h-12 text-green-600" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {quizScore && quizScore >= 70 ? 'Congratulations!' : 'Keep Practicing!'}
              </h3>
              <p className="text-gray-600">
                You scored <span className="font-bold text-blue-600">{quizScore}%</span>
              </p>
            </div>
            {activeQuiz?.questions.map((question, qIndex) => (
              <div key={question.id} className="text-left p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">{qIndex + 1}. {question.text}</p>
                <p className="text-sm text-gray-600">
                  Your answer: <span className={quizAnswers[question.id] === question.correctAnswer ? 'text-green-600' : 'text-red-600'}>
                    {question.options[quizAnswers[question.id]]}
                  </span>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Correct: {question.options[question.correctAnswer]}
                </p>
                <p className="text-sm text-gray-500 mt-2 italic">{question.explanation}</p>
              </div>
            ))}
            <Button onClick={() => { setActiveQuiz(null); setQuizSubmitted(false); setQuizScore(null); setQuizAnswers({}); }}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ============================================
// PREDICTION PLAYGROUND
// ============================================

const PredictionPlayground: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [userPrediction, setUserPrediction] = useState<'up' | 'down' | null>(null);
  const [predictionSubmitted, setPredictionSubmitted] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const stockData = generateHistoricalData(selectedSymbol);
  const currentPrice = stockData[stockData.length - 1].close;
  
  const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.25 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.80 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 385.50 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 238.75 },
  ];

  const handlePredict = () => {
    if (!userPrediction) return;
    setPredictionSubmitted(true);
    setAiPrediction(generateAIPrediction(selectedSymbol));
  };

  const chartData = stockData.map(d => ({
    ...d,
    date: d.date.slice(5)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prediction Playground</h1>
          <p className="text-gray-600 mt-1">Make predictions and compare with AI insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Paper Trading Mode</span>
          <div className="w-12 h-6 bg-green-500 rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stock Selection & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Selector */}
          <Card className="p-4">
            <div className="flex items-center space-x-4 overflow-x-auto">
              {stocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => { setSelectedSymbol(stock.symbol); setPredictionSubmitted(false); setAiPrediction(null); setUserPrediction(null); }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    selectedSymbol === stock.symbol
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold">{stock.symbol}</div>
                    <div className="text-sm opacity-80">${stock.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Price Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedSymbol} Price History</h3>
                <p className="text-gray-600">Last 90 days</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">${currentPrice}</div>
                <div className="text-sm text-green-600">+2.3%</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Prediction Interface */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Make Your Prediction</h3>
            
            {!predictionSubmitted ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What do you think will happen to {selectedSymbol} in the next week?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setUserPrediction('up')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        userPrediction === 'up'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <ArrowUpRight className={`w-12 h-12 mx-auto mb-2 ${userPrediction === 'up' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="font-bold text-lg">Price Will Go Up</div>
                    </button>
                    <button
                      onClick={() => setUserPrediction('down')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        userPrediction === 'down'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <ArrowDownRight className={`w-12 h-12 mx-auto mb-2 ${userPrediction === 'down' ? 'text-red-600' : 'text-gray-400'}`} />
                      <div className="font-bold text-lg">Price Will Go Down</div>
                    </button>
                  </div>
                </div>
                <Button onClick={handlePredict} disabled={!userPrediction} className="w-full" size="lg">
                  <Brain className="w-5 h-5 mr-2" />
                  Submit Prediction & Compare with AI
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Comparison */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Your Prediction</div>
                    <div className={`text-2xl font-bold ${userPrediction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {userPrediction?.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">AI Prediction</div>
                    <div className={`text-2xl font-bold ${aiPrediction?.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {aiPrediction?.direction.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Confidence</div>
                    <div className="text-2xl font-bold text-purple-600">{aiPrediction?.confidence}%</div>
                  </div>
                </div>

                {/* AI Factors */}
                {aiPrediction && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">AI Analysis Factors</h4>
                    <div className="space-y-2">
                      {aiPrediction.factors.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">{factor.name}</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${factor.impact > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.abs(factor.impact) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">{(factor.impact * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={() => setShowExplanation(true)} variant="outline" className="w-full">
                  <Eye className="w-5 h-5 mr-2" />
                  View Detailed AI Explanation
                </Button>

                <Button onClick={() => { setPredictionSubmitted(false); setUserPrediction(null); setAiPrediction(null); }} variant="ghost" className="w-full">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Make New Prediction
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Statistics */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Key Statistics</h3>
            <div className="space-y-3">
              {[
                { label: 'Current Price', value: `$${currentPrice}` },
                { label: '52 Week High', value: `$${(currentPrice * 1.2).toFixed(2)}` },
                { label: '52 Week Low', value: `$${(currentPrice * 0.7).toFixed(2)}` },
                { label: 'Volume', value: '2.4M' },
                { label: 'Market Cap', value: '2.8T' },
                { label: 'P/E Ratio', value: '28.5' },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{stat.label}</span>
                  <span className="font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Technical Indicators */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Technical Indicators</h3>
            <div className="space-y-3">
              {[
                { name: 'RSI (14)', value: 58.2, signal: 'Neutral' },
                { name: 'MACD', value: 2.34, signal: 'Buy' },
                { name: 'SMA (50)', value: 172.5, signal: 'Buy' },
                { name: 'EMA (20)', value: 175.8, signal: 'Buy' },
              ].map((indicator) => (
                <div key={indicator.name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{indicator.name}</span>
                  <div className="text-right">
                    <div className="font-medium">{indicator.value}</div>
                    <Badge variant={indicator.signal === 'Buy' ? 'success' : indicator.signal === 'Sell' ? 'error' : 'default'}>
                      {indicator.signal}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-500" />
              Prediction Leaderboard
            </h3>
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Alex K.', accuracy: 87.5, predictions: 124 },
                { rank: 2, name: 'Sarah M.', accuracy: 82.3, predictions: 98 },
                { rank: 3, name: 'You', accuracy: 67.0, predictions: 47, highlight: true },
                { rank: 4, name: 'Mike R.', accuracy: 64.2, predictions: 156 },
                { rank: 5, name: 'Emma L.', accuracy: 61.8, predictions: 89 },
              ].map((player) => (
                <div 
                  key={player.rank} 
                  className={`flex items-center justify-between p-3 rounded-lg ${player.highlight ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      player.rank === 1 ? 'bg-yellow-500 text-white' :
                      player.rank === 2 ? 'bg-gray-400 text-white' :
                      player.rank === 3 ? 'bg-orange-500 text-white' :
                      'bg-gray-200'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <div className={`font-medium ${player.highlight ? 'text-blue-600' : ''}`}>{player.name}</div>
                      <div className="text-xs text-gray-500">{player.predictions} predictions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{player.accuracy}%</div>
                    <div className="text-xs text-gray-500">Accuracy</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* AI Explanation Modal */}
      <Modal
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
        title="AI Prediction Explanation"
      >
        {aiPrediction && (
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <p className="text-gray-800 leading-relaxed">{aiPrediction.explanation}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">SHAP Feature Importance</h4>
              <div className="space-y-2">
                {aiPrediction.shapValues.map((shap, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{shap.feature}</span>
                    <div className="flex items-center space-x-3 flex-1 mx-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${shap.value > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.abs(shap.value) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{shap.value > 0 ? '+' : ''}{shap.value.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Target Price</div>
                <div className="text-2xl font-bold text-green-600">${aiPrediction.targetPrice}</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Confidence Level</div>
                <div className="text-2xl font-bold text-purple-600">{aiPrediction.confidence}%</div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Learning Insight
              </h4>
              <p className="text-sm text-yellow-800">
                AI predictions are based on historical patterns, technical indicators, and market sentiment. 
                Use these insights as educational tools, not financial advice. Always do your own research!
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ============================================
// NEWS INTELLIGENCE
// ============================================

const NewsIntelligence: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [newsCategory, setNewsCategory] = useState<'general' | 'forex' | 'crypto' | 'merger'>('general');
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews();
    }, 20000);

    return () => clearInterval(interval);
  }, [newsCategory]);

  // Detect alerts whenever news updates
  useEffect(() => {
    if (news.length > 0) {
      const detectedAlerts = AlertDetector.detectAlerts(news);
      // Limit to 3 most recent alerts
      const limitedAlerts = detectedAlerts.slice(0, 3);
      setAlerts(limitedAlerts);
    }
  }, [news]);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  useEffect(() => {
    fetchNews();
  }, [newsCategory]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      // Use fallback API key if environment variable is not available
      const apiKey = (import.meta as any).env?.VITE_FINNHUB_API_KEY || 'd6g9gjhr01qt49322b30d6g9gjhr01qt49322b3g';
      
      if (!apiKey) {
        console.warn('No API key found, using mock data');
        setNews(generateNewsData());
        return;
      }

      const finnhubNews = await finnhubService.getMarketNews(newsCategory);
      const formattedNews = finnhubService.convertFinnhubNewsToAppFormat(finnhubNews);
      
      // Ensure we have news data
      if (formattedNews.length === 0) {
        console.warn('No news received, using mock data');
        setNews(generateNewsData());
      } else {
        setNews(formattedNews);
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to mock data if API fails
      setNews(generateNewsData());
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(n => 
    sentimentFilter === 'all' || n.sentimentLabel === sentimentFilter
  );

  const sentimentData = [
    { name: 'Positive', value: news.filter(n => n.sentimentLabel === 'positive').length, color: '#22c55e' },
    { name: 'Neutral', value: news.filter(n => n.sentimentLabel === 'neutral').length, color: '#a1a1aa' },
    { name: 'Negative', value: news.filter(n => n.sentimentLabel === 'negative').length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Floating Alert Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border-l-4 p-4 rounded-lg shadow-lg"
            style={{ borderLeftColor: AlertDetector.getImpactColor(alert.impact) }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{AlertDetector.getImpactIcon(alert.impact)}</span>
                  <span className={`text-xs font-semibold uppercase`} style={{ color: AlertDetector.getImpactColor(alert.impact) }}>
                    {alert.impact} impact
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{alert.title}</h4>
                <p className="text-xs text-gray-600 mb-2">{alert.summary}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{alert.source}</span>
                  <span>•</span>
                  <span>{new Date(alert.detectedAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {alert.keywords.slice(0, 3).map((keyword, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">News Intelligence</h1>
          <p className="text-gray-600 mt-1">AI-powered sentiment analysis & market impact</p>
          <p className="text-xs text-gray-500 mt-1">
            Last refreshed: {lastRefresh.toLocaleTimeString()} • Auto-refresh every 20s
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={newsCategory}
            onChange={(e) => setNewsCategory(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="general">General News</option>
            <option value="forex">Forex News</option>
            <option value="crypto">Crypto News</option>
            <option value="merger">M&A News</option>
          </select>
          <Button onClick={fetchNews} disabled={loading}>
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading latest news...</span>
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
        {/* News Feed */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {(['all', 'positive', 'neutral', 'negative'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSentimentFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  sentimentFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== 'all' && (
                  <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                    {news.filter(n => n.sentimentLabel === filter).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* News Cards */}
          <div className="space-y-4">
            {filteredNews.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setSelectedNews(item)}>
                  <div className="flex items-start space-x-4">
                    <img src={item.imageUrl} alt={item.title} className="w-32 h-24 object-cover rounded-lg" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant={item.sentimentLabel === 'positive' ? 'success' : item.sentimentLabel === 'negative' ? 'error' : 'default'}>
                          {item.sentimentLabel.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">{item.source}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{new Date(item.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{item.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {item.relatedStocks.map((stock: any) => (
                            <Badge key={stock}>{stock}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-600">Impact:</div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.impactScore > 7 ? 'bg-red-100 text-red-800' :
                            item.impactScore > 4 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.impactScore}/10
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sentiment Distribution */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Sentiment Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {sentimentData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Market Impact */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Top Impact Stories</h3>
            <div className="space-y-3">
              {news.sort((a, b) => b.impactScore - a.impactScore).slice(0, 5).map((item) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => setSelectedNews(item)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.impactScore > 7 ? 'bg-red-100 text-red-800' :
                      item.impactScore > 4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.impactScore}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.relatedStocks.slice(0, 2).map((stock: any) => (
                      <Badge key={stock} variant="default">{stock}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Insights */}
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <h3 className="font-bold mb-3 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI Insights
            </h3>
            <p className="text-sm text-purple-100 mb-4">
              Based on today's news sentiment, the overall market outlook is moderately positive with tech stocks showing strong momentum.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>Strong sentiment in AI sector</span>
              </div>
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>Watch regulatory news</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2" />
                <span>Earnings season approaching</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}
      
      {/* News Detail Modal */}
      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title="News Details"
      >
        {selectedNews && (
          <div className="space-y-6">
            <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-48 object-cover rounded-lg" />
            <div className="flex items-center space-x-3">
              <Badge variant={selectedNews.sentimentLabel === 'positive' ? 'success' : selectedNews.sentimentLabel === 'negative' ? 'error' : 'default'}>
                {selectedNews.sentimentLabel.toUpperCase()}
              </Badge>
              <span className="text-gray-600">{selectedNews.source}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-600">{new Date(selectedNews.publishedAt).toLocaleString()}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedNews.title}</h2>
            <p className="text-gray-700 leading-relaxed">{selectedNews.summary}</p>
            <p className="text-gray-700 leading-relaxed">
              This article provides comprehensive coverage of the latest developments affecting {selectedNews.relatedStocks.join(', ')}. 
              Market analysts suggest that the implications could be significant for investors in these sectors.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Sentiment Score</div>
                <div className="text-2xl font-bold">{selectedNews.sentiment}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Impact Score</div>
                <div className="text-2xl font-bold">{selectedNews.impactScore}/10</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Related Stocks</h4>
              <div className="flex flex-wrap gap-2">
                {selectedNews.relatedStocks.map((stock: any) => (
                  <Badge key={stock} variant="info">{stock}</Badge>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => window.open(selectedNews.url, '_blank')}>
              <ExternalLink className="w-5 h-5 mr-2" />
              Read Full Article
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ============================================
// PORTFOLIO ANALYZER
// ============================================

const PortfolioAnalyzer: React.FC = () => {
  const portfolio = generatePortfolio();
  const analysis = generatePortfolioAnalysis();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Analyzer</h1>
          <p className="text-gray-600 mt-1">Advanced risk analysis & performance tracking</p>
        </div>
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          Add Position
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm opacity-80 mb-1">Total Value</div>
          <div className="text-3xl font-bold">${analysis.totalValue.toLocaleString()}</div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm opacity-80 mb-1">Total Gain/Loss</div>
          <div className="text-3xl font-bold">+${analysis.totalGainLoss.toLocaleString()}</div>
          <div className="text-sm opacity-80">+{analysis.totalGainLossPercent.toFixed(2)}%</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Risk Score</div>
          <div className="text-3xl font-bold text-orange-600">{analysis.riskScore}/10</div>
          <div className="text-sm text-gray-500">Moderate Risk</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Sharpe Ratio</div>
          <div className="text-3xl font-bold text-green-600">{analysis.sharpeRatio}</div>
          <div className="text-sm text-gray-500">Good Risk-Adjusted Return</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Your Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shares</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {portfolio.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium">{item.symbol}</div>
                        <div className="text-sm text-gray-500">{item.name}</div>
                      </td>
                      <td className="px-4 py-4 text-right">{item.shares}</td>
                      <td className="px-4 py-4 text-right">${item.avgPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right">${item.currentPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right font-medium">${item.marketValue.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right">
                        <div className={item.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.gainLoss >= 0 ? '+' : ''}${item.gainLoss.toFixed(2)}
                        </div>
                        <div className={`text-sm ${item.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.gainLossPercent >= 0 ? '+' : ''}{item.gainLossPercent.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Allocation Pie Chart */}
        <div>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Asset Allocation</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analysis.allocation}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {analysis.allocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Performance & Risk Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Returns */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Daily Returns (30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analysis.dailyReturns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="return" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk-Return Scatter */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Risk vs Return Analysis</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="risk" name="Risk" unit="%" />
              <YAxis type="number" dataKey="return" name="Return" unit="%" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={analysis.riskReturnScatter} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Risk Metrics */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-4">Risk Metrics</h3>
        <div className="grid md:grid-cols-5 gap-6">
          {[
            { label: 'Beta', value: analysis.beta, description: 'Market sensitivity', ideal: 'Near 1.0' },
            { label: 'Volatility', value: `${analysis.volatility}%`, description: 'Price fluctuation', ideal: 'Lower is better' },
            { label: 'Max Drawdown', value: `${analysis.maxDrawdown}%`, description: 'Largest peak-to-trough', ideal: 'Lower is better' },
            { label: 'Sharpe Ratio', value: analysis.sharpeRatio, description: 'Risk-adjusted return', ideal: '> 1.0' },
            { label: 'Diversification', value: 'Good', description: 'Asset spread', ideal: 'High' },
          ].map((metric) => (
            <div key={metric.label} className="text-center">
              <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-xs text-gray-500 mb-1">{metric.description}</div>
              <Badge variant="info">Ideal: {metric.ideal}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};


// ============================================
// AI ADVISOR
// ============================================

const AIAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m your AI Financial Advisor. I can help you with:\n\n• Portfolio analysis and recommendations\n• Investment strategies\n• Market insights\n• Risk assessment\n• Educational explanations\n\nWhat would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    'Analyze my current portfolio',
    'What is the best strategy for a beginner?',
    'How can I reduce my portfolio risk?',
    'Explain the current market sentiment',
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));

    const response = generateAIResponse(userMessage);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const generateAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('portfolio') || lowerQuery.includes('analyze')) {
      return `Based on your current portfolio analysis:

📊 **Portfolio Overview:**
- Total Value: $28,822
- Overall Gain: +$2,322 (+8.8%)
- Risk Score: 6.5/10 (Moderate)

💡 **Recommendations:**
1. **Diversification**: Your portfolio is heavily weighted in tech (75%). Consider adding exposure to healthcare or consumer staples.

2. **Risk Management**: Your beta of 1.15 indicates slightly higher volatility than the market. Consider adding some defensive positions.

3. **Position Sizing**: No single position exceeds 40%, which is good for risk management.

📈 **Action Items:**
- Review TSLA position (currently -2.55%)
- Consider taking profits on AAPL (+7.70%)
- Explore dividend-paying stocks for income

Would you like me to elaborate on any of these points?`;
    }
    
    if (lowerQuery.includes('strategy') || lowerQuery.includes('beginner')) {
      return `🎯 **Investment Strategy for Beginners:**

1. **Start with Index Funds**
   - Low cost, instant diversification
   - Track the overall market performance
   - Recommended: 60-70% of portfolio

2. **Dollar-Cost Averaging**
   - Invest fixed amounts regularly
   - Reduces timing risk
   - Builds discipline

3. **Asset Allocation**
   - 60% Stocks (growth)
   - 30% Bonds (stability)
   - 10% Cash/Alternatives

4. **Long-term Mindset**
   - Think in years, not days
   - Avoid emotional trading
   - Rebalance quarterly

5. **Continuous Learning**
   - Stay informed but don't overreact
   - Learn from both wins and losses
   - Use our learning modules!

Remember: The best strategy is one you can stick with through market ups and downs.`;
    }
    
    if (lowerQuery.includes('risk') || lowerQuery.includes('reduce')) {
      return `🛡️ **Risk Reduction Strategies:**

1. **Diversification**
   - Spread across sectors (tech, healthcare, finance, etc.)
   - Include different asset classes (stocks, bonds, REITs)
   - Consider international exposure

2. **Position Sizing**
   - Never invest more than 5-10% in single stock
   - Your current largest position is ~40% (AAPL)
   - Consider reducing to 25% max

3. **Stop-Loss Orders**
   - Set automatic sell orders at -10% to -15%
   - Protects against major declines
   - Removes emotion from decisions

4. **Hedging**
   - Consider protective puts for large positions
   - Use inverse ETFs sparingly
   - Options strategies for advanced investors

5. **Regular Rebalancing**
   - Review monthly
   - Rebalance quarterly
   - Take profits when positions grow too large

Your current risk score is 6.5/10. Target would be 5-6 for moderate risk tolerance.`;
    }
    
    if (lowerQuery.includes('market') || lowerQuery.includes('sentiment')) {
      return `📰 **Current Market Sentiment Analysis:**

**Overall Sentiment: Moderately Positive (0.65/1.0)**

🟢 **Positive Factors:**
- Strong earnings reports from tech giants
- AI sector momentum continuing
- Economic data better than expected
- Fed policy stabilizing

🟡 **Neutral Factors:**
- Inflation concerns remain
- Geopolitical tensions
- Election uncertainty

🔴 **Negative Factors:**
- Some regulatory headwinds
- Valuation concerns in growth stocks

**Sector Performance:**
1. Technology: +3.2% 📈
2. Healthcare: +1.8% 📈
3. Financials: +0.9% 📈
4. Energy: -0.5% 📉

**Recommendation:**
Maintain current allocation but consider:
- Taking some profits in tech
- Adding defensive positions
- Keeping dry powder for opportunities

Would you like specific stock recommendations or sector analysis?`;
    }
    
    return `Thank you for your question: "${query}"

I'd be happy to help you with that! Based on my analysis of your portfolio and current market conditions, here's what I recommend:

**Key Points to Consider:**

1. **Your Current Position**: You have a well-diversified portfolio with a moderate risk profile.

2. **Market Context**: The current market shows mixed signals with tech leading gains while traditional sectors lag.

3. **Actionable Advice**:
   - Review your investment goals
   - Consider your time horizon
   - Assess your risk tolerance
   - Look at tax implications

**Next Steps:**
- Would you like a detailed portfolio analysis?
- Should we discuss specific stocks?
- Do you want to explore new investment opportunities?
- Would educational resources help?

Feel free to ask more specific questions, and I'll provide tailored guidance!`;
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">AI Financial Advisor</h1>
        <p className="text-gray-600 mt-1">Get personalized investment advice powered by AI</p>
      </div>

      <div className="flex-1 grid lg:grid-cols-4 gap-6">
        {/* Chat */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            <div className="p-4 border-t">
              <div className="flex flex-wrap gap-2 mb-4">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about your investments..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Portfolio Snapshot */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Portfolio Snapshot</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value</span>
                <span className="font-bold">$28,822</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gain/Loss</span>
                <span className="font-bold text-green-600">+$2,322</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Score</span>
                <span className="font-bold">6.5/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Positions</span>
                <span className="font-bold">4</span>
              </div>
            </div>
          </Card>

          {/* Recent News */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Recent News</h3>
            <div className="space-y-3">
              {generateNewsData().slice(0, 3).map((news) => (
                <div key={news.id} className="text-sm">
                  <div className="font-medium mb-1">{news.title}</div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{news.source}</span>
                    <Badge variant={news.sentimentLabel === 'positive' ? 'success' : news.sentimentLabel === 'negative' ? 'error' : 'default'}>
                      {news.sentimentLabel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Advisor Tips */}
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <h3 className="font-bold mb-3 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Pro Tips
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Review your portfolio weekly</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Rebalance quarterly</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Keep emergency fund separate</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Invest for the long term</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Lightbulb icon component
const Lightbulb: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

// ============================================
// COMMUNITY CHAT
// ============================================

const CommunityChat: React.FC = () => {
  const [activeRoom, setActiveRoom] = useState('general');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', userId: 'user-2', userName: 'Alex K.', content: 'Just made my first profitable trade! 🎉', timestamp: new Date(Date.now() - 300000).toISOString(), room: 'general' },
    { id: '2', userId: 'user-3', userName: 'Sarah M.', content: 'Congrats! What was your strategy?', timestamp: new Date(Date.now() - 240000).toISOString(), room: 'general' },
    { id: '3', userId: 'user-1', userName: 'Mike R.', content: 'The AI predictions are surprisingly accurate!', timestamp: new Date(Date.now() - 180000).toISOString(), room: 'general' },
  ]);
  const [input, setInput] = useState('');

  const rooms: ChatRoom[] = [
    { id: 'general', name: 'General', description: 'General discussion', memberCount: 1234 },
    { id: 'stocks', name: 'Stock Trading', description: 'Stock market talks', memberCount: 856 },
    { id: 'crypto', name: 'Crypto', description: 'Cryptocurrency discussion', memberCount: 623 },
    { id: 'learning', name: 'Learning', description: 'Study groups & tips', memberCount: 445 },
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: 'user-1',
      userName: 'You',
      content: input,
      timestamp: new Date().toISOString(),
      room: activeRoom,
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  const roomMessages = messages.filter(m => m.room === activeRoom);

  return (
    <div className="h-[calc(100vh-150px)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Community Chat</h1>
        <p className="text-gray-600 mt-1">Connect with fellow investors and learners</p>
      </div>

      <div className="flex-1 grid lg:grid-cols-4 gap-6">
        {/* Rooms List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-bold text-gray-900 mb-4">Chat Rooms</h3>
            <div className="space-y-2">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    activeRoom === room.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{room.name}</div>
                  <div className={`text-sm ${activeRoom === room.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {room.description}
                  </div>
                  <div className={`text-xs mt-1 ${activeRoom === room.id ? 'text-blue-200' : 'text-gray-400'}`}>
                    {room.memberCount} members
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Online Users */}
          <Card className="p-4 mt-4">
            <h3 className="font-bold text-gray-900 mb-4">Online Now</h3>
            <div className="space-y-3">
              {[
                { name: 'Alex K.', avatar: 'A', status: 'online' },
                { name: 'Sarah M.', avatar: 'S', status: 'online' },
                { name: 'Mike R.', avatar: 'M', status: 'away' },
                { name: 'Emma L.', avatar: 'E', status: 'online' },
              ].map((user) => (
                <div key={user.name} className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.avatar}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            {/* Room Header */}
            <div className="p-4 border-b">
              <h3 className="font-bold text-gray-900">
                {rooms.find(r => r.id === activeRoom)?.name}
              </h3>
              <p className="text-sm text-gray-500">
                {rooms.find(r => r.id === activeRoom)?.description}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {roomMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.userId === 'user-1' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${message.userId === 'user-1' ? 'order-2' : ''}`}>
                    <div className={`flex items-center space-x-2 mb-1 ${message.userId === 'user-1' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-medium text-gray-700">{message.userName}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.userId === 'user-1'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button onClick={handleSend}>
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showAuth={showAuth}
          setShowAuth={setShowAuth}
          authMode={authMode}
          setAuthMode={setAuthMode}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};

interface AppContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showAuth: boolean;
  setShowAuth: (show: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
}

const AppContent: React.FC<AppContentProps> = ({
  activeTab,
  setActiveTab,
  showAuth,
  setShowAuth,
  authMode,
  setAuthMode,
}) => {
  const { user, isAuthenticated, web3Login, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* Landing Page */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6"
            >
              <BrainCircuit className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-5xl font-bold text-white mb-6">
              AI-Powered Finance
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Education & Investment
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Master investing with AI-powered predictions, personalized learning, 
              and intelligent portfolio analysis.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button size="lg" onClick={() => { setShowAuth(true); setAuthMode('login'); }}>
                Sign In
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-blue-600 border-white hover:bg-blue-50" onClick={() => { setShowAuth(true); setAuthMode('register'); }}>
                Get Started Free
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: <Brain className="w-8 h-8" />, title: 'AI Predictions', description: 'Leverage machine learning for smarter investment decisions' },
              { icon: <BookOpen className="w-8 h-8" />, title: 'Interactive Learning', description: 'Master finance with AI-powered courses and quizzes' },
              { icon: <BarChart3 className="w-8 h-8" />, title: 'Portfolio Analysis', description: 'Advanced risk metrics and performance tracking' },
              { icon: <Newspaper className="w-8 h-8" />, title: 'News Intelligence', description: 'AI sentiment analysis on market news' },
              { icon: <MessageSquare className="w-8 h-8" />, title: 'AI Advisor', description: 'Get personalized investment guidance 24/7' },
              { icon: <Users className="w-8 h-8" />, title: 'Community', description: 'Connect with fellow investors and learners' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-white"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-blue-100">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Active Users' },
              { value: '50,000+', label: 'Predictions Made' },
              { value: '95%', label: 'Satisfaction Rate' },
              { value: '24/7', label: 'AI Support' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-blue-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && showAuth) {
    return authMode === 'login' ? (
      <LoginScreen onSwitch={() => setAuthMode('register')} />
    ) : (
      <RegisterScreen onSwitch={() => setAuthMode('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'learning' && <LearningModule />}
            {activeTab === 'prediction' && <PredictionPlayground />}
            {activeTab === 'news' && <NewsIntelligence />}
            {activeTab === 'portfolio' && <PortfolioAnalyzer />}
            {activeTab === 'advisor' && <AIAdvisor />}
            {activeTab === 'community' && <CommunityChat />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;

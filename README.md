# FinEdu AI - AI-Powered Finance Education & Investment Intelligence

A modern web application built with React, Vite, TypeScript, and Tailwind CSS that provides AI-powered finance education and investment intelligence.

## 🚀 Features

- **Stock Prediction**: AI-driven stock market predictions
- **Portfolio Analysis**: Comprehensive portfolio management and analysis
- **Learning Modules**: Interactive finance education content
- **News Intelligence**: Real-time market news with AI-powered sentiment analysis using Finnhub API
- **Investment Intelligence**: Real-time market insights and recommendations

## 🛠️ Tech Stack

- **Frontend**: React 19.2.3 with TypeScript
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 4.1.17
- **Routing**: React Router DOM 7.13.1
- **State Management**: Zustand 5.0.11
- **Data Fetching**: TanStack React Query 5.90.21
- **HTTP Client**: Axios 1.13.5
- **Charts**: Recharts 3.7.0
- **Animations**: Framer Motion 12.34.3
- **Icons**: Lucide React 0.575.0
- **Blockchain**: Ethers.js 5.7.2

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Batcat72/codenex-is-not-us.git
cd codenex-is-not-us

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file and add your Finnhub API key

# Start development server
npm run dev
```

## 🔧 Environment Configuration

### Finnhub API Setup

1. **Get API Key**: Sign up for a free account at [Finnhub.io](https://finnhub.io/) and get your API key
2. **Configure Environment**: Copy `.env.example` to `.env` and add your API key:

```bash
# Create .env file from example
cp .env.example .env

# Edit .env file
VITE_FINNHUB_API_KEY=your_finnhub_api_key_here
```

3. **Restart Development Server**: After setting up the environment variables, restart your development server

### Available News Categories

The News Intelligence section supports the following categories:
- **General News**: General market news
- **Forex News**: Foreign exchange market news
- **Crypto News**: Cryptocurrency market news
- **M&A News**: Mergers and acquisitions news

## 🏗️ Build & Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

This project is configured for automatic deployment to GitHub Pages. The build process creates optimized static files in the `dist/` directory.

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to your hosting service

### GitHub Pages (Recommended)

1. **Set up GitHub Secrets**:
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add `FINNHUB_API_KEY` with your Finnhub API key

2. **Push to GitHub**:
   - The GitHub Actions will automatically deploy your site
   - The API key will be securely injected during build

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select source as "GitHub Actions"

## 📁 Project Structure

```
├── src/                 # Source code
├── dist/               # Production build
├── public/             # Static assets
├── .gitignore          # Git ignore file
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # Project documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

Your Name - [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

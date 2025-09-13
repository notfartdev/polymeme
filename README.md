# PredictMarket 🎯

A modern prediction market platform where users can create and bet on token predictions using their SPL wallet assets.

## ✨ Features

- **Token-Based Markets**: Create prediction markets about tokens you own
- **Real-Time Data**: Live token prices and data from CoinGecko API
- **Animated Wizard**: Step-by-step market creation with smooth animations
- **Social Integration**: Token social links and community data
- **USD Converter**: Real-time USD value calculation for bets
- **Responsive Design**: Beautiful UI that works on all devices

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Icons**: Lucide React
- **Data**: CoinGecko API
- **Deployment**: Vercel

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/predictmarket.git
cd predictmarket
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
predictmarket/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── create-market/     # Market creation page
│   ├── markets/           # Market listing and details
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── ...               # Custom components
├── lib/                  # Utility libraries
│   ├── api.ts           # API client
│   ├── coingecko.ts     # CoinGecko integration
│   └── utils.ts         # Helper functions
└── public/              # Static assets
```

## 🎨 Key Components

- **Animated Wizard**: Multi-step form with smooth transitions
- **Token Details**: Live data display with social links
- **Market Preview**: Real-time preview of market being created
- **USD Converter**: Real-time price conversion
- **Bet Selection**: Color-coded YES/NO selection

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_api_key
NEXT_PUBLIC_COINGECKO_API_BASE=https://pro-api.coingecko.com/api/v3
```

## 📱 Features in Detail

### Market Creation Wizard
1. **How It Works** - Introduction and explanation
2. **Select Token** - Choose from wallet with live data
3. **Write Question** - AI-powered suggestions and clarity scoring
4. **Add Description** - AI suggestions for market rules
5. **Set Timeline** - Date and time picker with validation
6. **Review & Create** - Final bet placement and market creation

### Token Integration
- Real-time price data from CoinGecko
- Social media links (Twitter, Reddit, Telegram)
- Supply information when available
- Live USD conversion for bets

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on every push

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [CoinGecko](https://coingecko.com) for cryptocurrency data
- [Shadcn UI](https://ui.shadcn.com) for beautiful components
- [Vercel](https://vercel.com) for hosting
- [Next.js](https://nextjs.org) for the amazing framework

---

Made with ❤️ for the prediction market community

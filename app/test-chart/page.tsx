"use client"

import { useState, useEffect, useCallback } from "react"
import { ChartVariants } from "@/components/chart-variants"

interface ChartDataPoint {
  time: string
  value: number
  timestamp: number
}

export default function TestChartPage() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [currentPrice, setCurrentPrice] = useState(0.9502)
  const [priceChange, setPriceChange] = useState(3.2)

  // Generate sample chart data
  const generateChartData = useCallback(() => {
    const mockData: ChartDataPoint[] = []
    const currentTime = new Date()
    const basePrice = currentPrice
    
    // Calculate starting price 24 hours ago based on current price and 24h change
    const startPrice = basePrice / (1 + priceChange / 100)
    
    // Generate 24 data points over the last 24 hours
    let price = startPrice
    for (let i = 23; i >= 0; i--) {
      const time = new Date(currentTime.getTime() - (i * 60 * 60 * 1000)) // 1 hour apart
      
      // Create realistic price movements that end at the current price
      const progress = (23 - i) / 23 // 0 to 1 progress through the day
      const targetPrice = startPrice + (basePrice - startPrice) * progress
      
      // Add some realistic volatility around the trend
      const volatility = (Math.random() - 0.5) * 0.05 * targetPrice // ±2.5% volatility
      price = targetPrice + volatility
      
      // Ensure the last data point is exactly the current price
      if (i === 0) {
        price = basePrice
      }
      
      mockData.push({
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        value: price,
        timestamp: time.getTime()
      })
    }
    
    return mockData
  }, [currentPrice, priceChange])

  useEffect(() => {
    const data = generateChartData()
    setChartData(data)
  }, [generateChartData])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chart Design Variants</h1>
          <p className="text-gray-600">Same data, different visual styles. Click the buttons to switch between designs.</p>
        </div>

        <ChartVariants 
          chartData={chartData}
          currentPrice={currentPrice}
          priceChange={priceChange}
        />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2">Gradient Chart</h3>
            <p className="text-sm text-gray-600">Current CoinGecko-style design with green gradient fill and thick line.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2">Area Chart</h3>
            <p className="text-sm text-gray-600">Smooth area chart with blue gradient, perfect for showing trends.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2">Minimal Chart</h3>
            <p className="text-sm text-gray-600">Ultra-clean design with minimal styling, focuses purely on data.</p>
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-2">Candlestick Chart</h3>
          <p className="text-sm text-gray-600">Shows price ranges and volatility with high/low bars and main price line.</p>
        </div>
      </div>
    </div>
  )
}

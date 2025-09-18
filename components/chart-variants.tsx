"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Area, AreaChart, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ComposedChart, Bar } from "recharts"

interface ChartDataPoint {
  time: string
  value: number
  timestamp: number
}

interface ChartVariantsProps {
  chartData: ChartDataPoint[]
  currentPrice: number
  priceChange: number
}

export function ChartVariants({ chartData, currentPrice, priceChange }: ChartVariantsProps) {
  const [selectedVariant, setSelectedVariant] = useState<'gradient' | 'area' | 'minimal' | 'candlestick'>('gradient')

  const variants = [
    { id: 'gradient', name: 'Gradient', description: 'Current CoinGecko style' },
    { id: 'area', name: 'Area', description: 'Smooth area chart' },
    { id: 'minimal', name: 'Minimal', description: 'Ultra-clean design' },
    { id: 'candlestick', name: 'Candlestick', description: 'Price range chart' }
  ]

  const renderChart = () => {
    switch (selectedVariant) {
      case 'gradient':
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="1 1" stroke="#f3f4f6" strokeOpacity={0.5} />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              orientation="right"
              domain={['dataMin - dataMin * 0.005', 'dataMax + dataMax * 0.005']}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={4}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 8, fill: '#10b981', stroke: '#ffffff', strokeWidth: 3 }}
            />
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              orientation="right"
              domain={['dataMin - dataMin * 0.005', 'dataMax + dataMax * 0.005']}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#areaGradient)"
              dot={false}
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        )

      case 'minimal':
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              orientation="right"
              domain={['dataMin - dataMin * 0.005', 'dataMax + dataMax * 0.005']}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '11px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#374151" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#374151', stroke: '#ffffff', strokeWidth: 1 }}
            />
          </LineChart>
        )

      case 'candlestick':
        // Generate candlestick-like data
        const candlestickData = chartData.map((point, index) => {
          const volatility = 0.01 // 1% volatility
          const high = point.value * (1 + volatility * Math.random())
          const low = point.value * (1 - volatility * Math.random())
          return {
            ...point,
            high: Math.max(high, point.value),
            low: Math.min(low, point.value),
            open: index > 0 ? chartData[index - 1].value : point.value,
            close: point.value
          }
        })

        return (
          <ComposedChart data={candlestickData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              orientation="right"
              domain={['dataMin - dataMin * 0.01', 'dataMax + dataMax * 0.01']}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const label = name === 'value' ? 'Price' : name.charAt(0).toUpperCase() + name.slice(1)
                return [`$${value.toFixed(4)}`, label]
              }}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="high" fill="#10b981" opacity={0.3} />
            <Bar dataKey="low" fill="#ef4444" opacity={0.3} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </ComposedChart>
        )

      default:
        return null
    }
  }

  return (
    <Card className="p-6">
      {/* Variant Selector */}
      <div className="flex gap-2 mb-4">
        {variants.map((variant) => (
          <Button
            key={variant.id}
            variant={selectedVariant === variant.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedVariant(variant.id as any)}
            className="text-xs"
          >
            {variant.name}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80 bg-white rounded-lg border border-gray-200 p-4">
        <div className="h-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              {variants.find(v => v.id === selectedVariant)?.name} Chart
            </h4>
            <div className="text-sm text-gray-500">
              {variants.find(v => v.id === selectedVariant)?.description}
            </div>
          </div>
          
          <div style={{ width: '100%', height: 'calc(100% - 2rem)' }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  )
}

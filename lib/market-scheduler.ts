import { supabase } from './supabase'

export interface ScheduledResolution {
  marketId: string
  question: string
  questionType: string
  resolutionCriteria: string
  closingDate: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  lastAttempt?: Date
  error?: string
}

export class MarketScheduler {
  // Check for markets that need resolution
  public static async checkPendingResolutions(): Promise<ScheduledResolution[]> {
    try {
      const now = new Date()
      
      // Get markets that have passed their closing date but are still active
      const { data: markets, error } = await supabase
        .from('markets')
        .select('id, question, question_type_detailed, resolution_criteria, closing_date, status')
        .eq('status', 'active')
        .lt('closing_date', now.toISOString())

      if (error) {
        console.error('Error fetching pending markets:', error)
        return []
      }

      return markets.map(market => ({
        marketId: market.id,
        question: market.question,
        questionType: market.question_type_detailed || 'price',
        resolutionCriteria: market.resolution_criteria || '',
        closingDate: new Date(market.closing_date),
        status: 'pending' as const,
        attempts: 0
      }))
    } catch (error) {
      console.error('Error checking pending resolutions:', error)
      return []
    }
  }

  // Process a single market resolution
  public static async processMarketResolution(resolution: ScheduledResolution): Promise<boolean> {
    try {
      console.log(`🔄 Processing resolution for market ${resolution.marketId}`)
      console.log(`📋 Question: "${resolution.question}"`)
      console.log(`🏷️ Type: ${resolution.questionType}`)
      console.log(`📅 Closing Date: ${resolution.closingDate}`)
      
      // Import resolution function
      const { resolveMarket } = await import('./market-resolution')
      
      // Resolve the market
      const resolutionData = await resolveMarket(
        resolution.marketId,
        resolution.question,
        resolution.questionType,
        resolution.resolutionCriteria,
        resolution.closingDate
      )

      console.log(`📊 Resolution result:`, {
        resolution: resolutionData.resolution,
        confidence: resolutionData.resolutionData.confidence,
        dataSource: resolutionData.resolutionData.dataSource
      })

      // Update market in database
      const { error: updateError } = await supabase
        .from('markets')
        .update({
          status: 'closed',
          resolution: resolutionData.resolution,
          resolution_data: resolutionData.resolutionData,
          resolved_at: new Date().toISOString(),
          dispute_reason: resolutionData.disputeReason
        })
        .eq('id', resolution.marketId)

      if (updateError) {
        console.error('❌ Error updating market resolution:', updateError)
        return false
      }

      console.log(`✅ Successfully resolved market ${resolution.marketId}: ${resolutionData.resolution}`)
      return true

    } catch (error) {
      console.error(`❌ Error processing resolution for market ${resolution.marketId}:`, error)
      
      // Try to mark as disputed if resolution completely fails
      try {
        const { error: updateError } = await supabase
          .from('markets')
          .update({
            status: 'closed',
            resolution: 'disputed',
            resolved_at: new Date().toISOString(),
            dispute_reason: 'Resolution processing failed'
          })
          .eq('id', resolution.marketId)
        
        if (!updateError) {
          console.log(`⚠️ Marked market ${resolution.marketId} as disputed due to processing error`)
        }
      } catch (updateError) {
        console.error(`❌ Failed to mark market ${resolution.marketId} as disputed:`, updateError)
      }
      
      return false
    }
  }

  // Process all pending resolutions
  public static async processAllPendingResolutions(): Promise<void> {
    try {
      const pendingResolutions = await this.checkPendingResolutions()
      
      if (pendingResolutions.length === 0) {
        console.log('No pending market resolutions found')
        return
      }

      console.log(`Found ${pendingResolutions.length} pending market resolutions`)

      // Process each resolution
      for (const resolution of pendingResolutions) {
        try {
          const success = await this.processMarketResolution(resolution)
          
          if (success) {
            console.log(`✅ Market ${resolution.marketId} resolved successfully`)
          } else {
            console.log(`❌ Failed to resolve market ${resolution.marketId}`)
          }
        } catch (error) {
          console.error(`❌ Error processing market ${resolution.marketId}:`, error)
        }
      }

    } catch (error) {
      console.error('Error processing pending resolutions:', error)
    }
  }

  // Get resolution statistics
  public static async getResolutionStats(): Promise<{
    totalMarkets: number
    activeMarkets: number
    closedMarkets: number
    pendingResolutions: number
    resolvedToday: number
  }> {
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

      // Get total markets
      const { count: totalMarkets } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })

      // Get active markets
      const { count: activeMarkets } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Get closed markets
      const { count: closedMarkets } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed')

      // Get pending resolutions
      const { count: pendingResolutions } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('closing_date', now.toISOString())

      // Get resolved today
      const { count: resolvedToday } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed')
        .gte('resolved_at', todayStart.toISOString())
        .lt('resolved_at', todayEnd.toISOString())

      return {
        totalMarkets: totalMarkets || 0,
        activeMarkets: activeMarkets || 0,
        closedMarkets: closedMarkets || 0,
        pendingResolutions: pendingResolutions || 0,
        resolvedToday: resolvedToday || 0
      }
    } catch (error) {
      console.error('Error getting resolution stats:', error)
      return {
        totalMarkets: 0,
        activeMarkets: 0,
        closedMarkets: 0,
        pendingResolutions: 0,
        resolvedToday: 0
      }
    }
  }
}

// Auto-resolution function that can be called by cron jobs
export async function autoResolveMarkets(): Promise<void> {
  console.log('🔄 Starting automatic market resolution...')
  await MarketScheduler.processAllPendingResolutions()
  console.log('✅ Automatic market resolution completed')
}

// MarketScheduler is already exported as a class above

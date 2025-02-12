import { KiteAI } from '@kite-js/sdk'

export function useKiteAI() {
  const config = useRuntimeConfig()
  
  const kiteAI = new KiteAI({
    apiKey: config.public.kiteAIKey,
    environment: 'production'
  })

  const fetchMarketData = async () => {
    try {
      const response = await kiteAI.query({
        model: 'carbon-market',
        query: `
          SELECT 
            id, name, price, quantity, type, verified,
            PREDICT(price_trend) as predicted_price
          FROM carbon_credits
          WHERE verified = true
          ORDER BY created_at DESC
          LIMIT 100
        `
      })
      
      return response.data.map(credit => ({
        ...credit,
        predictedPrice: credit.predicted_price
      }))
    } catch (error) {
      console.error('Failed to fetch market data:', error)
      return []
    }
  }

  return {
    fetchMarketData
  }
}
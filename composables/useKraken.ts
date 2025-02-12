import { KrakenClient } from '@kraken-api/client'
import Decimal from 'decimal.js'

export function useKraken() {
  const config = useRuntimeConfig()
  const kraken = new KrakenClient({
    key: config.public.krakenApiKey,
    secret: config.public.krakenApiSecret
  })

  const getExchangeRate = async (pair: string = 'ETHUSD') => {
    try {
      const ticker = await kraken.ticker({ pair })
      return new Decimal(ticker[pair].c[0])
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error)
      throw error
    }
  }

  const createPayment = async (amount: number, currency: string = 'USD') => {
    try {
      const response = await kraken.createOrder({
        ordertype: 'market',
        type: 'buy',
        pair: `ETH${currency}`,
        volume: amount.toString()
      })
      
      return {
        orderId: response.txid[0],
        status: 'pending',
        amount,
        currency
      }
    } catch (error) {
      console.error('Failed to create payment:', error)
      throw error
    }
  }

  const getPaymentStatus = async (orderId: string) => {
    try {
      const status = await kraken.queryOrders({ txid: orderId })
      return status[orderId]
    } catch (error) {
      console.error('Failed to get payment status:', error)
      throw error
    }
  }

  return {
    getExchangeRate,
    createPayment,
    getPaymentStatus
  }
}
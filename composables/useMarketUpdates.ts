import { ref, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useToast } from './useToast'

interface MarketUpdate {
  creditId: string
  price: number
  volume: number
  timestamp: number
}

interface PriceAlert {
  creditId: string
  condition: 'above' | 'below'
  price: number
  callback: (price: number) => void
}

export function useMarketUpdates() {
  const socket = ref<Socket | null>(null)
  const lastUpdate = ref<MarketUpdate | null>(null)
  const priceAlerts = ref<PriceAlert[]>([])
  const toast = useToast()

  const connect = () => {
    socket.value = io(process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket']
    })

    socket.value.on('market-update', (update: MarketUpdate) => {
      lastUpdate.value = update
      checkPriceAlerts(update)
    })

    socket.value.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      toast.error('Failed to connect to market updates')
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  const subscribeToCreditUpdates = (creditId: string) => {
    if (socket.value) {
      socket.value.emit('subscribe', { creditId })
    }
  }

  const unsubscribeFromCreditUpdates = (creditId: string) => {
    if (socket.value) {
      socket.value.emit('unsubscribe', { creditId })
    }
  }

  const setPriceAlert = (alert: PriceAlert) => {
    priceAlerts.value.push(alert)
  }

  const removePriceAlert = (creditId: string, condition: 'above' | 'below') => {
    priceAlerts.value = priceAlerts.value.filter(
      alert => !(alert.creditId === creditId && alert.condition === condition)
    )
  }

  const checkPriceAlerts = (update: MarketUpdate) => {
    priceAlerts.value.forEach(alert => {
      if (alert.creditId === update.creditId) {
        if (alert.condition === 'above' && update.price > alert.price) {
          alert.callback(update.price)
          removePriceAlert(alert.creditId, alert.condition)
        } else if (alert.condition === 'below' && update.price < alert.price) {
          alert.callback(update.price)
          removePriceAlert(alert.creditId, alert.condition)
        }
      }
    })
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    lastUpdate,
    subscribeToCreditUpdates,
    unsubscribeFromCreditUpdates,
    setPriceAlert,
    removePriceAlert
  }
}
```typescript
import { ref, computed } from 'vue'
import { useWalletStore } from '~/stores/wallet'
import { useToast } from './useToast'
import { ethers } from 'ethers'

interface Position {
  creditId: string
  quantity: number
  averagePrice: number
  currentPrice: number
  pnl: number
  risk: number
}

interface RiskMetrics {
  totalExposure: number
  maxDrawdown: number
  sharpeRatio: number
  volatility: number
}

interface RiskLimits {
  maxPositionSize: number
  maxLeverage: number
  stopLossLevel: number
  takeProfitLevel: number
}

export function useRiskManagement() {
  const walletStore = useWalletStore()
  const toast = useToast()

  const positions = ref<Position[]>([])
  const riskMetrics = ref<RiskMetrics>({
    totalExposure: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    volatility: 0
  })

  const riskLimits = ref<RiskLimits>({
    maxPositionSize: 100000,
    maxLeverage: 2,
    stopLossLevel: 0.1,
    takeProfitLevel: 0.2
  })

  const historicalPrices = ref<Map<string, number[]>>(new Map())
  const monitoring = ref(false)

  // Computed metrics
  const portfolioValue = computed(() => {
    return positions.value.reduce((total, pos) => {
      return total + (pos.quantity * pos.currentPrice)
    }, 0)
  })

  const totalRisk = computed(() => {
    return positions.value.reduce((total, pos) => {
      return total + (pos.risk * (pos.quantity * pos.currentPrice))
    }, 0)
  })

  const riskScore = computed(() => {
    if (portfolioValue.value === 0) return 0
    return (totalRisk.value / portfolioValue.value) * 100
  })

  // Risk monitoring
  async function startMonitoring() {
    if (monitoring.value) return
    monitoring.value = true

    try {
      const contract = walletStore.contract
      
      // Monitor price changes
      contract.on('PriceUpdate', async (creditId, price) => {
        await updatePositionRisk(creditId.toString(), price)
      })

      // Monitor new positions
      contract.on('PositionOpened', async (trader, creditId, quantity, price) => {
        if (trader === walletStore.address) {
          await addPosition(creditId.toString(), quantity, price)
        }
      })

      // Check risk limits
      setInterval(checkRiskLimits, 5000)
    } catch (error) {
      console.error('Failed to start risk monitoring:', error)
      toast.error('Risk monitoring system failed to start')
    }
  }

  async function updatePositionRisk(creditId: string, currentPrice: number) {
    const position = positions.value.find(p => p.creditId === creditId)
    if (!position) return

    // Update position metrics
    position.currentPrice = currentPrice
    position.pnl = ((currentPrice - position.averagePrice) / position.averagePrice) * 100

    // Calculate risk metrics
    const prices = historicalPrices.get(creditId) || []
    prices.push(currentPrice)
    historicalPrices.set(creditId, prices.slice(-100)) // Keep last 100 prices

    position.risk = calculatePositionRisk(position, prices)

    // Check stop loss and take profit
    checkStopLoss(position)
    checkTakeProfit(position)
  }

  function calculatePositionRisk(position: Position, prices: number[]): number {
    if (prices.length < 2) return 0

    // Calculate volatility
    const returns = prices.slice(1).map((price, i) => {
      return (price - prices[i]) / prices[i]
    })

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const volatility = Math.sqrt(variance)

    // Calculate value at risk (VaR)
    const positionValue = position.quantity * position.currentPrice
    const var95 = positionValue * volatility * 1.645 // 95% confidence level

    return var95 / positionValue
  }

  async function checkRiskLimits() {
    // Check portfolio-wide limits
    if (portfolioValue.value > riskLimits.value.maxPositionSize) {
      toast.warning('Portfolio value exceeds maximum position size')
    }

    // Check individual position limits
    for (const position of positions.value) {
      const positionValue = position.quantity * position.currentPrice
      
      if (positionValue > riskLimits.value.maxPositionSize) {
        toast.warning(`Position ${position.creditId} exceeds maximum size`)
      }

      if (position.risk > 0.5) { // 50% risk threshold
        toast.warning(`High risk detected for position ${position.creditId}`)
      }
    }
  }

  async function checkStopLoss(position: Position) {
    if (position.pnl <= -riskLimits.value.stopLossLevel * 100) {
      try {
        await closePosition(position.creditId)
        toast.info(`Stop loss triggered for position ${position.creditId}`)
      } catch (error) {
        console.error('Failed to execute stop loss:', error)
        toast.error('Failed to execute stop loss')
      }
    }
  }

  async function checkTakeProfit(position: Position) {
    if (position.pnl >= riskLimits.value.takeProfitLevel * 100) {
      try {
        await closePosition(position.creditId)
        toast.success(`Take profit triggered for position ${position.creditId}`)
      } catch (error) {
        console.error('Failed to execute take profit:', error)
        toast.error('Failed to execute take profit')
      }
    }
  }

  async function closePosition(creditId: string) {
    try {
      const contract = walletStore.contract
      const position = positions.value.find(p => p.creditId === creditId)
      if (!position) return

      const tx = await contract.closePosition(creditId, position.quantity)
      await tx.wait()

      positions.value = positions.value.filter(p => p.creditId !== creditId)
    } catch (error) {
      console.error('Failed to close position:', error)
      throw error
    }
  }

  async function addPosition(creditId: string, quantity: number, price: number) {
    const existingPosition = positions.value.find(p => p.creditId === creditId)
    
    if (existingPosition) {
      // Update existing position
      const totalQuantity = existingPosition.quantity + quantity
      const totalValue = (existingPosition.quantity * existingPosition.averagePrice) + (quantity * price)
      existingPosition.quantity = totalQuantity
      existingPosition.averagePrice = totalValue / totalQuantity
    } else {
      // Add new position
      positions.value.push({
        creditId,
        quantity,
        averagePrice: price,
        currentPrice: price,
        pnl: 0,
        risk: 0
      })
    }

    await updateRiskMetrics()
  }

  async function updateRiskMetrics() {
    try {
      const prices = Array.from(historicalPrices.values()).flat()
      if (prices.length < 2) return

      // Calculate portfolio metrics
      const returns = prices.slice(1).map((price, i) => {
        return (price - prices[i]) / prices[i]
      })

      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const riskFreeRate = 0.02 // 2% annual risk-free rate

      riskMetrics.value = {
        totalExposure: portfolioValue.value,
        maxDrawdown: calculateMaxDrawdown(prices),
        sharpeRatio: calculateSharpeRatio(returns, avgReturn, riskFreeRate),
        volatility: calculateVolatility(returns)
      }
    } catch (error) {
      console.error('Failed to update risk metrics:', error)
    }
  }

  function calculateMaxDrawdown(prices: number[]): number {
    let maxDrawdown = 0
    let peak = prices[0]

    for (const price of prices) {
      if (price > peak) {
        peak = price
      } else {
        const drawdown = (peak - price) / peak
        maxDrawdown = Math.max(maxDrawdown, drawdown)
      }
    }

    return maxDrawdown
  }

  function calculateSharpeRatio(returns: number[], avgReturn: number, riskFreeRate: number): number {
    const volatility = calculateVolatility(returns)
    if (volatility === 0) return 0
    return (avgReturn - riskFreeRate) / volatility
  }

  function calculateVolatility(returns: number[]): number {
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    return Math.sqrt(variance)
  }

  // Lifecycle
  onMounted(() => {
    if (walletStore.isConnected) {
      startMonitoring()
    }
  })

  watch(() => walletStore.isConnected, (connected) => {
    if (connected) {
      startMonitoring()
    } else {
      monitoring.value = false
    }
  })

  return {
    positions,
    riskMetrics,
    riskLimits,
    portfolioValue,
    riskScore,
    monitoring,
    startMonitoring,
    closePosition,
    updateRiskLimits: (limits: Partial<RiskLimits>) => {
      riskLimits.value = { ...riskLimits.value, ...limits }
    }
  }
}
```
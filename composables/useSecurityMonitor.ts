```typescript
import { ref, onMounted } from 'vue'
import { useToast } from './useToast'
import { useWalletStore } from '~/stores/wallet'
import { ethers } from 'ethers'

interface SecurityAlert {
  id: string
  type: 'high' | 'medium' | 'low'
  message: string
  timestamp: number
  resolved: boolean
}

interface SecurityMetrics {
  riskScore: number
  activeMonitors: number
  lastCheck: number
  alerts: SecurityAlert[]
}

export function useSecurityMonitor() {
  const toast = useToast()
  const walletStore = useWalletStore()

  const metrics = ref<SecurityMetrics>({
    riskScore: 0,
    activeMonitors: 0,
    lastCheck: 0,
    alerts: []
  })

  const monitoring = ref(false)
  const pausedMonitors = ref<Set<string>>(new Set())

  // Security checks
  async function monitorTransactions() {
    try {
      const contract = walletStore.contract
      const filter = contract.filters.Transfer()
      
      contract.on(filter, async (from, to, value, event) => {
        // Check for suspicious patterns
        await checkTransactionPattern(from, to, value)
        
        // Monitor gas usage
        await checkGasUsage(event.transactionHash)
        
        // Check for contract interactions
        await validateContractInteraction(to)
      })
      
      metrics.value.activeMonitors++
    } catch (error) {
      console.error('Transaction monitoring failed:', error)
      addAlert('medium', 'Transaction monitoring system encountered an error')
    }
  }

  async function checkTransactionPattern(from: string, to: string, value: ethers.BigNumber) {
    try {
      // Check for known malicious addresses
      const isMalicious = await checkMaliciousAddress(to)
      if (isMalicious) {
        addAlert('high', `Suspicious transaction detected with flagged address: ${to}`)
        return
      }

      // Check for unusual transaction values
      const isUnusual = await checkUnusualValue(value)
      if (isUnusual) {
        addAlert('medium', 'Unusual transaction value detected')
      }

      // Pattern analysis
      const pattern = await analyzeTransactionPattern(from, to)
      if (pattern.suspicious) {
        addAlert('medium', `Suspicious transaction pattern detected: ${pattern.reason}`)
      }
    } catch (error) {
      console.error('Transaction pattern check failed:', error)
    }
  }

  async function checkGasUsage(txHash: string) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const receipt = await provider.getTransactionReceipt(txHash)
      
      if (receipt && receipt.gasUsed) {
        const gasLimit = 500000 // Example threshold
        if (receipt.gasUsed.gt(gasLimit)) {
          addAlert('medium', 'High gas usage detected in transaction')
        }
      }
    } catch (error) {
      console.error('Gas usage check failed:', error)
    }
  }

  async function validateContractInteraction(address: string) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const code = await provider.getCode(address)
      
      if (code !== '0x') {
        // Verify contract source
        const isVerified = await checkContractVerification(address)
        if (!isVerified) {
          addAlert('high', `Interaction with unverified contract detected: ${address}`)
        }
      }
    } catch (error) {
      console.error('Contract validation failed:', error)
    }
  }

  // Helper functions
  async function checkMaliciousAddress(address: string): Promise<boolean> {
    // Implementation for checking against known malicious addresses
    return false
  }

  async function checkUnusualValue(value: ethers.BigNumber): Promise<boolean> {
    // Implementation for checking unusual transaction values
    return false
  }

  async function analyzeTransactionPattern(from: string, to: string): Promise<{ suspicious: boolean, reason?: string }> {
    // Implementation for analyzing transaction patterns
    return { suspicious: false }
  }

  async function checkContractVerification(address: string): Promise<boolean> {
    // Implementation for checking contract verification
    return true
  }

  function addAlert(type: SecurityAlert['type'], message: string) {
    const alert: SecurityAlert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
      resolved: false
    }
    
    metrics.value.alerts.unshift(alert)
    metrics.value.riskScore = calculateRiskScore()
    
    if (type === 'high') {
      toast.error(message)
    }
  }

  function calculateRiskScore(): number {
    const activeAlerts = metrics.value.alerts.filter(a => !a.resolved)
    const weights = { high: 1, medium: 0.5, low: 0.2 }
    
    const score = activeAlerts.reduce((total, alert) => {
      return total + weights[alert.type]
    }, 0)
    
    return Math.min(Math.max(score, 0), 1)
  }

  function startMonitoring() {
    if (monitoring.value) return
    monitoring.value = true
    monitorTransactions()
    metrics.value.lastCheck = Date.now()
  }

  function stopMonitoring() {
    monitoring.value = false
    // Clean up listeners
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
      stopMonitoring()
    }
  })

  return {
    metrics,
    monitoring,
    startMonitoring,
    stopMonitoring,
    addAlert
  }
}
```
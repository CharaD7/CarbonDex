<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4 slide-in">User Profile</h1>
      <p class="text-muted-foreground mb-6 fade-in">Manage your account and view transaction history</p>
    </div>

    <!-- User Info -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Account Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ formatEther(balance) }} ETH</div>
          <p class="text-sm text-muted-foreground">
            ≈ ${{ formatUSD(balanceUSD) }}
          </p>
        </CardContent>
      </Card>

      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Carbon Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ totalCredits }}</div>
          <p class="text-sm text-muted-foreground">
            Across {{ uniqueTypes }} types
          </p>
        </CardContent>
      </Card>

      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Trading Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">${{ formatNumber(tradingVolume) }}</div>
          <p class="text-sm text-muted-foreground">
            {{ totalTrades }} trades
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Credit Holdings -->
    <Card class="mb-8 glow-on-hover">
      <CardHeader>
        <CardTitle>Credit Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left py-3">Type</th>
                <th class="text-left py-3">Quantity</th>
                <th class="text-left py-3">Average Price</th>
                <th class="text-left py-3">Current Value</th>
                <th class="text-left py-3">Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="holding in holdings" :key="holding.id" 
                  class="border-b hover:bg-muted/50 transition-colors">
                <td class="py-3">{{ holding.type }}</td>
                <td class="py-3">{{ holding.quantity }}</td>
                <td class="py-3">${{ holding.avgPrice.toFixed(2) }}</td>
                <td class="py-3">${{ holding.currentValue.toFixed(2) }}</td>
                <td class="py-3">
                  <span :class="holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
                    {{ holding.pnl >= 0 ? '+' : '' }}{{ holding.pnl.toFixed(2) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Transaction History -->
    <Card class="bounce-on-hover">
      <CardHeader>
        <div class="flex justify-between items-center">
          <CardTitle>Transaction History</CardTitle>
          <div class="flex gap-2">
            <Select v-model="txFilter" class="w-[150px]">
              <option value="all">All Types</option>
              <option value="buy">Buys</option>
              <option value="sell">Sells</option>
            </Select>
            <Select v-model="txSort" class="w-[150px]">
              <option value="recent">Most Recent</option>
              <option value="value">Highest Value</option>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="tx in filteredTransactions" :key="tx.hash" 
               class="p-4 border rounded hover:bg-muted/50 transition-colors">
            <div class="flex justify-between items-start">
              <div>
                <div class="flex items-center gap-2">
                  <Badge :variant="tx.type === 'buy' ? 'default' : 'secondary'">
                    {{ tx.type === 'buy' ? 'Buy' : 'Sell' }}
                  </Badge>
                  <span class="font-medium">{{ tx.creditType }}</span>
                </div>
                <p class="text-sm text-muted-foreground mt-1">
                  {{ formatDate(tx.timestamp) }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-medium">${{ formatNumber(tx.value) }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ tx.quantity }} credits @ ${{ tx.price.toFixed(2) }}
                </p>
              </div>
            </div>
            <div class="mt-2 text-sm">
              <a :href="`https://etherscan.io/tx/${tx.hash}`" 
                 target="_blank" 
                 class="text-primary hover:underline">
                View on Etherscan
              </a>
            </div>
          </div>
        </div>

        <div v-if="transactions.length === 0" class="text-center py-8 text-muted-foreground">
          No transactions found
        </div>

        <div v-if="hasMoreTransactions" class="text-center mt-4">
          <Button variant="outline" @click="loadMoreTransactions" :loading="loadingMore">
            Load More
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ethers } from 'ethers'
import { useWalletStore } from '~/stores/wallet'
import { useKraken } from '~/composables/useKraken'

const walletStore = useWalletStore()
const kraken = useKraken()

// User Data
const balance = ref('0')
const balanceUSD = ref(0)
const totalCredits = ref(0)
const uniqueTypes = ref(0)
const tradingVolume = ref(0)
const totalTrades = ref(0)

// Holdings
const holdings = ref([
  {
    id: 1,
    type: 'Forest Conservation',
    quantity: 100,
    avgPrice: 25.50,
    currentValue: 28.75,
    pnl: 12.75
  },
  {
    id: 2,
    type: 'Renewable Energy',
    quantity: 75,
    avgPrice: 20.00,
    currentValue: 22.50,
    pnl: 12.50
  }
])

// Transactions
const transactions = ref([])
const txFilter = ref('all')
const txSort = ref('recent')
const loadingMore = ref(false)
const page = ref(1)
const hasMoreTransactions = ref(true)

// Computed
const filteredTransactions = computed(() => {
  let filtered = [...transactions.value]
  
  if (txFilter.value !== 'all') {
    filtered = filtered.filter(tx => tx.type === txFilter.value)
  }
  
  if (txSort.value === 'recent') {
    filtered.sort((a, b) => b.timestamp - a.timestamp)
  } else if (txSort.value === 'value') {
    filtered.sort((a, b) => b.value - a.value)
  }
  
  return filtered
})

// Utilities
function formatEther(wei: string): string {
  return parseFloat(ethers.formatEther(wei)).toFixed(4)
}

function formatUSD(value: number): string {
  return value.toFixed(2)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }).format(num)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Data Loading
async function loadUserData() {
  if (!walletStore.isConnected) return

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    balance.value = await provider.getBalance(walletStore.address)
    
    // Get ETH/USD rate
    const ethRate = await kraken.getExchangeRate()
    balanceUSD.value = parseFloat(formatEther(balance.value)) * ethRate.toNumber()
    
    // Load user's credits
    const contract = walletStore.contract
    const userCredits = await contract.getHoldings(walletStore.address)
    totalCredits.value = userCredits.reduce((acc, credit) => acc + credit.quantity, 0)
    uniqueTypes.value = new Set(userCredits.map(credit => credit.type)).size
    
    // Load trading stats
    const stats = await contract.getUserStats(walletStore.address)
    tradingVolume.value = stats.volume
    totalTrades.value = stats.trades
  } catch (error) {
    console.error('Failed to load user data:', error)
  }
}

async function loadTransactions() {
  if (!walletStore.isConnected) return
  
  loadingMore.value = true
  try {
    const contract = walletStore.contract
    const events = await contract.queryFilter(
      contract.filters.CreditPurchased(null, walletStore.address),
      -10000 * page.value,
      'latest'
    )
    
    const newTxs = await Promise.all(
      events.map(async (event) => {
        const tx = await event.getTransaction()
        const credit = await contract.credits(event.args.tokenId)
        return {
          hash: tx.hash,
          type: 'buy',
          creditType: credit.name,
          quantity: event.args.amount,
          price: credit.price,
          value: credit.price * event.args.amount,
          timestamp: (await event.getBlock()).timestamp * 1000
        }
      })
    )
    
    transactions.value = [...transactions.value, ...newTxs]
    hasMoreTransactions.value = newTxs.length === 10 // Assuming 10 txs per page
  } catch (error) {
    console.error('Failed to load transactions:', error)
  } finally {
    loadingMore.value = false
  }
}

async function loadMoreTransactions() {
  page.value++
  await loadTransactions()
}

// Initial Load
onMounted(() => {
  if (walletStore.isConnected) {
    loadUserData()
    loadTransactions()
  }
})

// Watch for wallet connection
watch(() => walletStore.isConnected, (connected) => {
  if (connected) {
    loadUserData()
    loadTransactions()
  }
})

// Watch for filters
watch([txFilter, txSort], () => {
  page.value = 1
  transactions.value = []
  loadTransactions()
})
</script>
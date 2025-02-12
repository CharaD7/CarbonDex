```vue
<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4 slide-in">Order Book</h1>
      <p class="text-muted-foreground mb-6 fade-in">Real-time market depth and order matching</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Market Overview -->
      <Card class="lg:col-span-1 bounce-on-hover">
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Last Price</span>
              <span class="text-xl font-bold">${{ formatNumber(lastPrice) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">24h Change</span>
              <span :class="priceChange >= 0 ? 'text-green-500' : 'text-red-500'">
                {{ priceChange >= 0 ? '+' : '' }}{{ priceChange }}%
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">24h Volume</span>
              <span>${{ formatNumber(volume) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Market Depth</span>
              <span>${{ formatNumber(marketDepth) }}</span>
            </div>
          </div>

          <Separator class="my-4" />

          <div class="space-y-2">
            <Label>Select Credit Type</Label>
            <Select v-model="selectedCredit" @change="loadOrderBook">
              <option v-for="credit in credits" :key="credit.id" :value="credit.id">
                {{ credit.name }}
              </option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <!-- Order Book -->
      <Card class="lg:col-span-2 glow-on-hover">
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-4">
            <!-- Asks -->
            <div>
              <div class="mb-2 text-muted-foreground">Asks</div>
              <div class="space-y-1">
                <div v-for="ask in sortedAsks" :key="ask.price"
                     class="flex justify-between items-center p-2 hover:bg-muted/50 transition-colors"
                     :style="{ background: `linear-gradient(to left, rgba(239, 68, 68, 0.1) ${ask.depth}%, transparent 0%)` }">
                  <span class="text-red-500">{{ formatNumber(ask.price) }}</span>
                  <span>{{ formatNumber(ask.quantity) }}</span>
                </div>
              </div>
            </div>

            <!-- Bids -->
            <div>
              <div class="mb-2 text-muted-foreground">Bids</div>
              <div class="space-y-1">
                <div v-for="bid in sortedBids" :key="bid.price"
                     class="flex justify-between items-center p-2 hover:bg-muted/50 transition-colors"
                     :style="{ background: `linear-gradient(to right, rgba(34, 197, 94, 0.1) ${bid.depth}%, transparent 0%)` }">
                  <span class="text-green-500">{{ formatNumber(bid.price) }}</span>
                  <span>{{ formatNumber(bid.quantity) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Trades -->
          <Separator class="my-4" />
          <div>
            <h3 class="text-lg font-semibold mb-2">Recent Trades</h3>
            <div class="space-y-2">
              <div v-for="trade in recentTrades" :key="trade.id"
                   class="flex justify-between items-center p-2 hover:bg-muted/50 transition-colors">
                <div class="flex items-center gap-2">
                  <span :class="trade.side === 'buy' ? 'text-green-500' : 'text-red-500'">
                    {{ trade.side === 'buy' ? '↑' : '↓' }}
                  </span>
                  <span>{{ formatNumber(trade.price) }}</span>
                </div>
                <span>{{ formatNumber(trade.quantity) }}</span>
                <span class="text-muted-foreground text-sm">
                  {{ formatTime(trade.timestamp) }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Market Depth Chart -->
    <Card class="mt-8">
      <CardHeader>
        <CardTitle>Market Depth</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="h-[400px]">
          <Line
            :data="depthChartData"
            :options="depthChartOptions"
          />
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import { useDataProviders } from '~/composables/useDataProviders'
import { useWalletStore } from '~/stores/wallet'

const dataProviders = useDataProviders()
const walletStore = useWalletStore()

// State
const selectedCredit = ref('')
const lastPrice = ref(0)
const priceChange = ref(0)
const volume = ref(0)
const marketDepth = ref(0)

const asks = ref<{ price: number; quantity: number; depth: number }[]>([])
const bids = ref<{ price: number; quantity: number; depth: number }[]>([])
const recentTrades = ref<any[]>([])

const credits = ref([
  { id: 'forest', name: 'Forest Conservation' },
  { id: 'renewable', name: 'Renewable Energy' },
  { id: 'marine', name: 'Marine Conservation' }
])

// Computed
const sortedAsks = computed(() => {
  return [...asks.value].sort((a, b) => a.price - b.price)
})

const sortedBids = computed(() => {
  return [...bids.value].sort((a, b) => b.price - a.price)
})

const depthChartData = computed(() => ({
  labels: [...bids.value, ...asks.value].map(order => order.price),
  datasets: [
    {
      label: 'Bids',
      data: bids.value.map(bid => ({ x: bid.price, y: bid.quantity })),
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true
    },
    {
      label: 'Asks',
      data: asks.value.map(ask => ({ x: ask.price, y: ask.quantity })),
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true
    }
  ]
}))

const depthChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Price'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Quantity'
      }
    }
  }
}

// Functions
function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

async function loadOrderBook() {
  if (!selectedCredit.value) return

  try {
    const contract = walletStore.contract
    const [askOrders, bidOrders] = await Promise.all([
      contract.getOrders(selectedCredit.value, true),  // asks
      contract.getOrders(selectedCredit.value, false)  // bids
    ])

    // Process asks
    const totalAskVolume = askOrders.reduce((sum, order) => sum + order.quantity, 0)
    asks.value = askOrders.map(order => ({
      price: order.price,
      quantity: order.quantity,
      depth: (order.quantity / totalAskVolume) * 100
    }))

    // Process bids
    const totalBidVolume = bidOrders.reduce((sum, order) => sum + order.quantity, 0)
    bids.value = bidOrders.map(order => ({
      price: order.price,
      quantity: order.quantity,
      depth: (order.quantity / totalBidVolume) * 100
    }))

    // Update market stats
    marketDepth.value = totalAskVolume + totalBidVolume
    lastPrice.value = await contract.getLastPrice(selectedCredit.value)
    volume.value = await contract.get24hVolume(selectedCredit.value)
    
    // Load recent trades
    const trades = await contract.getRecentTrades(selectedCredit.value)
    recentTrades.value = trades.map(trade => ({
      id: trade.id,
      price: trade.price,
      quantity: trade.quantity,
      side: trade.side,
      timestamp: trade.timestamp * 1000
    }))
  } catch (error) {
    console.error('Failed to load order book:', error)
  }
}

// Real-time updates
let orderBookInterval: number

onMounted(() => {
  if (walletStore.isConnected) {
    loadOrderBook()
    orderBookInterval = setInterval(loadOrderBook, 5000)
  }
})

onUnmounted(() => {
  if (orderBookInterval) {
    clearInterval(orderBookInterval)
  }
})

// Watch for wallet connection
watch(() => walletStore.isConnected, (connected) => {
  if (connected) {
    loadOrderBook()
    orderBookInterval = setInterval(loadOrderBook, 5000)
  } else if (orderBookInterval) {
    clearInterval(orderBookInterval)
  }
})
</script>
```
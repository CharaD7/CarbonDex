<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4 slide-in">Market Analytics</h1>
      <p class="text-muted-foreground mb-6 fade-in">Real-time market insights and predictions</p>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Total Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">${{ formatNumber(totalVolume) }}</div>
          <p class="text-sm text-muted-foreground">
            <span :class="volumeChange >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ volumeChange >= 0 ? '↑' : '↓' }} {{ Math.abs(volumeChange) }}%
            </span>
            vs last week
          </p>
        </CardContent>
      </Card>

      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Active Traders</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ formatNumber(activeTraders) }}</div>
          <p class="text-sm text-muted-foreground">
            <span :class="tradersChange >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ tradersChange >= 0 ? '↑' : '↓' }} {{ Math.abs(tradersChange) }}%
            </span>
            vs last week
          </p>
        </CardContent>
      </Card>

      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Average Price</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">${{ averagePrice.toFixed(2) }}</div>
          <p class="text-sm text-muted-foreground">
            <span :class="priceChange >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ priceChange >= 0 ? '↑' : '↓' }} {{ Math.abs(priceChange) }}%
            </span>
            vs last week
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Price Chart -->
    <Card class="mb-8 glow-on-hover">
      <CardHeader>
        <CardTitle>Price Trends</CardTitle>
        <CardDescription>Historical and predicted prices</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="h-[400px]">
          <LineChart
            :data="priceHistory"
            :options="chartOptions"
            class="w-full h-full"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Market Distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card class="bounce-on-hover">
        <CardHeader>
          <CardTitle>Credit Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-[300px]">
            <DoughnutChart
              :data="typeDistribution"
              :options="doughnutOptions"
              class="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card class="bounce-on-hover">
        <CardHeader>
          <CardTitle>Top Traders</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="trader in topTraders" :key="trader.address" 
                 class="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors">
              <div class="flex items-center gap-2">
                <Badge variant="outline">{{ trader.rank }}</Badge>
                <span class="font-medium">{{ shortenAddress(trader.address) }}</span>
              </div>
              <div class="text-right">
                <p class="font-medium">${{ formatNumber(trader.volume) }}</p>
                <p class="text-sm text-muted-foreground">{{ trader.transactions }} trades</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useKiteAI } from '~/composables/useKiteAI'
import { LineChart, DoughnutChart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

const kiteAI = useKiteAI()

// Analytics Data
const totalVolume = ref(1200000)
const volumeChange = ref(15.3)
const activeTraders = ref(2543)
const tradersChange = ref(8.7)
const averagePrice = ref(25.40)
const priceChange = ref(-2.5)

const priceHistory = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Historical Price',
      data: [20, 22, 25, 23, 28, 30],
      borderColor: 'hsl(var(--primary))',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Predicted Price',
      data: [30, 32, 35, 33, 36, 38],
      borderColor: 'hsl(var(--destructive))',
      borderDash: [5, 5],
      fill: false,
      tension: 0.4
    }
  ]
})

const typeDistribution = ref({
  labels: ['Forest', 'Renewable Energy', 'Marine', 'Agriculture'],
  datasets: [{
    data: [40, 30, 20, 10],
    backgroundColor: [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))'
    ]
  }]
})

const topTraders = ref([
  { rank: 1, address: '0x1234...5678', volume: 250000, transactions: 45 },
  { rank: 2, address: '0x8765...4321', volume: 180000, transactions: 32 },
  { rank: 3, address: '0x9876...5432', volume: 150000, transactions: 28 },
  { rank: 4, address: '0x5432...8765', volume: 120000, transactions: 25 },
  { rank: 5, address: '0x6789...0123', volume: 100000, transactions: 20 }
])

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const
    }
  }
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(num)
}

function shortenAddress(address: string): string {
  return address
}

async function loadAnalytics() {
  try {
    const data = await kiteAI.fetchMarketData()
    // Update analytics with real data
    // Implementation depends on the actual data structure
  } catch (error) {
    console.error('Failed to load analytics:', error)
  }
}

onMounted(() => {
  loadAnalytics()
  // Set up real-time updates
  const interval = setInterval(loadAnalytics, 30000)
  onUnmounted(() => clearInterval(interval))
})
</script>
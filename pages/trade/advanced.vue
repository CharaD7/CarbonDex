<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4 slide-in">Advanced Trading</h1>
      <p class="text-muted-foreground mb-6 fade-in">Place limit orders and manage your positions</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Order Form -->
      <Card class="lg:col-span-1 bounce-on-hover">
        <CardHeader>
          <CardTitle>Place Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="placeOrder" class="space-y-4">
            <div class="space-y-2">
              <Label>Credit Type</Label>
              <Select v-model="orderForm.creditType" required>
                <option v-for="type in creditTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Order Type</Label>
              <Select v-model="orderForm.type" required>
                <option value="limit">Limit Order</option>
                <option value="stop">Stop Loss</option>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Side</Label>
              <Select v-model="orderForm.side" required>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Price</Label>
              <Input 
                v-model="orderForm.price" 
                type="number" 
                step="0.01" 
                required 
              />
            </div>

            <div class="space-y-2">
              <Label>Quantity</Label>
              <Input 
                v-model="orderForm.quantity" 
                type="number" 
                min="1" 
                required 
              />
            </div>

            <div class="space-y-2">
              <Label>Expiry</Label>
              <Select v-model="orderForm.expiry">
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="0">Good till cancelled</option>
              </Select>
            </div>

            <Button type="submit" class="w-full" :loading="placing">
              Place Order
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- Order Book -->
      <Card class="lg:col-span-2 glow-on-hover">
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open" class="w-full">
            <TabsList>
              <TabsTrigger value="open">Open Orders</TabsTrigger>
              <TabsTrigger value="filled">Filled Orders</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="open">
              <div class="space-y-4">
                <div v-for="order in openOrders" :key="order.id"
                     class="p-4 border rounded hover:bg-muted/50 transition-colors">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="flex items-center gap-2">
                        <Badge :variant="order.side === 'buy' ? 'default' : 'secondary'">
                          {{ order.side.toUpperCase() }}
                        </Badge>
                        <span class="font-medium">{{ order.creditType }}</span>
                      </div>
                      <p class="text-sm text-muted-foreground mt-1">
                        {{ order.quantity }} @ ${{ order.price }}
                      </p>
                    </div>
                    <div class="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        @click="editOrder(order.id)"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        @click="cancelOrder(order.id)"
                        :loading="cancelling[order.id]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="filled">
              <div class="space-y-4">
                <div v-for="order in filledOrders" :key="order.id"
                     class="p-4 border rounded">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="flex items-center gap-2">
                        <Badge :variant="order.side === 'buy' ? 'default' : 'secondary'">
                          {{ order.side.toUpperCase() }}
                        </Badge>
                        <span class="font-medium">{{ order.creditType }}</span>
                      </div>
                      <p class="text-sm text-muted-foreground mt-1">
                        {{ order.quantity }} @ ${{ order.price }}
                      </p>
                      <p class="text-sm text-muted-foreground">
                        Filled at: {{ formatDate(order.filledAt) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="cancelled">
              <div class="space-y-4">
                <div v-for="order in cancelledOrders" :key="order.id"
                     class="p-4 border rounded">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="flex items-center gap-2">
                        <Badge :variant="order.side === 'buy' ? 'default' : 'secondary'">
                          {{ order.side.toUpperCase() }}
                        </Badge>
                        <span class="font-medium">{{ order.creditType }}</span>
                      </div>
                      <p class="text-sm text-muted-foreground mt-1">
                        {{ order.quantity }} @ ${{ order.price }}
                      </p>
                      <p class="text-sm text-muted-foreground">
                        Cancelled at: {{ formatDate(order.cancelledAt) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'
import { useWalletStore } from '~/stores/wallet'

const toast = useToast()
const walletStore = useWalletStore()

// State
const creditTypes = ref([
  { id: 'forest', name: 'Forest Conservation' },
  { id: 'renewable', name: 'Renewable Energy' },
  { id: 'marine', name: 'Marine Conservation' }
])

const orderForm = ref({
  creditType: '',
  type: 'limit',
  side: 'buy',
  price: '',
  quantity: '',
  expiry: '7'
})

const placing = ref(false)
const cancelling = ref({})

const openOrders = ref([])
const filledOrders = ref([])
const cancelledOrders = ref([])

// Functions
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}

async function placeOrder() {
  if (!walletStore.isConnected) {
    toast.error('Please connect your wallet')
    return
  }

  placing.value = true
  try {
    const contract = walletStore.contract
    const tx = await contract.placeOrder({
      creditType: orderForm.value.creditType,
      orderType: orderForm.value.type,
      side: orderForm.value.side,
      price: parseFloat(orderForm.value.price),
      quantity: parseInt(orderForm.value.quantity),
      expiry: parseInt(orderForm.value.expiry) * 24 * 60 * 60 // Convert days to seconds
    })
    await tx.wait()
    toast.success('Order placed successfully')
    await loadOrders()
    orderForm.value = {
      creditType: '',
      type: 'limit',
      side: 'buy',
      price: '',
      quantity: '',
      expiry: '7'
    }
  } catch (error) {
    console.error('Failed to place order:', error)
    toast.error('Failed to place order')
  } finally {
    placing.value = false
  }
}

async function cancelOrder(orderId: string) {
  cancelling.value[orderId] = true
  try {
    const contract = walletStore.contract
    const tx = await contract.cancelOrder(orderId)
    await tx.wait()
    toast.success('Order cancelled')
    await loadOrders()
  } catch (error) {
    console.error('Failed to cancel order:', error)
    toast.error('Failed to cancel order')
  } finally {
    cancelling.value[orderId] = false
  }
}

async function editOrder(orderId: string) {
  // Implementation for editing orders
}

async function loadOrders() {
  try {
    const contract = walletStore.contract
    const [open, filled, cancelled] = await Promise.all([
      contract.getOpenOrders(walletStore.address),
      contract.getFilledOrders(walletStore.address),
      contract.getCancelledOrders(walletStore.address)
    ])
    
    openOrders.value = open
    filledOrders.value = filled
    cancelledOrders.value = cancelled
  } catch (error) {
    console.error('Failed to load orders:', error)
    toast.error('Failed to load orders')
  }
}

// Lifecycle
onMounted(() => {
  if (walletStore.isConnected) {
    loadOrders()
  }
})

// Watch for wallet connection
watch(() => walletStore.isConnected, (connected) => {
  if (connected) {
    loadOrders()
  }
})
</script>
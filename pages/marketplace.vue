<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Carbon Credit Marketplace</h1>
      <div class="flex gap-4">
        <USelect
          v-model="selectedType"
          :options="creditTypes"
          placeholder="Filter by type"
        />
        <USelect
          v-model="sortBy"
          :options="sortOptions"
          placeholder="Sort by"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="credit in filteredCredits"
        :key="credit.id"
      >
        <template #header>
          <h3 class="text-xl font-semibold">{{ credit.name }}</h3>
        </template>
        <div class="space-y-2">
          <p class="text-2xl font-bold">${{ credit.price }}</p>
          <p class="text-gray-600 dark:text-gray-400">
            Available: {{ credit.quantity }} credits
          </p>
          <p class="text-gray-600 dark:text-gray-400">
            Type: {{ credit.type }}
          </p>
          <div class="flex justify-between items-center mt-4">
            <UButton 
              :loading="purchaseLoading[credit.id]" 
              @click="purchaseCredit(credit)"
            >
              Buy Now
            </UButton>
            <UButton variant="outline" @click="viewDetails(credit)">
              View Details
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Purchase Modal -->
    <UModal v-model="showPurchaseModal">
      <UCard>
        <template #header>
          <h3 class="text-xl font-semibold">Confirm Purchase</h3>
        </template>
        <div class="space-y-4">
          <div v-if="selectedCredit">
            <p>Credit: {{ selectedCredit.name }}</p>
            <p>Price: ${{ selectedCredit.price }}</p>
            <p>Quantity: {{ purchaseQuantity }}</p>
            <p class="font-semibold">Total: ${{ totalPrice }}</p>
          </div>
          <UInput
            v-model="purchaseQuantity"
            type="number"
            min="1"
            label="Quantity"
          />
        </div>
        <template #footer>
          <div class="flex justify-end gap-4">
            <UButton @click="showPurchaseModal = false" variant="outline">
              Cancel
            </UButton>
            <UButton 
              :loading="processingPurchase" 
              @click="confirmPurchase"
            >
              Confirm Purchase
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKiteAI } from '~/composables/useKiteAI'
import { useWalletStore } from '~/stores/wallet'
import { useCarbonCreditContract } from '~/composables/useCarbonCreditContract'

const kiteAI = useKiteAI()
const walletStore = useWalletStore()
const { purchaseCredits } = useCarbonCreditContract()

const selectedType = ref('')
const sortBy = ref('')
const showPurchaseModal = ref(false)
const selectedCredit = ref(null)
const purchaseQuantity = ref(1)
const processingPurchase = ref(false)
const purchaseLoading = ref({})

const creditTypes = [
  { label: 'All Types', value: '' },
  { label: 'Forest', value: 'forest' },
  { label: 'Renewable Energy', value: 'renewable' },
  { label: 'Marine', value: 'marine' }
]

const sortOptions = [
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Quantity Available', value: 'quantity' }
]

const { data: credits, refresh } = await useAsyncData('credits',
  () => kiteAI.fetchMarketData()
)

onMounted(() => {
  const interval = setInterval(refresh, 30000)
  onUnmounted(() => clearInterval(interval))
})

const filteredCredits = computed(() => {
  let result = credits.value || []
  
  if (selectedType.value) {
    result = result.filter(credit => credit.type.toLowerCase() === selectedType.value)
  }
  
  if (sortBy.value) {
    result = [...result].sort((a, b) => {
      if (sortBy.value === 'price-asc') return a.price - b.price
      if (sortBy.value === 'price-desc') return b.price - a.price
      if (sortBy.value === 'quantity') return b.quantity - a.quantity
      return 0
    })
  }
  
  return result
})

const totalPrice = computed(() => {
  if (!selectedCredit.value) return 0
  return (selectedCredit.value.price * purchaseQuantity.value).toFixed(2)
})

async function purchaseCredit(credit: any) {
  if (!walletStore.isConnected) {
    alert('Please connect your wallet first')
    return
  }
  
  selectedCredit.value = credit
  purchaseQuantity.value = 1
  showPurchaseModal.value = true
}

async function confirmPurchase() {
  if (!selectedCredit.value) return
  
  processingPurchase.value = true
  purchaseLoading.value[selectedCredit.value.id] = true
  
  try {
    await purchaseCredits(selectedCredit.value.id, purchaseQuantity.value)
    showPurchaseModal.value = false
    refresh()
  } catch (error) {
    console.error('Purchase failed:', error)
  } finally {
    processingPurchase.value = false
    purchaseLoading.value[selectedCredit.value.id] = false
  }
}

function viewDetails(credit: any) {
  navigateTo(`/marketplace/${credit.id}`)
}
</script>
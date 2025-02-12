<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4 slide-in">Admin Dashboard</h1>
      <p class="text-muted-foreground mb-6 fade-in">Manage credit verification and platform settings</p>
    </div>

    <!-- Pending Verifications -->
    <Card class="mb-8 glow-on-hover">
      <CardHeader>
        <CardTitle>Pending Credit Verifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="credit in pendingCredits" :key="credit.id" 
               class="p-4 border rounded hover:bg-muted/50 transition-colors">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-semibold">{{ credit.name }}</h3>
                <p class="text-sm text-muted-foreground">Type: {{ credit.type }}</p>
                <p class="text-sm text-muted-foreground">Submitted: {{ formatDate(credit.submittedAt) }}</p>
              </div>
              <div class="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  @click="viewDocumentation(credit.id)"
                >
                  View Docs
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  @click="verifyCredit(credit.id)"
                  :loading="verifying[credit.id]"
                >
                  Verify
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  @click="rejectCredit(credit.id)"
                  :loading="rejecting[credit.id]"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Platform Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Total Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ totalCredits }}</div>
          <p class="text-sm text-muted-foreground">
            {{ verifiedCredits }} verified
          </p>
        </CardContent>
      </Card>

      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">{{ activeUsers }}</div>
          <p class="text-sm text-muted-foreground">
            Last 24 hours
          </p>
        </CardContent>
      </Card>

      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Platform Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold">${{ formatNumber(volume) }}</div>
          <p class="text-sm text-muted-foreground">
            Total volume
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Security Settings -->
    <Card class="mb-8 bounce-on-hover">
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="updateSecuritySettings" class="space-y-4">
          <div class="space-y-2">
            <Label>Minimum Verification Time</Label>
            <Select v-model="securitySettings.minVerificationTime">
              <option value="1">1 hour</option>
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Required Confirmations</Label>
            <Select v-model="securitySettings.requiredConfirmations">
              <option value="2">2 confirmations</option>
              <option value="3">3 confirmations</option>
              <option value="4">4 confirmations</option>
            </Select>
          </div>

          <div class="flex items-center space-x-2">
            <Switch v-model="securitySettings.enhancedSecurity" />
            <Label>Enable Enhanced Security Checks</Label>
          </div>

          <Button type="submit" :loading="updating">
            Update Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'
import { useWalletStore } from '~/stores/wallet'

const toast = useToast()
const walletStore = useWalletStore()

// State
const pendingCredits = ref([])
const verifying = ref({})
const rejecting = ref({})
const updating = ref(false)

const totalCredits = ref(0)
const verifiedCredits = ref(0)
const activeUsers = ref(0)
const volume = ref(0)

const securitySettings = ref({
  minVerificationTime: '24',
  requiredConfirmations: '2',
  enhancedSecurity: true
})

// Functions
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

async function loadPendingCredits() {
  try {
    const contract = walletStore.contract
    const events = await contract.queryFilter(contract.filters.CreditSubmitted())
    pendingCredits.value = await Promise.all(
      events.map(async (event) => {
        const credit = await contract.credits(event.args.tokenId)
        return {
          id: event.args.tokenId.toString(),
          name: credit.name,
          type: credit.creditType,
          submittedAt: (await event.getBlock()).timestamp * 1000
        }
      })
    )
  } catch (error) {
    console.error('Failed to load pending credits:', error)
    toast.error('Failed to load pending credits')
  }
}

async function verifyCredit(id: string) {
  verifying.value[id] = true
  try {
    const contract = walletStore.contract
    const tx = await contract.verifyCredit(id)
    await tx.wait()
    toast.success('Credit verified successfully')
    await loadPendingCredits()
  } catch (error) {
    console.error('Failed to verify credit:', error)
    toast.error('Failed to verify credit')
  } finally {
    verifying.value[id] = false
  }
}

async function rejectCredit(id: string) {
  rejecting.value[id] = true
  try {
    const contract = walletStore.contract
    const tx = await contract.rejectCredit(id)
    await tx.wait()
    toast.success('Credit rejected')
    await loadPendingCredits()
  } catch (error) {
    console.error('Failed to reject credit:', error)
    toast.error('Failed to reject credit')
  } finally {
    rejecting.value[id] = false
  }
}

async function viewDocumentation(id: string) {
  // Implementation for viewing documentation
}

async function updateSecuritySettings() {
  updating.value = true
  try {
    const contract = walletStore.contract
    const tx = await contract.updateSecuritySettings({
      minVerificationTime: parseInt(securitySettings.value.minVerificationTime),
      requiredConfirmations: parseInt(securitySettings.value.requiredConfirmations),
      enhancedSecurity: securitySettings.value.enhancedSecurity
    })
    await tx.wait()
    toast.success('Security settings updated')
  } catch (error) {
    console.error('Failed to update security settings:', error)
    toast.error('Failed to update security settings')
  } finally {
    updating.value = false
  }
}

async function loadStatistics() {
  try {
    const contract = walletStore.contract
    const stats = await contract.getPlatformStatistics()
    totalCredits.value = stats.totalCredits
    verifiedCredits.value = stats.verifiedCredits
    activeUsers.value = stats.activeUsers
    volume.value = stats.volume
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

// Lifecycle
onMounted(async () => {
  if (walletStore.isConnected) {
    await Promise.all([
      loadPendingCredits(),
      loadStatistics()
    ])
  }
})

// Watch for wallet connection
watch(() => walletStore.isConnected, (connected) => {
  if (connected) {
    loadPendingCredits()
    loadStatistics()
  }
})
</script>
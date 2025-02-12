<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4 slide-in">Governance Dashboard</h1>
      <p class="text-muted-foreground mb-6 fade-in">Manage multisig transactions and protocol settings</p>
    </div>

    <!-- Transaction Management -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <Card class="bounce-on-hover">
        <CardHeader>
          <CardTitle>Submit Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="submitNewTransaction" class="space-y-4">
            <div class="space-y-2">
              <Label for="to">Recipient Address</Label>
              <Input id="to" v-model="newTx.to" placeholder="0x..." />
            </div>
            <div class="space-y-2">
              <Label for="value">Value (ETH)</Label>
              <Input id="value" v-model="newTx.value" type="number" step="0.001" />
            </div>
            <div class="space-y-2">
              <Label for="data">Transaction Data (hex)</Label>
              <Textarea id="data" v-model="newTx.data" placeholder="0x..." />
            </div>
            <Button type="submit" :loading="submitting">Submit Transaction</Button>
          </form>
        </CardContent>
      </Card>

      <Card class="bounce-on-hover">
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="pendingTransactions.length === 0" class="text-center py-4 text-muted-foreground">
            No pending transactions
          </div>
          <div v-else class="space-y-4">
            <div v-for="tx in pendingTransactions" :key="tx.hash" class="p-4 border rounded-lg">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <p class="font-medium">To: {{ shortenAddress(tx.to) }}</p>
                  <p class="text-sm text-muted-foreground">Value: {{ tx.value }} ETH</p>
                </div>
                <Badge :variant="tx.confirmations >= required ? 'success' : 'secondary'">
                  {{ tx.confirmations }}/{{ required }} Confirmations
                </Badge>
              </div>
              <div class="flex gap-2 mt-4">
                <Button 
                  v-if="!tx.confirmed" 
                  @click="confirmTransaction(tx.hash)"
                  variant="outline"
                  class="glow-on-hover"
                >
                  Confirm
                </Button>
                <Button 
                  v-if="tx.confirmations >= required && !tx.executed"
                  @click="executeTransaction(tx.hash)"
                  class="pulse-on-hover"
                >
                  Execute
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Governance Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Required Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{{ required }}/{{ owners.length }}</p>
        </CardContent>
      </Card>

      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Total Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{{ totalTransactions }}</p>
        </CardContent>
      </Card>

      <Card class="hover-scale">
        <CardHeader>
          <CardTitle>Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{{ successRate }}%</p>
        </CardContent>
      </Card>
    </div>

    <!-- Owners List -->
    <Card class="rotate-on-hover">
      <CardHeader>
        <CardTitle>Wallet Owners</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="owner in owners" :key="owner" class="flex items-center gap-2 p-2 border rounded">
            <Badge variant="outline" class="flex-shrink-0">Owner</Badge>
            <span class="truncate">{{ owner }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ethers } from 'ethers'
import { useWalletStore } from '~/stores/wallet'
import { useToast } from '~/composables/useToast'

const walletStore = useWalletStore()
const toast = useToast()

const owners = ref<string[]>([])
const required = ref(0)
const pendingTransactions = ref<any[]>([])
const totalTransactions = ref(0)
const successRate = ref(0)
const submitting = ref(false)

const newTx = ref({
  to: '',
  value: '',
  data: ''
})

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

async function loadWalletData() {
  if (!walletStore.contract) return

  try {
    const contract = walletStore.contract
    owners.value = await contract.getOwners()
    required.value = await contract.required()
    
    // Load transactions
    const events = await contract.queryFilter(contract.filters.TransactionSubmitted())
    pendingTransactions.value = await Promise.all(
      events.map(async (event) => {
        const tx = await contract.transactions(event.args.txHash)
        const confirmations = await contract.getConfirmationCount(event.args.txHash)
        return {
          hash: event.args.txHash,
          ...tx,
          confirmations,
          confirmed: await contract.isConfirmed(event.args.txHash)
        }
      })
    )

    // Calculate stats
    totalTransactions.value = events.length
    const executed = await contract.queryFilter(contract.filters.TransactionExecuted())
    successRate.value = Math.round((executed.length / events.length) * 100) || 0
  } catch (error) {
    console.error('Failed to load wallet data:', error)
    toast.error('Failed to load wallet data')
  }
}

async function submitNewTransaction() {
  if (!walletStore.contract) return

  submitting.value = true
  try {
    const valueInWei = ethers.parseEther(newTx.value.toString())
    const tx = await walletStore.contract.submitTransaction(
      newTx.to,
      valueInWei,
      newTx.data || '0x'
    )
    await tx.wait()
    toast.success('Transaction submitted successfully')
    await loadWalletData()
    newTx.value = { to: '', value: '', data: '' }
  } catch (error) {
    console.error('Failed to submit transaction:', error)
    toast.error('Failed to submit transaction')
  } finally {
    submitting.value = false
  }
}

async function confirmTransaction(txHash: string) {
  if (!walletStore.contract) return

  try {
    const tx = await walletStore.contract.confirmTransaction(txHash)
    await tx.wait()
    toast.success('Transaction confirmed')
    await loadWalletData()
  } catch (error) {
    console.error('Failed to confirm transaction:', error)
    toast.error('Failed to confirm transaction')
  }
}

async function executeTransaction(txHash: string) {
  if (!walletStore.contract) return

  try {
    const tx = await walletStore.contract.executeTransaction(txHash)
    await tx.wait()
    toast.success('Transaction executed successfully')
    await loadWalletData()
  } catch (error) {
    console.error('Failed to execute transaction:', error)
    toast.error('Failed to execute transaction')
  }
}

onMounted(() => {
  if (walletStore.isConnected) {
    loadWalletData()
  }
})

// Watch for wallet connection
watch(() => walletStore.isConnected, (connected) => {
  if (connected) {
    loadWalletData()
  }
})
</script>
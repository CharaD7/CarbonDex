<template>
  <UButton
    :variant="isConnected ? 'outline' : 'solid'"
    @click="connectWallet"
  >
    <Icon name="carbon:wallet" class="mr-2" />
    {{ isConnected ? 'Connected' : 'Connect Wallet' }}
  </UButton>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ethers } from 'ethers'
import { useWalletStore } from '~/stores/wallet'

const walletStore = useWalletStore()
const isConnected = computed(() => walletStore.isConnected)

async function connectWallet() {
  try {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      walletStore.setWallet({ 
        address: await signer.getAddress(),
        signer
      })
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error)
  }
}
</script>
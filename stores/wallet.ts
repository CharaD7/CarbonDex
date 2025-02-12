import { defineStore } from 'pinia'
import { ethers } from 'ethers'

interface WalletState {
  address: string | null
  signer: ethers.Signer | null
}

export const useWalletStore = defineStore('wallet', {
  state: (): WalletState => ({
    address: null,
    signer: null
  }),
  
  getters: {
    isConnected: state => !!state.address
  },
  
  actions: {
    setWallet({ address, signer }: { address: string, signer: ethers.Signer }) {
      this.address = address
      this.signer = signer
    },
    
    disconnect() {
      this.address = null
      this.signer = null
    }
  }
})
import { ethers } from 'ethers'
import Decimal from 'decimal.js'
import CarbonCreditABI from '~/contracts/artifacts/CarbonCredit.json'

export function useCarbonCreditContract() {
  const config = useRuntimeConfig()
  const walletStore = useWalletStore()
  const kraken = useKraken()
  
  const getContract = () => {
    if (!walletStore.signer) throw new Error('Wallet not connected')
    
    return new ethers.Contract(
      config.public.contractAddress,
      CarbonCreditABI.abi,
      walletStore.signer
    )
  }

  const purchaseCredits = async (tokenId: number, amount: number) => {
    const contract = getContract()
    const credit = await contract.credits(tokenId)
    const priceInUSD = new Decimal(credit.price).times(amount)
    
    // Get current ETH/USD rate
    const ethRate = await kraken.getExchangeRate()
    const ethAmount = priceInUSD.dividedBy(ethRate)
    
    // Create payment through Kraken
    const payment = await kraken.createPayment(ethAmount.toNumber())
    
    // Monitor payment status
    const checkPaymentStatus = async () => {
      const status = await kraken.getPaymentStatus(payment.orderId)
      if (status.status === 'closed') {
        // Execute the purchase on the smart contract
        const tx = await contract.purchaseCredits(tokenId, amount, {
          value: ethers.parseEther(ethAmount.toString())
        })
        await tx.wait()
        return tx
      } else if (status.status === 'canceled' || status.status === 'expired') {
        throw new Error('Payment failed or expired')
      }
      // Continue checking if still pending
      await new Promise(resolve => setTimeout(resolve, 5000))
      return checkPaymentStatus()
    }

    return checkPaymentStatus()
  }

  return {
    purchaseCredits
  }
}
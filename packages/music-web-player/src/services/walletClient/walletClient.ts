import { ID, BNWei, StringWei, WalletAddress } from '@coliving/common'
import BN from 'bn.js'

import { stringWeiToBN } from 'common/utils/wallet'
import ColivingBackend from 'services/colivingBackend'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

// 0.001 Audio
export const MIN_TRANSFERRABLE_WEI = stringWeiToBN(
  '1000000000000000' as StringWei
)

const BN_ZERO = new BN('0') as BNWei

class WalletClient {
  init() {}

  async getCurrentBalance(bustCache = false): Promise<BNWei> {
    try {
      const balance = await ColivingBackend.getBalance(bustCache)
      return balance as BNWei
    } catch (err) {
      console.error(err)
      return BN_ZERO
    }
  }

  async getCurrentWAudioBalance(): Promise<BNWei> {
    try {
      const balance = await ColivingBackend.getWAudioBalance()
      return balance as BNWei
    } catch (err) {
      console.error(err)
      return BN_ZERO
    }
  }

  async transferTokensFromEthToSol(): Promise<void> {
    const balance = await ColivingBackend.getBalance(true)
    if (balance.gt(new BN('0'))) {
      await ColivingBackend.transferAudioToWAudio(balance)
    }
  }

  async getAssociatedWalletBalance(
    userID: ID,
    bustCache = false
  ): Promise<BNWei> {
    try {
      const associatedWallets = await apiClient.getAssociatedWallets({
        userID
      })

      if (associatedWallets === null) throw new Error('Unable to fetch wallets')
      const balances = await Promise.all([
        ...associatedWallets.wallets.map((wallet) =>
          ColivingBackend.getAddressTotalStakedBalance(wallet, bustCache)
        ),
        ...associatedWallets.sol_wallets.map((wallet) =>
          ColivingBackend.getAddressWAudioBalance(wallet)
        )
      ])

      const totalBalance = balances.reduce(
        (sum, walletBalance) => sum.add(walletBalance),
        new BN('0')
      )
      return totalBalance as BNWei
    } catch (err) {
      console.error(err)
      return BN_ZERO
    }
  }

  async getEthWalletBalances(
    wallets: string[],
    bustCache = false
  ): Promise<{ address: string; balance: BNWei }[]> {
    try {
      const balances: { address: string; balance: BNWei }[] = await Promise.all(
        wallets.map(async (wallet) => {
          const balance = await ColivingBackend.getAddressTotalStakedBalance(
            wallet,
            bustCache
          )
          return { address: wallet, balance: balance as BNWei }
        })
      )
      return balances
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getSolWalletBalances(
    wallets: string[]
  ): Promise<{ address: string; balance: BNWei }[]> {
    try {
      const balances: { address: string; balance: BNWei }[] = await Promise.all(
        wallets.map(async (wallet) => {
          const balance = await ColivingBackend.getAddressWAudioBalance(wallet)
          return { address: wallet, balance: balance as BNWei }
        })
      )
      return balances
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async claim(): Promise<void> {
    try {
      await ColivingBackend.makeDistributionClaim()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async sendTokens(address: WalletAddress, amount: BNWei): Promise<void> {
    if (amount.lt(MIN_TRANSFERRABLE_WEI)) {
      throw new Error('Insufficient Audio to transfer')
    }
    try {
      await ColivingBackend.sendTokens(address, amount)
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async sendWAudioTokens(address: WalletAddress, amount: BNWei): Promise<void> {
    if (amount.lt(MIN_TRANSFERRABLE_WEI)) {
      throw new Error('Insufficient Audio to transfer')
    }
    try {
      const { res, error, errorCode } = await ColivingBackend.sendWAudioTokens(
        address,
        amount
      )
      if (error) {
        if (error === 'Missing social proof') {
          throw new Error(error)
        }
        if (
          error ===
          'Recipient has no $DGC token account. Please install Phantom-Wallet to create one.'
        ) {
          throw new Error(error)
        }
        console.error(
          `Error sending sol wrapped digitalcoin amount ${amount.toString()} to ${address.toString()}` +
            `with error ${error.toString()} and errorCode: ${errorCode}`
        )
        throw new Error(
          `Error: ${error.toString()}, with code ${errorCode?.toString()}`
        )
      }
      return res
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}

const client = new WalletClient()

export default client

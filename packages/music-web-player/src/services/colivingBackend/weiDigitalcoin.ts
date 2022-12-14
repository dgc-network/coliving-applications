import { Name, Nullable } from '@coliving/common'
import { AccountInfo } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

import { waitForLibsInit } from 'services/colivingBackend/eagerLoadUtils'
import { digital_content } from 'store/analytics/providers'

// @ts-ignore
const libs = () => window.colivingLibs

export const doesUserBankExist = async () => {
  await waitForLibsInit()
  const userBank: PublicKey = await libs().solanaWeb3Manager.getUserBank()
  const doesExist = await checkIsCreatedTokenAccount(userBank.toString())
  return doesExist
}

export const checkIsCreatedTokenAccount = async (addr: string) => {
  await waitForLibsInit()
  const tokenAccount: Nullable<AccountInfo> =
    await libs().solanaWeb3Manager.getAssociatedTokenAccountInfo(addr)
  return tokenAccount != null
}

export const createUserBank = async (feePayerOverride = null) => {
  await waitForLibsInit()
  return libs().solanaWeb3Manager.createUserBank(feePayerOverride)
}

export const createUserBankIfNeeded = async (feePayerOverride = null) => {
  await waitForLibsInit()
  const userId = libs().Account.getCurrentUser().user_id
  try {
    const userbankExists = await doesUserBankExist()
    if (userbankExists) return
    console.warn(`Userbank doesn't exist, attempting to create...`)
    await digital_content(Name.CREATE_USER_BANK_REQUEST, { userId })
    const { error, errorCode } = await createUserBank(feePayerOverride)
    if (error || errorCode) {
      console.error(
        `Failed to create userbank, with err: ${error}, ${errorCode}`
      )
      await digital_content(Name.CREATE_USER_BANK_FAILURE, {
        userId,
        errorCode,
        error: (error as any).toString()
      })
    } else {
      console.log(`Successfully created userbank!`)
      await digital_content(Name.CREATE_USER_BANK_SUCCESS, { userId })
    }
  } catch (err) {
    await digital_content(Name.CREATE_USER_BANK_FAILURE, {
      userId,
      errorMessage: (err as any).toString()
    })
    console.error(`Failed to create userbank, with err: ${err}`)
  }
}

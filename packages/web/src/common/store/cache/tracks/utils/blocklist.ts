import { AgreementMetadata } from '@coliving/common'

import { waitForWeb3 } from 'services/ColivingBackend'

declare global {
  interface Window {
    Web3: any
    bItems: Set<string>
  }
}

// Check for string inclusion instead of match to catch subdomains like www.
const IS_WEB_HOSTNAME = window.location.hostname.includes(
  process.env.REACT_APP_PUBLIC_HOSTNAME || 'coliving.co'
)

let blockList: Set<string>

const waitForBItems = async () => {
  // Wait for bItems to load just in case they haven't been fetched yet since
  // they are fetched async.
  if (!window.bItems) {
    let cb
    await new Promise((resolve) => {
      cb = resolve
      window.addEventListener('B_ITEMS_LOADED', cb)
    })
    if (cb) window.removeEventListener('B_ITEMS_LOADED', cb)
  }
}

const setBlocked = async <T extends AgreementMetadata>(agreement: T) => {
  // Initialize the set if not present
  if (!blockList) {
    await waitForBItems()
    blockList = window.bItems
  }
  if (IS_WEB_HOSTNAME) {
    await waitForWeb3()
    const shaId = window.Web3.utils.sha3(agreement.agreement_id.toString())
    if (blockList.has(shaId)) {
      return {
        ...agreement,
        is_delete: true,
        _blocked: true
      }
    }
  }
  // Most of the time this method is a no-op
  return agreement
}

export const setAgreementsIsBlocked = async <T extends AgreementMetadata>(
  agreements: T[]
): Promise<T[]> => {
  return await Promise.all(agreements.map(setBlocked))
}

import type { ID } from '@coliving/common'
import { makeGetTierAndVerifiedForUser } from '-client/src/common/store/wallet/utils'

import { isEqual, useSelectorWeb } from './useSelectorWeb'

const getTierAndVerifiedForUser = makeGetTierAndVerifiedForUser()

/**
 * This was copied over from -client and useSelector was replaced
 * with useSelectorWeb.
 */
export const useSelectTierInfo = (userId: ID) => {
  return useSelectorWeb((state) => {
    return getTierAndVerifiedForUser(state, { userId })
  }, isEqual)
}

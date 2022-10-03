import { ID, Agreement } from '@coliving/common'

import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

type RetrieveUserAgreementsArgs = {
  handle: string
  currentUserId: ID | null
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
  /**
   * This will only let a user obtain their own unlisted agreements, not
   * anyone's unlisted agreements. Prevention logic is in discovery node.
   */
  getUnlisted?: boolean
}

export function* retrieveUserAgreements({
  handle,
  currentUserId,
  sort,
  offset,
  limit,
  getUnlisted = false
}: RetrieveUserAgreementsArgs): Generator<any, Agreement[], any> {
  const apiAgreements = yield apiClient.getUserAgreementsByHandle({
    handle,
    currentUserId,
    sort,
    limit,
    offset,
    getUnlisted
  })

  const processed: Agreement[] = yield processAndCacheAgreements(apiAgreements)
  return processed
}

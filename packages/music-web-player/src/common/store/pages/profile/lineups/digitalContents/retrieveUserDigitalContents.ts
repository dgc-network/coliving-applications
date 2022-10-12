import { ID, DigitalContent } from '@coliving/common'

import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

type RetrieveUserDigitalContentsArgs = {
  handle: string
  currentUserId: ID | null
  sort?: 'date' | 'plays'
  offset?: number
  limit?: number
  /**
   * This will only let a user obtain their own unlisted digitalContents, not
   * anyone's unlisted digitalContents. Prevention logic is in discovery node.
   */
  getUnlisted?: boolean
}

export function* retrieveUserDigitalContents({
  handle,
  currentUserId,
  sort,
  offset,
  limit,
  getUnlisted = false
}: RetrieveUserDigitalContentsArgs): Generator<any, DigitalContent[], any> {
  const apiDigitalContents = yield apiClient.getUserDigitalContentsByHandle({
    handle,
    currentUserId,
    sort,
    limit,
    offset,
    getUnlisted
  })

  const processed: DigitalContent[] = yield processAndCacheDigitalContents(apiDigitalContents)
  return processed
}

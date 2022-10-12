import { ID, UserCollection, DigitalContent, UserDigitalContentMetadata } from '@coliving/common'
import { all } from 'redux-saga/effects'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

const getDigitalContentsAndCollections = (
  feed: (UserDigitalContentMetadata | UserCollection)[]
) =>
  feed.reduce(
    (
      acc: [UserDigitalContentMetadata[], UserCollection[]],
      cur: UserDigitalContentMetadata | UserCollection
    ) =>
      ('digital_content_id' in cur
        ? [[...acc[0], cur], acc[1]]
        : [acc[0], [...acc[1], cur]]) as [
        UserDigitalContentMetadata[],
        UserCollection[]
      ],
    [[], []]
  )

type RetrieveUserRepostsArgs = {
  handle: string
  currentUserId: ID | null
  offset?: number
  limit?: number
}

export function* retrieveUserReposts({
  handle,
  currentUserId,
  offset,
  limit
}: RetrieveUserRepostsArgs): Generator<any, DigitalContent[], any> {
  const reposts = yield apiClient.getUserRepostsByHandle({
    handle,
    currentUserId,
    limit,
    offset
  })
  const [digitalContents, collections] = getDigitalContentsAndCollections(reposts)
  const digitalContentIds = digitalContents.map((t) => t.digital_content_id)
  const [processedDigitalContents, processedCollections] = yield all([
    processAndCacheDigitalContents(digitalContents),
    processAndCacheCollections(
      collections,
      /* shouldRetrieveDigitalContents */ false,
      digitalContentIds
    )
  ])
  const processedDigitalContentsMap = processedDigitalContents.reduce(
    (acc: any, cur: any) => ({ ...acc, [cur.digital_content_id]: cur }),
    {}
  )
  const processedCollectionsMap = processedCollections.reduce(
    (acc: any, cur: any) => ({ ...acc, [cur.content_list_id]: cur }),
    {}
  )
  const processed = reposts.map((m: any) =>
    m.digital_content_id
      ? processedDigitalContentsMap[m.digital_content_id]
      : processedCollectionsMap[m.content_list_id]
  )

  return processed
}

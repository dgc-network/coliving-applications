import { ID, UserCollection, DigitalContent, UserAgreementMetadata } from '@coliving/common'
import { all } from 'redux-saga/effects'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

const getAgreementsAndCollections = (
  feed: (UserAgreementMetadata | UserCollection)[]
) =>
  feed.reduce(
    (
      acc: [UserAgreementMetadata[], UserCollection[]],
      cur: UserAgreementMetadata | UserCollection
    ) =>
      ('digital_content_id' in cur
        ? [[...acc[0], cur], acc[1]]
        : [acc[0], [...acc[1], cur]]) as [
        UserAgreementMetadata[],
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
  const [agreements, collections] = getAgreementsAndCollections(reposts)
  const agreementIds = agreements.map((t) => t.digital_content_id)
  const [processedAgreements, processedCollections] = yield all([
    processAndCacheAgreements(agreements),
    processAndCacheCollections(
      collections,
      /* shouldRetrieveAgreements */ false,
      agreementIds
    )
  ])
  const processedAgreementsMap = processedAgreements.reduce(
    (acc: any, cur: any) => ({ ...acc, [cur.digital_content_id]: cur }),
    {}
  )
  const processedCollectionsMap = processedCollections.reduce(
    (acc: any, cur: any) => ({ ...acc, [cur.content_list_id]: cur }),
    {}
  )
  const processed = reposts.map((m: any) =>
    m.digital_content_id
      ? processedAgreementsMap[m.digital_content_id]
      : processedCollectionsMap[m.content_list_id]
  )

  return processed
}

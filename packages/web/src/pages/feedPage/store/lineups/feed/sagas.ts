import {
  ID,
  Collection,
  UserCollectionMetadata,
  FeedFilter,
  Kind,
  LineupAgreement,
  AgreementMetadata,
  UserAgreementMetadata
} from '@coliving/common'
import { select, all } from 'redux-saga/effects'

import { CommonState } from 'common/store'
import { getAccountUser } from 'common/store/account/selectors'
import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import { PREFIX, feedActions } from 'common/store/pages/feed/lineup/actions'
import { getFeedFilter } from 'common/store/pages/feed/selectors'
import {
  getAccountReady,
  getFollowIds,
  getStartedSignOnProcess
} from 'pages/signOn/store/selectors'
import apiClient, {
  GetSocialFeedArgs
} from 'services/coliving-api-client/ColivingAPIClient'
import { LineupSagas } from 'store/lineup/sagas'

type FeedItem = LineupAgreement | Collection

const filterMap = {
  [FeedFilter.ALL]: 'all',
  [FeedFilter.ORIGINAL]: 'original',
  [FeedFilter.REPOST]: 'repost'
}

function* getAgreements({
  offset,
  limit
}: {
  offset: number
  limit: number
}): Generator<any, FeedItem[], any> {
  const currentUser = yield select(getAccountUser)
  const filterEnum: FeedFilter = yield select(getFeedFilter)
  const filter = filterMap[filterEnum]

  // NOTE: The `/feed` does not paginate, so the feed is requested from 0 to N
  const params: GetSocialFeedArgs = {
    offset: 0,
    limit: offset + limit,
    filter,
    with_users: true,
    current_user_id: currentUser.user_id
  }

  // If the user just signed up, we might not have a feed ready.
  // Optimistically load the feed as though the follows are all confirmed.
  const startedSignOn = yield select(getStartedSignOnProcess)
  if (startedSignOn) {
    const isAccountReady = yield select(getAccountReady)
    if (!isAccountReady) {
      // Get the landlords the user selected in signup:
      const followeeUserIds = yield select(getFollowIds)
      params.followee_user_ids = followeeUserIds
    }
  }

  const feed: (UserAgreementMetadata | UserCollectionMetadata)[] =
    yield apiClient.getSocialFeed(params)
  if (!feed.length) return []
  const filteredFeed = feed.filter((record) => !record.user.is_deactivated)
  const [agreements, collections] = getAgreementsAndCollections(filteredFeed)
  const agreementIds = agreements.map((t) => t.agreement_id)

  // Process (e.g. cache and remove entries)
  const [processedAgreements, processedCollections]: [LineupAgreement[], Collection[]] =
    yield all([
      processAndCacheAgreements(agreements),
      processAndCacheCollections(collections, true, agreementIds)
    ])
  const processedAgreementsMap = processedAgreements.reduce<Record<ID, LineupAgreement>>(
    (acc, cur) => ({ ...acc, [cur.agreement_id]: cur }),
    {}
  )
  const processedCollectionsMap = processedCollections.reduce<
    Record<ID, Collection>
  >((acc, cur) => ({ ...acc, [cur.content_list_id]: cur }), {})
  const processedFeed: FeedItem[] = filteredFeed.map((m) =>
    (m as LineupAgreement).agreement_id
      ? processedAgreementsMap[(m as LineupAgreement).agreement_id]
      : processedCollectionsMap[(m as UserCollectionMetadata).content_list_id]
  )
  return processedFeed
}

const getAgreementsAndCollections = (
  feed: Array<AgreementMetadata | UserCollectionMetadata>
) =>
  feed.reduce<[LineupAgreement[], UserCollectionMetadata[]]>(
    (acc, cur) =>
      (cur as LineupAgreement).agreement_id
        ? [[...acc[0], cur as LineupAgreement], acc[1]]
        : [acc[0], [...acc[1], cur as UserCollectionMetadata]],
    [[], []]
  )

const keepActivityTimeStamp = (
  entry: (LineupAgreement | Collection) & { uid: string } // LineupSaga adds a UID to each entry
) => ({
  uid: entry.uid,
  kind: (entry as LineupAgreement).agreement_id ? Kind.AGREEMENTS : Kind.COLLECTIONS,
  id: (entry as LineupAgreement).agreement_id || (entry as Collection).content_list_id,
  activityTimestamp: entry.activity_timestamp
})

class FeedSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      feedActions,
      (store: CommonState) => store.pages.feed.feed,
      getAgreements,
      keepActivityTimeStamp
    )
  }
}

export default function sagas() {
  return new FeedSagas().getSagas()
}

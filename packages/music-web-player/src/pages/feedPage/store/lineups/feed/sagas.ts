import {
  ID,
  Collection,
  UserCollectionMetadata,
  FeedFilter,
  Kind,
  LineupDigitalContent,
  DigitalContentMetadata,
  UserDigitalContentMetadata
} from '@coliving/common'
import { select, all } from 'redux-saga/effects'

import { CommonState } from 'common/store'
import { getAccountUser } from 'common/store/account/selectors'
import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import { PREFIX, feedActions } from 'common/store/pages/feed/lineup/actions'
import { getFeedFilter } from 'common/store/pages/feed/selectors'
import {
  getAccountReady,
  getFollowIds,
  getStartedSignOnProcess
} from 'pages/signOn/store/selectors'
import apiClient, {
  GetSocialFeedArgs
} from 'services/colivingAPIClient/colivingAPIClient'
import { LineupSagas } from 'store/lineup/sagas'

type FeedItem = LineupDigitalContent | Collection

const filterMap = {
  [FeedFilter.ALL]: 'all',
  [FeedFilter.ORIGINAL]: 'original',
  [FeedFilter.REPOST]: 'repost'
}

function* getDigitalContents({
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

  const feed: (UserDigitalContentMetadata | UserCollectionMetadata)[] =
    yield apiClient.getSocialFeed(params)
  if (!feed.length) return []
  const filteredFeed = feed.filter((record) => !record.user.is_deactivated)
  const [digitalContents, collections] = getDigitalContentsAndCollections(filteredFeed)
  const digitalContentIds = digitalContents.map((t) => t.digital_content_id)

  // Process (e.g. cache and remove entries)
  const [processedDigitalContents, processedCollections]: [LineupDigitalContent[], Collection[]] =
    yield all([
      processAndCacheDigitalContents(digitalContents),
      processAndCacheCollections(collections, true, digitalContentIds)
    ])
  const processedDigitalContentsMap = processedDigitalContents.reduce<Record<ID, LineupDigitalContent>>(
    (acc, cur) => ({ ...acc, [cur.digital_content_id]: cur }),
    {}
  )
  const processedCollectionsMap = processedCollections.reduce<
    Record<ID, Collection>
  >((acc, cur) => ({ ...acc, [cur.content_list_id]: cur }), {})
  const processedFeed: FeedItem[] = filteredFeed.map((m) =>
    (m as LineupDigitalContent).digital_content_id
      ? processedDigitalContentsMap[(m as LineupDigitalContent).digital_content_id]
      : processedCollectionsMap[(m as UserCollectionMetadata).content_list_id]
  )
  return processedFeed
}

const getDigitalContentsAndCollections = (
  feed: Array<DigitalContentMetadata | UserCollectionMetadata>
) =>
  feed.reduce<[LineupDigitalContent[], UserCollectionMetadata[]]>(
    (acc, cur) =>
      (cur as LineupDigitalContent).digital_content_id
        ? [[...acc[0], cur as LineupDigitalContent], acc[1]]
        : [acc[0], [...acc[1], cur as UserCollectionMetadata]],
    [[], []]
  )

const keepActivityTimeStamp = (
  entry: (LineupDigitalContent | Collection) & { uid: string } // LineupSaga adds a UID to each entry
) => ({
  uid: entry.uid,
  kind: (entry as LineupDigitalContent).digital_content_id ? Kind.AGREEMENTS : Kind.COLLECTIONS,
  id: (entry as LineupDigitalContent).digital_content_id || (entry as Collection).content_list_id,
  activityTimestamp: entry.activity_timestamp
})

class FeedSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      feedActions,
      (store: CommonState) => store.pages.feed.feed,
      getDigitalContents,
      keepActivityTimeStamp
    )
  }
}

export default function sagas() {
  return new FeedSagas().getSagas()
}

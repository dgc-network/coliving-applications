import {
  SmartCollection,
  SmartCollectionVariant,
  Status,
  DigitalContent,
  UserDigitalContent
} from '@coliving/common'
import { takeEvery, put, call, select } from 'typed-redux-saga/macro'

import { getAccountStatus, getUserId } from 'common/store/account/selectors'
import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import { fetchUsers as retrieveUsers } from 'common/store/cache/users/sagas'
import { setSmartCollection } from 'common/store/pages/collection/actions'
import {
  fetchSmartCollection,
  fetchSmartCollectionSucceeded
} from 'common/store/pages/smartCollection/slice'
import Explore from 'services/colivingBackend/explore'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getLuckyDigitalContents } from 'store/recommendation/sagas'
import { EXPLORE_PAGE } from 'utils/route'
import { requiresAccount, waitForValue } from 'utils/sagaHelpers'

import {
  HEAVY_ROTATION,
  BEST_NEW_RELEASES,
  MOST_LOVED,
  FEELING_LUCKY,
  UNDER_THE_RADAR,
  REMIXABLES
} from '../smartCollections'

const COLLECTIONS_LIMIT = 25

function* fetchHeavyRotation() {
  const topListens = yield* call(Explore.getTopUserListens)

  const users = yield* call(
    retrieveUsers,
    topListens.map((t) => t.userId)
  )
  const digitalContentIds = topListens
    .filter(
      (digital_content) =>
        users.entries[digital_content.userId] &&
        !users.entries[digital_content.userId].is_deactivated
    )
    .map((listen) => ({
      digital_content: listen.digitalContentId
    }))

  return {
    ...HEAVY_ROTATION,
    content_list_contents: {
      digital_content_ids: digitalContentIds
    }
  }
}

function* fetchBestNewReleases() {
  const digitalContents = yield* call(Explore.getTopFolloweeDigitalContentsFromWindow, 'month')

  const digitalContentIds = digitalContents
    .filter((digital_content) => !digital_content.user.is_deactivated)
    .map((digital_content: DigitalContent) => ({
      time: digital_content.created_at,
      digital_content: digital_content.digital_content_id
    }))

  yield* call(processAndCacheDigitalContents, digitalContents)

  return {
    ...BEST_NEW_RELEASES,
    content_list_contents: {
      digital_content_ids: digitalContentIds
    }
  }
}

function* fetchUnderTheRadar() {
  const digitalContents = yield* call(Explore.getFeedNotListenedTo)

  const digitalContentIds = digitalContents
    .filter((digital_content: UserDigitalContent) => !digital_content.user.is_deactivated)
    .map((digital_content: DigitalContent) => ({
      time: digital_content.activity_timestamp,
      digital_content: digital_content.digital_content_id
    }))

  yield* call(processAndCacheDigitalContents, digitalContents)

  // feed minus listened
  return {
    ...UNDER_THE_RADAR,
    content_list_contents: {
      digital_content_ids: digitalContentIds
    }
  }
}

function* fetchMostLoved() {
  const digitalContents = yield* call(Explore.getTopFolloweeSaves)

  const digitalContentIds = digitalContents
    .filter((digital_content) => !digital_content.user.is_deactivated)
    .map((digital_content: DigitalContent) => ({
      time: digital_content.created_at,
      digital_content: digital_content.digital_content_id
    }))

  yield call(processAndCacheDigitalContents, digitalContents)

  return {
    ...MOST_LOVED,
    content_list_contents: {
      digital_content_ids: digitalContentIds
    }
  }
}

function* fetchFeelingLucky() {
  const digitalContents = yield* call(getLuckyDigitalContents, COLLECTIONS_LIMIT)

  const digitalContentIds = digitalContents
    .filter((digital_content) => !digital_content.user.is_deactivated)
    .map((digital_content: DigitalContent) => ({
      time: digital_content.created_at,
      digital_content: digital_content.digital_content_id
    }))

  return {
    ...FEELING_LUCKY,
    content_list_contents: {
      digital_content_ids: digitalContentIds
    }
  }
}

function* fetchRemixables() {
  const currentUserId = yield* select(getUserId)
  if (currentUserId == null) {
    return
  }
  const digitalContents = yield* call(
    Explore.getRemixables,
    currentUserId,
    75 // limit
  )

  // Limit the number of times an author can appear
  const landlordLimit = 3
  const landlordCount: Record<number, number> = {}

  const filteredDigitalContents = digitalContents.filter((digitalContentMetadata) => {
    if (digitalContentMetadata.user?.is_deactivated) {
      return false
    }
    const id = digitalContentMetadata.owner_id
    if (!landlordCount[id]) {
      landlordCount[id] = 0
    }
    landlordCount[id]++
    return landlordCount[id] <= landlordLimit
  })

  const processedDigitalContents = yield* call(
    processAndCacheDigitalContents,
    filteredDigitalContents.slice(0, COLLECTIONS_LIMIT)
  )

  const digitalContentIds = processedDigitalContents.map((digital_content: DigitalContent) => ({
    time: digital_content.created_at,
    digital_content: digital_content.digital_content_id
  }))

  return {
    ...REMIXABLES,
    content_list_contents: {
      digital_content_ids: digitalContentIds
    }
  }
}

const fetchMap = {
  [SmartCollectionVariant.HEAVY_ROTATION]: requiresAccount(
    fetchHeavyRotation,
    EXPLORE_PAGE
  ),
  [SmartCollectionVariant.BEST_NEW_RELEASES]: requiresAccount(
    fetchBestNewReleases,
    EXPLORE_PAGE
  ),
  [SmartCollectionVariant.UNDER_THE_RADAR]: requiresAccount(
    fetchUnderTheRadar,
    EXPLORE_PAGE
  ),
  [SmartCollectionVariant.MOST_LOVED]: requiresAccount(
    fetchMostLoved,
    EXPLORE_PAGE
  ),
  [SmartCollectionVariant.FEELING_LUCKY]: fetchFeelingLucky,
  [SmartCollectionVariant.REMIXABLES]: fetchRemixables,
  [SmartCollectionVariant.LIVE_NFT_CONTENT_LIST]: () => {}
}

function* watchFetch() {
  yield takeEvery(
    fetchSmartCollection.type,
    function* (action: ReturnType<typeof fetchSmartCollection>) {
      yield call(waitForBackendSetup)
      yield call(
        waitForValue,
        getAccountStatus,
        {},
        (status) => status !== Status.LOADING
      )

      const { variant } = action.payload

      const collection: SmartCollection | undefined = yield* call(
        fetchMap[variant]
      )

      if (collection) {
        yield put(
          fetchSmartCollectionSucceeded({
            variant,
            collection
          })
        )
      }
      yield put(setSmartCollection(variant))
    }
  )
}

export default function sagas() {
  return [watchFetch]
}

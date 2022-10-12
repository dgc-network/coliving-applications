import {
  SmartCollection,
  SmartCollectionVariant,
  Status,
  DigitalContent,
  UserAgreement
} from '@coliving/common'
import { takeEvery, put, call, select } from 'typed-redux-saga/macro'

import { getAccountStatus, getUserId } from 'common/store/account/selectors'
import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import { fetchUsers as retrieveUsers } from 'common/store/cache/users/sagas'
import { setSmartCollection } from 'common/store/pages/collection/actions'
import {
  fetchSmartCollection,
  fetchSmartCollectionSucceeded
} from 'common/store/pages/smartCollection/slice'
import Explore from 'services/colivingBackend/explore'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getLuckyAgreements } from 'store/recommendation/sagas'
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
  const agreementIds = topListens
    .filter(
      (digital_content) =>
        users.entries[digital_content.userId] &&
        !users.entries[digital_content.userId].is_deactivated
    )
    .map((listen) => ({
      digital_content: listen.agreementId
    }))

  return {
    ...HEAVY_ROTATION,
    content_list_contents: {
      digital_content_ids: agreementIds
    }
  }
}

function* fetchBestNewReleases() {
  const agreements = yield* call(Explore.getTopFolloweeAgreementsFromWindow, 'month')

  const agreementIds = agreements
    .filter((digital_content) => !digital_content.user.is_deactivated)
    .map((digital_content: DigitalContent) => ({
      time: digital_content.created_at,
      digital_content: digital_content.digital_content_id
    }))

  yield* call(processAndCacheAgreements, agreements)

  return {
    ...BEST_NEW_RELEASES,
    content_list_contents: {
      digital_content_ids: agreementIds
    }
  }
}

function* fetchUnderTheRadar() {
  const agreements = yield* call(Explore.getFeedNotListenedTo)

  const agreementIds = agreements
    .filter((digital_content: UserAgreement) => !digital_content.user.is_deactivated)
    .map((digital_content: DigitalContent) => ({
      time: digital_content.activity_timestamp,
      digital_content: digital_content.digital_content_id
    }))

  yield* call(processAndCacheAgreements, agreements)

  // feed minus listened
  return {
    ...UNDER_THE_RADAR,
    content_list_contents: {
      digital_content_ids: agreementIds
    }
  }
}

function* fetchMostLoved() {
  const agreements = yield* call(Explore.getTopFolloweeSaves)

  const agreementIds = agreements
    .filter((digital_content) => !digital_content.user.is_deactivated)
    .map((digital_content: DigitalContent) => ({
      time: digital_content.created_at,
      digital_content: digital_content.digital_content_id
    }))

  yield call(processAndCacheAgreements, agreements)

  return {
    ...MOST_LOVED,
    content_list_contents: {
      digital_content_ids: agreementIds
    }
  }
}

function* fetchFeelingLucky() {
  const agreements = yield* call(getLuckyAgreements, COLLECTIONS_LIMIT)

  const agreementIds = agreements
    .filter((digital_content) => !digital_content.user.is_deactivated)
    .map((digital_content: DigitalContent) => ({
      time: digital_content.created_at,
      digital_content: digital_content.digital_content_id
    }))

  return {
    ...FEELING_LUCKY,
    content_list_contents: {
      digital_content_ids: agreementIds
    }
  }
}

function* fetchRemixables() {
  const currentUserId = yield* select(getUserId)
  if (currentUserId == null) {
    return
  }
  const agreements = yield* call(
    Explore.getRemixables,
    currentUserId,
    75 // limit
  )

  // Limit the number of times an landlord can appear
  const landlordLimit = 3
  const landlordCount: Record<number, number> = {}

  const filteredAgreements = agreements.filter((agreementMetadata) => {
    if (agreementMetadata.user?.is_deactivated) {
      return false
    }
    const id = agreementMetadata.owner_id
    if (!landlordCount[id]) {
      landlordCount[id] = 0
    }
    landlordCount[id]++
    return landlordCount[id] <= landlordLimit
  })

  const processedAgreements = yield* call(
    processAndCacheAgreements,
    filteredAgreements.slice(0, COLLECTIONS_LIMIT)
  )

  const agreementIds = processedAgreements.map((digital_content: DigitalContent) => ({
    time: digital_content.created_at,
    digital_content: digital_content.digital_content_id
  }))

  return {
    ...REMIXABLES,
    content_list_contents: {
      digital_content_ids: agreementIds
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

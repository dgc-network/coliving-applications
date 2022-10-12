import { Collection, Status } from '@coliving/common'
import { takeEvery, call, put } from 'typed-redux-saga/macro'

import { getAccountStatus } from 'common/store/account/selectors'
import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import Explore from 'services/colivingBackend/explore'
import { waitForBackendSetup } from 'store/backend/sagas'
import { EXPLORE_PAGE } from 'utils/route'
import { waitForValue, requiresAccount } from 'utils/sagaHelpers'

import { ExploreCollectionsVariant } from '../types'

import { fetch, fetchSucceeded } from './slice'

function* fetchLetThemDJ() {
  const collections = yield* call(Explore.getTopCollections, 'contentList', true)
  return collections
}

function* fetchTopAlbums() {
  const collections = yield* call(Explore.getTopCollections, 'album', false)
  return collections
}

function* fetchMoodContentLists(moods: string[]) {
  const collections = yield* call(Explore.getTopContentListsForMood, moods)
  return collections
}

const fetchMap = {
  [ExploreCollectionsVariant.LET_THEM_DJ]: requiresAccount(
    fetchLetThemDJ,
    EXPLORE_PAGE
  ),
  [ExploreCollectionsVariant.TOP_ALBUMS]: fetchTopAlbums,
  [ExploreCollectionsVariant.MOOD]: fetchMoodContentLists
}

function* watchFetch() {
  yield* takeEvery(fetch.type, function* (action: ReturnType<typeof fetch>) {
    yield* call(waitForBackendSetup)
    yield* call(
      waitForValue,
      getAccountStatus,
      {},
      (status) => status !== Status.LOADING
    )

    const { variant, moods } = action.payload

    let collections
    if (variant === ExploreCollectionsVariant.MOOD) {
      collections = yield* call(
        fetchMap[ExploreCollectionsVariant.MOOD],
        moods!
      )
    } else if (variant === ExploreCollectionsVariant.DIRECT_LINK) {
      // no-op
    } else {
      collections = yield* call(fetchMap[variant])
    }
    if (!collections) return

    yield* call(
      processAndCacheCollections,
      collections,
      /* shouldRetrieveDigitalContents= */ false
    )

    const collectionIds = collections.map((c: Collection) => c.content_list_id)

    yield* put(
      fetchSucceeded({
        variant,
        collectionIds
      })
    )
  })
}

export default function sagas() {
  return [watchFetch]
}

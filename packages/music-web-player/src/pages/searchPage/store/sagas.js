import { select, call, takeLatest, put } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { processAndCacheUsers } from 'common/store/cache/users/utils'
import * as searchPageActions from 'common/store/pages/searchResults/actions'
import { digitalContentsActions as digitalContentsLineupActions } from 'common/store/pages/searchResults/lineup/digital_contents/actions'
import { trimToAlphaNumeric } from 'common/utils/formatUtil'
import digitalContentsSagas from 'pages/search-page/store/lineups/digital_contents/sagas'
import ColivingBackend from 'services/colivingBackend'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { waitForBackendSetup } from 'store/backend/sagas'

export function* getTagSearchResults(tag, kind, limit, offset) {
  const results = yield call(ColivingBackend.searchTags, {
    searchText: tag.toLowerCase(),
    minTagThreshold: 1,
    kind,
    limit,
    offset
  })
  const { users, digitalContents } = results

  const creatorIds = digitalContents
    .map((t) => t.owner_id)
    .concat(users.map((u) => u.user_id))

  yield call(fetchUsers, creatorIds)

  const { entries } = yield call(fetchUsers, creatorIds)

  const digitalContentsWithUsers = digitalContents.map((digital_content) => ({
    ...digital_content,
    user: entries[digital_content.owner_id]
  }))
  yield call(processAndCacheDigitalContents, digitalContentsWithUsers)

  return { users, digitalContents }
}

export function* fetchSearchPageTags(action) {
  yield call(waitForBackendSetup)
  const tag = trimToAlphaNumeric(action.tag)

  const results = yield call(
    getTagSearchResults,
    tag,
    action.kind,
    action.limit,
    action.offset
  )
  if (results) {
    results.users = results.users.map(({ user_id: id }) => id)
    results.digitalContents = results.digitalContents.map(({ digital_content_id: id }) => id)
    yield put(searchPageActions.fetchSearchPageTagsSucceeded(results, tag))
    yield put(digitalContentsLineupActions.fetchLineupMetadatas(0, 10))
  } else {
    yield put(searchPageActions.fetchSearchPageTagsFailed())
  }
}

export function* getSearchResults(searchText, kind, limit, offset) {
  const userId = yield select(getUserId)
  const results = yield apiClient.getSearchFull({
    currentUserId: userId,
    query: searchText,
    kind,
    limit,
    offset
  })
  const { digitalContents, albums, contentLists, users } = results

  yield call(processAndCacheUsers, users)
  yield call(processAndCacheDigitalContents, digitalContents)

  const collections = albums.concat(contentLists)
  yield call(
    processAndCacheCollections,
    collections,
    /* shouldRetrieveDigitalContents */ false
  )

  return { users, digitalContents, albums, contentLists }
}

function* fetchSearchPageResults(action) {
  yield call(waitForBackendSetup)

  const results = yield call(
    getSearchResults,
    action.searchText,
    action.searchKind,
    action.limit,
    action.offset
  )
  if (results) {
    results.users = results.users.map(({ user_id: id }) => id)
    results.digitalContents = results.digitalContents.map(({ digital_content_id: id }) => id)
    results.albums = results.albums.map(({ content_list_id: id }) => id)
    results.contentLists = results.contentLists.map(({ content_list_id: id }) => id)
    yield put(
      searchPageActions.fetchSearchPageResultsSucceeded(
        results,
        action.searchText
      )
    )
    yield put(digitalContentsLineupActions.fetchLineupMetadatas(0, 10))
  } else {
    yield put(searchPageActions.fetchSearchPageResultsFailed())
  }
}

function* watchFetchSearchPageTags() {
  yield takeLatest(
    searchPageActions.FETCH_SEARCH_PAGE_TAGS,
    fetchSearchPageTags
  )
}

function* watchFetchSearchPageResults() {
  yield takeLatest(
    searchPageActions.FETCH_SEARCH_PAGE_RESULTS,
    fetchSearchPageResults
  )
}

export default function sagas() {
  return [
    ...digitalContentsSagas(),
    watchFetchSearchPageResults,
    watchFetchSearchPageTags
  ]
}

import { Name } from '@coliving/common'
import { call, cancel, fork, put, race, select, take } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { setDigitalContentsIsBlocked } from 'common/store/cache/digital_contents/utils/blocklist'
import * as searchActions from 'components/searchBar/store/actions'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'

import mobileSagas from './mobileSagas'
import { getSearch } from './selectors'
const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export function* getSearchResults(searchText) {
  const userId = yield select(getUserId)
  const results = yield apiClient.getSearchAutocomplete({
    currentUserId: userId,
    query: searchText,
    limit: 3,
    offset: 0
  })

  const { digitalContents, albums, contentLists, users } = results
  const checkedUsers = users.filter((t) => !t.is_deactivated)
  const checkedDigitalContents = (yield call(setDigitalContentsIsBlocked, digitalContents)).filter(
    (t) => !t.is_delete && !t._blocked && !t.user.is_deactivated
  )
  const checkedContentLists = contentLists.filter((t) => !t.user?.is_deactivated)
  const checkedAlbums = albums.filter((t) => !t.user?.is_deactivated)
  return {
    users: checkedUsers,
    digitalContents: checkedDigitalContents,
    albums: checkedAlbums,
    contentLists: checkedContentLists
  }
}

function* fetchSearchAsync(action) {
  yield call(waitForBackendSetup)
  yield put(searchActions.fetchSearchRequested(action.searchText))
  const search = yield select(getSearch)
  if (action.searchText === search.searchText) {
    const previousResults = {
      digitalContents: search.digitalContents,
      albums: search.albums,
      contentLists: search.contentLists,
      users: search.users
    }
    yield put(
      searchActions.fetchSearchSucceeded(previousResults, search.searchText)
    )
  } else {
    const results = yield call(getSearchResults, action.searchText)
    if (results) {
      yield put(searchActions.fetchSearchSucceeded(results, action.searchText))
      yield put(
        make(Name.SEARCH_SEARCH, {
          term: action.searchText,
          source: 'autocomplete'
        })
      )
    } else {
      yield put(searchActions.fetchSearchFailed(action.searchText))
    }
  }
}

function* watchSearch() {
  let lastTask
  while (true) {
    const { searchAction, cancelSearch } = yield race({
      searchAction: take(searchActions.FETCH_SEARCH),
      cancelSearch: take(searchActions.CANCEL_FETCH_SEARCH)
    })
    if (lastTask) {
      // cancel is no-op if the task has already terminated
      yield cancel(lastTask)

      // Reset the search bar state
      yield put(searchActions.clearSearch())
    }
    if (!cancelSearch) {
      lastTask = yield fork(fetchSearchAsync, searchAction)
    }
  }
}

export default function sagas() {
  const sagas = [watchSearch]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}

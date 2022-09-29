import {
  ID,
  Kind,
  ContentListIdentifier,
  ContentListLibrary,
  ContentListLibraryFolder,
  ContentListLibraryIdentifier,
  User,
  makeKindId
} from '@coliving/common'
import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import { AccountCollection } from 'common/store/account/reducer'
import {
  getAccountNavigationContentLists,
  getAccountUser,
  getContentListLibrary
} from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import {
  containsTempContentList,
  extractTempContentListsFromLibrary,
  getContentListsNotInLibrary,
  removeContentListLibraryDuplicates,
  replaceTempWithResolvedContentLists
} from 'common/store/contentListLibrary/helpers'
import { updateProfileAsync } from 'pages/profilePage/sagas'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getResult } from 'store/confirmer/selectors'
import { waitForValue } from 'utils/sagaHelpers'

import { update } from './slice'

const TEMP_CONTENT_LIST_UPDATE_HELPER = 'TEMP_CONTENT_LIST_UPDATE_HELPER'

/**
 * Given a temp contentList, resolves it to a proper contentList
 * @param contentList
 * @returns a contentList library identifier
 */
function* resolveTempContentLists(
  contentList: ContentListLibraryIdentifier | ContentListLibraryFolder
) {
  if (contentList.type === 'temp_content_list') {
    const { content_list_id }: { content_list_id: ID } = yield call(
      waitForValue,
      getResult,
      {
        uid: makeKindId(Kind.COLLECTIONS, contentList.content_list_id),
        index: 0
      },
      // The contentList has been created
      (res) => Object.keys(res).length > 0
    )
    return {
      type: 'contentList',
      content_list_id
    }
  }
  return contentList
}

function* watchUpdateContentListLibrary() {
  yield takeEvery(
    update.type,
    function* updateContentListLibrary(action: ReturnType<typeof update>) {
      const { contentListLibrary } = action.payload
      yield call(waitForBackendSetup)

      const account: User = yield select(getAccountUser)
      account.content_list_library =
        removeContentListLibraryDuplicates(contentListLibrary)
      yield put(
        cacheActions.update(Kind.USERS, [
          {
            id: account.user_id,
            metadata: account
          }
        ])
      )

      const containsTemps = containsTempContentList(contentListLibrary)
      if (containsTemps) {
        // Deal with temp contentLists
        // If there's a temp contentList, write to the cache, but dispatch
        // to a helper to watch for the update.
        yield put({
          type: TEMP_CONTENT_LIST_UPDATE_HELPER,
          payload: { contentListLibrary }
        })
      } else {
        // Otherwise, just write the profile update
        yield fork(updateProfileAsync, { metadata: account })
      }
    }
  )
}

/**
 * Helper to watch for updates to the library with temp playlits in it.
 * Here we intentionally take latest so that we only do one write to the
 * backend once we've resolved the temp contentList ids to actual ids
 */
function* watchUpdateContentListLibraryWithTempContentList() {
  yield takeLatest(
    TEMP_CONTENT_LIST_UPDATE_HELPER,
    function* makeUpdate(action: ReturnType<typeof update>) {
      const { contentListLibrary: rawContentListLibrary } = action.payload
      const contentListLibrary =
        removeContentListLibraryDuplicates(rawContentListLibrary)
      const account: User = yield select(getAccountUser)

      // Map over contentList library contents and resolve each temp id contentList
      // to one with an actual id. Once we have the actual id, we can proceed
      // with writing the library to the user metadata (profile update)
      const tempContentLists = extractTempContentListsFromLibrary(contentListLibrary)
      const resolvedContentLists: ContentListLibraryIdentifier[] = yield all(
        tempContentLists.map((contentList) => call(resolveTempContentLists, contentList))
      )
      const tempContentListIdToResolvedContentList = tempContentLists.reduce(
        (result, nextTempContentList, index) => ({
          ...result,
          [nextTempContentList.content_list_id]: resolvedContentLists[index]
        }),
        {} as { [key: string]: ContentListLibraryIdentifier }
      )

      contentListLibrary.contents = replaceTempWithResolvedContentLists(
        contentListLibrary,
        tempContentListIdToResolvedContentList
      ).contents
      account.content_list_library = contentListLibrary
      // Update contentList library on chain via an account profile update
      yield call(updateProfileAsync, { metadata: account })
    }
  )
}

/**
 * Goes through the account contentLists and adds contentLists that are
 * not in the user's set contentList library
 */
export function* addContentListsNotInLibrary() {
  let library: ContentListLibrary = yield select(getContentListLibrary)
  if (!library) library = { contents: [] }
  const contentLists: { [id: number]: AccountCollection } = yield select(
    getAccountNavigationContentLists
  )
  const notInLibrary = getContentListsNotInLibrary(library, contentLists)
  if (Object.keys(notInLibrary).length > 0) {
    const newEntries = Object.values(notInLibrary).map(
      (contentList) =>
        ({
          content_list_id: contentList.id,
          type: 'contentList'
        } as ContentListIdentifier)
    )
    const newContents = library.contents.concat(newEntries)
    yield put(
      update({ contentListLibrary: { ...library, contents: newContents } })
    )
  }
}

export default function sagas() {
  const sagas = [
    watchUpdateContentListLibrary,
    watchUpdateContentListLibraryWithTempContentList
  ]
  return sagas
}

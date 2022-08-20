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
} from 'common/store/content list-library/helpers'
import { updateProfileAsync } from 'pages/profile-page/sagas'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getResult } from 'store/confirmer/selectors'
import { waitForValue } from 'utils/sagaHelpers'

import { update } from './slice'

const TEMP_CONTENT_LIST_UPDATE_HELPER = 'TEMP_CONTENT_LIST_UPDATE_HELPER'

/**
 * Given a temp content list, resolves it to a proper content list
 * @param content list
 * @returns a content list library identifier
 */
function* resolveTempContentLists(
  content list: ContentListLibraryIdentifier | ContentListLibraryFolder
) {
  if (content list.type === 'temp_content list') {
    const { content list_id }: { content list_id: ID } = yield call(
      waitForValue,
      getResult,
      {
        uid: makeKindId(Kind.COLLECTIONS, content list.content list_id),
        index: 0
      },
      // The content list has been created
      (res) => Object.keys(res).length > 0
    )
    return {
      type: 'content list',
      content list_id
    }
  }
  return content list
}

function* watchUpdateContentListLibrary() {
  yield takeEvery(
    update.type,
    function* updateContentListLibrary(action: ReturnType<typeof update>) {
      const { content listLibrary } = action.payload
      yield call(waitForBackendSetup)

      const account: User = yield select(getAccountUser)
      account.content list_library =
        removeContentListLibraryDuplicates(content listLibrary)
      yield put(
        cacheActions.update(Kind.USERS, [
          {
            id: account.user_id,
            metadata: account
          }
        ])
      )

      const containsTemps = containsTempContentList(content listLibrary)
      if (containsTemps) {
        // Deal with temp content lists
        // If there's a temp content list, write to the cache, but dispatch
        // to a helper to watch for the update.
        yield put({
          type: TEMP_CONTENT_LIST_UPDATE_HELPER,
          payload: { content listLibrary }
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
 * backend once we've resolved the temp content list ids to actual ids
 */
function* watchUpdateContentListLibraryWithTempContentList() {
  yield takeLatest(
    TEMP_CONTENT_LIST_UPDATE_HELPER,
    function* makeUpdate(action: ReturnType<typeof update>) {
      const { content listLibrary: rawContentListLibrary } = action.payload
      const content listLibrary =
        removeContentListLibraryDuplicates(rawContentListLibrary)
      const account: User = yield select(getAccountUser)

      // Map over content list library contents and resolve each temp id content list
      // to one with an actual id. Once we have the actual id, we can proceed
      // with writing the library to the user metadata (profile update)
      const tempContentLists = extractTempContentListsFromLibrary(content listLibrary)
      const resolvedContentLists: ContentListLibraryIdentifier[] = yield all(
        tempContentLists.map((content list) => call(resolveTempContentLists, content list))
      )
      const tempContentListIdToResolvedContentList = tempContentLists.reduce(
        (result, nextTempContentList, index) => ({
          ...result,
          [nextTempContentList.content list_id]: resolvedContentLists[index]
        }),
        {} as { [key: string]: ContentListLibraryIdentifier }
      )

      content listLibrary.contents = replaceTempWithResolvedContentLists(
        content listLibrary,
        tempContentListIdToResolvedContentList
      ).contents
      account.content list_library = content listLibrary
      // Update content list library on chain via an account profile update
      yield call(updateProfileAsync, { metadata: account })
    }
  )
}

/**
 * Goes through the account content lists and adds content lists that are
 * not in the user's set content list library
 */
export function* addContentListsNotInLibrary() {
  let library: ContentListLibrary = yield select(getContentListLibrary)
  if (!library) library = { contents: [] }
  const content lists: { [id: number]: AccountCollection } = yield select(
    getAccountNavigationContentLists
  )
  const notInLibrary = getContentListsNotInLibrary(library, content lists)
  if (Object.keys(notInLibrary).length > 0) {
    const newEntries = Object.values(notInLibrary).map(
      (content list) =>
        ({
          content list_id: content list.id,
          type: 'content list'
        } as ContentListIdentifier)
    )
    const newContents = library.contents.concat(newEntries)
    yield put(
      update({ content listLibrary: { ...library, contents: newContents } })
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

import { Name, DefaultSizes, Kind, makeKindId, makeUid } from '@coliving/common'
import { isEqual } from 'lodash'
import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import * as accountActions from 'common/store/account/reducer'
import { getAccountUser, getUserId } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import * as collectionActions from 'common/store/cache/collections/actions'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { squashNewLines } from 'common/utils/formatUtil'
import * as signOnActions from 'pages/signOn/store/actions'
import ColivingBackend from 'services/colivingBackend'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { dataURLtoFile } from 'utils/fileUtils'
import { getContentNodeIPFSGateways } from 'utils/gatewayUtil'

import watchDigitalContentErrors from './errorSagas'
import { ContentListOperations } from './types'
import { reformat } from './utils'
import {
  retrieveCollection,
  retrieveCollections
} from './utils/retrieveCollections'

/** Counts instances of digitalContentId in a contentList. */
const countDigitalContentIds = (contentListContents, digitalContentId) => {
  return contentListContents.digital_content_ids
    .map((t) => t.digital_content)
    .reduce((acc, t) => {
      if (t === digitalContentId) acc += 1
      return acc
    }, 0)
}

/** CREATE CONTENT_LIST */

function* watchCreateContentList() {
  yield takeLatest(collectionActions.CREATE_CONTENT_LIST, createContentListAsync)
}

function* createContentListAsync(action) {
  // Potentially grab artwork from the initializing digital_content.
  if (action.initDigitalContentId) {
    const digital_content = yield select(getDigitalContent, { id: action.initDigitalContentId })
    action.formFields._cover_art_sizes = digital_content._cover_art_sizes
    action.formFields.cover_art_sizes = digital_content.cover_art_sizes
  }

  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  const uid = action.tempId
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }
  yield put(collectionActions.createContentListRequested())

  const contentList = { ...action.formFields }

  // For base64 images (coming from native), convert to a blob
  if (contentList.artwork?.type === 'base64') {
    contentList.artwork.file = dataURLtoFile(contentList.artwork.file)
  }

  const event = make(Name.CONTENT_LIST_START_CREATE, {
    source: action.source,
    artworkSource: contentList.artwork ? contentList.artwork.source : ''
  })
  yield put(event)

  yield call(
    confirmCreateContentList,
    uid,
    userId,
    action.formFields,
    action.source
  )
  contentList.content_list_id = uid
  contentList.content_list_owner_id = userId
  contentList.is_private = true
  contentList.content_list_contents = { digital_content_ids: [] }
  if (contentList.artwork) {
    contentList._cover_art_sizes = {
      ...contentList._cover_art_sizes,
      [DefaultSizes.OVERRIDE]: contentList.artwork.url
    }
  }
  contentList._temp = true

  const subscribedUid = yield makeUid(Kind.COLLECTIONS, uid, 'account')
  yield put(
    cacheActions.add(
      Kind.COLLECTIONS,
      [
        {
          id: contentList.content_list_id,
          uid: subscribedUid,
          metadata: { ...contentList, is_album: false }
        }
      ],
      /* replace= */ true, // forces cache update
      /* persistent cache */ false // Do not persistent cache since it's missing data
    )
  )
  const user = yield select(getUser, { id: userId })
  yield put(
    accountActions.addAccountContentList({
      id: contentList.content_list_id,
      name: contentList.content_list_name,
      isAlbum: contentList.is_album,
      user: { id: userId, handle: user.handle }
    })
  )
  yield put(collectionActions.createContentListSucceeded())

  const collectionIds = (user._collectionIds || [])
    .filter((c) => c.uid !== uid)
    .concat(uid)
  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: userId,
        metadata: { _collectionIds: collectionIds }
      }
    ])
  )
}

function* confirmCreateContentList(uid, userId, formFields, source) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, uid),
      function* () {
        const { blockHash, blockNumber, contentListId, error } = yield call(
          ColivingBackend.createContentList,
          userId,
          formFields
        )

        if (error || !contentListId) throw new Error('Unable to create contentList')

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm contentList creation for contentList id ${contentListId}`
          )
        }

        const confirmedContentList = (yield call(
          ColivingBackend.getContentLists,
          userId,
          [contentListId]
        ))[0]

        // Immediately after confirming the contentList,
        // create a new contentList reference and mark the temporary one as moved.
        // This will trigger the page to refresh, etc. with the new ID url.
        // Even if there are other actions confirming for this particular
        // contentList, those will just file in afterwards.

        const subscribedUid = makeUid(
          Kind.COLLECTIONS,
          confirmedContentList.content_list_id,
          'account'
        )
        const movedCollection = yield select(getCollection, { id: uid })

        // The reformatted contentList is the combination of the results we get back
        // from the confirmation, plus any writes that may be in the confirmer still.
        const reformattedContentList = {
          ...reformat(confirmedContentList),
          ...movedCollection,
          content_list_id: confirmedContentList.content_list_id,
          _temp: false
        }

        // On contentList creation, copy over all fields from the temp collection
        // to retain optimistically set fields.
        yield put(
          cacheActions.add(Kind.COLLECTIONS, [
            {
              id: confirmedContentList.content_list_id,
              uid: subscribedUid,
              metadata: reformattedContentList
            }
          ])
        )
        const user = yield select(getUser, { id: userId })
        yield put(
          cacheActions.update(Kind.USERS, [
            {
              id: userId,
              metadata: {
                _collectionIds: (user._collectionIds || [])
                  .filter((cId) => cId !== uid && confirmedContentList.content_list_id)
                  .concat(confirmedContentList.content_list_id)
              }
            }
          ])
        )
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            { id: uid, metadata: { _moved: subscribedUid } }
          ])
        )
        yield put(accountActions.removeAccountContentList({ collectionId: uid }))
        yield put(
          accountActions.addAccountContentList({
            id: confirmedContentList.content_list_id,
            // Take contentList name from the "local" state because the user
            // may have edited the name before we got the confirmed result back.
            name: reformattedContentList.content_list_name,
            isAlbum: confirmedContentList.is_album,
            user: {
              id: user.user_id,
              handle: user.handle
            }
          })
        )

        const event = make(Name.CONTENT_LIST_COMPLETE_CREATE, {
          source,
          status: 'success'
        })
        yield put(event)
        return confirmedContentList
      },
      function* () {},
      function* ({ error, timeout, message }) {
        const event = make(Name.CONTENT_LIST_COMPLETE_CREATE, {
          source,
          status: 'failure'
        })
        yield put(event)
        yield put(
          collectionActions.createContentListFailed(
            message,
            { userId, formFields, source },
            { error, timeout }
          )
        )
      }
    )
  )
}

/** EDIT CONTENT_LIST */

function* watchEditContentList() {
  yield takeLatest(collectionActions.EDIT_CONTENT_LIST, editContentListAsync)
}

function* editContentListAsync(action) {
  yield call(waitForBackendSetup)
  action.formFields.description = squashNewLines(action.formFields.description)

  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  // Updated the stored account contentList shortcut
  yield put(
    accountActions.renameAccountContentList({
      collectionId: action.contentListId,
      name: action.formFields.content_list_name
    })
  )

  const contentList = { ...action.formFields }

  // For base64 images (coming from native), convert to a blob
  if (contentList.artwork?.type === 'base64') {
    contentList.artwork.file = dataURLtoFile(contentList.artwork.file)
  }

  yield call(confirmEditContentList, action.contentListId, userId, contentList)

  contentList.content_list_id = action.contentListId
  if (contentList.artwork) {
    contentList._cover_art_sizes = {
      ...contentList._cover_art_sizes
    }
    if (contentList.artwork.url) {
      contentList._cover_art_sizes[DefaultSizes.OVERRIDE] = contentList.artwork.url
    }
  }
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: contentList.content_list_id,
        metadata: contentList
      }
    ])
  )
  yield put(collectionActions.editContentListSucceeded())
}

function* confirmEditContentList(contentListId, userId, formFields) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),
      function* (confirmedContentListId) {
        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.updateContentList,
          confirmedContentListId,
          {
            ...formFields
          }
        )

        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm contentList edition for contentList id ${contentListId}`
          )
        }

        return (yield call(ColivingBackend.getContentLists, userId, [
          confirmedContentListId
        ]))[0]
      },
      function* (confirmedContentList) {
        // Update the cached collection so it no longer contains image upload artifacts
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedContentList.content_list_id,
              metadata: { ...reformat(confirmedContentList), artwork: {} }
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        yield put(
          collectionActions.editContentListFailed(
            message,
            { contentListId, userId, formFields },
            { error, timeout }
          )
        )
      },
      (result) => (result.content_list_id ? result.content_list_id : contentListId)
    )
  )
}

/** ADD DIGITAL_CONTENT TO CONTENT_LIST */

function* watchAddDigitalContentToContentList() {
  yield takeEvery(
    collectionActions.ADD_DIGITAL_CONTENT_TO_CONTENT_LIST,
    addDigitalContentToContentListAsync
  )
}

function* addDigitalContentToContentListAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  // Retrieve digitalContents with the the collection so we confirm with the
  // most up-to-date information.
  const { collections } = yield call(
    retrieveCollections,
    userId,
    [action.contentListId],
    true
  )
  const contentList = collections[action.contentListId]

  const digitalContentUid = makeUid(
    Kind.DIGITAL_CONTENTS,
    action.digitalContentId,
    `collection:${action.contentListId}`
  )
  contentList.content_list_contents = {
    digital_content_ids: contentList.content_list_contents.digital_content_ids.concat({
      digital_content: action.digitalContentId,
      time: Math.round(Date.now() / 1000),
      uid: digitalContentUid
    })
  }
  const count = countDigitalContentIds(contentList.content_list_contents, action.digitalContentId)

  const event = make(Name.CONTENT_LIST_ADD, {
    digitalContentId: action.digitalContentId,
    contentListId: action.contentListId
  })
  yield put(event)

  yield call(
    confirmAddDigitalContentToContentList,
    userId,
    action.contentListId,
    action.digitalContentId,
    count
  )
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: contentList.content_list_id,
        metadata: {
          content_list_contents: contentList.content_list_contents
        }
      }
    ])
  )
  yield put(
    cacheActions.subscribe(Kind.DIGITAL_CONTENTS, [{ uid: digitalContentUid, id: action.digitalContentId }])
  )
}

function* confirmAddDigitalContentToContentList(userId, contentListId, digitalContentId, count) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),
      function* (confirmedContentListId) {
        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.addContentListDigitalContent,
          confirmedContentListId,
          digitalContentId
        )
        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm add contentList digital_content for contentList id ${contentListId} and digital_content id ${digitalContentId}`
          )
        }
        return confirmedContentListId
      },
      function* (confirmedContentListId) {
        const confirmedContentList = (yield call(
          retrieveCollection,
          confirmedContentListId
        ))[0]

        const contentList = yield select(getCollection, { id: contentListId })

        /** Since "add digital_content" calls are parallelized, digitalContents may be added
         * out of order. Here we check if digitalContents made it in the intended order;
         * if not, we reorder them into the correct order.
         */
        const numberOfDigitalContentsMatch =
          confirmedContentList.content_list_contents.digital_content_ids.length ===
          contentList.content_list_contents.digital_content_ids.length

        const confirmedContentListHasDigitalContents =
          confirmedContentList.content_list_contents.digital_content_ids.length > 0

        if (numberOfDigitalContentsMatch && confirmedContentListHasDigitalContents) {
          const confirmedContentListDigitalContents =
            confirmedContentList.content_list_contents.digital_content_ids.map((t) => t.digital_content)
          const cachedContentListDigitalContents = contentList.content_list_contents.digital_content_ids.map(
            (t) => t.digital_content
          )
          if (!isEqual(confirmedContentListDigitalContents, cachedContentListDigitalContents)) {
            yield call(
              confirmOrderContentList,
              userId,
              contentListId,
              cachedContentListDigitalContents
            )
          } else {
            yield put(
              cacheActions.update(Kind.COLLECTIONS, [
                {
                  id: confirmedContentList.content_list_id,
                  metadata: confirmedContentList
                }
              ])
            )
          }
        }
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.addDigitalContentToContentListFailed(
            message,
            { userId, contentListId, digitalContentId, count },
            { error, timeout }
          )
        )
      },
      (result) => (result.content_list_id ? result.content_list_id : contentListId),
      undefined,
      {
        operationId: ContentListOperations.ADD_DIGITAL_CONTENT,
        parallelizable: true,
        useOnlyLastSuccessCall: true
      }
    )
  )
}

/** REMOVE DIGITAL_CONTENT FROM CONTENT_LIST */

function* watchRemoveDigitalContentFromContentList() {
  yield takeEvery(
    collectionActions.REMOVE_DIGITAL_CONTENT_FROM_CONTENT_LIST,
    removeDigitalContentFromContentListAsync
  )
}

function* removeDigitalContentFromContentListAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const contentList = yield select(getCollection, { id: action.contentListId })

  // Find the index of the digital_content based on the digital_content's id and timestamp
  const index = contentList.content_list_contents.digital_content_ids.findIndex(
    (t) => t.time === action.timestamp && t.digital_content === action.digitalContentId
  )
  if (index === -1) {
    console.error('Could not find the index of to-be-deleted digital_content')
    return
  }

  const digital_content = contentList.content_list_contents.digital_content_ids[index]
  contentList.content_list_contents.digital_content_ids.splice(index, 1)
  const count = countDigitalContentIds(contentList.content_list_contents, action.digitalContentId)

  yield call(
    confirmRemoveDigitalContentFromContentList,
    userId,
    action.contentListId,
    action.digitalContentId,
    digital_content.time,
    count
  )
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: contentList.content_list_id,
        metadata: {
          content_list_contents: contentList.content_list_contents
        }
      }
    ])
  )
}

// Removes the invalid digital_content ids from the contentList by calling `dangerouslySetContentListOrder`
function* fixInvalidDigitalContentsInContentList(contentListId, userId, invalidDigitalContentIds) {
  yield call(waitForBackendSetup)
  const removedDigitalContentIds = new Set(invalidDigitalContentIds)

  const contentList = yield select(getCollection, { id: contentListId })

  const digitalContentIds = contentList.content_list_contents.digital_content_ids
    .map(({ digital_content }) => digital_content)
    .filter((id) => !removedDigitalContentIds.has(id))
  const { error } = yield call(
    ColivingBackend.dangerouslySetContentListOrder,
    contentListId,
    digitalContentIds
  )
  if (error) throw error

  const currentUserId = yield select(getUserId)
  const contentLists = yield apiClient.getContentList({
    contentListId,
    currentUserId
  })
  return contentLists[0]
}

function* confirmRemoveDigitalContentFromContentList(
  userId,
  contentListId,
  digitalContentId,
  timestamp,
  count
) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),
      function* (confirmedContentListId) {
        // NOTE: In an attempt to fix contentLists in a corrupted state, only attempt the delete contentList digital_content once,
        // if it fails, check if the contentList is in a corrupted state and if so fix it before re-attempting to delete digital content from contentList
        let { blockHash, blockNumber, error } = yield call(
          ColivingBackend.deleteContentListDigitalContent,
          confirmedContentListId,
          digitalContentId,
          timestamp,
          0
        )
        if (error) {
          const {
            error: digitalContentsInContentListError,
            isValid,
            invalidDigitalContentIds
          } = yield call(
            ColivingBackend.validateDigitalContentsInContentList,
            confirmedContentListId
          )
          if (digitalContentsInContentListError) throw digitalContentsInContentListError
          if (!isValid) {
            const updatedContentList = yield call(
              fixInvalidDigitalContentsInContentList,
              confirmedContentListId,
              userId,
              invalidDigitalContentIds
            )
            const isDigitalContentRemoved =
              countDigitalContentIds(updatedContentList.content_list_contents, digitalContentId) <= count
            if (isDigitalContentRemoved) return updatedContentList
          }
          const response = yield call(
            ColivingBackend.deleteContentListDigitalContent,
            confirmedContentListId,
            digitalContentId,
            timestamp
          )
          if (response.error) throw response.error

          blockHash = response.blockHash
          blockNumber = response.blockNumber
        }

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm remove contentList digital_content for contentList id ${contentListId} and digital_content id ${digitalContentId}`
          )
        }
        return confirmedContentListId
      },
      function* (confirmedContentListId) {
        const confirmedContentList = (yield call(
          retrieveCollection,
          confirmedContentListId
        ))[0]
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedContentList.content_list_id,
              metadata: confirmedContentList
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.removeDigitalContentFromContentListFailed(
            message,
            { userId, contentListId, digitalContentId, timestamp, count },
            { error, timeout }
          )
        )
      },
      (result) => (result.content_list_id ? result.content_list_id : contentListId),
      undefined,
      {
        operationId: ContentListOperations.REMOVE_DIGITAL_CONTENT,
        parallelizable: true,
        useOnlyLastSuccessCall: true
      }
    )
  )
}

/** ORDER CONTENT_LIST */

function* watchOrderContentList() {
  yield takeEvery(collectionActions.ORDER_CONTENT_LIST, orderContentListAsync)
}

function* orderContentListAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const contentList = yield select(getCollection, { id: action.contentListId })

  const digitalContentIds = []
  const updatedContentList = {
    ...contentList,
    content_list_contents: {
      ...contentList.content_list_contents,
      digital_content_ids: action.digitalContentIdsAndTimes.map(({ id, time }) => {
        digitalContentIds.push(id)
        return { digital_content: id, time }
      })
    }
  }

  yield call(confirmOrderContentList, userId, action.contentListId, digitalContentIds)
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: updatedContentList.content_list_id,
        metadata: updatedContentList
      }
    ])
  )
}

function* confirmOrderContentList(userId, contentListId, digitalContentIds) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),
      function* (confirmedContentListId) {
        // NOTE: In an attempt to fix contentLists in a corrupted state, only attempt the order contentList digitalContents once,
        // if it fails, check if the contentList is in a corrupted state and if so fix it before re-attempting to order contentList
        let { blockHash, blockNumber, error } = yield call(
          ColivingBackend.orderContentList,
          confirmedContentListId,
          digitalContentIds,
          0
        )
        if (error) {
          const { error, isValid, invalidDigitalContentIds } = yield call(
            ColivingBackend.validateDigitalContentsInContentList,
            confirmedContentListId
          )
          if (error) throw error
          if (!isValid) {
            yield call(
              fixInvalidDigitalContentsInContentList,
              confirmedContentListId,
              userId,
              invalidDigitalContentIds
            )
            const invalidIds = new Set(invalidDigitalContentIds)
            digitalContentIds = digitalContentIds.filter((id) => !invalidIds.has(id))
          }
          const response = yield call(
            ColivingBackend.orderContentList,
            confirmedContentListId,
            digitalContentIds
          )
          if (response.error) {
            throw response.error
          }

          blockHash = response.blockHash
          blockNumber = response.blockNumber
        }

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm order contentList for contentList id ${contentListId}`
          )
        }

        return confirmedContentListId
      },
      function* (confirmedContentListId) {
        const confirmedContentList = (yield call(
          retrieveCollection,
          confirmedContentListId
        ))[0]

        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedContentList.content_list_id,
              metadata: confirmedContentList
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.orderContentListFailed(
            message,
            { userId, contentListId, digitalContentIds },
            { error, timeout }
          )
        )
      },
      (result) => (result.content_list_id ? result.content_list_id : contentListId),
      undefined,
      { operationId: ContentListOperations.REORDER, squashable: true }
    )
  )
}

/** PUBLISH CONTENT_LIST */

function* watchPublishContentList() {
  yield takeEvery(collectionActions.PUBLISH_CONTENT_LIST, publishContentListAsync)
}

function* publishContentListAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const event = make(Name.CONTENT_LIST_MAKE_PUBLIC, { id: action.contentListId })
  yield put(event)

  const contentList = yield select(getCollection, { id: action.contentListId })
  contentList._is_publishing = true
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: contentList.content_list_id,
        metadata: { _is_publishing: true }
      }
    ])
  )

  yield call(confirmPublishContentList, userId, action.contentListId)
}

function* confirmPublishContentList(userId, contentListId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),
      function* (confirmedContentListId) {
        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.publishContentList,
          confirmedContentListId
        )
        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm publish contentList for contentList id ${contentListId}`
          )
        }
        return (yield call(ColivingBackend.getContentLists, userId, [
          confirmedContentListId
        ]))[0]
      },
      function* (confirmedContentList) {
        confirmedContentList.is_private = false
        confirmedContentList._is_publishing = false
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedContentList.content_list_id,
              metadata: confirmedContentList
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.publishContentListFailed(
            message,
            { userId, contentListId },
            { error, timeout }
          )
        )
      },
      (result) => (result.content_list_id ? result.content_list_id : contentListId)
    )
  )
}

/** DELETE CONTENT_LIST */

function* watchDeleteContentList() {
  yield takeEvery(collectionActions.DELETE_CONTENT_LIST, deleteContentListAsync)
}

function* deleteContentListAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  // Depending on whether the collection is an album
  // or contentList, we should either delete all the digitalContents
  // or just delete the collection.
  const collection = yield select(getCollection, { id: action.contentListId })
  if (!collection) return

  const isAlbum = collection.is_album
  if (isAlbum) {
    const digitalContentIds = collection.content_list_contents.digital_content_ids

    const event = make(Name.DELETE, { kind: 'album', id: action.contentListId })
    yield put(event)
    yield call(confirmDeleteAlbum, action.contentListId, digitalContentIds, userId)
  } else {
    const event = make(Name.DELETE, { kind: 'contentList', id: action.contentListId })
    yield put(event)

    // Preemptively mark the contentList as deleted.
    // It's possible there are other transactions confirming
    // for this contentList, which prevent the delete confirmation
    // from running immediately, which would leave
    // the contentList visible before it runs.
    yield put(
      cacheActions.update(Kind.COLLECTIONS, [
        {
          id: action.contentListId,
          metadata: { _marked_deleted: true }
        }
      ])
    )
    yield call(confirmDeleteContentList, userId, action.contentListId)
  }

  const user = yield select(getUser, { id: userId })
  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: userId,
        metadata: {
          _collectionIds: (user._collectionIds || []).filter(
            (cId) => cId !== action.contentListId
          )
        }
      }
    ])
  )
}

function* confirmDeleteAlbum(contentListId, digitalContentIds, userId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),

      // we don't have to worry about passing in a confirmed ID
      // here because unlike deleting a contentList, when
      // deleting an album we know it's persisted to chain already
      // thus we have it's permanent ID.
      function* () {
        // Optimistically mark everything as deleted
        yield all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: contentListId,
                metadata: { _marked_deleted: true }
              }
            ])
          ),
          put(
            cacheActions.update(
              Kind.DIGITAL_CONTENTS,
              digitalContentIds.map((t) => ({
                id: t.digital_content,
                metadata: { _marked_deleted: true }
              }))
            )
          ),
          put(
            accountActions.removeAccountContentList({ collectionId: contentListId })
          )
        ])

        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.deleteAlbum,
          contentListId,
          digitalContentIds
        )
        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(`Could not confirm delete album for id ${contentListId}`)
        }
        return contentListId
      },
      function* () {
        console.debug(`Successfully deleted album ${contentListId}`)
        yield put(cacheActions.remove(Kind.COLLECTIONS, [contentListId]))
      },
      function* ({ error, timeout, message }) {
        console.error(`Failed to delete album ${contentListId}`)
        // Need to revert the deletes now
        const [contentList, user] = yield all([
          select(getCollection, { id: contentListId }),
          select(getAccountUser)
        ])
        yield all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: contentListId,
                metadata: { _marked_deleted: false }
              }
            ])
          ),
          put(
            cacheActions.update(
              Kind.DIGITAL_CONTENTS,
              digitalContentIds.map((t) => ({
                id: t.digital_content,
                metadata: { _marked_deleted: false }
              }))
            )
          ),
          put(
            accountActions.addAccountContentList({
              id: contentList.content_list_id,
              name: contentList.content_list_name,
              isAlbum: contentList.is_album,
              user: { id: user.user_id, handle: user.handle }
            })
          )
        ])
        yield put(
          collectionActions.deleteContentListFailed(
            message,
            { contentListId, digitalContentIds, userId },
            { error, timeout }
          )
        )
      }
    )
  )
}

function* confirmDeleteContentList(userId, contentListId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),
      function* (confirmedContentListId) {
        // Optimistically mark contentList as removed
        yield all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: confirmedContentListId,
                metadata: { _marked_deleted: true }
              }
            ])
          ),
          put(
            accountActions.removeAccountContentList({ collectionId: contentListId })
          )
        ])

        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.deleteContentList,
          confirmedContentListId
        )
        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm delete contentList digital_content for contentList id ${contentListId}`
          )
        }
        return confirmedContentListId
      },
      function* () {
        console.debug(`Successfully deleted contentList ${contentListId}`)
        yield put(cacheActions.remove(Kind.COLLECTIONS, [contentListId]))
      },
      function* ({ error, timeout, message }) {
        console.error(`Failed to delete contentList ${contentListId}`)
        const [contentList, user] = yield all([
          select(getCollection, { id: contentListId }),
          select(getAccountUser)
        ])
        yield all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: contentListId,
                metadata: { _marked_deleted: false }
              }
            ])
          ),
          put(
            accountActions.addAccountContentList({
              id: contentList.content_list_id,
              name: contentList.content_list_name,
              isAlbum: contentList.is_album,
              user: { id: user.user_id, handle: user.handle }
            })
          )
        ])
        yield put(
          collectionActions.deleteContentListFailed(
            message,
            { contentListId, userId },
            { error, timeout }
          )
        )
      },
      (result) => (result.content_list_id ? result.content_list_id : contentListId)
    )
  )
}

function* fetchRepostInfo(entries) {
  const userIds = []
  entries.forEach((entry) => {
    if (entry.metadata.followee_reposts) {
      entry.metadata.followee_reposts.forEach((repost) =>
        userIds.push(repost.user_id)
      )
    }
  })
  if (userIds.length > 0) {
    const { entries: users, uids } = yield call(fetchUsers, userIds)

    const updates = []
    const subscriptions = []
    entries.forEach((entry) => {
      const followeeRepostUsers = { id: entry.id, metadata: { _followees: [] } }
      const subscriptionUids = []
      entry.metadata.followee_reposts.forEach((repost) => {
        followeeRepostUsers.metadata._followees.push({
          ...repost,
          ...users[repost.user_id]
        })
        subscriptionUids.push(uids[repost.user_id])
      })
      updates.push(followeeRepostUsers)
      if (subscriptionUids.length > 0) {
        subscriptions.push({
          id: entry.id,
          kind: Kind.USERS,
          uids: subscriptionUids
        })
      }
    })

    yield put(cacheActions.update(Kind.COLLECTIONS, updates, subscriptions))
  }
}

function* watchAdd() {
  yield takeEvery(cacheActions.ADD_SUCCEEDED, function* (action) {
    if (action.kind === Kind.COLLECTIONS) {
      yield fork(fetchRepostInfo, action.entries)
    }
  })
}

function* watchFetchCoverArt() {
  const inProgress = new Set()
  yield takeEvery(
    collectionActions.FETCH_COVER_ART,
    function* ({ collectionId, size }) {
      // Unique on id and size
      const key = `${collectionId}-${size}`
      if (inProgress.has(key)) return
      inProgress.add(key)

      try {
        let collection = yield select(getCollection, { id: collectionId })
        const user = yield select(getUser, { id: collection.content_list_owner_id })
        if (
          !collection ||
          !user ||
          (!collection.cover_art_sizes && !collection.cover_art)
        )
          return

        const gateways = getContentNodeIPFSGateways(user.content_node_endpoint)
        const multihash = collection.cover_art_sizes || collection.cover_art
        const coverArtSize =
          multihash === collection.cover_art_sizes ? size : null
        const url = yield call(
          ColivingBackend.getImageUrl,
          multihash,
          coverArtSize,
          gateways
        )
        collection = yield select(getCollection, { id: collectionId })
        collection._cover_art_sizes = {
          ...collection._cover_art_sizes,
          [coverArtSize || DefaultSizes.OVERRIDE]: url
        }
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            { id: collectionId, metadata: collection }
          ])
        )
      } catch (e) {
        console.error(
          `Unable to fetch cover art for collection ${collectionId}`
        )
      } finally {
        inProgress.delete(key)
      }
    }
  )
}

export default function sagas() {
  return [
    watchAdd,
    watchCreateContentList,
    watchEditContentList,
    watchAddDigitalContentToContentList,
    watchRemoveDigitalContentFromContentList,
    watchOrderContentList,
    watchPublishContentList,
    watchDeleteContentList,
    watchFetchCoverArt,
    watchDigitalContentErrors
  ]
}

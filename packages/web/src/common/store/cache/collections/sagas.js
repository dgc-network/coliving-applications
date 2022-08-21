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
import { getAgreement } from 'common/store/cache/agreements/selectors'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { squashNewLines } from 'common/utils/formatUtil'
import * as signOnActions from 'pages/sign-on/store/actions'
import ColivingBackend from 'services/ColivingBackend'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { dataURLtoFile } from 'utils/fileUtils'
import { getContentNodeIPFSGateways } from 'utils/gatewayUtil'

import watchAgreementErrors from './errorSagas'
import { ContentListOperations } from './types'
import { reformat } from './utils'
import {
  retrieveCollection,
  retrieveCollections
} from './utils/retrieveCollections'

/** Counts instances of agreementId in a contentList. */
const countAgreementIds = (contentListContents, agreementId) => {
  return contentListContents.agreement_ids
    .map((t) => t.agreement)
    .reduce((acc, t) => {
      if (t === agreementId) acc += 1
      return acc
    }, 0)
}

/** CREATE CONTENT_LIST */

function* watchCreateContentList() {
  yield takeLatest(collectionActions.CREATE_CONTENT_LIST, createContentListAsync)
}

function* createContentListAsync(action) {
  // Potentially grab artwork from the initializing agreement.
  if (action.initAgreementId) {
    const agreement = yield select(getAgreement, { id: action.initAgreementId })
    action.formFields._cover_art_sizes = agreement._cover_art_sizes
    action.formFields.cover_art_sizes = agreement.cover_art_sizes
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
  contentList.contentList_id = uid
  contentList.contentList_owner_id = userId
  contentList.is_private = true
  contentList.contentList_contents = { agreement_ids: [] }
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
          id: contentList.contentList_id,
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
      id: contentList.contentList_id,
      name: contentList.contentList_name,
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
          confirmedContentList.contentList_id,
          'account'
        )
        const movedCollection = yield select(getCollection, { id: uid })

        // The reformatted contentList is the combination of the results we get back
        // from the confirmation, plus any writes that may be in the confirmer still.
        const reformattedContentList = {
          ...reformat(confirmedContentList),
          ...movedCollection,
          contentList_id: confirmedContentList.contentList_id,
          _temp: false
        }

        // On contentList creation, copy over all fields from the temp collection
        // to retain optimistically set fields.
        yield put(
          cacheActions.add(Kind.COLLECTIONS, [
            {
              id: confirmedContentList.contentList_id,
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
                  .filter((cId) => cId !== uid && confirmedContentList.contentList_id)
                  .concat(confirmedContentList.contentList_id)
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
            id: confirmedContentList.contentList_id,
            // Take contentList name from the "local" state because the user
            // may have edited the name before we got the confirmed result back.
            name: reformattedContentList.contentList_name,
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
      name: action.formFields.contentList_name
    })
  )

  const contentList = { ...action.formFields }

  // For base64 images (coming from native), convert to a blob
  if (contentList.artwork?.type === 'base64') {
    contentList.artwork.file = dataURLtoFile(contentList.artwork.file)
  }

  yield call(confirmEditContentList, action.contentListId, userId, contentList)

  contentList.contentList_id = action.contentListId
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
        id: contentList.contentList_id,
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
              id: confirmedContentList.contentList_id,
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
      (result) => (result.contentList_id ? result.contentList_id : contentListId)
    )
  )
}

/** ADD AGREEMENT TO CONTENT_LIST */

function* watchAddAgreementToContentList() {
  yield takeEvery(
    collectionActions.ADD_AGREEMENT_TO_CONTENT_LIST,
    addAgreementToContentListAsync
  )
}

function* addAgreementToContentListAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  // Retrieve agreements with the the collection so we confirm with the
  // most up-to-date information.
  const { collections } = yield call(
    retrieveCollections,
    userId,
    [action.contentListId],
    true
  )
  const contentList = collections[action.contentListId]

  const agreementUid = makeUid(
    Kind.AGREEMENTS,
    action.agreementId,
    `collection:${action.contentListId}`
  )
  contentList.contentList_contents = {
    agreement_ids: contentList.contentList_contents.agreement_ids.concat({
      agreement: action.agreementId,
      time: Math.round(Date.now() / 1000),
      uid: agreementUid
    })
  }
  const count = countAgreementIds(contentList.contentList_contents, action.agreementId)

  const event = make(Name.CONTENT_LIST_ADD, {
    agreementId: action.agreementId,
    contentListId: action.contentListId
  })
  yield put(event)

  yield call(
    confirmAddAgreementToContentList,
    userId,
    action.contentListId,
    action.agreementId,
    count
  )
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: contentList.contentList_id,
        metadata: {
          contentList_contents: contentList.contentList_contents
        }
      }
    ])
  )
  yield put(
    cacheActions.subscribe(Kind.AGREEMENTS, [{ uid: agreementUid, id: action.agreementId }])
  )
}

function* confirmAddAgreementToContentList(userId, contentListId, agreementId, count) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),
      function* (confirmedContentListId) {
        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.addContentListAgreement,
          confirmedContentListId,
          agreementId
        )
        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm add contentList agreement for contentList id ${contentListId} and agreement id ${agreementId}`
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

        /** Since "add agreement" calls are parallelized, agreements may be added
         * out of order. Here we check if agreements made it in the intended order;
         * if not, we reorder them into the correct order.
         */
        const numberOfAgreementsMatch =
          confirmedContentList.contentList_contents.agreement_ids.length ===
          contentList.contentList_contents.agreement_ids.length

        const confirmedContentListHasAgreements =
          confirmedContentList.contentList_contents.agreement_ids.length > 0

        if (numberOfAgreementsMatch && confirmedContentListHasAgreements) {
          const confirmedContentListAgreements =
            confirmedContentList.contentList_contents.agreement_ids.map((t) => t.agreement)
          const cachedContentListAgreements = contentList.contentList_contents.agreement_ids.map(
            (t) => t.agreement
          )
          if (!isEqual(confirmedContentListAgreements, cachedContentListAgreements)) {
            yield call(
              confirmOrderContentList,
              userId,
              contentListId,
              cachedContentListAgreements
            )
          } else {
            yield put(
              cacheActions.update(Kind.COLLECTIONS, [
                {
                  id: confirmedContentList.contentList_id,
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
          collectionActions.addAgreementToContentListFailed(
            message,
            { userId, contentListId, agreementId, count },
            { error, timeout }
          )
        )
      },
      (result) => (result.contentList_id ? result.contentList_id : contentListId),
      undefined,
      {
        operationId: ContentListOperations.ADD_AGREEMENT,
        parallelizable: true,
        useOnlyLastSuccessCall: true
      }
    )
  )
}

/** REMOVE AGREEMENT FROM CONTENT_LIST */

function* watchRemoveAgreementFromContentList() {
  yield takeEvery(
    collectionActions.REMOVE_AGREEMENT_FROM_CONTENT_LIST,
    removeAgreementFromContentListAsync
  )
}

function* removeAgreementFromContentListAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const contentList = yield select(getCollection, { id: action.contentListId })

  // Find the index of the agreement based on the agreement's id and timestamp
  const index = contentList.contentList_contents.agreement_ids.findIndex(
    (t) => t.time === action.timestamp && t.agreement === action.agreementId
  )
  if (index === -1) {
    console.error('Could not find the index of to-be-deleted agreement')
    return
  }

  const agreement = contentList.contentList_contents.agreement_ids[index]
  contentList.contentList_contents.agreement_ids.splice(index, 1)
  const count = countAgreementIds(contentList.contentList_contents, action.agreementId)

  yield call(
    confirmRemoveAgreementFromContentList,
    userId,
    action.contentListId,
    action.agreementId,
    agreement.time,
    count
  )
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: contentList.contentList_id,
        metadata: {
          contentList_contents: contentList.contentList_contents
        }
      }
    ])
  )
}

// Removes the invalid agreement ids from the contentList by calling `dangerouslySetContentListOrder`
function* fixInvalidAgreementsInContentList(contentListId, userId, invalidAgreementIds) {
  yield call(waitForBackendSetup)
  const removedAgreementIds = new Set(invalidAgreementIds)

  const contentList = yield select(getCollection, { id: contentListId })

  const agreementIds = contentList.contentList_contents.agreement_ids
    .map(({ agreement }) => agreement)
    .filter((id) => !removedAgreementIds.has(id))
  const { error } = yield call(
    ColivingBackend.dangerouslySetContentListOrder,
    contentListId,
    agreementIds
  )
  if (error) throw error

  const currentUserId = yield select(getUserId)
  const contentLists = yield apiClient.getContentList({
    contentListId,
    currentUserId
  })
  return contentLists[0]
}

function* confirmRemoveAgreementFromContentList(
  userId,
  contentListId,
  agreementId,
  timestamp,
  count
) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),
      function* (confirmedContentListId) {
        // NOTE: In an attempt to fix contentLists in a corrupted state, only attempt the delete contentList agreement once,
        // if it fails, check if the contentList is in a corrupted state and if so fix it before re-attempting to delete agreement from contentList
        let { blockHash, blockNumber, error } = yield call(
          ColivingBackend.deleteContentListAgreement,
          confirmedContentListId,
          agreementId,
          timestamp,
          0
        )
        if (error) {
          const {
            error: agreementsInContentListError,
            isValid,
            invalidAgreementIds
          } = yield call(
            ColivingBackend.validateAgreementsInContentList,
            confirmedContentListId
          )
          if (agreementsInContentListError) throw agreementsInContentListError
          if (!isValid) {
            const updatedContentList = yield call(
              fixInvalidAgreementsInContentList,
              confirmedContentListId,
              userId,
              invalidAgreementIds
            )
            const isAgreementRemoved =
              countAgreementIds(updatedContentList.contentList_contents, agreementId) <= count
            if (isAgreementRemoved) return updatedContentList
          }
          const response = yield call(
            ColivingBackend.deleteContentListAgreement,
            confirmedContentListId,
            agreementId,
            timestamp
          )
          if (response.error) throw response.error

          blockHash = response.blockHash
          blockNumber = response.blockNumber
        }

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm remove contentList agreement for contentList id ${contentListId} and agreement id ${agreementId}`
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
              id: confirmedContentList.contentList_id,
              metadata: confirmedContentList
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.removeAgreementFromContentListFailed(
            message,
            { userId, contentListId, agreementId, timestamp, count },
            { error, timeout }
          )
        )
      },
      (result) => (result.contentList_id ? result.contentList_id : contentListId),
      undefined,
      {
        operationId: ContentListOperations.REMOVE_AGREEMENT,
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

  const agreementIds = []
  const updatedContentList = {
    ...contentList,
    contentList_contents: {
      ...contentList.contentList_contents,
      agreement_ids: action.agreementIdsAndTimes.map(({ id, time }) => {
        agreementIds.push(id)
        return { agreement: id, time }
      })
    }
  }

  yield call(confirmOrderContentList, userId, action.contentListId, agreementIds)
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: updatedContentList.contentList_id,
        metadata: updatedContentList
      }
    ])
  )
}

function* confirmOrderContentList(userId, contentListId, agreementIds) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, contentListId),
      function* (confirmedContentListId) {
        // NOTE: In an attempt to fix contentLists in a corrupted state, only attempt the order contentList agreements once,
        // if it fails, check if the contentList is in a corrupted state and if so fix it before re-attempting to order contentList
        let { blockHash, blockNumber, error } = yield call(
          ColivingBackend.orderContentList,
          confirmedContentListId,
          agreementIds,
          0
        )
        if (error) {
          const { error, isValid, invalidAgreementIds } = yield call(
            ColivingBackend.validateAgreementsInContentList,
            confirmedContentListId
          )
          if (error) throw error
          if (!isValid) {
            yield call(
              fixInvalidAgreementsInContentList,
              confirmedContentListId,
              userId,
              invalidAgreementIds
            )
            const invalidIds = new Set(invalidAgreementIds)
            agreementIds = agreementIds.filter((id) => !invalidIds.has(id))
          }
          const response = yield call(
            ColivingBackend.orderContentList,
            confirmedContentListId,
            agreementIds
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
              id: confirmedContentList.contentList_id,
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
            { userId, contentListId, agreementIds },
            { error, timeout }
          )
        )
      },
      (result) => (result.contentList_id ? result.contentList_id : contentListId),
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
        id: contentList.contentList_id,
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
              id: confirmedContentList.contentList_id,
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
      (result) => (result.contentList_id ? result.contentList_id : contentListId)
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
  // or contentList, we should either delete all the agreements
  // or just delete the collection.
  const collection = yield select(getCollection, { id: action.contentListId })
  if (!collection) return

  const isAlbum = collection.is_album
  if (isAlbum) {
    const agreementIds = collection.contentList_contents.agreement_ids

    const event = make(Name.DELETE, { kind: 'album', id: action.contentListId })
    yield put(event)
    yield call(confirmDeleteAlbum, action.contentListId, agreementIds, userId)
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

function* confirmDeleteAlbum(contentListId, agreementIds, userId) {
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
              Kind.AGREEMENTS,
              agreementIds.map((t) => ({
                id: t.agreement,
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
          agreementIds
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
              Kind.AGREEMENTS,
              agreementIds.map((t) => ({
                id: t.agreement,
                metadata: { _marked_deleted: false }
              }))
            )
          ),
          put(
            accountActions.addAccountContentList({
              id: contentList.contentList_id,
              name: contentList.contentList_name,
              isAlbum: contentList.is_album,
              user: { id: user.user_id, handle: user.handle }
            })
          )
        ])
        yield put(
          collectionActions.deleteContentListFailed(
            message,
            { contentListId, agreementIds, userId },
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
            `Could not confirm delete contentList agreement for contentList id ${contentListId}`
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
              id: contentList.contentList_id,
              name: contentList.contentList_name,
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
      (result) => (result.contentList_id ? result.contentList_id : contentListId)
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
        const user = yield select(getUser, { id: collection.contentList_owner_id })
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
    watchAddAgreementToContentList,
    watchRemoveAgreementFromContentList,
    watchOrderContentList,
    watchPublishContentList,
    watchDeleteContentList,
    watchFetchCoverArt,
    watchAgreementErrors
  ]
}

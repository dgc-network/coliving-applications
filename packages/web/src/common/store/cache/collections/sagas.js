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
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'

import watchAgreementErrors from './errorSagas'
import { PlaylistOperations } from './types'
import { reformat } from './utils'
import {
  retrieveCollection,
  retrieveCollections
} from './utils/retrieveCollections'

/** Counts instances of agreementId in a content list. */
const countAgreementIds = (content listContents, agreementId) => {
  return content listContents.agreement_ids
    .map((t) => t.agreement)
    .reduce((acc, t) => {
      if (t === agreementId) acc += 1
      return acc
    }, 0)
}

/** CREATE CONTENT_LIST */

function* watchCreatePlaylist() {
  yield takeLatest(collectionActions.CREATE_CONTENT_LIST, createPlaylistAsync)
}

function* createPlaylistAsync(action) {
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
  yield put(collectionActions.createPlaylistRequested())

  const content list = { ...action.formFields }

  // For base64 images (coming from native), convert to a blob
  if (content list.artwork?.type === 'base64') {
    content list.artwork.file = dataURLtoFile(content list.artwork.file)
  }

  const event = make(Name.CONTENT_LIST_START_CREATE, {
    source: action.source,
    artworkSource: content list.artwork ? content list.artwork.source : ''
  })
  yield put(event)

  yield call(
    confirmCreatePlaylist,
    uid,
    userId,
    action.formFields,
    action.source
  )
  content list.content list_id = uid
  content list.content list_owner_id = userId
  content list.is_private = true
  content list.content list_contents = { agreement_ids: [] }
  if (content list.artwork) {
    content list._cover_art_sizes = {
      ...content list._cover_art_sizes,
      [DefaultSizes.OVERRIDE]: content list.artwork.url
    }
  }
  content list._temp = true

  const subscribedUid = yield makeUid(Kind.COLLECTIONS, uid, 'account')
  yield put(
    cacheActions.add(
      Kind.COLLECTIONS,
      [
        {
          id: content list.content list_id,
          uid: subscribedUid,
          metadata: { ...content list, is_album: false }
        }
      ],
      /* replace= */ true, // forces cache update
      /* persistent cache */ false // Do not persistent cache since it's missing data
    )
  )
  const user = yield select(getUser, { id: userId })
  yield put(
    accountActions.addAccountPlaylist({
      id: content list.content list_id,
      name: content list.content list_name,
      isAlbum: content list.is_album,
      user: { id: userId, handle: user.handle }
    })
  )
  yield put(collectionActions.createPlaylistSucceeded())

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

function* confirmCreatePlaylist(uid, userId, formFields, source) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, uid),
      function* () {
        const { blockHash, blockNumber, content listId, error } = yield call(
          ColivingBackend.createPlaylist,
          userId,
          formFields
        )

        if (error || !content listId) throw new Error('Unable to create content list')

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm content list creation for content list id ${content listId}`
          )
        }

        const confirmedPlaylist = (yield call(
          ColivingBackend.getPlaylists,
          userId,
          [content listId]
        ))[0]

        // Immediately after confirming the content list,
        // create a new content list reference and mark the temporary one as moved.
        // This will trigger the page to refresh, etc. with the new ID url.
        // Even if there are other actions confirming for this particular
        // content list, those will just file in afterwards.

        const subscribedUid = makeUid(
          Kind.COLLECTIONS,
          confirmedPlaylist.content list_id,
          'account'
        )
        const movedCollection = yield select(getCollection, { id: uid })

        // The reformatted content list is the combination of the results we get back
        // from the confirmation, plus any writes that may be in the confirmer still.
        const reformattedPlaylist = {
          ...reformat(confirmedPlaylist),
          ...movedCollection,
          content list_id: confirmedPlaylist.content list_id,
          _temp: false
        }

        // On content list creation, copy over all fields from the temp collection
        // to retain optimistically set fields.
        yield put(
          cacheActions.add(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.content list_id,
              uid: subscribedUid,
              metadata: reformattedPlaylist
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
                  .filter((cId) => cId !== uid && confirmedPlaylist.content list_id)
                  .concat(confirmedPlaylist.content list_id)
              }
            }
          ])
        )
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            { id: uid, metadata: { _moved: subscribedUid } }
          ])
        )
        yield put(accountActions.removeAccountPlaylist({ collectionId: uid }))
        yield put(
          accountActions.addAccountPlaylist({
            id: confirmedPlaylist.content list_id,
            // Take content list name from the "local" state because the user
            // may have edited the name before we got the confirmed result back.
            name: reformattedPlaylist.content list_name,
            isAlbum: confirmedPlaylist.is_album,
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
        return confirmedPlaylist
      },
      function* () {},
      function* ({ error, timeout, message }) {
        const event = make(Name.CONTENT_LIST_COMPLETE_CREATE, {
          source,
          status: 'failure'
        })
        yield put(event)
        yield put(
          collectionActions.createPlaylistFailed(
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

function* watchEditPlaylist() {
  yield takeLatest(collectionActions.EDIT_CONTENT_LIST, editPlaylistAsync)
}

function* editPlaylistAsync(action) {
  yield call(waitForBackendSetup)
  action.formFields.description = squashNewLines(action.formFields.description)

  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  // Updated the stored account content list shortcut
  yield put(
    accountActions.renameAccountPlaylist({
      collectionId: action.content listId,
      name: action.formFields.content list_name
    })
  )

  const content list = { ...action.formFields }

  // For base64 images (coming from native), convert to a blob
  if (content list.artwork?.type === 'base64') {
    content list.artwork.file = dataURLtoFile(content list.artwork.file)
  }

  yield call(confirmEditPlaylist, action.content listId, userId, content list)

  content list.content list_id = action.content listId
  if (content list.artwork) {
    content list._cover_art_sizes = {
      ...content list._cover_art_sizes
    }
    if (content list.artwork.url) {
      content list._cover_art_sizes[DefaultSizes.OVERRIDE] = content list.artwork.url
    }
  }
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: content list.content list_id,
        metadata: content list
      }
    ])
  )
  yield put(collectionActions.editPlaylistSucceeded())
}

function* confirmEditPlaylist(content listId, userId, formFields) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, content listId),
      function* (confirmedPlaylistId) {
        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.updatePlaylist,
          confirmedPlaylistId,
          {
            ...formFields
          }
        )

        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm content list edition for content list id ${content listId}`
          )
        }

        return (yield call(ColivingBackend.getPlaylists, userId, [
          confirmedPlaylistId
        ]))[0]
      },
      function* (confirmedPlaylist) {
        // Update the cached collection so it no longer contains image upload artifacts
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.content list_id,
              metadata: { ...reformat(confirmedPlaylist), artwork: {} }
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        yield put(
          collectionActions.editPlaylistFailed(
            message,
            { content listId, userId, formFields },
            { error, timeout }
          )
        )
      },
      (result) => (result.content list_id ? result.content list_id : content listId)
    )
  )
}

/** ADD AGREEMENT TO CONTENT_LIST */

function* watchAddAgreementToPlaylist() {
  yield takeEvery(
    collectionActions.ADD_AGREEMENT_TO_CONTENT_LIST,
    addAgreementToPlaylistAsync
  )
}

function* addAgreementToPlaylistAsync(action) {
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
    [action.content listId],
    true
  )
  const content list = collections[action.content listId]

  const agreementUid = makeUid(
    Kind.AGREEMENTS,
    action.agreementId,
    `collection:${action.content listId}`
  )
  content list.content list_contents = {
    agreement_ids: content list.content list_contents.agreement_ids.concat({
      agreement: action.agreementId,
      time: Math.round(Date.now() / 1000),
      uid: agreementUid
    })
  }
  const count = countAgreementIds(content list.content list_contents, action.agreementId)

  const event = make(Name.CONTENT_LIST_ADD, {
    agreementId: action.agreementId,
    content listId: action.content listId
  })
  yield put(event)

  yield call(
    confirmAddAgreementToPlaylist,
    userId,
    action.content listId,
    action.agreementId,
    count
  )
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: content list.content list_id,
        metadata: {
          content list_contents: content list.content list_contents
        }
      }
    ])
  )
  yield put(
    cacheActions.subscribe(Kind.AGREEMENTS, [{ uid: agreementUid, id: action.agreementId }])
  )
}

function* confirmAddAgreementToPlaylist(userId, content listId, agreementId, count) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, content listId),
      function* (confirmedPlaylistId) {
        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.addPlaylistAgreement,
          confirmedPlaylistId,
          agreementId
        )
        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm add content list agreement for content list id ${content listId} and agreement id ${agreementId}`
          )
        }
        return confirmedPlaylistId
      },
      function* (confirmedPlaylistId) {
        const confirmedPlaylist = (yield call(
          retrieveCollection,
          confirmedPlaylistId
        ))[0]

        const content list = yield select(getCollection, { id: content listId })

        /** Since "add agreement" calls are parallelized, agreements may be added
         * out of order. Here we check if agreements made it in the intended order;
         * if not, we reorder them into the correct order.
         */
        const numberOfAgreementsMatch =
          confirmedPlaylist.content list_contents.agreement_ids.length ===
          content list.content list_contents.agreement_ids.length

        const confirmedPlaylistHasAgreements =
          confirmedPlaylist.content list_contents.agreement_ids.length > 0

        if (numberOfAgreementsMatch && confirmedPlaylistHasAgreements) {
          const confirmedPlaylistAgreements =
            confirmedPlaylist.content list_contents.agreement_ids.map((t) => t.agreement)
          const cachedPlaylistAgreements = content list.content list_contents.agreement_ids.map(
            (t) => t.agreement
          )
          if (!isEqual(confirmedPlaylistAgreements, cachedPlaylistAgreements)) {
            yield call(
              confirmOrderPlaylist,
              userId,
              content listId,
              cachedPlaylistAgreements
            )
          } else {
            yield put(
              cacheActions.update(Kind.COLLECTIONS, [
                {
                  id: confirmedPlaylist.content list_id,
                  metadata: confirmedPlaylist
                }
              ])
            )
          }
        }
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.addAgreementToPlaylistFailed(
            message,
            { userId, content listId, agreementId, count },
            { error, timeout }
          )
        )
      },
      (result) => (result.content list_id ? result.content list_id : content listId),
      undefined,
      {
        operationId: PlaylistOperations.ADD_AGREEMENT,
        parallelizable: true,
        useOnlyLastSuccessCall: true
      }
    )
  )
}

/** REMOVE AGREEMENT FROM CONTENT_LIST */

function* watchRemoveAgreementFromPlaylist() {
  yield takeEvery(
    collectionActions.REMOVE_AGREEMENT_FROM_CONTENT_LIST,
    removeAgreementFromPlaylistAsync
  )
}

function* removeAgreementFromPlaylistAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const content list = yield select(getCollection, { id: action.content listId })

  // Find the index of the agreement based on the agreement's id and timestamp
  const index = content list.content list_contents.agreement_ids.findIndex(
    (t) => t.time === action.timestamp && t.agreement === action.agreementId
  )
  if (index === -1) {
    console.error('Could not find the index of to-be-deleted agreement')
    return
  }

  const agreement = content list.content list_contents.agreement_ids[index]
  content list.content list_contents.agreement_ids.splice(index, 1)
  const count = countAgreementIds(content list.content list_contents, action.agreementId)

  yield call(
    confirmRemoveAgreementFromPlaylist,
    userId,
    action.content listId,
    action.agreementId,
    agreement.time,
    count
  )
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: content list.content list_id,
        metadata: {
          content list_contents: content list.content list_contents
        }
      }
    ])
  )
}

// Removes the invalid agreement ids from the content list by calling `dangerouslySetPlaylistOrder`
function* fixInvalidAgreementsInPlaylist(content listId, userId, invalidAgreementIds) {
  yield call(waitForBackendSetup)
  const removedAgreementIds = new Set(invalidAgreementIds)

  const content list = yield select(getCollection, { id: content listId })

  const agreementIds = content list.content list_contents.agreement_ids
    .map(({ agreement }) => agreement)
    .filter((id) => !removedAgreementIds.has(id))
  const { error } = yield call(
    ColivingBackend.dangerouslySetPlaylistOrder,
    content listId,
    agreementIds
  )
  if (error) throw error

  const currentUserId = yield select(getUserId)
  const content lists = yield apiClient.getPlaylist({
    content listId,
    currentUserId
  })
  return content lists[0]
}

function* confirmRemoveAgreementFromPlaylist(
  userId,
  content listId,
  agreementId,
  timestamp,
  count
) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, content listId),
      function* (confirmedPlaylistId) {
        // NOTE: In an attempt to fix content lists in a corrupted state, only attempt the delete content list agreement once,
        // if it fails, check if the content list is in a corrupted state and if so fix it before re-attempting to delete agreement from content list
        let { blockHash, blockNumber, error } = yield call(
          ColivingBackend.deletePlaylistAgreement,
          confirmedPlaylistId,
          agreementId,
          timestamp,
          0
        )
        if (error) {
          const {
            error: agreementsInPlaylistError,
            isValid,
            invalidAgreementIds
          } = yield call(
            ColivingBackend.validateAgreementsInPlaylist,
            confirmedPlaylistId
          )
          if (agreementsInPlaylistError) throw agreementsInPlaylistError
          if (!isValid) {
            const updatedPlaylist = yield call(
              fixInvalidAgreementsInPlaylist,
              confirmedPlaylistId,
              userId,
              invalidAgreementIds
            )
            const isAgreementRemoved =
              countAgreementIds(updatedPlaylist.content list_contents, agreementId) <= count
            if (isAgreementRemoved) return updatedPlaylist
          }
          const response = yield call(
            ColivingBackend.deletePlaylistAgreement,
            confirmedPlaylistId,
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
            `Could not confirm remove content list agreement for content list id ${content listId} and agreement id ${agreementId}`
          )
        }
        return confirmedPlaylistId
      },
      function* (confirmedPlaylistId) {
        const confirmedPlaylist = (yield call(
          retrieveCollection,
          confirmedPlaylistId
        ))[0]
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.content list_id,
              metadata: confirmedPlaylist
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.removeAgreementFromPlaylistFailed(
            message,
            { userId, content listId, agreementId, timestamp, count },
            { error, timeout }
          )
        )
      },
      (result) => (result.content list_id ? result.content list_id : content listId),
      undefined,
      {
        operationId: PlaylistOperations.REMOVE_AGREEMENT,
        parallelizable: true,
        useOnlyLastSuccessCall: true
      }
    )
  )
}

/** ORDER CONTENT_LIST */

function* watchOrderPlaylist() {
  yield takeEvery(collectionActions.ORDER_CONTENT_LIST, orderPlaylistAsync)
}

function* orderPlaylistAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const content list = yield select(getCollection, { id: action.content listId })

  const agreementIds = []
  const updatedPlaylist = {
    ...content list,
    content list_contents: {
      ...content list.content list_contents,
      agreement_ids: action.agreementIdsAndTimes.map(({ id, time }) => {
        agreementIds.push(id)
        return { agreement: id, time }
      })
    }
  }

  yield call(confirmOrderPlaylist, userId, action.content listId, agreementIds)
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: updatedPlaylist.content list_id,
        metadata: updatedPlaylist
      }
    ])
  )
}

function* confirmOrderPlaylist(userId, content listId, agreementIds) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, content listId),
      function* (confirmedPlaylistId) {
        // NOTE: In an attempt to fix content lists in a corrupted state, only attempt the order content list agreements once,
        // if it fails, check if the content list is in a corrupted state and if so fix it before re-attempting to order content list
        let { blockHash, blockNumber, error } = yield call(
          ColivingBackend.orderPlaylist,
          confirmedPlaylistId,
          agreementIds,
          0
        )
        if (error) {
          const { error, isValid, invalidAgreementIds } = yield call(
            ColivingBackend.validateAgreementsInPlaylist,
            confirmedPlaylistId
          )
          if (error) throw error
          if (!isValid) {
            yield call(
              fixInvalidAgreementsInPlaylist,
              confirmedPlaylistId,
              userId,
              invalidAgreementIds
            )
            const invalidIds = new Set(invalidAgreementIds)
            agreementIds = agreementIds.filter((id) => !invalidIds.has(id))
          }
          const response = yield call(
            ColivingBackend.orderPlaylist,
            confirmedPlaylistId,
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
            `Could not confirm order content list for content list id ${content listId}`
          )
        }

        return confirmedPlaylistId
      },
      function* (confirmedPlaylistId) {
        const confirmedPlaylist = (yield call(
          retrieveCollection,
          confirmedPlaylistId
        ))[0]

        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.content list_id,
              metadata: confirmedPlaylist
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.orderPlaylistFailed(
            message,
            { userId, content listId, agreementIds },
            { error, timeout }
          )
        )
      },
      (result) => (result.content list_id ? result.content list_id : content listId),
      undefined,
      { operationId: PlaylistOperations.REORDER, squashable: true }
    )
  )
}

/** PUBLISH CONTENT_LIST */

function* watchPublishPlaylist() {
  yield takeEvery(collectionActions.PUBLISH_CONTENT_LIST, publishPlaylistAsync)
}

function* publishPlaylistAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const event = make(Name.CONTENT_LIST_MAKE_PUBLIC, { id: action.content listId })
  yield put(event)

  const content list = yield select(getCollection, { id: action.content listId })
  content list._is_publishing = true
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: content list.content list_id,
        metadata: { _is_publishing: true }
      }
    ])
  )

  yield call(confirmPublishPlaylist, userId, action.content listId)
}

function* confirmPublishPlaylist(userId, content listId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, content listId),
      function* (confirmedPlaylistId) {
        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.publishPlaylist,
          confirmedPlaylistId
        )
        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm publish content list for content list id ${content listId}`
          )
        }
        return (yield call(ColivingBackend.getPlaylists, userId, [
          confirmedPlaylistId
        ]))[0]
      },
      function* (confirmedPlaylist) {
        confirmedPlaylist.is_private = false
        confirmedPlaylist._is_publishing = false
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.content list_id,
              metadata: confirmedPlaylist
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.publishPlaylistFailed(
            message,
            { userId, content listId },
            { error, timeout }
          )
        )
      },
      (result) => (result.content list_id ? result.content list_id : content listId)
    )
  )
}

/** DELETE CONTENT_LIST */

function* watchDeletePlaylist() {
  yield takeEvery(collectionActions.DELETE_CONTENT_LIST, deletePlaylistAsync)
}

function* deletePlaylistAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  // Depending on whether the collection is an album
  // or content list, we should either delete all the agreements
  // or just delete the collection.
  const collection = yield select(getCollection, { id: action.content listId })
  if (!collection) return

  const isAlbum = collection.is_album
  if (isAlbum) {
    const agreementIds = collection.content list_contents.agreement_ids

    const event = make(Name.DELETE, { kind: 'album', id: action.content listId })
    yield put(event)
    yield call(confirmDeleteAlbum, action.content listId, agreementIds, userId)
  } else {
    const event = make(Name.DELETE, { kind: 'content list', id: action.content listId })
    yield put(event)

    // Preemptively mark the content list as deleted.
    // It's possible there are other transactions confirming
    // for this content list, which prevent the delete confirmation
    // from running immediately, which would leave
    // the content list visible before it runs.
    yield put(
      cacheActions.update(Kind.COLLECTIONS, [
        {
          id: action.content listId,
          metadata: { _marked_deleted: true }
        }
      ])
    )
    yield call(confirmDeletePlaylist, userId, action.content listId)
  }

  const user = yield select(getUser, { id: userId })
  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: userId,
        metadata: {
          _collectionIds: (user._collectionIds || []).filter(
            (cId) => cId !== action.content listId
          )
        }
      }
    ])
  )
}

function* confirmDeleteAlbum(content listId, agreementIds, userId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, content listId),

      // we don't have to worry about passing in a confirmed ID
      // here because unlike deleting a content list, when
      // deleting an album we know it's persisted to chain already
      // thus we have it's permanent ID.
      function* () {
        // Optimistically mark everything as deleted
        yield all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: content listId,
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
            accountActions.removeAccountPlaylist({ collectionId: content listId })
          )
        ])

        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.deleteAlbum,
          content listId,
          agreementIds
        )
        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(`Could not confirm delete album for id ${content listId}`)
        }
        return content listId
      },
      function* () {
        console.debug(`Successfully deleted album ${content listId}`)
        yield put(cacheActions.remove(Kind.COLLECTIONS, [content listId]))
      },
      function* ({ error, timeout, message }) {
        console.error(`Failed to delete album ${content listId}`)
        // Need to revert the deletes now
        const [content list, user] = yield all([
          select(getCollection, { id: content listId }),
          select(getAccountUser)
        ])
        yield all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: content listId,
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
            accountActions.addAccountPlaylist({
              id: content list.content list_id,
              name: content list.content list_name,
              isAlbum: content list.is_album,
              user: { id: user.user_id, handle: user.handle }
            })
          )
        ])
        yield put(
          collectionActions.deletePlaylistFailed(
            message,
            { content listId, agreementIds, userId },
            { error, timeout }
          )
        )
      }
    )
  )
}

function* confirmDeletePlaylist(userId, content listId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, content listId),
      function* (confirmedPlaylistId) {
        // Optimistically mark content list as removed
        yield all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: confirmedPlaylistId,
                metadata: { _marked_deleted: true }
              }
            ])
          ),
          put(
            accountActions.removeAccountPlaylist({ collectionId: content listId })
          )
        ])

        const { blockHash, blockNumber, error } = yield call(
          ColivingBackend.deletePlaylist,
          confirmedPlaylistId
        )
        if (error) throw error

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm delete content list agreement for content list id ${content listId}`
          )
        }
        return confirmedPlaylistId
      },
      function* () {
        console.debug(`Successfully deleted content list ${content listId}`)
        yield put(cacheActions.remove(Kind.COLLECTIONS, [content listId]))
      },
      function* ({ error, timeout, message }) {
        console.error(`Failed to delete content list ${content listId}`)
        const [content list, user] = yield all([
          select(getCollection, { id: content listId }),
          select(getAccountUser)
        ])
        yield all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: content listId,
                metadata: { _marked_deleted: false }
              }
            ])
          ),
          put(
            accountActions.addAccountPlaylist({
              id: content list.content list_id,
              name: content list.content list_name,
              isAlbum: content list.is_album,
              user: { id: user.user_id, handle: user.handle }
            })
          )
        ])
        yield put(
          collectionActions.deletePlaylistFailed(
            message,
            { content listId, userId },
            { error, timeout }
          )
        )
      },
      (result) => (result.content list_id ? result.content list_id : content listId)
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
        const user = yield select(getUser, { id: collection.content list_owner_id })
        if (
          !collection ||
          !user ||
          (!collection.cover_art_sizes && !collection.cover_art)
        )
          return

        const gateways = getCreatorNodeIPFSGateways(user.content_node_endpoint)
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
    watchCreatePlaylist,
    watchEditPlaylist,
    watchAddAgreementToPlaylist,
    watchRemoveAgreementFromPlaylist,
    watchOrderPlaylist,
    watchPublishPlaylist,
    watchDeletePlaylist,
    watchFetchCoverArt,
    watchAgreementErrors
  ]
}

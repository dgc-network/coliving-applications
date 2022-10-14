import {
  Name,
  DefaultSizes,
  SquareSizes,
  Kind,
  Status,
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

import {
  getAccountUser,
  getUserId,
  getUserHandle
} from 'common/store/account/selectors'
import { setDominantColors } from 'common/store/averageColor/slice'
import * as cacheActions from 'common/store/cache/actions'
import * as digitalContentActions from 'common/store/cache/digital_contents/actions'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { squashNewLines, formatUrlName } from 'common/utils/formatUtil'
import * as signOnActions from 'pages/signOn/store/actions'
import ColivingBackend, { fetchCID } from 'services/colivingBackend'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import DigitalContentDownload from 'services/colivingBackend/digitalContentDownload'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { getContentNodeIPFSGateways } from 'utils/gatewayUtil'
import { dominantColor } from 'utils/imageProcessingUtil'
import { waitForValue } from 'utils/sagaHelpers'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* fetchRepostInfo(entries) {
  const userIds = []
  entries.forEach((entry) => {
    if (entry.metadata.followee_reposts) {
      entry.metadata.followee_reposts.forEach((repost) =>
        userIds.push(repost.user_id)
      )
    }
  })

  if (userIds.length) {
    yield call(fetchUsers, userIds)
  }
}

function* fetchSegment(metadata) {
  const user = yield call(waitForValue, getUser, { id: metadata.owner_id })
  const gateways = getContentNodeIPFSGateways(user.content_node_endpoint)
  if (!metadata.digital_content_segments[0]) return
  const cid = metadata.digital_content_segments[0].multihash
  return yield call(fetchCID, cid, gateways, /* cache */ false)
}

// TODO(AUD-1837) -- we should not rely on this logic anymore of fetching first
// segments, particularly to flag unauthorized content, but it should probably
// just be removed altogether since first segment fetch is usually fast.
function* fetchFirstSegments(entries) {
  // Segments aren't part of the critical path so let them resolve later.
  try {
    const firstSegments = yield all(
      entries.map((e) => call(fetchSegment, e.metadata))
    )

    yield put(
      cacheActions.update(
        Kind.AGREEMENTS,
        firstSegments.map((s, i) => {
          if (s === 'Unauthorized') {
            return {
              id: entries[i].id,
              metadata: {
                is_delete: true,
                _blocked: true,
                _marked_deleted: true
              }
            }
          }
          return {
            id: entries[i].id,
            metadata: { _first_segment: s }
          }
        })
      )
    )
  } catch (err) {
    console.error(err)
  }
}

function* watchAdd() {
  yield takeEvery(cacheActions.ADD_SUCCEEDED, function* (action) {
    if (action.kind === Kind.AGREEMENTS) {
      yield put(
        digitalContentActions.setPermalinkStatus(
          action.entries
            .filter((entry) => !!entry.metadata.permalink)
            .map((entry) => ({
              permalink: entry.metadata.permalink,
              id: entry.id,
              status: Status.SUCCESS
            }))
        )
      )
      if (!NATIVE_MOBILE) {
        yield fork(fetchRepostInfo, action.entries)
        yield fork(fetchFirstSegments, action.entries)
      }
    }
  })
}

export function* digitalContentNewRemixEvent(remixDigitalContent) {
  const account = yield select(getAccountUser)
  const remixParentDigitalContent = remixDigitalContent.remix_of.digitalContents[0]
  const parentDigitalContent = yield select(getDigitalContent, {
    id: remixParentDigitalContent.parent_digital_content_id
  })
  const parentDigitalContentUser = parentDigitalContent
    ? yield select(getUser, { id: parentDigitalContent.owner_id })
    : null
  yield put(
    make(Name.REMIX_NEW_REMIX, {
      id: remixDigitalContent.digital_content_id,
      handle: account.handle,
      title: remixDigitalContent.title,
      parent_digital_content_id: remixParentDigitalContent.parent_digital_content_id,
      parent_digital_content_title: parentDigitalContent ? parentDigitalContent.title : '',
      parent_digital_content_user_handle: parentDigitalContentUser ? parentDigitalContentUser.handle : ''
    })
  )
}

function* editDigitalContentAsync(action) {
  yield call(waitForBackendSetup)
  action.formFields.description = squashNewLines(action.formFields.description)

  const currentDigitalContent = yield select(getDigitalContent, { id: action.digitalContentId })
  const wasDownloadable =
    currentDigitalContent.download && currentDigitalContent.download.is_downloadable
  const isNowDownloadable =
    action.formFields.download && action.formFields.download.is_downloadable

  const isPublishing = currentDigitalContent._is_publishing
  const wasUnlisted = currentDigitalContent.is_unlisted
  const isNowListed = !action.formFields.is_unlisted

  if (!isPublishing && wasUnlisted && isNowListed) {
    yield put(
      cacheActions.update(Kind.AGREEMENTS, [
        {
          id: action.digitalContentId,
          metadata: { _is_publishing: true }
        }
      ])
    )
  }

  yield call(
    confirmEditDigitalContent,
    action.digitalContentId,
    action.formFields,
    wasDownloadable,
    isNowDownloadable,
    wasUnlisted,
    isNowListed,
    currentDigitalContent
  )

  const digital_content = { ...action.formFields }
  digital_content.digital_content_id = action.digitalContentId
  if (digital_content.artwork) {
    digital_content._cover_art_sizes = {
      ...digital_content._cover_art_sizes,
      [DefaultSizes.OVERRIDE]: digital_content.artwork.url
    }
  }

  yield put(
    cacheActions.update(Kind.AGREEMENTS, [{ id: digital_content.digital_content_id, metadata: digital_content }])
  )
  yield put(digitalContentActions.editDigitalContentSucceeded())

  // This is a new remix
  if (
    digital_content?.remix_of?.digitalContents?.[0]?.parent_digital_content_id &&
    currentDigitalContent?.remix_of?.digitalContents?.[0]?.parent_digital_content_id !==
      digital_content?.remix_of?.digitalContents?.[0]?.parent_digital_content_id
  ) {
    // This is a new remix
    yield call(digitalContentNewRemixEvent, digital_content)
  }
}

function* confirmEditDigitalContent(
  digitalContentId,
  formFields,
  wasDownloadable,
  isNowDownloadable,
  wasUnlisted,
  isNowListed,
  currentDigitalContent
) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.AGREEMENTS, digitalContentId),
      function* () {
        if (!wasDownloadable && isNowDownloadable) {
          yield put(digitalContentActions.checkIsDownloadable(digitalContentId))
        }

        const { blockHash, blockNumber } = yield call(
          ColivingBackend.updateDigitalContent,
          digitalContentId,
          { ...formFields }
        )

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm edit digital_content for digital_content id ${digitalContentId}`
          )
        }

        // Need to poll with the new digital_content name in case it changed
        const userId = yield select(getUserId)
        const handle = yield select(getUserHandle)

        return yield apiClient.getDigitalContent(
          {
            id: digitalContentId,
            currentUserId: userId,
            unlistedArgs: {
              urlTitle: formatUrlName(formFields.title),
              handle
            }
          },
          /* retry */ false
        )
      },
      function* (confirmedDigitalContent) {
        if (wasUnlisted && isNowListed) {
          confirmedDigitalContent._is_publishing = false
        }
        // Update the cached digital_content so it no longer contains image upload artifacts
        yield put(
          cacheActions.update(Kind.AGREEMENTS, [
            {
              id: confirmedDigitalContent.digital_content_id,
              metadata: { ...confirmedDigitalContent, artwork: {} }
            }
          ])
        )

        // Record analytics on digital_content edit
        // Note: if remixes is not defined in field_visibility, it defaults to true
        if (
          (currentDigitalContent?.field_visibility?.remixes ?? true) &&
          confirmedDigitalContent?.field_visibility?.remixes === false
        ) {
          const handle = yield select(getUserHandle)
          // Record event if hide remixes was turned on
          yield put(
            make(Name.REMIX_HIDE, {
              id: confirmedDigitalContent.digital_content_id,
              handle
            })
          )
        }
      },
      function* () {
        yield put(digitalContentActions.editDigitalContentFailed())
        // Throw so the user can't capture a bad upload state (especially for downloads).
        // TODO: Consider better update revesion logic here coupled with a toast or similar.
        throw new Error('Edit digital_content failed')
      }
    )
  )
}

function* watchEditDigitalContent() {
  yield takeEvery(digitalContentActions.EDIT_AGREEMENT, editDigitalContentAsync)
}

function* deleteDigitalContentAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }
  const handle = yield select(getUserHandle)

  // Before deleting, check if the digital_content is set as the author pick & delete if so
  const socials = yield call(ColivingBackend.getCreatorSocialHandle, handle)
  if (socials.pinnedDigitalContentId === action.digitalContentId) {
    yield call(ColivingBackend.setLandlordPick)
    yield put(
      cacheActions.update(Kind.USERS, [
        {
          id: userId,
          metadata: { _landlord_pick: null }
        }
      ])
    )
  }

  const digital_content = yield select(getDigitalContent, { id: action.digitalContentId })
  yield put(
    cacheActions.update(Kind.AGREEMENTS, [
      { id: digital_content.digital_content_id, metadata: { _marked_deleted: true } }
    ])
  )

  yield call(confirmDeleteDigitalContent, digital_content.digital_content_id)
}

function* confirmDeleteDigitalContent(digitalContentId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.AGREEMENTS, digitalContentId),
      function* () {
        const { blockHash, blockNumber } = yield call(
          ColivingBackend.deleteDigitalContent,
          digitalContentId
        )

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm delete digital content for digital_content id ${digitalContentId}`
          )
        }

        const digital_content = yield select(getDigitalContent, { id: digitalContentId })
        const handle = yield select(getUserHandle)
        const userId = yield select(getUserId)

        return yield apiClient.getDigitalContent(
          {
            id: digitalContentId,
            currentUserId: userId,
            unlistedArgs: {
              urlTitle: formatUrlName(digital_content.title),
              handle
            }
          },
          /* retry */ false
        )
      },
      function* (deletedDigitalContent) {
        // NOTE: we do not delete from the cache as the digital_content may be playing
        yield put(digitalContentActions.deleteDigitalContentSucceeded(deletedDigitalContent.digital_content_id))

        // Record Delete Event
        const event = make(Name.DELETE, {
          kind: 'digital_content',
          id: deletedDigitalContent.digitalContentId
        })
        yield put(event)
        if (deletedDigitalContent.stem_of) {
          const stemDeleteEvent = make(Name.STEM_DELETE, {
            id: deletedDigitalContent.digital_content_id,
            parent_digital_content_id: deletedDigitalContent.stem_of.parent_digital_content_id,
            category: deletedDigitalContent.stem_of.category
          })
          yield put(stemDeleteEvent)
        }
      },
      function* () {
        // On failure, do not mark the digital_content as deleted
        yield put(
          cacheActions.update(Kind.AGREEMENTS, [
            { id: digitalContentId, metadata: { _marked_deleted: false } }
          ])
        )
      }
    )
  )
}

function* watchDeleteDigitalContent() {
  yield takeEvery(digitalContentActions.DELETE_DIGITAL_CONTENT, deleteDigitalContentAsync)
}

function* watchFetchCoverArt() {
  const inProgress = new Set()
  yield takeEvery(digitalContentActions.FETCH_COVER_ART, function* ({ digitalContentId, size }) {
    // Unique on id and size
    const key = `${digitalContentId}-${size}`
    if (inProgress.has(key)) return
    inProgress.add(key)

    try {
      let digital_content = yield call(waitForValue, getDigitalContent, { id: digitalContentId })
      const user = yield call(waitForValue, getUser, { id: digital_content.owner_id })
      if (!digital_content || !user || (!digital_content.cover_art_sizes && !digital_content.cover_art))
        return
      const gateways = getContentNodeIPFSGateways(user.content_node_endpoint)
      const multihash = digital_content.cover_art_sizes || digital_content.cover_art
      const coverArtSize = multihash === digital_content.cover_art_sizes ? size : null
      const url = yield call(
        ColivingBackend.getImageUrl,
        multihash,
        coverArtSize,
        gateways
      )
      digital_content = yield select(getDigitalContent, { id: digitalContentId })
      digital_content._cover_art_sizes = {
        ...digital_content._cover_art_sizes,
        [coverArtSize || DefaultSizes.OVERRIDE]: url
      }
      yield put(
        cacheActions.update(Kind.AGREEMENTS, [{ id: digitalContentId, metadata: digital_content }])
      )

      let smallImageUrl = url
      if (coverArtSize !== SquareSizes.SIZE_150_BY_150) {
        smallImageUrl = yield call(
          ColivingBackend.getImageUrl,
          multihash,
          SquareSizes.SIZE_150_BY_150,
          gateways
        )
      }
      const dominantColors = yield call(dominantColor, smallImageUrl)

      yield put(
        setDominantColors({
          multihash,
          colors: dominantColors
        })
      )
    } catch (e) {
      console.error(`Unable to fetch cover art for digital_content ${digitalContentId}`)
    } finally {
      inProgress.delete(key)
    }
  })
}

function* watchCheckIsDownloadable() {
  yield takeLatest(digitalContentActions.CHECK_IS_DOWNLOADABLE, function* (action) {
    const digital_content = yield select(getDigitalContent, { id: action.digitalContentId })
    if (!digital_content) return

    const user = yield select(getUser, { id: digital_content.owner_id })
    if (!user) return
    if (!user.content_node_endpoint) return

    const cid = yield call(
      DigitalContentDownload.checkIfDownloadAvailable,
      digital_content.digital_content_id,
      user.content_node_endpoint
    )

    const updatedMetadata = {
      ...digital_content,
      download: {
        ...digital_content.download,
        cid
      }
    }

    yield put(
      cacheActions.update(Kind.AGREEMENTS, [
        {
          id: digital_content.digital_content_id,
          metadata: updatedMetadata
        }
      ])
    )

    const currentUserId = yield select(getUserId)
    if (currentUserId === user.user_id) {
      yield call(
        DigitalContentDownload.updateDigitalContentDownloadCID,
        digital_content.digital_content_id,
        digital_content,
        cid
      )
    }
  })
}

const sagas = () => {
  return [
    watchAdd,
    watchEditDigitalContent,
    watchDeleteDigitalContent,
    watchFetchCoverArt,
    watchCheckIsDownloadable
  ]
}

export default sagas

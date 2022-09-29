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
import * as agreementActions from 'common/store/cache/agreements/actions'
import { getAgreement } from 'common/store/cache/agreements/selectors'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { squashNewLines, formatUrlName } from 'common/utils/formatUtil'
import * as signOnActions from 'pages/signOn/store/actions'
import ColivingBackend, { fetchCID } from 'services/ColivingBackend'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'
import AgreementDownload from 'services/coliving-backend/AgreementDownload'
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
  if (!metadata.agreement_segments[0]) return
  const cid = metadata.agreement_segments[0].multihash
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
        agreementActions.setPermalinkStatus(
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

export function* agreementNewRemixEvent(remixAgreement) {
  const account = yield select(getAccountUser)
  const remixParentAgreement = remixAgreement.remix_of.agreements[0]
  const parentAgreement = yield select(getAgreement, {
    id: remixParentAgreement.parent_agreement_id
  })
  const parentAgreementUser = parentAgreement
    ? yield select(getUser, { id: parentAgreement.owner_id })
    : null
  yield put(
    make(Name.REMIX_NEW_REMIX, {
      id: remixAgreement.agreement_id,
      handle: account.handle,
      title: remixAgreement.title,
      parent_agreement_id: remixParentAgreement.parent_agreement_id,
      parent_agreement_title: parentAgreement ? parentAgreement.title : '',
      parent_agreement_user_handle: parentAgreementUser ? parentAgreementUser.handle : ''
    })
  )
}

function* editAgreementAsync(action) {
  yield call(waitForBackendSetup)
  action.formFields.description = squashNewLines(action.formFields.description)

  const currentAgreement = yield select(getAgreement, { id: action.agreementId })
  const wasDownloadable =
    currentAgreement.download && currentAgreement.download.is_downloadable
  const isNowDownloadable =
    action.formFields.download && action.formFields.download.is_downloadable

  const isPublishing = currentAgreement._is_publishing
  const wasUnlisted = currentAgreement.is_unlisted
  const isNowListed = !action.formFields.is_unlisted

  if (!isPublishing && wasUnlisted && isNowListed) {
    yield put(
      cacheActions.update(Kind.AGREEMENTS, [
        {
          id: action.agreementId,
          metadata: { _is_publishing: true }
        }
      ])
    )
  }

  yield call(
    confirmEditAgreement,
    action.agreementId,
    action.formFields,
    wasDownloadable,
    isNowDownloadable,
    wasUnlisted,
    isNowListed,
    currentAgreement
  )

  const agreement = { ...action.formFields }
  agreement.agreement_id = action.agreementId
  if (agreement.artwork) {
    agreement._cover_art_sizes = {
      ...agreement._cover_art_sizes,
      [DefaultSizes.OVERRIDE]: agreement.artwork.url
    }
  }

  yield put(
    cacheActions.update(Kind.AGREEMENTS, [{ id: agreement.agreement_id, metadata: agreement }])
  )
  yield put(agreementActions.editAgreementSucceeded())

  // This is a new remix
  if (
    agreement?.remix_of?.agreements?.[0]?.parent_agreement_id &&
    currentAgreement?.remix_of?.agreements?.[0]?.parent_agreement_id !==
      agreement?.remix_of?.agreements?.[0]?.parent_agreement_id
  ) {
    // This is a new remix
    yield call(agreementNewRemixEvent, agreement)
  }
}

function* confirmEditAgreement(
  agreementId,
  formFields,
  wasDownloadable,
  isNowDownloadable,
  wasUnlisted,
  isNowListed,
  currentAgreement
) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.AGREEMENTS, agreementId),
      function* () {
        if (!wasDownloadable && isNowDownloadable) {
          yield put(agreementActions.checkIsDownloadable(agreementId))
        }

        const { blockHash, blockNumber } = yield call(
          ColivingBackend.updateAgreement,
          agreementId,
          { ...formFields }
        )

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm edit agreement for agreement id ${agreementId}`
          )
        }

        // Need to poll with the new agreement name in case it changed
        const userId = yield select(getUserId)
        const handle = yield select(getUserHandle)

        return yield apiClient.getAgreement(
          {
            id: agreementId,
            currentUserId: userId,
            unlistedArgs: {
              urlTitle: formatUrlName(formFields.title),
              handle
            }
          },
          /* retry */ false
        )
      },
      function* (confirmedAgreement) {
        if (wasUnlisted && isNowListed) {
          confirmedAgreement._is_publishing = false
        }
        // Update the cached agreement so it no longer contains image upload artifacts
        yield put(
          cacheActions.update(Kind.AGREEMENTS, [
            {
              id: confirmedAgreement.agreement_id,
              metadata: { ...confirmedAgreement, artwork: {} }
            }
          ])
        )

        // Record analytics on agreement edit
        // Note: if remixes is not defined in field_visibility, it defaults to true
        if (
          (currentAgreement?.field_visibility?.remixes ?? true) &&
          confirmedAgreement?.field_visibility?.remixes === false
        ) {
          const handle = yield select(getUserHandle)
          // Record event if hide remixes was turned on
          yield put(
            make(Name.REMIX_HIDE, {
              id: confirmedAgreement.agreement_id,
              handle
            })
          )
        }
      },
      function* () {
        yield put(agreementActions.editAgreementFailed())
        // Throw so the user can't capture a bad upload state (especially for downloads).
        // TODO: Consider better update revesion logic here coupled with a toast or similar.
        throw new Error('Edit agreement failed')
      }
    )
  )
}

function* watchEditAgreement() {
  yield takeEvery(agreementActions.EDIT_AGREEMENT, editAgreementAsync)
}

function* deleteAgreementAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }
  const handle = yield select(getUserHandle)

  // Before deleting, check if the agreement is set as the landlord pick & delete if so
  const socials = yield call(ColivingBackend.getCreatorSocialHandle, handle)
  if (socials.pinnedAgreementId === action.agreementId) {
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

  const agreement = yield select(getAgreement, { id: action.agreementId })
  yield put(
    cacheActions.update(Kind.AGREEMENTS, [
      { id: agreement.agreement_id, metadata: { _marked_deleted: true } }
    ])
  )

  yield call(confirmDeleteAgreement, agreement.agreement_id)
}

function* confirmDeleteAgreement(agreementId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.AGREEMENTS, agreementId),
      function* () {
        const { blockHash, blockNumber } = yield call(
          ColivingBackend.deleteAgreement,
          agreementId
        )

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm delete agreement for agreement id ${agreementId}`
          )
        }

        const agreement = yield select(getAgreement, { id: agreementId })
        const handle = yield select(getUserHandle)
        const userId = yield select(getUserId)

        return yield apiClient.getAgreement(
          {
            id: agreementId,
            currentUserId: userId,
            unlistedArgs: {
              urlTitle: formatUrlName(agreement.title),
              handle
            }
          },
          /* retry */ false
        )
      },
      function* (deletedAgreement) {
        // NOTE: we do not delete from the cache as the agreement may be playing
        yield put(agreementActions.deleteAgreementSucceeded(deletedAgreement.agreement_id))

        // Record Delete Event
        const event = make(Name.DELETE, {
          kind: 'agreement',
          id: deletedAgreement.agreementId
        })
        yield put(event)
        if (deletedAgreement.stem_of) {
          const stemDeleteEvent = make(Name.STEM_DELETE, {
            id: deletedAgreement.agreement_id,
            parent_agreement_id: deletedAgreement.stem_of.parent_agreement_id,
            category: deletedAgreement.stem_of.category
          })
          yield put(stemDeleteEvent)
        }
      },
      function* () {
        // On failure, do not mark the agreement as deleted
        yield put(
          cacheActions.update(Kind.AGREEMENTS, [
            { id: agreementId, metadata: { _marked_deleted: false } }
          ])
        )
      }
    )
  )
}

function* watchDeleteAgreement() {
  yield takeEvery(agreementActions.DELETE_AGREEMENT, deleteAgreementAsync)
}

function* watchFetchCoverArt() {
  const inProgress = new Set()
  yield takeEvery(agreementActions.FETCH_COVER_ART, function* ({ agreementId, size }) {
    // Unique on id and size
    const key = `${agreementId}-${size}`
    if (inProgress.has(key)) return
    inProgress.add(key)

    try {
      let agreement = yield call(waitForValue, getAgreement, { id: agreementId })
      const user = yield call(waitForValue, getUser, { id: agreement.owner_id })
      if (!agreement || !user || (!agreement.cover_art_sizes && !agreement.cover_art))
        return
      const gateways = getContentNodeIPFSGateways(user.content_node_endpoint)
      const multihash = agreement.cover_art_sizes || agreement.cover_art
      const coverArtSize = multihash === agreement.cover_art_sizes ? size : null
      const url = yield call(
        ColivingBackend.getImageUrl,
        multihash,
        coverArtSize,
        gateways
      )
      agreement = yield select(getAgreement, { id: agreementId })
      agreement._cover_art_sizes = {
        ...agreement._cover_art_sizes,
        [coverArtSize || DefaultSizes.OVERRIDE]: url
      }
      yield put(
        cacheActions.update(Kind.AGREEMENTS, [{ id: agreementId, metadata: agreement }])
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
      console.error(`Unable to fetch cover art for agreement ${agreementId}`)
    } finally {
      inProgress.delete(key)
    }
  })
}

function* watchCheckIsDownloadable() {
  yield takeLatest(agreementActions.CHECK_IS_DOWNLOADABLE, function* (action) {
    const agreement = yield select(getAgreement, { id: action.agreementId })
    if (!agreement) return

    const user = yield select(getUser, { id: agreement.owner_id })
    if (!user) return
    if (!user.content_node_endpoint) return

    const cid = yield call(
      AgreementDownload.checkIfDownloadAvailable,
      agreement.agreement_id,
      user.content_node_endpoint
    )

    const updatedMetadata = {
      ...agreement,
      download: {
        ...agreement.download,
        cid
      }
    }

    yield put(
      cacheActions.update(Kind.AGREEMENTS, [
        {
          id: agreement.agreement_id,
          metadata: updatedMetadata
        }
      ])
    )

    const currentUserId = yield select(getUserId)
    if (currentUserId === user.user_id) {
      yield call(
        AgreementDownload.updateAgreementDownloadCID,
        agreement.agreement_id,
        agreement,
        cid
      )
    }
  })
}

const sagas = () => {
  return [
    watchAdd,
    watchEditAgreement,
    watchDeleteAgreement,
    watchFetchCoverArt,
    watchCheckIsDownloadable
  ]
}

export default sagas

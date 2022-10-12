import { Kind, ID, Name, DigitalContent, User, makeKindId } from '@coliving/common'
import { call, select, takeEvery, put } from 'typed-redux-saga/macro'

import * as accountActions from 'common/store/account/reducer'
import { getUserId, getUserHandle } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { getAgreement, getAgreements } from 'common/store/cache/agreements/selectors'
import { adjustUserField } from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { updateOptimisticListenStreak } from 'common/store/pages/digitalcoin-rewards/slice'
import * as socialActions from 'common/store/social/agreements/actions'
import { formatShareText } from 'common/utils/formatUtil'
import * as signOnActions from 'pages/signOn/store/actions'
import ColivingBackend from 'services/colivingBackend'
import AgreementDownload from 'services/colivingBackend/agreementDownload'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { waitForValue } from 'utils/sagaHelpers'
import { share } from 'utils/share'

import watchAgreementErrors from './errorSagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

/* REPOST AGREEMENT */
export function* watchRepostAgreement() {
  yield* takeEvery(socialActions.REPOST_AGREEMENT, repostAgreementAsync)
}

export function* repostAgreementAsync(
  action: ReturnType<typeof socialActions.repostAgreement>
) {
  yield* call(waitForBackendSetup)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  //  Increment the repost count on the user
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  yield* call(adjustUserField, { user, fieldName: 'repost_count', delta: 1 })
  // Indicates that the user has reposted `this` session
  yield* put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          _has_reposted: true
        }
      }
    ])
  )

  const event = make(Name.REPOST, {
    kind: 'digital_content',
    source: action.source,
    id: action.agreementId
  })
  yield* put(event)

  yield* call(confirmRepostAgreement, action.agreementId, user)

  const agreements = yield* select(getAgreements, { ids: [action.agreementId] })
  const digital_content = agreements[action.agreementId]

  const eagerlyUpdatedMetadata: Partial<DigitalContent> = {
    has_current_user_reposted: true,
    repost_count: digital_content.repost_count + 1
  }

  const remixAgreement = digital_content.remix_of?.agreements?.[0]
  const isCoSign = remixAgreement?.user?.user_id === userId

  if (remixAgreement && isCoSign) {
    // This repost is a co-sign
    const remixOf = {
      agreements: [
        {
          ...remixAgreement,
          has_remix_author_reposted: true
        }
      ]
    }
    eagerlyUpdatedMetadata.remix_of = remixOf
    eagerlyUpdatedMetadata._co_sign = remixOf.agreements[0]
  }

  yield* put(
    cacheActions.update(Kind.AGREEMENTS, [
      {
        id: action.agreementId,
        metadata: eagerlyUpdatedMetadata
      }
    ])
  )

  if (remixAgreement && isCoSign) {
    const {
      parent_digital_content_id,
      has_remix_author_reposted,
      has_remix_author_saved
    } = remixAgreement

    // DigitalContent Cosign Event
    const hasAlreadyCoSigned =
      has_remix_author_reposted || has_remix_author_saved

    const parentAgreement = yield* select(getAgreement, { id: parent_digital_content_id })

    if (parentAgreement) {
      const coSignIndicatorEvent = make(Name.REMIX_COSIGN_INDICATOR, {
        id: action.agreementId,
        handle: user.handle,
        original_digital_content_id: parentAgreement.digital_content_id,
        original_digital_content_title: parentAgreement.title,
        action: 'reposted'
      })
      yield* put(coSignIndicatorEvent)

      if (!hasAlreadyCoSigned) {
        const coSignEvent = make(Name.REMIX_COSIGN, {
          id: action.agreementId,
          handle: user.handle,
          original_digital_content_id: parentAgreement.digital_content_id,
          original_digital_content_title: parentAgreement.title,
          action: 'reposted'
        })
        yield* put(coSignEvent)
      }
    }
  }
}

export function* confirmRepostAgreement(agreementId: ID, user: User) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.AGREEMENTS, agreementId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          ColivingBackend.repostAgreement,
          agreementId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm repost digital_content for digital_content id ${agreementId}`
          )
        }
        return agreementId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        // Revert the incremented repost count
        yield* call(adjustUserField, {
          user,
          fieldName: 'repost_count',
          delta: -1
        })
        yield* put(
          socialActions.agreementRepostFailed(
            agreementId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}

export function* watchUndoRepostAgreement() {
  yield* takeEvery(socialActions.UNDO_REPOST_AGREEMENT, undoRepostAgreementAsync)
}

export function* undoRepostAgreementAsync(
  action: ReturnType<typeof socialActions.undoRepostAgreement>
) {
  yield* call(waitForBackendSetup)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  // Decrement the repost count
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  yield* call(adjustUserField, { user, fieldName: 'repost_count', delta: -1 })

  const event = make(Name.UNDO_REPOST, {
    kind: 'digital_content',
    source: action.source,
    id: action.agreementId
  })
  yield* put(event)

  yield* call(confirmUndoRepostAgreement, action.agreementId, user)

  const agreements = yield* select(getAgreements, { ids: [action.agreementId] })
  const digital_content = agreements[action.agreementId]

  const eagerlyUpdatedMetadata: Partial<DigitalContent> = {
    has_current_user_reposted: false,
    repost_count: digital_content.repost_count - 1
  }

  if (digital_content.remix_of?.agreements?.[0]?.user?.user_id === userId) {
    // This repost is a co-sign
    const remixOf = {
      agreements: [
        {
          ...digital_content.remix_of.agreements[0],
          has_remix_author_reposted: false
        }
      ]
    }
    eagerlyUpdatedMetadata.remix_of = remixOf
    if (
      remixOf.agreements[0].has_remix_author_saved ||
      remixOf.agreements[0].has_remix_author_reposted
    ) {
      eagerlyUpdatedMetadata._co_sign = remixOf.agreements[0]
    } else {
      eagerlyUpdatedMetadata._co_sign = null
    }
  }

  yield* put(
    cacheActions.update(Kind.AGREEMENTS, [
      {
        id: action.agreementId,
        metadata: eagerlyUpdatedMetadata
      }
    ])
  )
}

export function* confirmUndoRepostAgreement(agreementId: ID, user: User) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.AGREEMENTS, agreementId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          ColivingBackend.undoRepostAgreement,
          agreementId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm undo repost digital_content for digital_content id ${agreementId}`
          )
        }
        return agreementId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        // revert the decremented repost count
        yield* call(adjustUserField, {
          user,
          fieldName: 'repost_count',
          delta: 1
        })
        yield* put(
          socialActions.agreementRepostFailed(
            agreementId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}
/* SAVE AGREEMENT */

export function* watchSaveAgreement() {
  yield* takeEvery(socialActions.SAVE_AGREEMENT, saveAgreementAsync)
}

export function* saveAgreementAsync(
  action: ReturnType<typeof socialActions.saveAgreement>
) {
  yield* call(waitForBackendSetup)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(signOnActions.openSignOn(false))
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  const agreements = yield* select(getAgreements, { ids: [action.agreementId] })
  const digital_content = agreements[action.agreementId]

  if (digital_content.has_current_user_saved) return
  yield* put(accountActions.didFavoriteItem())

  const event = make(Name.FAVORITE, {
    kind: 'digital_content',
    source: action.source,
    id: action.agreementId
  })
  yield* put(event)

  yield* call(confirmSaveAgreement, action.agreementId)

  const eagerlyUpdatedMetadata: Partial<DigitalContent> = {
    has_current_user_saved: true,
    save_count: digital_content.save_count + 1
  }

  const remixAgreement = digital_content.remix_of?.agreements?.[0]
  const isCoSign = remixAgreement?.user?.user_id === userId
  if (remixAgreement && isCoSign) {
    // This repost is a co-sign
    const remixOf = {
      agreements: [
        {
          ...remixAgreement,
          has_remix_author_saved: true
        }
      ]
    }
    eagerlyUpdatedMetadata.remix_of = remixOf
    eagerlyUpdatedMetadata._co_sign = remixOf.agreements[0]
  }

  yield* put(
    cacheActions.update(Kind.AGREEMENTS, [
      {
        id: action.agreementId,
        metadata: eagerlyUpdatedMetadata
      }
    ])
  )
  yield* put(socialActions.saveAgreementSucceeded(action.agreementId))
  if (isCoSign) {
    // DigitalContent Cosign Event
    const parentAgreementId = remixAgreement.parent_digital_content_id
    const hasAlreadyCoSigned =
      remixAgreement.has_remix_author_reposted || remixAgreement.has_remix_author_saved

    const parentAgreement = yield* select(getAgreement, { id: parentAgreementId })
    const handle = yield* select(getUserHandle)
    const coSignIndicatorEvent = make(Name.REMIX_COSIGN_INDICATOR, {
      id: action.agreementId,
      handle,
      original_digital_content_id: parentAgreement?.digital_content_id,
      original_digital_content_title: parentAgreement?.title,
      action: 'favorited'
    })
    yield* put(coSignIndicatorEvent)

    if (!hasAlreadyCoSigned) {
      const coSignEvent = make(Name.REMIX_COSIGN, {
        id: action.agreementId,
        handle,
        original_digital_content_id: parentAgreement?.digital_content_id,
        original_digital_content_title: parentAgreement?.title,
        action: 'favorited'
      })
      yield* put(coSignEvent)
    }
  }
}

export function* confirmSaveAgreement(agreementId: ID) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.AGREEMENTS, agreementId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          ColivingBackend.saveAgreement,
          agreementId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm save digital_content for digital_content id ${agreementId}`
          )
        }
        return agreementId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.saveAgreementFailed(agreementId, timeout ? 'Timeout' : message)
        )
      }
    )
  )
}

export function* watchUnsaveAgreement() {
  yield* takeEvery(socialActions.UNSAVE_AGREEMENT, unsaveAgreementAsync)
}

export function* unsaveAgreementAsync(
  action: ReturnType<typeof socialActions.unsaveAgreement>
) {
  yield* call(waitForBackendSetup)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  const event = make(Name.UNFAVORITE, {
    kind: 'digital_content',
    source: action.source,
    id: action.agreementId
  })
  yield* put(event)

  yield* call(confirmUnsaveAgreement, action.agreementId)

  const agreements = yield* select(getAgreements, { ids: [action.agreementId] })
  const digital_content = agreements[action.agreementId]
  if (digital_content) {
    const eagerlyUpdatedMetadata: Partial<DigitalContent> = {
      has_current_user_saved: false,
      save_count: digital_content.save_count - 1
    }

    if (digital_content.remix_of?.agreements?.[0]?.user?.user_id === userId) {
      // This repost is a co-sign
      const remixOf = {
        agreements: [
          {
            ...digital_content.remix_of.agreements[0],
            has_remix_author_saved: false
          }
        ]
      }
      eagerlyUpdatedMetadata.remix_of = remixOf
      if (
        remixOf.agreements[0].has_remix_author_saved ||
        remixOf.agreements[0].has_remix_author_reposted
      ) {
        eagerlyUpdatedMetadata._co_sign = remixOf.agreements[0]
      } else {
        eagerlyUpdatedMetadata._co_sign = null
      }
    }

    yield* put(
      cacheActions.update(Kind.AGREEMENTS, [
        {
          id: action.agreementId,
          metadata: eagerlyUpdatedMetadata
        }
      ])
    )
  }

  yield* put(socialActions.unsaveAgreementSucceeded(action.agreementId))
}

export function* confirmUnsaveAgreement(agreementId: ID) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.AGREEMENTS, agreementId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          ColivingBackend.unsaveAgreement,
          agreementId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm unsave digital_content for digital_content id ${agreementId}`
          )
        }
        return agreementId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.unsaveAgreementFailed(
            agreementId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}

export function* watchSetLandlordPick() {
  yield* takeEvery(
    socialActions.SET_LANDLORD_PICK,
    function* (action: ReturnType<typeof socialActions.setLandlordPick>) {
      const userId = yield* select(getUserId)
      yield* put(
        cacheActions.update(Kind.USERS, [
          {
            id: userId,
            metadata: { _landlord_pick: action.agreementId }
          }
        ])
      )
      yield* call(ColivingBackend.setLandlordPick, action.agreementId)

      const event = make(Name.LANDLORD_PICK_SELECT_AGREEMENT, { id: action.agreementId })
      yield* put(event)
    }
  )
}

export function* watchUnsetLandlordPick() {
  yield* takeEvery(socialActions.UNSET_LANDLORD_PICK, function* (action) {
    const userId = yield* select(getUserId)
    yield* put(
      cacheActions.update(Kind.USERS, [
        {
          id: userId,
          metadata: { _landlord_pick: null }
        }
      ])
    )
    yield* call(ColivingBackend.setLandlordPick)

    const event = make(Name.LANDLORD_PICK_SELECT_AGREEMENT, { id: 'none' })
    yield* put(event)
  })
}

/* RECORD LISTEN */

export function* watchRecordListen() {
  yield* takeEvery(
    socialActions.RECORD_LISTEN,
    function* (action: ReturnType<typeof socialActions.recordListen>) {
      if (NATIVE_MOBILE) return
      console.debug('Listen recorded for digital_content', action.agreementId)

      const userId = yield* select(getUserId)
      const digital_content = yield* select(getAgreement, { id: action.agreementId })
      if (!userId || !digital_content) return

      if (userId !== digital_content.owner_id || digital_content.play_count < 10) {
        yield* call(ColivingBackend.recordAgreementListen, action.agreementId)
      }

      // Record digital_content listen analytics event
      const event = make(Name.LISTEN, { agreementId: action.agreementId })
      yield* put(event)

      // Optimistically update the listen streak if applicable
      yield* put(updateOptimisticListenStreak())
    }
  )
}

/* DOWNLOAD AGREEMENT */

function* watchDownloadAgreement() {
  yield* takeEvery(
    socialActions.DOWNLOAD_AGREEMENT,
    function* (action: ReturnType<typeof socialActions.downloadAgreement>) {
      yield* call(waitForBackendSetup)

      // Check if there is a logged in account and if not,
      // wait for one so we can trigger the download immediately after
      // logging in.
      const accountUserId = yield* select(getUserId)
      if (!accountUserId) {
        yield* call(waitForValue, getUserId)
      }

      const digital_content = yield* select(getAgreement, { id: action.agreementId })
      if (!digital_content) return

      const userId = digital_content.owner_id
      const user = yield* select(getUser, { id: userId })
      if (!user) return

      let filename
      // Determine if this digital_content requires a follow to download.
      // In the case of a stem, check the parent digital_content
      let requiresFollow =
        digital_content.download?.requires_follow && userId !== accountUserId
      if (digital_content.stem_of?.parent_digital_content_id) {
        const parentAgreement = yield* select(getAgreement, {
          id: digital_content.stem_of?.parent_digital_content_id
        })
        requiresFollow =
          requiresFollow ||
          (parentAgreement?.download?.requires_follow && userId !== accountUserId)

        filename = `${parentAgreement?.title} - ${action.stemName} - ${user.name} (Coliving).mp3`
      } else {
        filename = `${digital_content.title} - ${user.name} (Coliving).mp3`
      }

      // If a follow is required and the current user is not following
      // bail out of downloading.
      if (requiresFollow && !user.does_current_user_follow) {
        return
      }

      const endpoints = action.contentNodeEndpoints
        .split(',')
        .map((endpoint) => `${endpoint}/ipfs/`)

      if (NATIVE_MOBILE) {
        yield* call(
          AgreementDownload.downloadAgreementMobile,
          action.cid,
          endpoints,
          filename
        )
      } else {
        yield* call(
          AgreementDownload.downloadAgreement,
          action.cid,
          endpoints,
          filename
        )
      }
    }
  )
}

/* SHARE */

function* watchShareAgreement() {
  yield* takeEvery(
    socialActions.SHARE_AGREEMENT,
    function* (action: ReturnType<typeof socialActions.shareAgreement>) {
      const { agreementId } = action

      const digital_content = yield* select(getAgreement, { id: agreementId })
      if (!digital_content) return

      const user = yield* select(getUser, { id: digital_content.owner_id })
      if (!user) return

      const link = digital_content.permalink
      share(link, formatShareText(digital_content.title, user.name))

      const event = make(Name.SHARE, {
        kind: 'digital_content',
        source: action.source,
        id: agreementId,
        url: link
      })
      yield* put(event)
    }
  )
}

const sagas = () => {
  return [
    watchRepostAgreement,
    watchUndoRepostAgreement,
    watchSaveAgreement,
    watchUnsaveAgreement,
    watchRecordListen,
    watchSetLandlordPick,
    watchUnsetLandlordPick,
    watchDownloadAgreement,
    watchShareAgreement,
    watchAgreementErrors
  ]
}

export default sagas

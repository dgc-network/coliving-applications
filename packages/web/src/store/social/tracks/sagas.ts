import { Kind, ID, Name, Agreement, User, makeKindId } from '@coliving/common'
import { call, select, takeEvery, put } from 'typed-redux-saga/macro'

import * as accountActions from 'common/store/account/reducer'
import { getUserId, getUserHandle } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { getAgreement, getAgreements } from 'common/store/cache/agreements/selectors'
import { adjustUserField } from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { updateOptimisticListenStreak } from 'common/store/pages/live-rewards/slice'
import * as socialActions from 'common/store/social/agreements/actions'
import { formatShareText } from 'common/utils/formatUtil'
import * as signOnActions from 'pages/signOn/store/actions'
import ColivingBackend from 'services/ColivingBackend'
import AgreementDownload from 'services/coliving-backend/AgreementDownload'
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
    kind: 'agreement',
    source: action.source,
    id: action.agreementId
  })
  yield* put(event)

  yield* call(confirmRepostAgreement, action.agreementId, user)

  const agreements = yield* select(getAgreements, { ids: [action.agreementId] })
  const agreement = agreements[action.agreementId]

  const eagerlyUpdatedMetadata: Partial<Agreement> = {
    has_current_user_reposted: true,
    repost_count: agreement.repost_count + 1
  }

  const remixAgreement = agreement.remix_of?.agreements?.[0]
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
      parent_agreement_id,
      has_remix_author_reposted,
      has_remix_author_saved
    } = remixAgreement

    // Agreement Cosign Event
    const hasAlreadyCoSigned =
      has_remix_author_reposted || has_remix_author_saved

    const parentAgreement = yield* select(getAgreement, { id: parent_agreement_id })

    if (parentAgreement) {
      const coSignIndicatorEvent = make(Name.REMIX_COSIGN_INDICATOR, {
        id: action.agreementId,
        handle: user.handle,
        original_agreement_id: parentAgreement.agreement_id,
        original_agreement_title: parentAgreement.title,
        action: 'reposted'
      })
      yield* put(coSignIndicatorEvent)

      if (!hasAlreadyCoSigned) {
        const coSignEvent = make(Name.REMIX_COSIGN, {
          id: action.agreementId,
          handle: user.handle,
          original_agreement_id: parentAgreement.agreement_id,
          original_agreement_title: parentAgreement.title,
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
            `Could not confirm repost agreement for agreement id ${agreementId}`
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
    kind: 'agreement',
    source: action.source,
    id: action.agreementId
  })
  yield* put(event)

  yield* call(confirmUndoRepostAgreement, action.agreementId, user)

  const agreements = yield* select(getAgreements, { ids: [action.agreementId] })
  const agreement = agreements[action.agreementId]

  const eagerlyUpdatedMetadata: Partial<Agreement> = {
    has_current_user_reposted: false,
    repost_count: agreement.repost_count - 1
  }

  if (agreement.remix_of?.agreements?.[0]?.user?.user_id === userId) {
    // This repost is a co-sign
    const remixOf = {
      agreements: [
        {
          ...agreement.remix_of.agreements[0],
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
            `Could not confirm undo repost agreement for agreement id ${agreementId}`
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
  const agreement = agreements[action.agreementId]

  if (agreement.has_current_user_saved) return
  yield* put(accountActions.didFavoriteItem())

  const event = make(Name.FAVORITE, {
    kind: 'agreement',
    source: action.source,
    id: action.agreementId
  })
  yield* put(event)

  yield* call(confirmSaveAgreement, action.agreementId)

  const eagerlyUpdatedMetadata: Partial<Agreement> = {
    has_current_user_saved: true,
    save_count: agreement.save_count + 1
  }

  const remixAgreement = agreement.remix_of?.agreements?.[0]
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
    // Agreement Cosign Event
    const parentAgreementId = remixAgreement.parent_agreement_id
    const hasAlreadyCoSigned =
      remixAgreement.has_remix_author_reposted || remixAgreement.has_remix_author_saved

    const parentAgreement = yield* select(getAgreement, { id: parentAgreementId })
    const handle = yield* select(getUserHandle)
    const coSignIndicatorEvent = make(Name.REMIX_COSIGN_INDICATOR, {
      id: action.agreementId,
      handle,
      original_agreement_id: parentAgreement?.agreement_id,
      original_agreement_title: parentAgreement?.title,
      action: 'favorited'
    })
    yield* put(coSignIndicatorEvent)

    if (!hasAlreadyCoSigned) {
      const coSignEvent = make(Name.REMIX_COSIGN, {
        id: action.agreementId,
        handle,
        original_agreement_id: parentAgreement?.agreement_id,
        original_agreement_title: parentAgreement?.title,
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
            `Could not confirm save agreement for agreement id ${agreementId}`
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
    kind: 'agreement',
    source: action.source,
    id: action.agreementId
  })
  yield* put(event)

  yield* call(confirmUnsaveAgreement, action.agreementId)

  const agreements = yield* select(getAgreements, { ids: [action.agreementId] })
  const agreement = agreements[action.agreementId]
  if (agreement) {
    const eagerlyUpdatedMetadata: Partial<Agreement> = {
      has_current_user_saved: false,
      save_count: agreement.save_count - 1
    }

    if (agreement.remix_of?.agreements?.[0]?.user?.user_id === userId) {
      // This repost is a co-sign
      const remixOf = {
        agreements: [
          {
            ...agreement.remix_of.agreements[0],
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
            `Could not confirm unsave agreement for agreement id ${agreementId}`
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
      console.debug('Listen recorded for agreement', action.agreementId)

      const userId = yield* select(getUserId)
      const agreement = yield* select(getAgreement, { id: action.agreementId })
      if (!userId || !agreement) return

      if (userId !== agreement.owner_id || agreement.play_count < 10) {
        yield* call(ColivingBackend.recordAgreementListen, action.agreementId)
      }

      // Record agreement listen analytics event
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

      const agreement = yield* select(getAgreement, { id: action.agreementId })
      if (!agreement) return

      const userId = agreement.owner_id
      const user = yield* select(getUser, { id: userId })
      if (!user) return

      let filename
      // Determine if this agreement requires a follow to download.
      // In the case of a stem, check the parent agreement
      let requiresFollow =
        agreement.download?.requires_follow && userId !== accountUserId
      if (agreement.stem_of?.parent_agreement_id) {
        const parentAgreement = yield* select(getAgreement, {
          id: agreement.stem_of?.parent_agreement_id
        })
        requiresFollow =
          requiresFollow ||
          (parentAgreement?.download?.requires_follow && userId !== accountUserId)

        filename = `${parentAgreement?.title} - ${action.stemName} - ${user.name} (Coliving).mp3`
      } else {
        filename = `${agreement.title} - ${user.name} (Coliving).mp3`
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

      const agreement = yield* select(getAgreement, { id: agreementId })
      if (!agreement) return

      const user = yield* select(getUser, { id: agreement.owner_id })
      if (!user) return

      const link = agreement.permalink
      share(link, formatShareText(agreement.title, user.name))

      const event = make(Name.SHARE, {
        kind: 'agreement',
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

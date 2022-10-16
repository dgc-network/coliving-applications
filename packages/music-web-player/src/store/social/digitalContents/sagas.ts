import { Kind, ID, Name, DigitalContent, User, makeKindId } from '@coliving/common'
import { call, select, takeEvery, put } from 'typed-redux-saga/macro'

import * as accountActions from 'common/store/account/reducer'
import { getUserId, getUserHandle } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { getDigitalContent, getDigitalContents } from 'common/store/cache/digital_contents/selectors'
import { adjustUserField } from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { updateOptimisticListenStreak } from 'common/store/pages/digitalcoin-rewards/slice'
import * as socialActions from 'common/store/social/digital_contents/actions'
import { formatShareText } from 'common/utils/formatUtil'
import * as signOnActions from 'pages/signOn/store/actions'
import ColivingBackend from 'services/colivingBackend'
import DigitalContentDownload from 'services/colivingBackend/digitalContentDownload'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { waitForValue } from 'utils/sagaHelpers'
import { share } from 'utils/share'

import watchDigitalContentErrors from './errorSagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

/* REPOST DIGITAL_CONTENT */
export function* watchRepostDigitalContent() {
  yield* takeEvery(socialActions.REPOST_DIGITAL_CONTENT, repostDigitalContentAsync)
}

export function* repostDigitalContentAsync(
  action: ReturnType<typeof socialActions.repostDigitalContent>
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
    id: action.digitalContentId
  })
  yield* put(event)

  yield* call(confirmRepostDigitalContent, action.digitalContentId, user)

  const digitalContents = yield* select(getDigitalContents, { ids: [action.digitalContentId] })
  const digital_content = digitalContents[action.digitalContentId]

  const eagerlyUpdatedMetadata: Partial<DigitalContent> = {
    has_current_user_reposted: true,
    repost_count: digital_content.repost_count + 1
  }

  const remixDigitalContent = digital_content.remix_of?.digitalContents?.[0]
  const isCoSign = remixDigitalContent?.user?.user_id === userId

  if (remixDigitalContent && isCoSign) {
    // This repost is a co-sign
    const remixOf = {
      digitalContents: [
        {
          ...remixDigitalContent,
          has_remix_author_reposted: true
        }
      ]
    }
    eagerlyUpdatedMetadata.remix_of = remixOf
    eagerlyUpdatedMetadata._co_sign = remixOf.digitalContents[0]
  }

  yield* put(
    cacheActions.update(Kind.DIGITAL_CONTENTS, [
      {
        id: action.digitalContentId,
        metadata: eagerlyUpdatedMetadata
      }
    ])
  )

  if (remixDigitalContent && isCoSign) {
    const {
      parent_digital_content_id,
      has_remix_author_reposted,
      has_remix_author_saved
    } = remixDigitalContent

    // DigitalContent Cosign Event
    const hasAlreadyCoSigned =
      has_remix_author_reposted || has_remix_author_saved

    const parentDigitalContent = yield* select(getDigitalContent, { id: parent_digital_content_id })

    if (parentDigitalContent) {
      const coSignIndicatorEvent = make(Name.REMIX_COSIGN_INDICATOR, {
        id: action.digitalContentId,
        handle: user.handle,
        original_digital_content_id: parentDigitalContent.digital_content_id,
        original_digital_content_title: parentDigitalContent.title,
        action: 'reposted'
      })
      yield* put(coSignIndicatorEvent)

      if (!hasAlreadyCoSigned) {
        const coSignEvent = make(Name.REMIX_COSIGN, {
          id: action.digitalContentId,
          handle: user.handle,
          original_digital_content_id: parentDigitalContent.digital_content_id,
          original_digital_content_title: parentDigitalContent.title,
          action: 'reposted'
        })
        yield* put(coSignEvent)
      }
    }
  }
}

export function* confirmRepostDigitalContent(digitalContentId: ID, user: User) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.DIGITAL_CONTENTS, digitalContentId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          ColivingBackend.repostDigitalContent,
          digitalContentId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm repost digital_content for digital_content id ${digitalContentId}`
          )
        }
        return digitalContentId
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
          socialActions.digitalContentRepostFailed(
            digitalContentId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}

export function* watchUndoRepostDigitalContent() {
  yield* takeEvery(socialActions.UNDO_REPOST_DIGITAL_CONTENT, undoRepostDigitalContentAsync)
}

export function* undoRepostDigitalContentAsync(
  action: ReturnType<typeof socialActions.undoRepostDigitalContent>
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
    id: action.digitalContentId
  })
  yield* put(event)

  yield* call(confirmUndoRepostDigitalContent, action.digitalContentId, user)

  const digitalContents = yield* select(getDigitalContents, { ids: [action.digitalContentId] })
  const digital_content = digitalContents[action.digitalContentId]

  const eagerlyUpdatedMetadata: Partial<DigitalContent> = {
    has_current_user_reposted: false,
    repost_count: digital_content.repost_count - 1
  }

  if (digital_content.remix_of?.digitalContents?.[0]?.user?.user_id === userId) {
    // This repost is a co-sign
    const remixOf = {
      digitalContents: [
        {
          ...digital_content.remix_of.digitalContents[0],
          has_remix_author_reposted: false
        }
      ]
    }
    eagerlyUpdatedMetadata.remix_of = remixOf
    if (
      remixOf.digitalContents[0].has_remix_author_saved ||
      remixOf.digitalContents[0].has_remix_author_reposted
    ) {
      eagerlyUpdatedMetadata._co_sign = remixOf.digitalContents[0]
    } else {
      eagerlyUpdatedMetadata._co_sign = null
    }
  }

  yield* put(
    cacheActions.update(Kind.DIGITAL_CONTENTS, [
      {
        id: action.digitalContentId,
        metadata: eagerlyUpdatedMetadata
      }
    ])
  )
}

export function* confirmUndoRepostDigitalContent(digitalContentId: ID, user: User) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.DIGITAL_CONTENTS, digitalContentId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          ColivingBackend.undoRepostDigitalContent,
          digitalContentId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm undo repost digital_content for digital_content id ${digitalContentId}`
          )
        }
        return digitalContentId
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
          socialActions.digitalContentRepostFailed(
            digitalContentId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}
/* SAVE DIGITAL_CONTENT */

export function* watchSaveDigitalContent() {
  yield* takeEvery(socialActions.SAVE_DIGITAL_CONTENT, saveDigitalContentAsync)
}

export function* saveDigitalContentAsync(
  action: ReturnType<typeof socialActions.saveDigitalContent>
) {
  yield* call(waitForBackendSetup)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(signOnActions.openSignOn(false))
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  const digitalContents = yield* select(getDigitalContents, { ids: [action.digitalContentId] })
  const digital_content = digitalContents[action.digitalContentId]

  if (digital_content.has_current_user_saved) return
  yield* put(accountActions.didFavoriteItem())

  const event = make(Name.FAVORITE, {
    kind: 'digital_content',
    source: action.source,
    id: action.digitalContentId
  })
  yield* put(event)

  yield* call(confirmSaveDigitalContent, action.digitalContentId)

  const eagerlyUpdatedMetadata: Partial<DigitalContent> = {
    has_current_user_saved: true,
    save_count: digital_content.save_count + 1
  }

  const remixDigitalContent = digital_content.remix_of?.digitalContents?.[0]
  const isCoSign = remixDigitalContent?.user?.user_id === userId
  if (remixDigitalContent && isCoSign) {
    // This repost is a co-sign
    const remixOf = {
      digitalContents: [
        {
          ...remixDigitalContent,
          has_remix_author_saved: true
        }
      ]
    }
    eagerlyUpdatedMetadata.remix_of = remixOf
    eagerlyUpdatedMetadata._co_sign = remixOf.digitalContents[0]
  }

  yield* put(
    cacheActions.update(Kind.DIGITAL_CONTENTS, [
      {
        id: action.digitalContentId,
        metadata: eagerlyUpdatedMetadata
      }
    ])
  )
  yield* put(socialActions.saveDigitalContentSucceeded(action.digitalContentId))
  if (isCoSign) {
    // DigitalContent Cosign Event
    const parentDigitalContentId = remixDigitalContent.parent_digital_content_id
    const hasAlreadyCoSigned =
      remixDigitalContent.has_remix_author_reposted || remixDigitalContent.has_remix_author_saved

    const parentDigitalContent = yield* select(getDigitalContent, { id: parentDigitalContentId })
    const handle = yield* select(getUserHandle)
    const coSignIndicatorEvent = make(Name.REMIX_COSIGN_INDICATOR, {
      id: action.digitalContentId,
      handle,
      original_digital_content_id: parentDigitalContent?.digital_content_id,
      original_digital_content_title: parentDigitalContent?.title,
      action: 'favorited'
    })
    yield* put(coSignIndicatorEvent)

    if (!hasAlreadyCoSigned) {
      const coSignEvent = make(Name.REMIX_COSIGN, {
        id: action.digitalContentId,
        handle,
        original_digital_content_id: parentDigitalContent?.digital_content_id,
        original_digital_content_title: parentDigitalContent?.title,
        action: 'favorited'
      })
      yield* put(coSignEvent)
    }
  }
}

export function* confirmSaveDigitalContent(digitalContentId: ID) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.DIGITAL_CONTENTS, digitalContentId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          ColivingBackend.saveDigitalContent,
          digitalContentId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm save digital_content for digital_content id ${digitalContentId}`
          )
        }
        return digitalContentId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.saveDigitalContentFailed(digitalContentId, timeout ? 'Timeout' : message)
        )
      }
    )
  )
}

export function* watchUnsaveDigitalContent() {
  yield* takeEvery(socialActions.UNSAVE_DIGITAL_CONTENT, unsaveDigitalContentAsync)
}

export function* unsaveDigitalContentAsync(
  action: ReturnType<typeof socialActions.unsaveDigitalContent>
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
    id: action.digitalContentId
  })
  yield* put(event)

  yield* call(confirmUnsaveDigitalContent, action.digitalContentId)

  const digitalContents = yield* select(getDigitalContents, { ids: [action.digitalContentId] })
  const digital_content = digitalContents[action.digitalContentId]
  if (digital_content) {
    const eagerlyUpdatedMetadata: Partial<DigitalContent> = {
      has_current_user_saved: false,
      save_count: digital_content.save_count - 1
    }

    if (digital_content.remix_of?.digitalContents?.[0]?.user?.user_id === userId) {
      // This repost is a co-sign
      const remixOf = {
        digitalContents: [
          {
            ...digital_content.remix_of.digitalContents[0],
            has_remix_author_saved: false
          }
        ]
      }
      eagerlyUpdatedMetadata.remix_of = remixOf
      if (
        remixOf.digitalContents[0].has_remix_author_saved ||
        remixOf.digitalContents[0].has_remix_author_reposted
      ) {
        eagerlyUpdatedMetadata._co_sign = remixOf.digitalContents[0]
      } else {
        eagerlyUpdatedMetadata._co_sign = null
      }
    }

    yield* put(
      cacheActions.update(Kind.DIGITAL_CONTENTS, [
        {
          id: action.digitalContentId,
          metadata: eagerlyUpdatedMetadata
        }
      ])
    )
  }

  yield* put(socialActions.unsaveDigitalContentSucceeded(action.digitalContentId))
}

export function* confirmUnsaveDigitalContent(digitalContentId: ID) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.DIGITAL_CONTENTS, digitalContentId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          ColivingBackend.unsaveDigitalContent,
          digitalContentId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm unsave digital_content for digital_content id ${digitalContentId}`
          )
        }
        return digitalContentId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.unsaveDigitalContentFailed(
            digitalContentId,
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
            metadata: { _landlord_pick: action.digitalContentId }
          }
        ])
      )
      yield* call(ColivingBackend.setLandlordPick, action.digitalContentId)

      const event = make(Name.LANDLORD_PICK_SELECT_DIGITAL_CONTENT, { id: action.digitalContentId })
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

    const event = make(Name.LANDLORD_PICK_SELECT_DIGITAL_CONTENT, { id: 'none' })
    yield* put(event)
  })
}

/* RECORD LISTEN */

export function* watchRecordListen() {
  yield* takeEvery(
    socialActions.RECORD_LISTEN,
    function* (action: ReturnType<typeof socialActions.recordListen>) {
      if (NATIVE_MOBILE) return
      console.debug('Listen recorded for digital_content', action.digitalContentId)

      const userId = yield* select(getUserId)
      const digital_content = yield* select(getDigitalContent, { id: action.digitalContentId })
      if (!userId || !digital_content) return

      if (userId !== digital_content.owner_id || digital_content.play_count < 10) {
        yield* call(ColivingBackend.recordDigitalContentListen, action.digitalContentId)
      }

      // Record digital_content listen analytics event
      const event = make(Name.LISTEN, { digitalContentId: action.digitalContentId })
      yield* put(event)

      // Optimistically update the listen streak if applicable
      yield* put(updateOptimisticListenStreak())
    }
  )
}

/* DOWNLOAD DIGITAL_CONTENT */

function* watchDownloadDigitalContent() {
  yield* takeEvery(
    socialActions.DOWNLOAD_DIGITAL_CONTENT,
    function* (action: ReturnType<typeof socialActions.downloadDigitalContent>) {
      yield* call(waitForBackendSetup)

      // Check if there is a logged in account and if not,
      // wait for one so we can trigger the download immediately after
      // logging in.
      const accountUserId = yield* select(getUserId)
      if (!accountUserId) {
        yield* call(waitForValue, getUserId)
      }

      const digital_content = yield* select(getDigitalContent, { id: action.digitalContentId })
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
        const parentDigitalContent = yield* select(getDigitalContent, {
          id: digital_content.stem_of?.parent_digital_content_id
        })
        requiresFollow =
          requiresFollow ||
          (parentDigitalContent?.download?.requires_follow && userId !== accountUserId)

        filename = `${parentDigitalContent?.title} - ${action.stemName} - ${user.name} (Coliving).mp3`
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
          DigitalContentDownload.downloadDigitalContentMobile,
          action.cid,
          endpoints,
          filename
        )
      } else {
        yield* call(
          DigitalContentDownload.downloadDigitalContent,
          action.cid,
          endpoints,
          filename
        )
      }
    }
  )
}

/* SHARE */

function* watchShareDigitalContent() {
  yield* takeEvery(
    socialActions.SHARE_DIGITAL_CONTENT,
    function* (action: ReturnType<typeof socialActions.shareDigitalContent>) {
      const { digitalContentId } = action

      const digital_content = yield* select(getDigitalContent, { id: digitalContentId })
      if (!digital_content) return

      const user = yield* select(getUser, { id: digital_content.owner_id })
      if (!user) return

      const link = digital_content.permalink
      share(link, formatShareText(digital_content.title, user.name))

      const event = make(Name.SHARE, {
        kind: 'digital_content',
        source: action.source,
        id: digitalContentId,
        url: link
      })
      yield* put(event)
    }
  )
}

const sagas = () => {
  return [
    watchRepostDigitalContent,
    watchUndoRepostDigitalContent,
    watchSaveDigitalContent,
    watchUnsaveDigitalContent,
    watchRecordListen,
    watchSetLandlordPick,
    watchUnsetLandlordPick,
    watchDownloadDigitalContent,
    watchShareDigitalContent,
    watchDigitalContentErrors
  ]
}

export default sagas

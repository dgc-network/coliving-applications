import {
  Kind,
  ID,
  UID,
  Name,
  PlaybackSource,
  LineupState,
  User,
  Nullable,
  makeUid,
  Uid
} from '@coliving/common'
import {
  all,
  call,
  put,
  select,
  takeEvery,
  takeLatest
} from 'typed-redux-saga/macro'

import { getUserId } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getId } from 'common/store/cache/selectors'
import { getAgreement } from 'common/store/cache/agreements/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import {
  getCollectible,
  getId as getQueueAgreementId,
  getIndex,
  getLength,
  getOvershot,
  getQueueAutoplay,
  getRepeat,
  getShuffle,
  getSource,
  getUid,
  getUndershot
} from 'common/store/queue/selectors'
import {
  add,
  clear,
  next,
  pause,
  play,
  queueAutoplay,
  persist,
  previous,
  remove
} from 'common/store/queue/slice'
import { RepeatMode, Source } from 'common/store/queue/types'
import { make } from 'store/analytics/actions'
import { getLineupSelectorForRoute } from 'store/lineup/lineupForRoute'
import {
  getAgreementId as getPlayerAgreementId,
  getUid as getPlayerUid
} from 'store/player/selectors'
import * as playerActions from 'store/player/slice'

import { getRecommendedAgreements } from '../recommendation/sagas'

import mobileSagas from './mobileSagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const QUEUE_SUBSCRIBER_NAME = 'QUEUE'

export function* getToQueue(prefix: string, entry: { kind: Kind; uid: UID }) {
  if (entry.kind === Kind.COLLECTIONS) {
    const collection = yield* select(getCollection, { uid: entry.uid })
    if (!collection) return

    const {
      contentList_contents: { agreement_ids: agreementIds }
    } = collection
    // Replace the agreement uid source w/ the full source including collection source
    // Replace the agreement count w/ it's index in the array
    const collectionUid = Uid.fromString(entry.uid)
    const collectionSource = collectionUid.source

    return agreementIds.map(({ agreement, uid }, idx: number) => {
      const agreementUid = Uid.fromString(uid ?? '')
      agreementUid.source = `${collectionSource}:${agreementUid.source}`
      agreementUid.count = idx

      return {
        id: agreement,
        uid: agreementUid.toString(),
        source: prefix
      }
    })
  } else if (entry.kind === Kind.AGREEMENTS) {
    const agreement = yield* select(getAgreement, { uid: entry.uid })
    if (!agreement) return {}
    return {
      id: agreement.agreement_id,
      uid: entry.uid,
      source: prefix
    }
  }
}

const flatten = (list: any[]): any[] =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

function* handleQueueAutoplay({
  skip,
  ignoreSkip,
  agreement
}: {
  skip: boolean
  ignoreSkip: boolean
  agreement: any
}) {
  const isQueueAutoplayEnabled = yield* select(getQueueAutoplay)
  const index = yield* select(getIndex)
  if (!isQueueAutoplayEnabled || index < 0) {
    return
  }

  // Get recommended agreements if not in shuffle mode
  // and not in repeat mode and
  // - close to end of queue, or
  // - playing first song of lineup and lineup has only one song
  const length = yield* select(getLength)
  const shuffle = yield* select(getShuffle)
  const repeatMode = yield* select(getRepeat)
  const isCloseToEndOfQueue = index + 1 >= length
  const isOnlySongInQueue = index === 0 && length === 1
  const isNotRepeating =
    repeatMode === RepeatMode.OFF ||
    (repeatMode === RepeatMode.SINGLE && (skip || ignoreSkip))
  if (
    !shuffle &&
    isNotRepeating &&
    (isCloseToEndOfQueue || isOnlySongInQueue)
  ) {
    const userId = yield* select(getUserId)
    yield* put(
      queueAutoplay({
        genre: agreement?.genre,
        exclusionList: agreement ? [agreement.agreement_id] : [],
        currentUserId: userId
      })
    )
  }
}

/**
 * Play the queue. The side effects are slightly complicated, but can be summarized in the following
 * cases.
 * 1. If the caller provided a uid, play that uid.
 * 2. If no uid was provided and the queue is empty, find whatever lineup is on the page, queue it and play it.
 * 3. If the queue is indexed onto a different uid than the player, play the queue's uid
 * 4. Resume whatever was playing on the player
 */
export function* watchPlay() {
  yield* takeLatest(play.type, function* (action: ReturnType<typeof play>) {
    // persist queue in mobile layer
    yield* put(persist({}))
    const { uid, agreementId, collectible } = action.payload

    // Play a specific uid
    const playerUid = yield* select(getPlayerUid)
    const playerAgreementId = yield* select(getPlayerAgreementId)
    if (uid || agreementId) {
      const playActionAgreement = yield* select(
        getAgreement,
        agreementId ? { id: agreementId } : { uid }
      )

      if (!playActionAgreement) return

      yield* call(handleQueueAutoplay, {
        skip: false,
        ignoreSkip: true,
        agreement: playActionAgreement
      })

      const user: User | null = playActionAgreement
        ? yield* select(getUser, { id: playActionAgreement.owner_id })
        : null

      // Skip deleted agreements
      if (
        (playActionAgreement && playActionAgreement.is_delete) ||
        // @ts-ignore user incorrectly typed as `null`. ignoring until we implement typed-redux-saga
        user?.is_deactivated
      ) {
        yield* put(next({}))
        return
      }

      // Make sure that we should actually play
      const repeatMode = yield* select(getRepeat)
      const noAgreementPlaying = !playerAgreementId
      const agreementIsDifferent = playerAgreementId !== playActionAgreement.agreement_id
      const agreementIsSameButDifferentUid =
        playerAgreementId === playActionAgreement.agreement_id && uid !== playerUid
      const agreementIsSameAndRepeatSingle =
        playerAgreementId === playActionAgreement.agreement_id &&
        repeatMode === RepeatMode.SINGLE
      if (
        noAgreementPlaying ||
        agreementIsDifferent ||
        agreementIsSameButDifferentUid ||
        agreementIsSameAndRepeatSingle
      ) {
        yield* put(playerActions.stop({}))
        yield* put(
          playerActions.play({
            uid,
            agreementId: playActionAgreement.agreement_id,
            onEnd: next
          })
        )
      } else {
        yield* put(playerActions.play({}))
      }
    } else if (collectible) {
      yield* put(playerActions.stop({}))
      yield* put(
        playerActions.playCollectible({
          collectible,
          onEnd: next
        })
      )
    } else {
      // If nothing is queued, grab the proper lineup, queue it and play it
      const index = yield* select(getIndex)
      if (index === -1) {
        // @ts-ignore todo
        const lineup: LineupState<{ id: number }> = yield* select(
          getLineupSelectorForRoute()
        )
        if (!lineup) return
        if (lineup.entries.length > 0) {
          yield* put(clear({}))
          const toQueue = yield* all(
            lineup.entries.map((e: { kind: Kind; uid: UID }) =>
              call(getToQueue, lineup.prefix, e)
            )
          )
          const flattenedQueue = flatten(toQueue)
          yield* put(add({ entries: flattenedQueue }))

          const playAgreement = yield* select(getAgreement, {
            uid: flattenedQueue[0].uid
          })

          if (!playAgreement) return

          yield* put(
            play({
              uid: flattenedQueue[0].uid,
              agreementId: playAgreement.agreement_id,
              source: lineup.prefix
            })
          )
        }
      } else {
        const queueUid = yield* select(getPlayerUid)
        const playerAgreementId = yield* select(getPlayerAgreementId)
        if (queueUid && playerAgreementId && queueUid !== playerUid) {
          yield* put(playerActions.stop({}))
          yield* put(
            playerActions.play({ uid: queueUid, agreementId: playerAgreementId })
          )
        } else {
          // Play whatever is/was playing
          yield* put(playerActions.play({}))
        }
      }
    }
  })
}

export function* watchPause() {
  yield* takeEvery(pause.type, function* (action: ReturnType<typeof pause>) {
    yield* put(playerActions.pause({}))
  })
}

export function* watchNext() {
  yield* takeEvery(next.type, function* (action: ReturnType<typeof next>) {
    const { skip } = action.payload

    // If the queue has overshot the end, reset the song
    const overshot = yield* select(getOvershot)
    if (overshot) {
      yield* put(playerActions.reset({ shouldAutoplay: false }))
      return
    }

    // For the live nft contentList flow
    const collectible = yield* select(getCollectible)
    if (collectible) {
      const event = make(Name.PLAYBACK_PLAY, {
        id: `${collectible.id}`,
        source: PlaybackSource.PASSIVE
      })
      yield* put(event)

      const source = yield* select(getSource)
      if (source) {
        yield* put(play({ collectible, source }))
      }
      return
    }

    const id = (yield* select(getQueueAgreementId)) as ID
    const agreement = yield* select(getAgreement, { id })
    const user = yield* select(getUser, { id: agreement?.owner_id })
    // Skip deleted or owner deactivated agreement
    if (agreement && (agreement.is_delete || user?.is_deactivated)) {
      yield* put(next({ skip }))
    } else {
      const uid = yield* select(getUid)
      const source = yield* select(getSource)

      yield* call(handleQueueAutoplay, {
        skip: !!skip,
        ignoreSkip: false,
        agreement
      })

      if (agreement) {
        yield* put(play({ uid, agreementId: id, source }))

        const event = make(Name.PLAYBACK_PLAY, {
          id: `${id}`,
          source: PlaybackSource.PASSIVE
        })
        yield* put(event)
      } else {
        yield* put(playerActions.stop({}))
      }
    }
  })
}

export function* watchQueueAutoplay() {
  yield* takeEvery(
    queueAutoplay.type,
    function* (action: ReturnType<typeof queueAutoplay>) {
      const { genre, exclusionList, currentUserId } = action.payload
      const agreements = yield* call(
        getRecommendedAgreements,
        genre,
        exclusionList,
        currentUserId
      )
      const recommendedAgreements = agreements.map(({ agreement_id }) => ({
        id: agreement_id,
        uid: makeUid(Kind.AGREEMENTS, agreement_id),
        source: Source.RECOMMENDED_AGREEMENTS
      }))
      yield* put(add({ entries: recommendedAgreements }))
    }
  )
}

export function* watchPrevious() {
  yield* takeEvery(
    previous.type,
    function* (action: ReturnType<typeof previous>) {
      // If the queue has undershot the beginning, reset the song
      const undershot = yield* select(getUndershot)
      if (undershot) {
        yield* put(playerActions.reset({ shouldAutoplay: false }))
        return
      }

      // For the live nft contentList flow
      const collectible = yield* select(getCollectible)
      if (collectible) {
        const event = make(Name.PLAYBACK_PLAY, {
          id: `${collectible.id}`,
          source: PlaybackSource.PASSIVE
        })
        yield* put(event)

        const source = yield* select(getSource)
        if (source) {
          yield* put(play({ collectible, source }))
        }
        return
      }

      const uid = yield* select(getUid)
      const id = (yield* select(getQueueAgreementId)) as Nullable<ID>
      const agreement = yield* select(getAgreement, { id })
      const source = yield* select(getSource)
      const user = yield* select(getUser, { id: agreement?.owner_id })

      // If we move to a previous song that's been
      // deleted, skip over it.
      if (agreement && (agreement.is_delete || user?.is_deactivated)) {
        yield* put(previous({}))
      } else {
        const index = yield* select(getIndex)
        if (index >= 0) {
          yield* put(play({ uid, agreementId: id, source }))
          const event = make(Name.PLAYBACK_PLAY, {
            id: `${id}`,
            source: PlaybackSource.PASSIVE
          })
          yield* put(event)
        } else {
          yield* put(playerActions.stop({}))
        }
      }
    }
  )
}

export function* watchAdd() {
  yield* takeEvery(add.type, function* (action: ReturnType<typeof add>) {
    const { entries } = action.payload

    const subscribers = entries.map((entry) => ({
      uid: QUEUE_SUBSCRIBER_NAME,
      id: entry.id
    }))
    yield* put(cacheActions.subscribe(Kind.AGREEMENTS, subscribers))
    // persist queue in mobile layer
    yield* put(persist({}))
  })
}

export function* watchRemove() {
  yield* takeEvery(remove.type, function* (action: ReturnType<typeof remove>) {
    const { uid } = action.payload

    const id = yield* select(getId, { kind: Kind.AGREEMENTS, uid })
    yield* put(
      cacheActions.unsubscribe(Kind.AGREEMENTS, [
        { uid: QUEUE_SUBSCRIBER_NAME, id }
      ])
    )
  })
}

const sagas = () => {
  const sagas = [
    watchPlay,
    watchPause,
    watchNext,
    watchQueueAutoplay,
    watchPrevious,
    watchAdd,
    watchRemove
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}

export default sagas

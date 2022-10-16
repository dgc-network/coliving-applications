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
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import {
  getCollectible,
  getId as getQueueDigitalContentId,
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
  getDigitalContentId as getPlayerDigitalContentId,
  getUid as getPlayerUid
} from 'store/player/selectors'
import * as playerActions from 'store/player/slice'

import { getRecommendedDigitalContents } from '../recommendation/sagas'

import mobileSagas from './mobileSagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const QUEUE_SUBSCRIBER_NAME = 'QUEUE'

export function* getToQueue(prefix: string, entry: { kind: Kind; uid: UID }) {
  if (entry.kind === Kind.COLLECTIONS) {
    const collection = yield* select(getCollection, { uid: entry.uid })
    if (!collection) return

    const {
      content_list_contents: { digital_content_ids: digitalContentIds }
    } = collection
    // Replace the digital_content uid source w/ the full source including collection source
    // Replace the digital_content count w/ it's index in the array
    const collectionUid = Uid.fromString(entry.uid)
    const collectionSource = collectionUid.source

    return digitalContentIds.map(({ digital_content, uid }, idx: number) => {
      const digitalContentUid = Uid.fromString(uid ?? '')
      digitalContentUid.source = `${collectionSource}:${digitalContentUid.source}`
      digitalContentUid.count = idx

      return {
        id: digital_content,
        uid: digitalContentUid.toString(),
        source: prefix
      }
    })
  } else if (entry.kind === Kind.DIGITAL_CONTENTS) {
    const digital_content = yield* select(getDigitalContent, { uid: entry.uid })
    if (!digital_content) return {}
    return {
      id: digital_content.digital_content_id,
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
  digital_content
}: {
  skip: boolean
  ignoreSkip: boolean
  digital_content: any
}) {
  const isQueueAutoplayEnabled = yield* select(getQueueAutoplay)
  const index = yield* select(getIndex)
  if (!isQueueAutoplayEnabled || index < 0) {
    return
  }

  // Get recommended digitalContents if not in shuffle mode
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
        genre: digital_content?.genre,
        exclusionList: digital_content ? [digital_content.digital_content_id] : [],
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
    const { uid, digitalContentId, collectible } = action.payload

    // Play a specific uid
    const playerUid = yield* select(getPlayerUid)
    const playerDigitalContentId = yield* select(getPlayerDigitalContentId)
    if (uid || digitalContentId) {
      const playActionDigitalContent = yield* select(
        getDigitalContent,
        digitalContentId ? { id: digitalContentId } : { uid }
      )

      if (!playActionDigitalContent) return

      yield* call(handleQueueAutoplay, {
        skip: false,
        ignoreSkip: true,
        digital_content: playActionDigitalContent
      })

      const user: User | null = playActionDigitalContent
        ? yield* select(getUser, { id: playActionDigitalContent.owner_id })
        : null

      // Skip deleted digitalContents
      if (
        (playActionDigitalContent && playActionDigitalContent.is_delete) ||
        // @ts-ignore user incorrectly typed as `null`. ignoring until we implement typed-redux-saga
        user?.is_deactivated
      ) {
        yield* put(next({}))
        return
      }

      // Make sure that we should actually play
      const repeatMode = yield* select(getRepeat)
      const noDigitalContentPlaying = !playerDigitalContentId
      const digitalContentIsDifferent = playerDigitalContentId !== playActionDigitalContent.digital_content_id
      const digitalContentIsSameButDifferentUid =
        playerDigitalContentId === playActionDigitalContent.digital_content_id && uid !== playerUid
      const digitalContentIsSameAndRepeatSingle =
        playerDigitalContentId === playActionDigitalContent.digital_content_id &&
        repeatMode === RepeatMode.SINGLE
      if (
        noDigitalContentPlaying ||
        digitalContentIsDifferent ||
        digitalContentIsSameButDifferentUid ||
        digitalContentIsSameAndRepeatSingle
      ) {
        yield* put(playerActions.stop({}))
        yield* put(
          playerActions.play({
            uid,
            digitalContentId: playActionDigitalContent.digital_content_id,
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

          const playDigitalContent = yield* select(getDigitalContent, {
            uid: flattenedQueue[0].uid
          })

          if (!playDigitalContent) return

          yield* put(
            play({
              uid: flattenedQueue[0].uid,
              digitalContentId: playDigitalContent.digital_content_id,
              source: lineup.prefix
            })
          )
        }
      } else {
        const queueUid = yield* select(getPlayerUid)
        const playerDigitalContentId = yield* select(getPlayerDigitalContentId)
        if (queueUid && playerDigitalContentId && queueUid !== playerUid) {
          yield* put(playerActions.stop({}))
          yield* put(
            playerActions.play({ uid: queueUid, digitalContentId: playerDigitalContentId })
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

    // For the digitalcoin nft contentList flow
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

    const id = (yield* select(getQueueDigitalContentId)) as ID
    const digital_content = yield* select(getDigitalContent, { id })
    const user = yield* select(getUser, { id: digital_content?.owner_id })
    // Skip deleted or owner deactivated digital_content
    if (digital_content && (digital_content.is_delete || user?.is_deactivated)) {
      yield* put(next({ skip }))
    } else {
      const uid = yield* select(getUid)
      const source = yield* select(getSource)

      yield* call(handleQueueAutoplay, {
        skip: !!skip,
        ignoreSkip: false,
        digital_content
      })

      if (digital_content) {
        yield* put(play({ uid, digitalContentId: id, source }))

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
      const digitalContents = yield* call(
        getRecommendedDigitalContents,
        genre,
        exclusionList,
        currentUserId
      )
      const recommendedDigitalContents = digitalContents.map(({ digital_content_id }) => ({
        id: digital_content_id,
        uid: makeUid(Kind.DIGITAL_CONTENTS, digital_content_id),
        source: Source.RECOMMENDED_DIGITAL_CONTENTS
      }))
      yield* put(add({ entries: recommendedDigitalContents }))
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

      // For the digitalcoin nft contentList flow
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
      const id = (yield* select(getQueueDigitalContentId)) as Nullable<ID>
      const digital_content = yield* select(getDigitalContent, { id })
      const source = yield* select(getSource)
      const user = yield* select(getUser, { id: digital_content?.owner_id })

      // If we move to a previous song that's been
      // deleted, skip over it.
      if (digital_content && (digital_content.is_delete || user?.is_deactivated)) {
        yield* put(previous({}))
      } else {
        const index = yield* select(getIndex)
        if (index >= 0) {
          yield* put(play({ uid, digitalContentId: id, source }))
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
    yield* put(cacheActions.subscribe(Kind.DIGITAL_CONTENTS, subscribers))
    // persist queue in mobile layer
    yield* put(persist({}))
  })
}

export function* watchRemove() {
  yield* takeEvery(remove.type, function* (action: ReturnType<typeof remove>) {
    const { uid } = action.payload

    const id = yield* select(getId, { kind: Kind.DIGITAL_CONTENTS, uid })
    yield* put(
      cacheActions.unsubscribe(Kind.DIGITAL_CONTENTS, [
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

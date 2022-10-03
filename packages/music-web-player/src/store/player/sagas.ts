import { Kind, StringKeys } from '@coliving/common'
import { eventChannel, END } from 'redux-saga'
import {
  select,
  take,
  call,
  put,
  spawn,
  takeLatest,
  delay
} from 'typed-redux-saga/macro'

import * as cacheActions from 'common/store/cache/actions'
import { getAgreement } from 'common/store/cache/agreements/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import * as queueActions from 'common/store/queue/slice'
import { recordListen } from 'common/store/social/agreements/actions'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'
import {
  getAudio,
  getAgreementId,
  getUid,
  getCounter,
  getPlaying
} from 'store/player/selectors'
import {
  setAudioStream as setAudioStreamAction,
  play,
  playSucceeded,
  playCollectible,
  playCollectibleSucceeded,
  pause,
  stop,
  setBuffering,
  reset,
  resetSuceeded,
  seek,
  error as errorAction
} from 'store/player/slice'
import { getContentNodeIPFSGateways } from 'utils/gatewayUtil'
import { encodeHashId } from 'utils/route/hashIds'
import { actionChannelDispatcher, waitForValue } from 'utils/sagaHelpers'

import errorSagas from './errorSagas'
import { TAudioStream, AudioState } from './types'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const PLAYER_SUBSCRIBER_NAME = 'PLAYER'
const RECORD_LISTEN_SECONDS = 1
const RECORD_LISTEN_INTERVAL = 1000

function* setAudioStream() {
  if (!NATIVE_MOBILE) {
    const chan = eventChannel<TAudioStream>((emitter) => {
      import('live/AudioStream').then((AudioStream) => {
        emitter(AudioStream.default)
        emitter(END)
      })
      return () => {}
    })
    const AudioStream = yield* take(chan)
    yield* put(setAudioStreamAction({ live: new AudioStream() }))
  }
}

// Set of agreement ids that should be forceably streamed as mp3 rather than hls because
// their hls maybe corrupt.
let FORCE_MP3_STREAM_AGREEMENT_IDS: Set<string> | null = null

export function* watchPlay() {
  yield* takeLatest(play.type, function* (action: ReturnType<typeof play>) {
    const { uid, agreementId, onEnd } = action.payload

    if (!FORCE_MP3_STREAM_AGREEMENT_IDS) {
      FORCE_MP3_STREAM_AGREEMENT_IDS = new Set(
        (
          remoteConfigInstance.getRemoteVar(
            StringKeys.FORCE_MP3_STREAM_AGREEMENT_IDS
          ) || ''
        ).split(',')
      )
    }

    const live: NonNullable<AudioState> = yield* call(waitForValue, getAudio)

    if (agreementId) {
      // Load and set end action.
      const agreement = yield* select(getAgreement, { id: agreementId })
      if (!agreement) return

      const owner = yield* select(getUser, {
        id: agreement.owner_id
      })

      const gateways = owner
        ? getContentNodeIPFSGateways(owner.content_node_endpoint)
        : []
      const encodedAgreementId = encodeHashId(agreementId)
      const forceStreamMp3 =
        encodedAgreementId && FORCE_MP3_STREAM_AGREEMENT_IDS.has(encodedAgreementId)
      const forceStreamMp3Url = forceStreamMp3
        ? apiClient.makeUrl(`/agreements/${encodedAgreementId}/stream`)
        : null

      const endChannel = eventChannel((emitter) => {
        live.load(
          agreement.agreement_segments,
          () => {
            if (onEnd) {
              emitter(onEnd({}))
            }
          },
          // @ts-ignore a few issues with typing here...
          [agreement._first_segment],
          gateways,
          {
            id: encodedAgreementId,
            title: agreement.title,
            landlord: owner?.name
          },
          forceStreamMp3Url
        )
        return () => {}
      })
      yield* spawn(actionChannelDispatcher, endChannel)
      yield* put(
        cacheActions.subscribe(Kind.AGREEMENTS, [
          { uid: PLAYER_SUBSCRIBER_NAME, id: agreementId }
        ])
      )
    }
    // Play.
    live.play()
    yield* put(playSucceeded({ uid, agreementId }))
  })
}

export function* watchCollectiblePlay() {
  yield* takeLatest(
    playCollectible.type,
    function* (action: ReturnType<typeof playCollectible>) {
      const { collectible, onEnd } = action.payload
      const live: NonNullable<AudioState> = yield* call(waitForValue, getAudio)
      const endChannel = eventChannel((emitter) => {
        live.load(
          [],
          () => {
            if (onEnd) {
              emitter(onEnd({}))
            }
          },
          [],
          [], // Gateways
          {
            id: collectible.id,
            title: collectible.name ?? 'Collectible',
            // TODO: Add account user name here
            landlord: 'YOUR NAME HERE',
            artwork:
              collectible.imageUrl ??
              collectible.frameUrl ??
              collectible.gifUrl ??
              ''
          },
          collectible.animationUrl
        )
        return () => {}
      })
      yield* spawn(actionChannelDispatcher, endChannel)

      live.play()
      yield* put(playCollectibleSucceeded({ collectible }))
    }
  )
}

export function* watchPause() {
  yield* takeLatest(pause.type, function* (action: ReturnType<typeof pause>) {
    const { onlySetState } = action.payload

    const live: NonNullable<AudioState> = yield* call(waitForValue, getAudio)
    if (onlySetState) return
    live.pause()
  })
}

export function* watchReset() {
  yield* takeLatest(reset.type, function* (action: ReturnType<typeof reset>) {
    const { shouldAutoplay } = action.payload

    const live: NonNullable<AudioState> = yield* call(waitForValue, getAudio)

    live.seek(0)
    if (!shouldAutoplay) {
      live.pause()
    } else {
      const playerUid = yield* select(getUid)
      const playerAgreementId = yield* select(getAgreementId)
      if (playerUid && playerAgreementId) {
        yield* put(
          play({
            uid: playerUid,
            agreementId: playerAgreementId,
            onEnd: queueActions.next
          })
        )
      }
    }
    yield* put(resetSuceeded({ shouldAutoplay }))
  })
}

export function* watchStop() {
  yield* takeLatest(stop.type, function* (action: ReturnType<typeof stop>) {
    const id = yield* select(getAgreementId)
    yield* put(
      cacheActions.unsubscribe(Kind.AGREEMENTS, [
        { uid: PLAYER_SUBSCRIBER_NAME, id }
      ])
    )
    const live: NonNullable<AudioState> = yield* call(waitForValue, getAudio)
    live.stop()
  })
}

export function* watchSeek() {
  yield* takeLatest(seek.type, function* (action: ReturnType<typeof seek>) {
    const { seconds } = action.payload

    const live: NonNullable<AudioState> = yield* call(waitForValue, getAudio)
    live.seek(seconds)
  })
}

// NOTE: Event listeners are attached to the live object b/c the live can be manipulated
// directly by the browser & not via the ui or hot keys. If the event listener is triggered
// and the playing field does not match live, then dispatch an action to update the store.
const AudioEvents = Object.freeze({
  PLAY: 'play',
  PAUSE: 'pause'
})

export function* setAudioListeners() {
  const liveStream = yield* call(waitForValue, getAudio)
  const chan = yield* call(watchAudio, liveStream.live)
  while (true) {
    const liveEvent = yield* take(chan)
    const playing = yield* select(getPlaying)
    if (liveEvent === AudioEvents.PLAY && !playing) {
      yield* put(play({}))
    } else if (liveEvent === AudioEvents.PAUSE && playing) {
      yield* put(pause({}))
    }
  }
}

export function* handleAudioBuffering() {
  const liveStream = yield* call(waitForValue, getAudio)
  const chan = eventChannel((emitter) => {
    liveStream.onBufferingChange = (isBuffering: boolean) => {
      emitter(setBuffering({ buffering: isBuffering }))
    }
    return () => {}
  })
  yield* spawn(actionChannelDispatcher, chan)
}

export function* handleAudioErrors() {
  // Watch for live errors and emit an error saga dispatching action
  const liveStream = yield* call(waitForValue, getAudio)

  const chan = eventChannel<{ error: string; data: string }>((emitter) => {
    liveStream.onError = (error: string, data: string) => {
      emitter({ error, data })
    }
    return () => {}
  })

  while (true) {
    const { error, data } = yield* take(chan)
    const agreementId = yield* select(getAgreementId)
    if (agreementId) {
      yield* put(errorAction({ error, agreementId, info: data }))
    }
  }
}

function watchAudio(live: HTMLAudioElement) {
  return eventChannel((emitter) => {
    const emitPlay = () => emitter(AudioEvents.PLAY)
    const emitPause = () => {
      if (!live.ended) {
        emitter(AudioEvents.PAUSE)
      }
    }

    if (live) {
      live.addEventListener(AudioEvents.PLAY, emitPlay)
      live.addEventListener(AudioEvents.PAUSE, emitPause)
    }

    return () => {
      if (live) {
        live.removeEventListener(AudioEvents.PLAY, emitPlay)
        live.removeEventListener(AudioEvents.PAUSE, emitPause)
      }
    }
  })
}

/**
 * Poll for whether a agreement has been listened to.
 */
function* recordListenWorker() {
  // Store the last seen play counter to make sure we only record
  // a listen for each "unique" agreement play. Using an id here wouldn't
  // be enough because the user might have "repeat single" mode turned on.
  let lastSeenPlayCounter = null
  while (true) {
    const agreementId = yield* select(getAgreementId)
    const playCounter = yield* select(getCounter)
    const live = yield* call(waitForValue, getAudio)
    const position = live.getPosition()

    const newPlay = lastSeenPlayCounter !== playCounter

    if (newPlay && position > RECORD_LISTEN_SECONDS) {
      if (agreementId) yield* put(recordListen(agreementId))
      lastSeenPlayCounter = playCounter
    }
    yield* delay(RECORD_LISTEN_INTERVAL)
  }
}

const sagas = () => {
  return [
    setAudioStream,
    watchPlay,
    watchCollectiblePlay,
    watchPause,
    watchStop,
    watchReset,
    watchSeek,
    setAudioListeners,
    handleAudioErrors,
    handleAudioBuffering,
    recordListenWorker,
    errorSagas
  ]
}

export default sagas
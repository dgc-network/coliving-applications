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
      import('digitalcoin/AudioStream').then((AudioStream) => {
        emitter(AudioStream.default)
        emitter(END)
      })
      return () => {}
    })
    const AudioStream = yield* take(chan)
    yield* put(setAudioStreamAction({ digitalcoin: new AudioStream() }))
  }
}

// Set of digital_content ids that should be forceably streamed as mp3 rather than hls because
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

    const digitalcoin: NonNullable<AudioState> = yield* call(waitForValue, getAudio)

    if (agreementId) {
      // Load and set end action.
      const digital_content = yield* select(getAgreement, { id: agreementId })
      if (!digital_content) return

      const owner = yield* select(getUser, {
        id: digital_content.owner_id
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
        digitalcoin.load(
          digital_content.digital_content_segments,
          () => {
            if (onEnd) {
              emitter(onEnd({}))
            }
          },
          // @ts-ignore a few issues with typing here...
          [digital_content._first_segment],
          gateways,
          {
            id: encodedAgreementId,
            title: digital_content.title,
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
    digitalcoin.play()
    yield* put(playSucceeded({ uid, agreementId }))
  })
}

export function* watchCollectiblePlay() {
  yield* takeLatest(
    playCollectible.type,
    function* (action: ReturnType<typeof playCollectible>) {
      const { collectible, onEnd } = action.payload
      const digitalcoin: NonNullable<AudioState> = yield* call(waitForValue, getAudio)
      const endChannel = eventChannel((emitter) => {
        digitalcoin.load(
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

      digitalcoin.play()
      yield* put(playCollectibleSucceeded({ collectible }))
    }
  )
}

export function* watchPause() {
  yield* takeLatest(pause.type, function* (action: ReturnType<typeof pause>) {
    const { onlySetState } = action.payload

    const digitalcoin: NonNullable<AudioState> = yield* call(waitForValue, getAudio)
    if (onlySetState) return
    digitalcoin.pause()
  })
}

export function* watchReset() {
  yield* takeLatest(reset.type, function* (action: ReturnType<typeof reset>) {
    const { shouldAutoplay } = action.payload

    const digitalcoin: NonNullable<AudioState> = yield* call(waitForValue, getAudio)

    digitalcoin.seek(0)
    if (!shouldAutoplay) {
      digitalcoin.pause()
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
    const digitalcoin: NonNullable<AudioState> = yield* call(waitForValue, getAudio)
    digitalcoin.stop()
  })
}

export function* watchSeek() {
  yield* takeLatest(seek.type, function* (action: ReturnType<typeof seek>) {
    const { seconds } = action.payload

    const digitalcoin: NonNullable<AudioState> = yield* call(waitForValue, getAudio)
    digitalcoin.seek(seconds)
  })
}

// NOTE: Event listeners are attached to the digitalcoin object b/c the digitalcoin can be manipulated
// directly by the browser & not via the ui or hot keys. If the event listener is triggered
// and the playing field does not match digitalcoin, then dispatch an action to update the store.
const AudioEvents = Object.freeze({
  PLAY: 'play',
  PAUSE: 'pause'
})

export function* setAudioListeners() {
  const liveStream = yield* call(waitForValue, getAudio)
  const chan = yield* call(watchAudio, liveStream.digitalcoin)
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
  // Watch for digitalcoin errors and emit an error saga dispatching action
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

function watchAudio(digitalcoin: HTMLAudioElement) {
  return eventChannel((emitter) => {
    const emitPlay = () => emitter(AudioEvents.PLAY)
    const emitPause = () => {
      if (!digitalcoin.ended) {
        emitter(AudioEvents.PAUSE)
      }
    }

    if (digitalcoin) {
      digitalcoin.addEventListener(AudioEvents.PLAY, emitPlay)
      digitalcoin.addEventListener(AudioEvents.PAUSE, emitPause)
    }

    return () => {
      if (digitalcoin) {
        digitalcoin.removeEventListener(AudioEvents.PLAY, emitPlay)
        digitalcoin.removeEventListener(AudioEvents.PAUSE, emitPause)
      }
    }
  })
}

/**
 * Poll for whether a digital_content has been listened to.
 */
function* recordListenWorker() {
  // Store the last seen play counter to make sure we only record
  // a listen for each "unique" digital_content play. Using an id here wouldn't
  // be enough because the user might have "repeat single" mode turned on.
  let lastSeenPlayCounter = null
  while (true) {
    const agreementId = yield* select(getAgreementId)
    const playCounter = yield* select(getCounter)
    const digitalcoin = yield* call(waitForValue, getAudio)
    const position = digitalcoin.getPosition()

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

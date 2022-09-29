import { AgreementSegment } from '@coliving/common'
import Hls from 'hls.js'

import { fetchCID } from 'services/colivingBackend'
import { generateM3U8, generateM3U8Variants } from 'utils/hlsUtil'
import { decodeHashId } from 'utils/route/hashIds'

declare global {
  interface Window {
    live: HTMLAudioElement
    webkitAudioContext: typeof AudioContext
  }
}

const FADE_IN_EVENT = new Event('fade-in')
const FADE_OUT_EVENT = new Event('fade-out')
const VOLUME_CHANGE_BASE = 10
const BUFFERING_DELAY_MILLISECONDS = 500

// In the case of live errors, try to resume playback
// by nudging the playhead this many seconds ahead.
const ON_ERROR_NUDGE_SECONDS = 0.2

// This calculation comes from chrome's live SourceBuffer max of
// 12MB. Each segment is ~260KB, so we can only fit ~ 47 segments in memory.
// Read more: https://github.com/w3c/media-source/issues/172
const MAX_SEGMENTS = 47
const AVERAGE_SEGMENT_DURATION = 6 /* seconds */
const MAX_BUFFER_LENGTH = MAX_SEGMENTS * AVERAGE_SEGMENT_DURATION

const PUBLIC_IPFS_GATEWAY = `http://cloudflare-ipfs.com/ipfs/`

const IS_CHROME_LIKE =
  /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)

export enum AudioError {
  LIVE = 'LIVE',
  HLS = 'HLS'
}

// Custom fragment loader for HLS that utilizes the coliving CID resolver.
// eslint-disable-next-line
class fLoader extends Hls.DefaultConfig.loader {
  getFallbacks = () => []
  getAgreementId = () => ''

  constructor(config: Hls.LoaderConfig) {
    super(config)
    const load = this.load.bind(this)
    this.load = function (context, config, callbacks) {
      // @ts-ignore: relurl is indeed on Fragment
      const segmentUrl = context.frag.relurl
      if (!segmentUrl.startsWith('blob')) {
        fetchCID(
          segmentUrl,
          this.getFallbacks(),
          /* cache */ false,
          /* asUrl */ true,
          decodeHashId(this.getAgreementId())
        ).then((resolved) => {
          const updatedContext = { ...context, url: resolved }
          load(updatedContext, config, callbacks)
        })
      } else {
        load(context, config, callbacks)
      }
    }
  }
}

const HlsConfig = {
  maxBufferLength: MAX_BUFFER_LENGTH,
  fLoader
}

class AudioStream {
  live: HTMLAudioElement
  liveCtx: AudioContext | null
  source: MediaElementAudioSourceNode | null
  gainNode: GainNode | null
  duration: number
  bufferingTimeout: ReturnType<typeof setTimeout> | null
  buffering: boolean
  onBufferingChange: (isBuffering: boolean) => void
  concatBufferInterval: ReturnType<typeof setInterval> | null
  nextBufferIndex: number
  loadCounter: number
  recordListenedTime: number
  endedListener: ((this: HTMLAudioElement, e: Event) => void) | null
  waitingListener: ((this: HTMLAudioElement, e: Event) => void) | null
  canPlayListener: ((this: HTMLAudioElement, e: Event) => void) | null
  url: string | null
  hls: Hls | null
  onError: (e: AudioError, data: string | Event | Hls.errorData) => void
  errorRateLimiter: Set<string>

  constructor() {
    this.live = new Audio()
    // Connect this.live to the window so that 3P's can interact with it.
    window.live = this.live

    this.liveCtx = null
    this.source = null
    this.gainNode = null

    // Because we use a media stream, we need the duration from an
    // outside source. Audio.duration returns Infinity until all the streams are
    // concatenated together.
    this.duration = 0

    this.bufferingTimeout = null
    this.buffering = false
    // Callback fired when buffering status changes
    this.onBufferingChange = (isBuffering) => {}

    this.concatBufferInterval = null
    this.nextBufferIndex = 0
    // Keeps a (monotonic) unique id for each load, so we know when to cancel the previous load.
    this.loadCounter = 0

    this.recordListenedTime = 5 /* seconds */
    // Event listeners
    this.endedListener = null
    this.waitingListener = null
    this.canPlayListener = null

    // M3U8 file
    this.url = null
    // HLS live object
    this.hls = null

    // Listen for errors
    this.onError = (e, data) => {}
    // Per load / instantiation of HLS (once per agreement),
    // we limit rate limit logging to once per type
    // this is to prevent log spam, something HLS.js is *very* good at
    this.errorRateLimiter = new Set()
  }

  _initContext = (shouldSkipAudioContext = false) => {
    this.live.addEventListener('canplay', () => {
      if (!this.liveCtx && !shouldSkipAudioContext) {
        // Set up WebAudio API handles
        const AudioContext = window.AudioContext || window.webkitAudioContext
        try {
          this.liveCtx = new AudioContext()
          this.gainNode = this.liveCtx.createGain()
          this.gainNode.connect(this.liveCtx.destination)
          this.source = this.liveCtx.createMediaElementSource(this.live)
          this.source.connect(this.gainNode)
        } catch (e) {
          console.log('error setting up live context')
          console.log(e)
        }
      }

      clearTimeout(this.bufferingTimeout!)
      this.buffering = false
      this.onBufferingChange(this.buffering)
    })

    this.live.onerror = (e) => {
      this.onError(AudioError.LIVE, e)

      // Handle live errors by trying to nudge the playhead and re attach media.
      // Simply nudging the media doesn't work.
      //
      // This kind of error only seems to manifest on chrome because, as they say
      // "We tend to be more strict about decoding errors than other browsers.
      // Ignoring them will lead to a/v sync issues."
      // https://bugs.chromium.org/p/chromium/issues/detail?id=1071899
      if (IS_CHROME_LIKE) {
        // Likely there isn't a case where an error is thrown while we're in a paused
        // state, but just in case, we record what state we were in.
        const wasPlaying = !this.live.paused
        if (this.hls && this.url) {
          const newTime = this.live.currentTime + ON_ERROR_NUDGE_SECONDS
          this.hls.loadSource(this.url)
          this.hls.attachMedia(this.live)
          // Set the new time to the current plus the nudge. If this nudge
          // wasn't enough, this error will be thrown again and we will just continue
          // to nudge the playhead forward until the errors stop or the song ends.
          this.live.currentTime = newTime
          if (wasPlaying) {
            this.live.play()
          }
        }
      }
    }
  }

  load = (
    segments: AgreementSegment[],
    onEnd: () => void,
    prefetchedSegments = [],
    gateways = [],
    info = { id: '', title: '', landlord: '' },
    forceStreamSrc: string | null = null
  ) => {
    if (forceStreamSrc) {
      // TODO: Test to make sure that this doesn't break anything
      this.stop()
      const prevVolume = this.live.volume
      this.live = new Audio()
      this.gainNode = null
      this.source = null
      this.liveCtx = null
      this._initContext(/* shouldSkipAudioContext */ true)
      this.live.setAttribute('preload', 'none')
      this.live.setAttribute('src', forceStreamSrc)
      this.live.volume = prevVolume
      this.live.onloadedmetadata = () => (this.duration = this.live.duration)
    } else {
      this._initContext()
      if (Hls.isSupported()) {
        // Clean up any existing hls.
        if (this.hls) {
          this.hls.destroy()
        }
        // Hls.js via MediaExtensions
        const m3u8 = generateM3U8(segments, prefetchedSegments)
        // eslint-disable-next-line
        class creatorFLoader extends fLoader {
          getFallbacks = () => gateways
          getAgreementId = () => info.id
        }
        const hlsConfig = { ...HlsConfig, fLoader: creatorFLoader }
        this.hls = new Hls(hlsConfig)

        // On load of HLS, reset error rate limiter
        this.errorRateLimiter = new Set()

        this.hls.on(Hls.Events.ERROR, (event, data) => {
          // Only emit on fatal because HLS is very noisy (e.g. pauses trigger errors)
          if (data.fatal) {
            // Buffer stall errors occur but are rarely fatal even if they claim to be.
            // This occurs when you play a agreement, pause it, and then wait a few seconds.
            // It appears as if we see this despite being able to play through the agreement.
            if (data.details === 'bufferStalledError') {
              return
            }

            // Only emit an error if we haven't errored on an error with the same "details"
            if (!this.errorRateLimiter.has(data.details)) {
              this.onError(AudioError.HLS, data)
            }

            // Only one "details" of error are allowed per HLS load
            this.errorRateLimiter.add(data.details)

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Try to recover network error
                this.hls!.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                // Try to recover fatal media errors
                this.hls!.recoverMediaError()
                break
              default:
                break
            }
          }
        })
        const m3u8Blob = new Blob([m3u8], {
          type: 'application/vnd.apple.mpegURL'
        })
        const url = URL.createObjectURL(m3u8Blob)
        this.url = url
        this.hls.loadSource(this.url)
        this.hls.attachMedia(this.live)
      } else {
        // Native HLS (ios Safari)
        const m3u8Gateways =
          gateways.length > 0 ? [gateways[0]] : [PUBLIC_IPFS_GATEWAY]
        const m3u8 = generateM3U8Variants(
          segments,
          prefetchedSegments,
          m3u8Gateways
        )

        this.live.src = m3u8
        this.live.title =
          info.title && info.landlord
            ? `${info.title} by ${info.landlord}`
            : 'Coliving'
      }
    }

    this.duration = segments.reduce(
      (duration, segment) => duration + parseFloat(segment.duration),
      0
    )

    // Set live listeners.
    if (this.endedListener) {
      this.live.removeEventListener('ended', this.endedListener)
    }
    this.endedListener = () => {
      onEnd()
    }
    this.live.addEventListener('ended', this.endedListener)

    if (this.waitingListener) {
      this.live.removeEventListener('waiting', this.waitingListener)
    }
    this.waitingListener = () => {
      this.bufferingTimeout = setTimeout(() => {
        this.buffering = true
        this.onBufferingChange(this.buffering)
      }, BUFFERING_DELAY_MILLISECONDS)
    }
    this.live.addEventListener('waiting', this.waitingListener)
  }

  play = () => {
    // In case we haven't faded out the last pause, pause again and
    // clear our listener for the end of the pause fade.
    this.live.removeEventListener('fade-out', this._pauseInternal)
    if (this.live.currentTime !== 0) {
      this._fadeIn()
    } else if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(1, 0)
    }

    // This is a very nasty "hack" to fix a bug in chrome-like webkit browsers.
    // Calling a traditional `live.pause()` / `play()` and switching tabs leaves the
    // AudioContext in a weird state where after the browser tab enters the background,
    // and then comes back into the foreground, the AudioContext gives misinformation.
    // Weirdly, the live's playback rate is no longer maintained on resuming playback after a pause.
    // Though the live itself claims live.playbackRate = 1.0, the actual resumed speed
    // is nearish 0.9.
    //
    // In chrome like browsers (opera, edge), we disconnect and reconnect the source node
    // instead of playing and pausing the live element itself, which seems to fix this issue
    // without any side-effects (though this behavior could change?).
    //
    // Another solution to this problem is calling `this.liveCtx.suspend()` and `resume()`,
    // however, that doesn't play nicely with Analyser nodes (e.g. visualizer) because it
    // freezes in place rather than naturally "disconnecting" it from live.
    //
    // Web resources on this problem are limited (or none?), but this is a start:
    // https://stackoverflow.com/questions/11506180/web-live-api-resume-from-pause
    if (this.liveCtx && IS_CHROME_LIKE) {
      this.source!.connect(this.gainNode!)
    }

    const promise = this.live.play()
    if (promise) {
      promise.catch((_) => {
        // Let pauses interrupt plays (as the user could be rapidly skipping through agreements).
      })
    }
  }

  pause = () => {
    this.live.addEventListener('fade-out', this._pauseInternal)
    this._fadeOut()
  }

  _pauseInternal = () => {
    if (this.liveCtx && IS_CHROME_LIKE) {
      // See comment above in the `play()` method.
      this.source!.disconnect()
    } else {
      this.live.pause()
    }
  }

  stop = () => {
    this.live.pause()
    // Normally canplaythrough should be required to set currentTime, but in the case
    // of setting curtingTime to zero, pushing to the end of the event loop works.
    // This fixes issues in Firefox, in particular `the operation was aborted`
    setTimeout(() => {
      this.live.currentTime = 0
    }, 0)
  }

  isPlaying = () => {
    return !this.live.paused
  }

  isPaused = () => {
    return this.live.paused
  }

  isBuffering = () => {
    return this.buffering
  }

  getDuration = () => {
    return this.duration
  }

  getPosition = () => {
    return this.live.currentTime
  }

  seek = (seconds: number) => {
    this.live.currentTime = seconds
  }

  setVolume = (value: number) => {
    this.live.volume =
      (Math.pow(VOLUME_CHANGE_BASE, value) - 1) / (VOLUME_CHANGE_BASE - 1)
  }

  _fadeIn = () => {
    if (this.gainNode) {
      const fadeTime = 320
      setTimeout(() => {
        this.live.dispatchEvent(FADE_IN_EVENT)
      }, fadeTime)
      this.gainNode.gain.exponentialRampToValueAtTime(
        1,
        this.liveCtx!.currentTime + fadeTime / 1000.0
      )
    } else {
      this.live.dispatchEvent(FADE_IN_EVENT)
    }
  }

  _fadeOut = () => {
    if (this.gainNode) {
      const fadeTime = 200
      setTimeout(() => {
        this.live.dispatchEvent(FADE_OUT_EVENT)
      }, fadeTime)
      this.gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.liveCtx!.currentTime + fadeTime / 1000.0
      )
    } else {
      this.live.dispatchEvent(FADE_OUT_EVENT)
    }
  }
}

export default AudioStream

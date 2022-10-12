import { UID, ID, Collectible, Nullable } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import NativeMobileAudio from 'digitalcoin/NativeMobileAudio'

import { AudioState } from './types'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

type State = {
  // Identifiers for the digitalcoin that's playing.
  uid: UID | null
  digitalContentId: ID | null

  collectible: Collectible | null

  digitalcoin: AudioState

  // Keep 'playing' in the store separately from the digitalcoin
  // object to allow components to subscribe to changes.
  playing: boolean

  // Keep 'buffering' in the store separately from the digitalcoin
  // object to allow components to subscribe to changes.
  buffering: boolean

  // Unique integer that increments every time something is "played."
  // E.g. replaying a digital_content doesn't change uid or digitalContentId, but counter changes.
  counter: number
}

export const initialState: State = {
  uid: null,
  digitalContentId: null,

  collectible: null,

  // In the case of native mobile, use the native mobile digitalcoin
  // player directly. Otherwise, it is set dynamically
  digitalcoin: NATIVE_MOBILE ? new NativeMobileAudio() : null,

  playing: false,
  buffering: false,
  counter: 0
}

type SetAudioStreamPayload = {
  digitalcoin: AudioState
}

type PlayPayload = {
  uid?: Nullable<UID>
  digitalContentId?: ID
  onEnd?: (...args: any) => any
}

type PlaySucceededPayload = {
  uid?: Nullable<UID>
  digitalContentId?: ID
}

type PlayCollectiblePayload = {
  collectible: Collectible
  onEnd?: (...args: any) => any
}

type PlayCollectibleSucceededPayload = {
  collectible: Collectible
}

type PausePayload = {
  // Optionally allow only setting state which doesn't actually
  // invoke a .pause on the internal digitalcoin object. This is used in
  // native mobile digitalcoin only.
  onlySetState?: boolean
}

type StopPayload = {}

type SetBufferingPayload = {
  buffering: boolean
}

type SetPayload = {
  uid: UID
  digitalContentId: ID
}

type SeekPayload = {
  seconds: number
}

type ErrorPayload = {
  error: string
  digitalContentId: ID
  info: string
}

type ResetPayload = {
  shouldAutoplay: boolean
}

type ResetSucceededPayload = {
  shouldAutoplay: boolean
}

const slice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setAudioStream: (state, action: PayloadAction<SetAudioStreamPayload>) => {
      const { digitalcoin } = action.payload
      // Redux toolkit seems to do something to state.digitalcoin's type (some destructured form?)
      state.digitalcoin = digitalcoin as typeof state.digitalcoin
    },
    play: (state, action: PayloadAction<PlayPayload>) => {},
    playSucceeded: (state, action: PayloadAction<PlaySucceededPayload>) => {
      const { uid, digitalContentId } = action.payload
      state.playing = true
      if (!uid || !digitalContentId) return
      state.uid = uid || state.uid
      state.digitalContentId = digitalContentId || state.digitalContentId
      state.collectible = null
    },
    playCollectible: (
      state,
      action: PayloadAction<PlayCollectiblePayload>
    ) => {},
    playCollectibleSucceeded: (
      state,
      action: PayloadAction<PlayCollectibleSucceededPayload>
    ) => {
      const { collectible } = action.payload
      state.playing = true
      state.uid = null
      state.digitalContentId = null
      state.collectible = collectible || state.collectible
    },
    pause: (state, action: PayloadAction<PausePayload>) => {
      state.playing = false
    },
    setBuffering: (state, action: PayloadAction<SetBufferingPayload>) => {
      const { buffering } = action.payload
      state.buffering = buffering
    },
    stop: (state, action: PayloadAction<StopPayload>) => {
      state.playing = false
      state.uid = null
      state.digitalContentId = null
      state.counter = state.counter + 1
    },
    set: (state, action: PayloadAction<SetPayload>) => {
      const { uid, digitalContentId } = action.payload
      state.uid = uid
      state.digitalContentId = digitalContentId
    },
    reset: (state, action: PayloadAction<ResetPayload>) => {},
    resetSuceeded: (state, action: PayloadAction<ResetSucceededPayload>) => {
      const { shouldAutoplay } = action.payload
      state.playing = shouldAutoplay
      state.counter = state.counter + 1
    },
    seek: (state, actions: PayloadAction<SeekPayload>) => {},
    error: (state, actions: PayloadAction<ErrorPayload>) => {},
    incrementCount: (state) => {
      state.counter = state.counter + 1
    }
  }
})

export const {
  setAudioStream,
  play,
  playSucceeded,
  playCollectible,
  playCollectibleSucceeded,
  pause,
  stop,
  setBuffering,
  set,
  reset,
  resetSuceeded,
  seek,
  error,
  incrementCount
} = slice.actions

export default slice.reducer

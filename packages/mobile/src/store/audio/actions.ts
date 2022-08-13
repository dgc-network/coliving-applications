import type { Message } from 'app/message'

export const PLAY = 'LIVE/PLAY'
export const PAUSE = 'LIVE/PAUSE'
export const NEXT = 'LIVE/NEXT'
export const PREVIOUS = 'LIVE/PREVIOUS'
export const SEEK = 'LIVE/SEEK'
export const SET_INFO = 'LIVE/SET_INFO'
export const PERSIST_QUEUE = 'LIVE/PERSIST_QUEUE'
export const REPEAT = 'LIVE/REPEAT'
export const SHUFFLE = 'LIVE/SHUFFLE'
export const RESET = 'LIVE/RESET'

// TODO(aud-1606): Clean up actions after message passing is removed.

type PlayAction = {
  type: typeof PLAY
}

type PauseAction = {
  type: typeof PAUSE
}

type NextAction = {
  type: typeof NEXT
}

type PreviousAction = {
  type: typeof PREVIOUS
}

type SeekAction = {
  type: typeof SEEK
  message: Message
}

type SetInfoAction = {
  type: typeof SET_INFO
  message: Message
}

type PersistQueueAction = {
  type: typeof PERSIST_QUEUE
  message: Message
}

type RepeatAction = {
  type: typeof REPEAT
  message: Message
}

type ShuffleAction = {
  type: typeof SHUFFLE
  message: Message
}

type ResetAction = {
  type: typeof RESET
}

export type AudioActions =
  | PlayAction
  | PauseAction
  | NextAction
  | PreviousAction
  | SeekAction
  | SetInfoAction
  | PersistQueueAction
  | RepeatAction
  | ShuffleAction
  | ResetAction

export const play = (): PlayAction => ({
  type: PLAY
})

export const pause = (): PauseAction => ({
  type: PAUSE
})

export const next = (): NextAction => ({
  type: NEXT
})

export const previous = (): PreviousAction => ({
  type: PREVIOUS
})

export const seek = (message: Message): SeekAction => ({
  type: SEEK,
  message
})

export const setInfo = (message: Message): SetInfoAction => ({
  type: SET_INFO,
  message
})

export const persistQueue = (message: Message): PersistQueueAction => ({
  type: PERSIST_QUEUE,
  message
})

export const repeat = (message: Message): RepeatAction => ({
  type: REPEAT,
  message
})

export const shuffle = (message: Message): ShuffleAction => ({
  type: SHUFFLE,
  message
})

export const reset = (): ResetAction => ({
  type: RESET
})

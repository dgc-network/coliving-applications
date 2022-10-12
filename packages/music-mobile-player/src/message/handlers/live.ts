import * as liveActions from 'app/store/digitalcoin/actions'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.PLAY_AGREEMENT]: ({ dispatch }) => {
    dispatch(liveActions.play())
  },
  [MessageType.PAUSE_AGREEMENT]: ({ dispatch }) => {
    dispatch(liveActions.pause())
  },
  [MessageType.SEEK_AGREEMENT]: ({ message, dispatch }) => {
    dispatch(liveActions.seek(message))
  },
  [MessageType.GET_POSITION]: ({ message, postMessage }) => {
    postMessage({
      type: message.type,
      id: message.id,
      // @ts-ignore
      ...global.progress
    })
  },
  [MessageType.PERSIST_QUEUE]: ({ message, dispatch }) => {
    dispatch(liveActions.persistQueue(message))
  },
  [MessageType.SET_REPEAT_MODE]: ({ message, dispatch }) => {
    dispatch(liveActions.repeat(message))
  },
  [MessageType.SHUFFLE]: ({ message, dispatch }) => {
    dispatch(liveActions.shuffle(message))
  }
}

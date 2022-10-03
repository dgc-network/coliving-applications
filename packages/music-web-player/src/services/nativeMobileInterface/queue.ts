import { ID, UID } from '@coliving/common'

import { RepeatMode } from 'common/store/queue/types'

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

// Array of m3u8 "data" files
type AgreementInfo = {
  uri: string
  title: string
  landlord: string
  artwork: string
  id: ID
  currentUserId: ID
  currentListenCount: number
  uid: UID
}
export type Agreements = AgreementInfo[]

export class PersistQueueMessage extends NativeMobileMessage {
  constructor(
    agreements: Agreements,
    index: number,
    shuffle: boolean,
    shuffleIndex: number,
    shuffleOrder: number[],
    queueAutoplay: boolean
  ) {
    super(MessageType.PERSIST_QUEUE, {
      agreements,
      index,
      shuffle,
      shuffleIndex,
      shuffleOrder,
      queueAutoplay
    })
  }
}

export class RepeatModeMessage extends NativeMobileMessage {
  constructor(repeatMode: RepeatMode) {
    super(MessageType.SET_REPEAT_MODE, { repeatMode })
  }
}

export class ShuffleMessage extends NativeMobileMessage {
  constructor(shuffle: boolean, shuffleIndex: number, shuffleOrder: number[]) {
    super(MessageType.SHUFFLE, { shuffle, shuffleIndex, shuffleOrder })
  }
}

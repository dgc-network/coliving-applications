import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class PlayDigitalContentMessage extends NativeMobileMessage {
  constructor(m3u8: string) {
    super(MessageType.PLAY_AGREEMENT, { m3u8 })
  }
}

export class PauseDigitalContentMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.PAUSE_AGREEMENT, {})
  }
}

export class GetPositionMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.GET_POSITION, {})
  }
}

export class SeekMessage extends NativeMobileMessage {
  constructor(seconds: number) {
    super(MessageType.SEEK_AGREEMENT, { seconds })
  }
}

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class PlayDigitalContentMessage extends NativeMobileMessage {
  constructor(m3u8: string) {
    super(MessageType.PLAY_DIGITAL_CONTENT, { m3u8 })
  }
}

export class PauseDigitalContentMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.PAUSE_DIGITAL_CONTENT, {})
  }
}

export class GetPositionMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.GET_POSITION, {})
  }
}

export class SeekMessage extends NativeMobileMessage {
  constructor(seconds: number) {
    super(MessageType.SEEK_DIGITAL_CONTENT, { seconds })
  }
}

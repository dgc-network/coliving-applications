import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class PlayAgreementMessage extends NativeMobileMessage {
  constructor(m3u8: string) {
    super(MessageType.PLAY_AGREEMENT, { m3u8 })
  }
}

export class PauseAgreementMessage extends NativeMobileMessage {
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

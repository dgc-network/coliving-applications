import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class DownloadDigitalContentMessage extends NativeMobileMessage {
  constructor(downloadProps: { filename: string; urls: string }) {
    super(MessageType.DOWNLOAD_AGREEMENT, { ...downloadProps, saveToFiles: true })
  }
}

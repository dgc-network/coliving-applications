import type { Identify, DigitalContent, Screen } from 'app/types/analytics'
import { digital_content, screen, identify } from 'app/utils/analytics'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.ANALYTICS_IDENTIFY]: async ({ message }) => {
    await identify(message as Identify)
  },
  [MessageType.ANALYTICS_AGREEMENT]: async ({ message }) => {
    await digital_content(message as DigitalContent)
  },
  [MessageType.ANALYTICS_SCREEN]: async ({ message }) => {
    await screen(message as Screen)
  }
}

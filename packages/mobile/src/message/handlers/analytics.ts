import type { Identify, Agreement, Screen } from 'app/types/analytics'
import { agreement, screen, identify } from 'app/utils/analytics'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.ANALYTICS_IDENTIFY]: async ({ message }) => {
    await identify(message as Identify)
  },
  [MessageType.ANALYTICS_AGREEMENT]: async ({ message }) => {
    await agreement(message as Agreement)
  },
  [MessageType.ANALYTICS_SCREEN]: async ({ message }) => {
    await screen(message as Screen)
  }
}

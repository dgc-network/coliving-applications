import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class SetAnalyticsUser extends NativeMobileMessage {
  constructor(handle: string, traits?: Record<string, any>) {
    super(MessageType.ANALYTICS_IDENTIFY, { handle, traits })
  }
}

export class DigitalContentAnalyticsEvent extends NativeMobileMessage {
  constructor(eventName: string, properties?: Record<string, any>) {
    super(MessageType.ANALYTICS_DIGITAL_CONTENT, { eventName, properties })
  }
}

export class ScreenAnalyticsEvent extends NativeMobileMessage {
  constructor(route: string, properties?: Record<string, any>) {
    super(MessageType.ANALYTICS_SCREEN, { route, properties })
  }
}

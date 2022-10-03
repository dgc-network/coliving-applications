import type { AllTrackingEvents as CommonTrackingEvents } from '@coliving/common'
import { Name as CommonEventNames } from '@coliving/common'

import type { Message } from 'app/message'

enum MobileEventNames {
  NOTIFICATIONS_OPEN_PUSH_NOTIFICATION = 'Notifications: Open Push Notification'
}

export const EventNames = { ...CommonEventNames, ...MobileEventNames }

type NotificationsOpenPushNotification = {
  eventName: MobileEventNames.NOTIFICATIONS_OPEN_PUSH_NOTIFICATION
  title?: string
  body?: string
}

type MobileTrackingEvents = NotificationsOpenPushNotification

export type AllEvents = CommonTrackingEvents | MobileTrackingEvents

export type JsonMap = Record<string, unknown>

export type Identify = {
  handle: string
  traits?: JsonMap
}

export type Agreement = {
  eventName: string
  properties?: JsonMap
}

export type Screen = {
  route: string
  properties?: JsonMap
}

export type AnalyticsMessage = Message & (Identify | Agreement | Screen)

export {
  PlaybackSource,
  ShareSource,
  RepostSource,
  FavoriteSource,
  FollowSource,
  CreateContentListSource
} from '@coliving/common'

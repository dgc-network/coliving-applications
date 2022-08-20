import { ID } from '@coliving/common'

// OverflowActions users can take
export enum OverflowAction {
  REPOST = 'REPOST',
  UNREPOST = 'UNREPOST',
  FAVORITE = 'FAVORITE',
  UNFAVORITE = 'UNFAVORITE',
  SHARE = 'SHARE',
  ADD_TO_CONTENT_LIST = 'ADD_TO_CONTENT_LIST',
  EDIT_CONTENT_LIST = 'EDIT_CONTENT_LIST',
  DELETE_CONTENT_LIST = 'DELETE_CONTENT_LIST',
  PUBLISH_CONTENT_LIST = 'PUBLISH_CONTENT_LIST',
  VIEW_AGREEMENT_PAGE = 'VIEW_AGREEMENT_PAGE',
  VIEW_ARTIST_PAGE = 'VIEW_ARTIST_PAGE',
  VIEW_COLLECTIBLE_PAGE = 'VIEW_COLLECTIBLE_PAGE',
  VIEW_CONTENT_LIST_PAGE = 'VIEW_CONTENT_LIST_PAGE',
  VIEW_ALBUM_PAGE = 'VIEW_ALBUM_PAGE',
  UNSUBSCRIBER_USER = 'UNSUBSCRIBER_USER',
  FOLLOW_ARTIST = 'FOLLOW_ARTIST',
  UNFOLLOW_ARTIST = 'UNFOLLOW_ARTIST',
  FOLLOW = 'FOLLOW',
  UNFOLLOW = 'UNFOLLOW'
}

export enum OverflowSource {
  NOTIFICATIONS = 'NOTIFICATIONS',
  AGREEMENTS = 'AGREEMENTS',
  COLLECTIONS = 'COLLECTIONS',
  PROFILE = 'PROFILE'
}

export type OpenPayload = {
  source: OverflowSource
  id: ID | string
  overflowActions: OverflowAction[]
  overflowActionCallbacks?: OverflowActionCallbacks
}

export type OverflowActionCallbacks = {
  [key in OverflowAction]?: () => void
}

export type MobileOverflowModalState = {
  id: ID | string | null /* Notification IDs can be strings */
  source: OverflowSource
  overflowActions: OverflowAction[]
  overflowActionCallbacks: OverflowActionCallbacks
}

import { ID, UID, LineupState, Status, User } from '@coliving/common'

export enum FollowType {
  FOLLOWERS = 'followers',
  FOLLOWEES = 'followees',
  FOLLOWEE_FOLLOWS = 'followeeFollows'
}

export enum CollectionSortMode {
  TIMESTAMP = 0,
  SAVE_COUNT = 1
}

export enum DigitalContentsSortMode {
  RECENT = 0,
  POPULAR = 1
}

export type Follow = {
  userIds: Array<{ id: ID; uid: UID }>
  status: Status
}

export type ProfilePageState = {
  handle: string
  userId: number
  status: Status
  updating: boolean
  updateSuccess: boolean
  updateError: boolean
  collectionIds: number[]
  mustUsedTags: string[]
  collectionSortMode: CollectionSortMode
  profileMeterDismissed: boolean
  followers: Follow
  followees: Follow
  followeeFollows: Follow
  feed: LineupState<{ id: ID }>
  digitalContents: LineupState<{ id: ID }>
  isNotificationSubscribed: boolean
  error?: string
  mostUsedTags: string[]
}

export enum Tabs {
  AGREEMENTS = 'AGREEMENTS',
  ALBUMS = 'ALBUMS',
  CONTENT_LISTS = 'CONTENT_LISTS',
  REPOSTS = 'REPOSTS',
  COLLECTIBLES = 'COLLECTIBLES'
}

export enum TabRoute {
  AGREEMENTS = 'digitalContents',
  ALBUMS = 'albums',
  CONTENT_LISTS = 'contentLists',
  REPOSTS = 'reposts',
  COLLECTIBLES = 'collectibles'
}

export const getTabForRoute = (tabRoute: TabRoute) => {
  switch (tabRoute) {
    case TabRoute.AGREEMENTS:
      return Tabs.AGREEMENTS
    case TabRoute.ALBUMS:
      return Tabs.ALBUMS
    case TabRoute.CONTENT_LISTS:
      return Tabs.CONTENT_LISTS
    case TabRoute.REPOSTS:
      return Tabs.REPOSTS
    case TabRoute.COLLECTIBLES:
      return Tabs.COLLECTIBLES
  }
}

type FollowerGroup = {
  status: Status
  users: User[]
}
export interface ProfileUser extends User {
  followers: FollowerGroup
  followees: FollowerGroup
}

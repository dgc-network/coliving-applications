import {
  ID,
  ChallengeRewardID,
  BadgeTier,
  Collection,
  Status,
  DigitalContent,
  User,
  StringWei,
  Nullable
} from '@coliving/common'

export enum NotificationType {
  Announcement = 'Announcement',
  UserSubscription = 'UserSubscription',
  Follow = 'Follow',
  Favorite = 'Favorite',
  Repost = 'Repost',
  Milestone = 'Milestone',
  RemixCreate = 'RemixCreate',
  RemixCosign = 'RemixCosign',
  TrendingAgreement = 'TrendingAgreement',
  ChallengeReward = 'ChallengeReward',
  TierChange = 'TierChange',
  Reaction = 'Reaction',
  TipReceive = 'TipReceive',
  TipSend = 'TipSend',
  SupporterRankUp = 'SupporterRankUp',
  SupportingRankUp = 'SupportingRankUp',
  AddAgreementToContentList = 'AddAgreementToContentList'
}

export enum Entity {
  DigitalContent = 'DigitalContent',
  ContentList = 'ContentList',
  Album = 'Album',
  User = 'User'
}

export type AgreementEntity = DigitalContent & { user: Nullable<User> }

export type CollectionEntity = Collection & { user: Nullable<User> }

export type EntityType = AgreementEntity | CollectionEntity

export type BaseNotification = {
  id: string
  isViewed: boolean
  timestamp: string
  timeLabel?: string
}

export type Announcement = BaseNotification & {
  type: NotificationType.Announcement
  title: string
  shortDescription: string
  longDescription?: string
}

export type UserSubscription = BaseNotification & {
  type: NotificationType.UserSubscription
  userId: ID
  entityIds: ID[]
} & (
    | {
        entityType: Entity.DigitalContent
      }
    | {
        entityType: Entity.ContentList | Entity.Album
      }
  )

export type Follow = BaseNotification & {
  type: NotificationType.Follow
  userIds: ID[]
}

export type Repost = BaseNotification & {
  type: NotificationType.Repost
  entityId: ID
  userIds: ID[]
  entityType: Entity.ContentList | Entity.Album | Entity.DigitalContent
}

export type Favorite = BaseNotification & {
  type: NotificationType.Favorite
  entityId: ID
  userIds: ID[]
  entityType: Entity.ContentList | Entity.Album | Entity.DigitalContent
}

export enum Achievement {
  Listens = 'Listens',
  Favorites = 'Favorites',
  Reposts = 'Reposts',
  Trending = 'Trending',
  Followers = 'Followers'
}

export type Milestone = BaseNotification &
  (
    | {
        type: NotificationType.Milestone
        entityType: Entity
        entityId: ID
        achievement: Exclude<Achievement, Achievement.Followers>
        value: number
      }
    | {
        type: NotificationType.Milestone
        entityId: ID
        achievement: Achievement.Followers
        value: number
      }
  )

export type RemixCreate = BaseNotification & {
  type: NotificationType.RemixCreate
  userId: ID
  parentAgreementId: ID
  childAgreementId: ID
  entityType: Entity.DigitalContent
  entityIds: ID[]
}

export type RemixCosign = BaseNotification & {
  type: NotificationType.RemixCosign
  userId: ID
  parentAgreementUserId: ID
  childAgreementId: ID
  entityType: Entity.DigitalContent
  entityIds: ID[]
}

export type TrendingAgreement = BaseNotification & {
  type: NotificationType.TrendingAgreement
  rank: number
  genre: string
  time: 'week' | 'month' | 'year'
  entityType: Entity.DigitalContent
  entityId: ID
}

export type ChallengeReward = BaseNotification & {
  type: NotificationType.ChallengeReward
  challengeId: ChallengeRewardID
}

export type TierChange = BaseNotification & {
  type: NotificationType.TierChange
  userId: ID
  tier: BadgeTier
}

// TODO: when we support multiple reaction types, reactedToEntity type
// should differ in a discrimated union reactionType
export type Reaction = BaseNotification & {
  type: NotificationType.Reaction
  entityId: ID
  entityType: Entity.User
  reactionValue: number
  reactionType: string
  reactedToEntity: {
    tx_signature: string
    amount: StringWei
    tip_sender_id: ID
  }
}

export type TipReceive = BaseNotification & {
  type: NotificationType.TipReceive
  amount: StringWei
  reactionValue: number
  entityId: ID
  entityType: Entity.User
  tipTxSignature: string
}

export type TipSend = BaseNotification & {
  type: NotificationType.TipSend
  amount: StringWei
  entityId: ID
  entityType: Entity.User
}

export type SupporterRankUp = BaseNotification & {
  type: NotificationType.SupporterRankUp
  rank: number
  entityId: ID
  entityType: Entity.User
}

export type SupportingRankUp = BaseNotification & {
  type: NotificationType.SupportingRankUp
  rank: number
  entityId: ID
  entityType: Entity.User
}

export type AddAgreementToContentList = BaseNotification & {
  type: NotificationType.AddAgreementToContentList
  agreementId: ID
  contentListId: ID
  contentListOwnerId: ID
}

export type Notification =
  | Announcement
  | UserSubscription
  | Follow
  | Repost
  | Favorite
  | Milestone
  | RemixCreate
  | RemixCosign
  | TrendingAgreement
  | ChallengeReward
  | TierChange
  | Reaction
  | TipReceive
  | TipSend
  | SupporterRankUp
  | SupportingRankUp
  | AddAgreementToContentList

export default interface NotificationState {
  notifications: {
    [id: string]: Notification
  }
  userList: {
    userIds: ID[]
    status?: Status
    limit: number
  }
  lastTimeStamp?: string
  allIds: string[]
  modalNotificationId: string | undefined
  panelIsOpen: boolean
  modalIsOpen: boolean
  totalUnviewed: number
  status?: Status
  hasMore: boolean
  hasLoaded: boolean
  contentListUpdates: number[]
}

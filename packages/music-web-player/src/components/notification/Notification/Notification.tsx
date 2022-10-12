import { useSelector } from 'react-redux'

import { CommonState } from 'common/store'
import {
  getNotificationEntities,
  getNotificationEntity,
  getNotificationUser,
  getNotificationUsers
} from 'common/store/notifications/selectors'
import {
  Notification as Notifications,
  NotificationType
} from 'common/store/notifications/types'
import ErrorWrapper from 'components/errorWrapper/errorWrapper'

import { AddDigitalContentToContentListNotification } from './addDigitalContentToContentListNotification'
import { AnnouncementNotification } from './announcementNotification'
import { ChallengeRewardNotification } from './challengeRewardNotification'
import { FavoriteNotification } from './favoriteNotification'
import { FollowNotification } from './followNotification'
import { MilestoneNotification } from './milestoneNotification'
import { RemixCosignNotification } from './remixCosignNotification'
import { RemixCreateNotification } from './remixCreateNotification'
import { RepostNotification } from './repostNotification'
import { TierChangeNotification } from './tierChangeNotification'
import { TipReactionNotification } from './tipReactionNotification'
import { TipReceivedNotification } from './tipReceivedNotification'
import { TipSentNotification } from './tipSentNotification'
import { TopSupporterNotification } from './topSupporterNotification'
import { TopSupportingNotification } from './topSupportingNotification'
import { TrendingDigitalContentNotification } from './trendingDigitalContentNotification'
import { UserSubscriptionNotification } from './userSubscriptionNotification'
import { USER_LENGTH_LIMIT } from './utils'

type NotificationProps = {
  notification: Notifications
}

export const Notification = (props: NotificationProps) => {
  const { notification: notificationProp } = props

  const user = useSelector((state: CommonState) =>
    getNotificationUser(state, notificationProp)
  )

  const users = useSelector((state: CommonState) =>
    getNotificationUsers(state, notificationProp, USER_LENGTH_LIMIT)
  )

  const entity = useSelector((state: CommonState) =>
    getNotificationEntity(state, notificationProp)
  )

  const entities = useSelector((state: CommonState) =>
    getNotificationEntities(state, notificationProp)
  )

  // Based on how notification types are defined, we need to cast like this.
  // In the future we should select user/users/entity/entities in each notif.
  const notification = {
    ...notificationProp,
    user,
    users,
    entity,
    entities
  } as unknown as Notifications
  const getNotificationElement = () => {
    switch (notification.type) {
      case NotificationType.Announcement: {
        return <AnnouncementNotification notification={notification} />
      }
      case NotificationType.ChallengeReward: {
        return <ChallengeRewardNotification notification={notification} />
      }
      case NotificationType.Favorite: {
        return <FavoriteNotification notification={notification} />
      }
      case NotificationType.Follow: {
        return <FollowNotification notification={notification} />
      }
      case NotificationType.Milestone: {
        return <MilestoneNotification notification={notification} />
      }
      case NotificationType.RemixCosign: {
        return <RemixCosignNotification notification={notification} />
      }
      case NotificationType.RemixCreate: {
        return <RemixCreateNotification notification={notification} />
      }
      case NotificationType.Repost: {
        return <RepostNotification notification={notification} />
      }
      case NotificationType.TierChange: {
        return <TierChangeNotification notification={notification} />
      }
      case NotificationType.Reaction: {
        return <TipReactionNotification notification={notification} />
      }
      case NotificationType.TipReceive: {
        return <TipReceivedNotification notification={notification} />
      }
      case NotificationType.TipSend: {
        return <TipSentNotification notification={notification} />
      }
      case NotificationType.SupporterRankUp: {
        return <TopSupporterNotification notification={notification} />
      }
      case NotificationType.SupportingRankUp: {
        return <TopSupportingNotification notification={notification} />
      }
      case NotificationType.TrendingDigitalContent: {
        return <TrendingDigitalContentNotification notification={notification} />
      }
      case NotificationType.UserSubscription: {
        return <UserSubscriptionNotification notification={notification} />
      }
      case NotificationType.AddDigitalContentToContentList: {
        return <AddDigitalContentToContentListNotification notification={notification} />
      }
      default: {
        return null
      }
    }
  }
  return (
    <ErrorWrapper
      errorMessage={`Could not render notification ${notification.id}`}
    >
      {getNotificationElement()}
    </ErrorWrapper>
  )
}

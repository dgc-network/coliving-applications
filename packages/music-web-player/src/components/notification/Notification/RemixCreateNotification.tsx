import { useCallback } from 'react'

import { Name, Nullable } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import {
  getNotificationEntities,
  getNotificationUser
} from 'common/store/notifications/selectors'
import { RemixCreate, DigitalContentEntity } from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/entityLink'
import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { TwitterShareButton } from './components/twitterShareButton'
import { UserNameLink } from './components/userNameLink'
import { IconRemix } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'New remix of your digital_content',
  by: 'by',
  shareTwitterText: (digital_content: DigitalContentEntity, handle: string) =>
    `New remix of ${digital_content.title} by ${handle} on @dgc-network #Coliving`
}

type RemixCreateNotificationProps = {
  notification: RemixCreate
}

export const RemixCreateNotification = (
  props: RemixCreateNotificationProps
) => {
  const { notification } = props
  const { entityType, timeLabel, isViewed, childDigitalContentId, parentDigitalContentId } =
    notification
  const dispatch = useDispatch()
  const user = useSelector((state) => getNotificationUser(state, notification))

  // TODO: casting from EntityType to DigitalContentEntity here, but
  // getNotificationEntities should be smart enough based on notif type
  const digitalContents = useSelector((state) =>
    getNotificationEntities(state, notification)
  ) as Nullable<DigitalContentEntity[]>

  const childDigitalContent = digitalContents?.find((digital_content) => digital_content.digital_content_id === childDigitalContentId)

  const parentDigitalContent = digitalContents?.find((digital_content) => digital_content.digital_content_id === parentDigitalContentId)

  const handleClick = useCallback(() => {
    if (childDigitalContent) {
      dispatch(push(getEntityLink(childDigitalContent)))
    }
  }, [childDigitalContent, dispatch])

  const handleShare = useCallback(
    (twitterHandle: string) => {
      if (!parentDigitalContent) return null
      const shareText = messages.shareTwitterText(parentDigitalContent, twitterHandle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_REMIX_CREATE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText, analytics }
    },
    [parentDigitalContent]
  )

  if (!user || !parentDigitalContent || !childDigitalContent) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>
          {messages.title}{' '}
          <EntityLink entity={parentDigitalContent} entityType={entityType} />
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <EntityLink entity={childDigitalContent} entityType={entityType} /> {messages.by}{' '}
        <UserNameLink user={user} notification={notification} />
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={user.handle}
        url={getEntityLink(parentDigitalContent, true)}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}

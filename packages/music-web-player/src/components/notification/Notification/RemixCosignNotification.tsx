import { useCallback } from 'react'

import { Nullable, Name } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import {
  getNotificationEntities,
  getNotificationUser
} from 'common/store/notifications/selectors'
import { RemixCosign, DigitalContentEntity } from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/entityLink'
import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { DigitalContent } from './components/digitalContent'
import { TwitterShareButton } from './components/twitterShareButton'
import { UserNameLink } from './components/userNameLink'
import { IconRemix } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of',
  shareTwitterText: (digitalContentTitle: string, handle: string) =>
    `My remix of ${digitalContentTitle} was Co-Signed by ${handle} on @dgc-network #Coliving`
}

type RemixCosignNotificationProps = {
  notification: RemixCosign
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
) => {
  const { notification } = props
  const { entityType, timeLabel, isViewed, childDigitalContentId, parentDigitalContentUserId } =
    notification

  const user = useSelector((state) => getNotificationUser(state, notification))

  // TODO: casting from EntityType to DigitalContentEntity here, but
  // getNotificationEntities should be smart enough based on notif type
  const digitalContents = useSelector((state) =>
    getNotificationEntities(state, notification)
  ) as Nullable<DigitalContentEntity[]>

  const dispatch = useDispatch()

  const childDigitalContent = digitalContents?.find((digital_content) => digital_content.digital_content_id === childDigitalContentId)

  const parentDigitalContent = digitalContents?.find(
    (digital_content) => digital_content.owner_id === parentDigitalContentUserId
  )
  const parentDigitalContentTitle = parentDigitalContent?.title

  const handleClick = useCallback(() => {
    if (!childDigitalContent) return
    dispatch(push(getEntityLink(childDigitalContent)))
  }, [childDigitalContent, dispatch])

  const handleTwitterShare = useCallback(
    (handle: string) => {
      if (!parentDigitalContentTitle) return null
      const shareText = messages.shareTwitterText(parentDigitalContentTitle, handle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE,
        {
          text: shareText
        }
      )
      return { shareText, analytics }
    },
    [parentDigitalContentTitle]
  )

  if (!user || !parentDigitalContent || !childDigitalContent) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={user} notification={notification} />{' '}
        {messages.cosign}{' '}
        <EntityLink entity={parentDigitalContent} entityType={entityType} />
      </NotificationBody>
      <div>
        <DigitalContent digital_content={childDigitalContent} />
      </div>
      <TwitterShareButton
        type='dynamic'
        handle={user.handle}
        shareData={handleTwitterShare}
        url={getEntityLink(childDigitalContent, true)}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}

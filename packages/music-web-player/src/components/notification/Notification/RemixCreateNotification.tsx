import { useCallback } from 'react'

import { Name, Nullable } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import {
  getNotificationEntities,
  getNotificationUser
} from 'common/store/notifications/selectors'
import { RemixCreate, AgreementEntity } from 'common/store/notifications/types'
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
  shareTwitterText: (digital_content: AgreementEntity, handle: string) =>
    `New remix of ${digital_content.title} by ${handle} on @dgc-network #Coliving`
}

type RemixCreateNotificationProps = {
  notification: RemixCreate
}

export const RemixCreateNotification = (
  props: RemixCreateNotificationProps
) => {
  const { notification } = props
  const { entityType, timeLabel, isViewed, childAgreementId, parentAgreementId } =
    notification
  const dispatch = useDispatch()
  const user = useSelector((state) => getNotificationUser(state, notification))

  // TODO: casting from EntityType to AgreementEntity here, but
  // getNotificationEntities should be smart enough based on notif type
  const agreements = useSelector((state) =>
    getNotificationEntities(state, notification)
  ) as Nullable<AgreementEntity[]>

  const childAgreement = agreements?.find((digital_content) => digital_content.digital_content_id === childAgreementId)

  const parentAgreement = agreements?.find((digital_content) => digital_content.digital_content_id === parentAgreementId)

  const handleClick = useCallback(() => {
    if (childAgreement) {
      dispatch(push(getEntityLink(childAgreement)))
    }
  }, [childAgreement, dispatch])

  const handleShare = useCallback(
    (twitterHandle: string) => {
      if (!parentAgreement) return null
      const shareText = messages.shareTwitterText(parentAgreement, twitterHandle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_REMIX_CREATE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText, analytics }
    },
    [parentAgreement]
  )

  if (!user || !parentAgreement || !childAgreement) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>
          {messages.title}{' '}
          <EntityLink entity={parentAgreement} entityType={entityType} />
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <EntityLink entity={childAgreement} entityType={entityType} /> {messages.by}{' '}
        <UserNameLink user={user} notification={notification} />
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={user.handle}
        url={getEntityLink(parentAgreement, true)}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}

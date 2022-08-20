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

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconRemix } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'New remix of your agreement',
  by: 'by',
  shareTwitterText: (agreement: AgreementEntity, handle: string) =>
    `New remix of ${agreement.title} by ${handle} on @dgc-network #Coliving`
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

  const childAgreement = agreements?.find((agreement) => agreement.agreement_id === childAgreementId)

  const parentAgreement = agreements?.find((agreement) => agreement.agreement_id === parentAgreementId)

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

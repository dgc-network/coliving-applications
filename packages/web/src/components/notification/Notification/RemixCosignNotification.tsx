import { useCallback } from 'react'

import { Nullable, Name } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import {
  getNotificationEntities,
  getNotificationUser
} from 'common/store/notifications/selectors'
import { RemixCosign, AgreementEntity } from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/entityLink'
import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { AgreementContent } from './components/AgreementContent'
import { TwitterShareButton } from './components/twitterShareButton'
import { UserNameLink } from './components/userNameLink'
import { IconRemix } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of',
  shareTwitterText: (agreementTitle: string, handle: string) =>
    `My remix of ${agreementTitle} was Co-Signed by ${handle} on @dgc-network #Coliving`
}

type RemixCosignNotificationProps = {
  notification: RemixCosign
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
) => {
  const { notification } = props
  const { entityType, timeLabel, isViewed, childAgreementId, parentAgreementUserId } =
    notification

  const user = useSelector((state) => getNotificationUser(state, notification))

  // TODO: casting from EntityType to AgreementEntity here, but
  // getNotificationEntities should be smart enough based on notif type
  const agreements = useSelector((state) =>
    getNotificationEntities(state, notification)
  ) as Nullable<AgreementEntity[]>

  const dispatch = useDispatch()

  const childAgreement = agreements?.find((agreement) => agreement.agreement_id === childAgreementId)

  const parentAgreement = agreements?.find(
    (agreement) => agreement.owner_id === parentAgreementUserId
  )
  const parentAgreementTitle = parentAgreement?.title

  const handleClick = useCallback(() => {
    if (!childAgreement) return
    dispatch(push(getEntityLink(childAgreement)))
  }, [childAgreement, dispatch])

  const handleTwitterShare = useCallback(
    (handle: string) => {
      if (!parentAgreementTitle) return null
      const shareText = messages.shareTwitterText(parentAgreementTitle, handle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE,
        {
          text: shareText
        }
      )
      return { shareText, analytics }
    },
    [parentAgreementTitle]
  )

  if (!user || !parentAgreement || !childAgreement) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRemix />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={user} notification={notification} />{' '}
        {messages.cosign}{' '}
        <EntityLink entity={parentAgreement} entityType={entityType} />
      </NotificationBody>
      <div>
        <AgreementContent agreement={childAgreement} />
      </div>
      <TwitterShareButton
        type='dynamic'
        handle={user.handle}
        shareData={handleTwitterShare}
        url={getEntityLink(childAgreement, true)}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}

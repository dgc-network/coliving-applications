import { useCallback } from 'react'

import { Name } from '@coliving/common'

import { useUIAudio } from 'common/hooks/useUILive'
import { getNotificationUser } from 'common/store/notifications/selectors'
import { TipSend } from 'common/store/notifications/types'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import styles from './TipSentNotification.module.css'
import { AudioText } from './components/audioText'
import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { ProfilePicture } from './components/profilePicture'
import { TwitterShareButton } from './components/twitterShareButton'
import { UserNameLink } from './components/userNameLink'
import { IconTip } from './components/icons'
import { useGoToProfile } from './useGoToProfile'

const messages = {
  title: 'Your Tip Was Sent!',
  sent: 'You successfully sent a tip of',
  to: 'to',
  twitterShare: (senderHandle: string, uiAmount: number) =>
    `I just tipped ${senderHandle} ${uiAmount} $LIVE on @dgc-network #Coliving #LIVETip`
}

type TipSentNotificationProps = {
  notification: TipSend
}

export const TipSentNotification = (props: TipSentNotificationProps) => {
  const { notification } = props
  const { amount, timeLabel, isViewed } = notification
  const uiAmount = useUIAudio(amount)

  const user = useSelector((state) => getNotificationUser(state, notification))
  const handleClick = useGoToProfile(user)

  const handleShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.twitterShare(senderHandle, uiAmount)
      return {
        shareText,
        analytics: make(Name.NOTIFICATIONS_CLICK_TIP_SENT_TWITTER_SHARE, {
          text: shareText
        })
      }
    },
    [uiAmount]
  )

  if (!user) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <ProfilePicture className={styles.profilePicture} user={user} />
        <span>
          {messages.sent} <AudioText value={uiAmount} /> {messages.to}{' '}
          <UserNameLink user={user} notification={notification} />
        </span>
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        handle={user.handle}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}

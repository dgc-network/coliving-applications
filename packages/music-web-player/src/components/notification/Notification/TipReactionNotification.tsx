import { useCallback } from 'react'

import { Name } from '@coliving/common'

import { useUIAudio } from 'common/hooks/useUILive'
import { getNotificationUser } from 'common/store/notifications/selectors'
import { Reaction } from 'common/store/notifications/types'
import { getReactionFromRawValue } from 'common/store/ui/reactions/slice'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import styles from './TipReactionNotification.module.css'
import { LiveText } from './components/liveText'
import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { ProfilePicture } from './components/profilePicture'
import { reactionMap } from './components/reaction'
import { TwitterShareButton } from './components/twitterShareButton'
import { UserNameLink } from './components/userNameLink'
import { IconTip } from './components/icons'
import { useGoToProfile } from './useGoToProfile'

const messages = {
  reacted: 'reacted',
  react: 'reacted to your tip of ',
  twitterShare: (handle: string) =>
    `I got a thanks from ${handle} for tipping them $LIVE on @colivingproject! #Coliving #LIVETip`
}

type TipReactionNotificationProps = {
  notification: Reaction
}

export const TipReactionNotification = (
  props: TipReactionNotificationProps
) => {
  const { notification } = props
  const {
    reactionValue,
    timeLabel,
    isViewed,
    reactedToEntity: { amount }
  } = notification

  const uiAmount = useUIAudio(amount)

  const user = useSelector((state) => getNotificationUser(state, notification))
  const handleClick = useGoToProfile(user)

  const handleShare = useCallback((twitterHandle: string) => {
    const shareText = messages.twitterShare(twitterHandle)
    const analytics = make(
      Name.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE,
      { text: shareText }
    )
    return { shareText, analytics }
  }, [])

  if (!user) return null

  const userLinkElement = (
    <UserNameLink
      className={styles.profileLink}
      user={user}
      notification={notification}
    />
  )

  const reactionType = getReactionFromRawValue(reactionValue)
  if (!reactionType) return null
  const Reaction = reactionMap[reactionType]

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>
          {userLinkElement} {messages.reacted}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <div className={styles.reactionRoot}>
          <Reaction />
          <ProfilePicture
            className={styles.profilePicture}
            user={user}
            disablePopover
          />
        </div>
        <div className={styles.reactionTextRoot}>
          <div>
            {userLinkElement} {messages.react}
            <LiveText value={uiAmount} />
          </div>
        </div>
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

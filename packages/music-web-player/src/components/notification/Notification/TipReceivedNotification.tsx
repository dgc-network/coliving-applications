import { ComponentType, useCallback, useState } from 'react'

import { Name, Nullable } from '@coliving/common'
import { useDispatch } from 'react-redux'

import { useUIAudio } from 'common/hooks/useUILive'
import { getNotificationUser } from 'common/store/notifications/selectors'
import { TipReceive } from 'common/store/notifications/types'
import {
  makeGetReactionForSignature,
  reactionOrder,
  ReactionTypes,
  writeReactionValue
} from 'common/store/ui/reactions/slice'
import { make } from 'store/analytics/actions'
import { useSelector } from 'utils/reducer'

import styles from './TipReceivedNotification.module.css'
import { LiveText } from './components/liveText'
import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { ProfilePicture } from './components/profilePicture'
import { ReactionProps, reactionMap } from './components/reaction'
import { TwitterShareButton } from './components/twitterShareButton'
import { UserNameLink } from './components/userNameLink'
import { IconTip } from './components/icons'
import { useGoToProfile } from './useGoToProfile'

const reactionList: [ReactionTypes, ComponentType<ReactionProps>][] =
  reactionOrder.map((r) => [r, reactionMap[r]])

const messages = {
  title: 'You Received a Tip!',
  sent: 'sent you a tip of',
  digitalcoin: '$LIVE',
  sayThanks: 'Say Thanks With a Reaction',
  reactionSent: 'Reaction Sent!',
  twitterShare: (senderHandle: string, amount: number) =>
    `Thanks ${senderHandle} for the ${amount} $LIVE tip on @dgc-network! #Coliving #LIVETip`
}

type TipReceivedNotificationProps = {
  notification: TipReceive
}

const useSetReaction = (tipTxSignature: string) => {
  const dispatch = useDispatch()

  const setReactionValue = useCallback(
    (reaction: Nullable<ReactionTypes>) => {
      dispatch(writeReactionValue({ reaction, entityId: tipTxSignature }))
    },
    [tipTxSignature, dispatch]
  )
  return setReactionValue
}

export const TipReceivedNotification = (
  props: TipReceivedNotificationProps
) => {
  const [isTileDisabled, setIsTileDisabled] = useState(false)
  const { notification } = props
  const { amount, timeLabel, isViewed, tipTxSignature } = notification

  const user = useSelector((state) => getNotificationUser(state, notification))

  const reactionValue = useSelector(makeGetReactionForSignature(tipTxSignature))
  const setReaction = useSetReaction(tipTxSignature)

  const uiAmount = useUIAudio(amount)

  const handleClick = useGoToProfile(user)

  const handleShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.twitterShare(senderHandle, uiAmount)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_TIP_RECEIVED_TWITTER_SHARE,
        { text: shareText }
      )

      return { shareText, analytics }
    },
    [uiAmount]
  )

  const handleMouseEnter = useCallback(() => setIsTileDisabled(true), [])
  const handleMouseLeave = useCallback(() => setIsTileDisabled(false), [])

  if (!user) return null

  return (
    <NotificationTile
      notification={notification}
      disabled={isTileDisabled}
      disableClosePanel
      onClick={handleClick}
    >
      <NotificationHeader icon={<IconTip />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <div className={styles.bodyText}>
          <ProfilePicture className={styles.profilePicture} user={user} />
          <span>
            <UserNameLink user={user} notification={notification} />{' '}
            {messages.sent} <LiveText value={uiAmount} />
          </span>
        </div>
        <div className={styles.sayThanks}>
          {reactionValue ? (
            <>
              <i className='emoji small white-heavy-check-mark' />{' '}
              {messages.reactionSent}{' '}
            </>
          ) : (
            messages.sayThanks
          )}
        </div>
        <div
          className={styles.reactionList}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {reactionList.map(([reactionType, Reaction]) => (
            <Reaction
              key={reactionType}
              onClick={(e) => {
                e.stopPropagation()
                setReaction(reactionType)
              }}
              isActive={
                reactionValue // treat 0 and null equivalently here
                  ? reactionType === reactionValue
                  : undefined
              }
              isResponsive
            />
          ))}
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

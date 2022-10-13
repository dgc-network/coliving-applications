import { useCallback } from 'react'

import { Name } from '@coliving/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { ChallengeReward } from 'common/store/notifications/types'
import { challengeRewardsConfig } from 'pages/digitalcoinRewardsPage/config'
import { make, useRecord } from 'store/analytics/actions'
import { LIVE_PAGE } from 'utils/route'

import { NotificationBody } from './components/notificationBody'
import { NotificationFooter } from './components/notificationFooter'
import { NotificationHeader } from './components/notificationHeader'
import { NotificationTile } from './components/notificationTile'
import { NotificationTitle } from './components/notificationTitle'
import { TwitterShareButton } from './components/twitterShareButton'
import { IconRewards } from './components/icons'

const messages = {
  amountEarned: (amount: number) => `You've earned ${amount} $DGCO`,
  referredText:
    ' for being referred! Invite your friends to join to earn more!',
  challengeCompleteText: ' for completing this challenge!',
  body: (amount: number) =>
    `You've earned ${amount} $DGCO for completing this challenge!`,
  twitterShareText:
    'I earned $DGCO for completing challenges on @dgc-network #DigitalcoinRewards'
}

type ChallengeRewardNotificationProps = {
  notification: ChallengeReward
}

export const ChallengeRewardNotification = (
  props: ChallengeRewardNotificationProps
) => {
  const { notification } = props
  const { challengeId, timeLabel, isViewed, type } = notification
  const dispatch = useDispatch()
  const record = useRecord()

  const {
    amount: rewardAmount,
    title,
    icon
  } = challengeRewardsConfig[challengeId]

  const handleClick = useCallback(() => {
    dispatch(push(LIVE_PAGE))
    record(
      make(Name.NOTIFICATIONS_CLICK_TILE, { kind: type, link_to: LIVE_PAGE })
    )
  }, [dispatch, record, type])

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRewards>{icon}</IconRewards>}>
        <NotificationTitle>{title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.amountEarned(rewardAmount)}
        {challengeId === 'referred'
          ? messages.referredText
          : messages.challengeCompleteText}
      </NotificationBody>
      <TwitterShareButton type='static' shareText={messages.twitterShareText} />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}

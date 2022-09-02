import type { ChallengeRewardID } from '@coliving/common'
import type { ChallengeReward } from '-client/src/common/store/notifications/types'

import IconColiving from 'app/assets/images/iconColiving.svg'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  NotificationTwitterButton
} from '../Notification'

const messages = {
  amountEarned: (amount: number) => `You've earned ${amount} $LIVE`,
  referredText:
    ' for being referred! Invite your friends to join to earn more!',
  challengeCompleteText: ' for completing this challenge!',
  twitterShareText:
    'I earned $LIVE for completing challenges on @dgc-network #LiveRewards'
}

const challengeInfoMap: Record<
  ChallengeRewardID,
  { title: string; amount: number }
> = {
  'profile-completion': {
    title: '✅️ Complete your Profile',
    amount: 1
  },
  'listen-streak': {
    title: '🎧 Listening Streak: 7 Days',
    amount: 1
  },
  'agreement-upload': {
    title: '🎶 Upload 3 Agreements',
    amount: 1
  },
  referrals: {
    title: '📨 Invite your Friends',
    amount: 1
  },
  'ref-v': {
    title: '📨 Invite your Residents',
    amount: 1
  },
  referred: {
    title: '📨 Invite your Friends',
    amount: 1
  },
  'connect-verified': {
    title: '✅️ Link Verified Accounts',
    amount: 5
  },
  'mobile-install': {
    title: '📲 Get the App',
    amount: 1
  },
  'send-first-tip': {
    title: '🤑 Send Your First Tip',
    amount: 2
  },
  'first-content-list': {
    title: '✨ Create Your First ContentList',
    amount: 2
  }
}

type ChallengeRewardNotificationProps = {
  notification: ChallengeReward
}

export const ChallengeRewardNotification = (
  props: ChallengeRewardNotificationProps
) => {
  const { notification } = props
  const { challengeId } = notification
  const { title, amount } = challengeInfoMap[challengeId]
  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={IconColiving}>
        <NotificationTitle>{title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.amountEarned(amount)}{' '}
        {challengeId === 'referred'
          ? messages.referredText
          : messages.challengeCompleteText}
      </NotificationText>
      <NotificationTwitterButton
        type='static'
        shareText={messages.twitterShareText}
      />
    </NotificationTile>
  )
}

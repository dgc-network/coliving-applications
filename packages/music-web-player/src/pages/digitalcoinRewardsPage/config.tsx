import { ReactNode } from 'react'

import {
  amounts,
  ChallengeRewardID,
  OptimisticUserChallenge,
  TrendingRewardID,
  Nullable
} from '@coliving/common'
import { IconArrow, IconCheck, IconUpload } from '@coliving/stems'

import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import { formatNumberCommas } from 'common/utils/formatUtil'
import {
  profilePage,
  SETTINGS_PAGE,
  TRENDING_PAGE,
  UPLOAD_PAGE,
  EXPLORE_HEAVY_ROTATION_PAGE,
  FAVORITES_PAGE
} from 'utils/route'

type LinkButtonType =
  | 'digitalContentUpload'
  | 'profile'
  | 'verifyAccount'
  | 'trendingDigitalContents'
  | 'sendFirstTip'
  | 'firstContentList'
type LinkButtonInfo = {
  label: string
  leftIcon: ReactNode | null
  rightIcon: ReactNode | null
  link: (handle: string | null) => string | null
}

const GoldBadgeIconImage = () => (
  <img
    draggable={false}
    alt='Gold badge'
    src={IconGoldBadge}
    width={24}
    height={24}
  />
)

const linkButtonMap: Record<LinkButtonType, LinkButtonInfo> = {
  digitalContentUpload: {
    label: 'Upload DigitalContents',
    leftIcon: null,
    rightIcon: <IconUpload />,
    link: () => UPLOAD_PAGE
  },
  profile: {
    label: 'Your Profile',
    leftIcon: null,
    rightIcon: <IconArrow />,
    link: (handle: Nullable<string>) => (handle ? profilePage(handle) : null)
  },
  verifyAccount: {
    label: 'Verify Your Account',
    leftIcon: null,
    rightIcon: <IconCheck />,
    link: () => SETTINGS_PAGE
  },
  trendingDigitalContents: {
    label: 'Trending DigitalContents',
    leftIcon: null,
    rightIcon: <IconArrow />,
    link: () => TRENDING_PAGE
  },
  sendFirstTip: {
    label: 'Find Someone To Tip',
    leftIcon: null,
    rightIcon: <GoldBadgeIconImage />,
    link: () => EXPLORE_HEAVY_ROTATION_PAGE
  },
  firstContentList: {
    label: 'Create Your First ContentList',
    leftIcon: null,
    rightIcon: <IconArrow />,
    link: () => FAVORITES_PAGE
  }
}

type ChallengeRewardsInfo = {
  id: ChallengeRewardID
  title: string
  icon: ReactNode
  description: (amount: OptimisticUserChallenge | undefined) => string
  fullDescription: (amount: OptimisticUserChallenge | undefined) => string
  progressLabel: string
  remainingLabel?: string
  amount: number
  panelButtonText: string
  modalButtonInfo: {
    incomplete: LinkButtonInfo | null
    inProgress: LinkButtonInfo | null
    complete: LinkButtonInfo | null
  }
  verifiedChallenge?: boolean
}

export const challengeRewardsConfig: Record<
  ChallengeRewardID,
  ChallengeRewardsInfo
> = {
  referrals: {
    id: 'referrals' as ChallengeRewardID,
    title: 'Invite your Friends',
    icon: <i className='emoji large incoming-envelope' />,
    description: (challenge) =>
      `Earn ${challenge?.amount} $DGC, for you and your friend`,
    fullDescription: (challenge) =>
      `Invite your Friends! You’ll earn ${challenge?.amount} $DGC for each friend who joins with your link (and they’ll get an $DGC too)`,
    progressLabel: '%0/%1 Invites Accepted',
    remainingLabel: '%0/%1 Invites Remain',
    amount: amounts.referrals,
    panelButtonText: 'Invite your Friends',
    modalButtonInfo: {
      incomplete: null,
      inProgress: null,
      complete: null
    }
  },
  'ref-v': {
    id: 'ref-v' as ChallengeRewardID,
    title: 'Invite your Residents',
    icon: <i className='emoji large incoming-envelope' />,
    description: (challenge) =>
      `Earn up to ${formatNumberCommas(challenge?.totalAmount ?? '')} $DGC`,
    fullDescription: (challenge) =>
      `Invite your residents! You’ll earn ${challenge?.amount} $DGC for each resident who joins with your link (and they’ll get an $DGC too)`,
    progressLabel: '%0/%1 Invites Accepted',
    remainingLabel: '%0/%1 Invites Remain',
    amount: amounts.referrals,
    panelButtonText: 'Invite your Residents',
    modalButtonInfo: {
      incomplete: null,
      inProgress: null,
      complete: null
    },
    verifiedChallenge: true
  },
  referred: {
    id: 'referred',
    title: 'You Accepted An Invite',
    icon: <i className='emoji large love-letter' />,
    description: () => `You earned $DGC for being invited`,
    fullDescription: () => `You earned $DGC for being invited`,
    progressLabel: '%0/%1 Invites',
    amount: amounts.referrals,
    panelButtonText: 'More Info',
    modalButtonInfo: {
      incomplete: null,
      inProgress: null,
      complete: null
    }
  },
  'connect-verified': {
    id: 'connect-verified' as ChallengeRewardID,
    title: 'Link Verified Accounts',
    icon: <i className='emoji large white-heavy-check-mark' />,
    description: (challenge) =>
      `Link your verified social media accounts to earn ${challenge?.amount} $DGC`,
    fullDescription: () =>
      'Get verified on Coliving by linking your verified Twitter or Instagram account!',
    progressLabel: 'Not Linked',
    amount: amounts['connect-verified'],
    panelButtonText: 'Link Verified Account',
    modalButtonInfo: {
      incomplete: linkButtonMap.verifyAccount,
      inProgress: linkButtonMap.verifyAccount,
      complete: linkButtonMap.profile
    }
  },
  'listen-streak': {
    id: 'listen-streak' as ChallengeRewardID,
    title: 'Listening Streak: 7 Days',
    icon: <i className='emoji large headphone' />,
    description: (challenge) =>
      `Listen to one digital_content a day for seven days to earn ${challenge?.amount} $DGC`,
    fullDescription: () =>
      'Sign in and listen to at least one digital_content every day for 7 days',
    progressLabel: '%0/%1 Days',
    amount: amounts['listen-streak'],
    panelButtonText: 'Trending on Coliving',
    modalButtonInfo: {
      incomplete: linkButtonMap.trendingDigitalContents,
      inProgress: linkButtonMap.trendingDigitalContents,
      complete: linkButtonMap.trendingDigitalContents
    }
  },
  'mobile-install': {
    id: 'mobile-install' as ChallengeRewardID,
    title: 'Get the Coliving Mobile App',
    icon: <i className='emoji large mobile-phone-with-arrow' />,
    description: (challenge) => `Earn ${challenge?.amount} $DGC`,
    fullDescription: () =>
      'Install the Coliving app for iPhone and Android and Sign in to your account!',
    progressLabel: 'Not Installed',
    amount: amounts['mobile-install'],
    panelButtonText: 'Get the App',
    modalButtonInfo: {
      incomplete: null,
      inProgress: null,
      complete: null
    }
  },
  'profile-completion': {
    id: 'profile-completion' as ChallengeRewardID,
    title: 'Complete Your Profile',
    icon: <i className='emoji large white-heavy-check-mark' />,
    description: (challenge) =>
      `Complete your Coliving profile to earn ${challenge?.amount} $DGC`,
    fullDescription: () =>
      'Fill out the missing details on your Coliving profile and start interacting with digitalContents and landlords!',
    progressLabel: '%0/%1 Complete',
    amount: amounts['profile-completion'],
    panelButtonText: 'More Info',
    modalButtonInfo: {
      incomplete: linkButtonMap.profile,
      inProgress: linkButtonMap.profile,
      complete: linkButtonMap.profile
    }
  },
  'digital-content-upload': {
    id: 'digital-content-upload' as ChallengeRewardID,
    title: 'Upload 3 DigitalContents',
    icon: <i className='emoji large multiple-musical-notes' />,
    description: (challenge) => `Earn ${challenge?.amount} $DGC`,
    fullDescription: () => 'Upload 3 digitalContents to your profile',
    progressLabel: '%0/%1 Uploaded',
    amount: amounts['digital-content-upload'],
    panelButtonText: 'Upload DigitalContents',
    modalButtonInfo: {
      incomplete: linkButtonMap.digitalContentUpload,
      inProgress: linkButtonMap.digitalContentUpload,
      complete: linkButtonMap.digitalContentUpload
    }
  },
  'send-first-tip': {
    id: 'send-first-tip' as ChallengeRewardID,
    title: 'Send Your First Tip',
    icon: <i className='emoji large money-mouth-face' />,
    description: (challenge) => `Earn ${challenge?.amount} $DGC`,
    fullDescription: () =>
      'Show some love to your favorite author and send them a tip',
    progressLabel: 'Not Earned',
    amount: amounts['send-first-tip'],
    panelButtonText: 'Find Someone To Tip',
    modalButtonInfo: {
      incomplete: linkButtonMap.sendFirstTip,
      inProgress: linkButtonMap.sendFirstTip,
      complete: linkButtonMap.sendFirstTip
    }
  },
  'first-content-list': {
    id: 'first-content-list' as ChallengeRewardID,
    title: 'Create Your First ContentList',
    icon: <i className='emoji large sparkles' />,
    description: (challenge) => `Earn ${challenge?.amount} $DGC`,
    fullDescription: () => 'Create your first contentList & add a digital_content to it',
    progressLabel: 'Not Earned',
    amount: amounts['first-content-list'],
    panelButtonText: 'Create Your First ContentList',
    modalButtonInfo: {
      incomplete: linkButtonMap.firstContentList,
      inProgress: linkButtonMap.firstContentList,
      complete: linkButtonMap.firstContentList
    }
  }
}

type TrendingRewardsInfo = {
  id: TrendingRewardID
  title: string
  icon: ReactNode
  description: string
  buttonText: string
}

export const trendingRewardsConfig: Record<
  TrendingRewardID,
  TrendingRewardsInfo
> = {
  'trending-content-list': {
    title: 'Top 5 Trending ContentLists',
    icon: <i className='emoji large chart-increasing' />,
    description: 'Winners are selected every Friday at Noon PT!',
    buttonText: 'See More',
    id: 'trending-content-list'
  },
  'trending-digital-content': {
    title: 'Top 5 Trending DigitalContents',
    icon: <i className='emoji large chart-increasing' />,
    description: 'Winners are selected every Friday at Noon PT!',
    buttonText: 'See More',
    id: 'trending-digital-content'
  },
  'top-api': {
    title: 'Top 10 API Apps',
    icon: <i className='emoji large nerd-face' />,
    description: 'The top 10 Coliving API apps each month win',
    buttonText: 'More Info',
    id: 'top-api'
  },
  'verified-upload': {
    title: 'First Upload With Your Verified Account',
    icon: <i className='emoji large white-heavy-check-mark' />,
    description:
      'Verified on Twitter/Instagram? Upload your first digital_content, post it on social media, & tag us',
    buttonText: 'More Info',
    id: 'verified-upload'
  },
  'trending-underground': {
    title: 'Top 5 Underground Trending',
    icon: <i className='emoji large chart-increasing' />,
    description: 'Winners are selected every Friday at Noon PT!',
    buttonText: 'See More',
    id: 'trending-underground'
  }
}

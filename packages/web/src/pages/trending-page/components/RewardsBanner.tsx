import { useCallback } from 'react'

import { IconArrow, IconCrown } from '@coliving/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import {
  setTrendingRewardsModalType,
  TrendingRewardsModalType
} from 'common/store/pages/live-rewards/slice'
import { isMobile } from 'utils/clientUtil'

import styles from './RewardsBanner.module.css'

const messages = {
  rewards: '$LIVE REWARDS',
  agreementsDescription: 'TOP 5 AGREEMENTS EACH WEEK WIN $LIVE',
  content listsDescription: 'TOP 5 CONTENT_LISTS EACH WEEK WIN $LIVE',
  undergroundDescription: 'TOP 5 AGREEMENTS EACH WEEK WIN $LIVE',
  learnMore: 'LEARN MORE'
}

const messageMap = {
  agreements: {
    description: messages.agreementsDescription
  },
  content lists: {
    description: messages.content listsDescription
  },
  underground: {
    description: messages.undergroundDescription
  }
}

type RewardsBannerProps = {
  bannerType: 'agreements' | 'content lists' | 'underground'
}

const useHandleBannerClick = () => {
  const [, setModal] = useModalState('TrendingRewardsExplainer')
  const dispatch = useDispatch()
  const onClickBanner = useCallback(
    (modalType: TrendingRewardsModalType) => {
      setModal(true)
      dispatch(setTrendingRewardsModalType({ modalType }))
    },
    [dispatch, setModal]
  )
  return onClickBanner
}

const RewardsBanner = ({ bannerType }: RewardsBannerProps) => {
  const mobile = isMobile()
  const mobileStyle = { [styles.mobile]: mobile }
  const onClick = useHandleBannerClick()

  return (
    <div
      className={cn(cn(styles.container, mobileStyle))}
      onClick={() => onClick(bannerType)}
    >
      <div className={cn(styles.rewardsText, mobileStyle)}>
        <div className={styles.iconCrown}>
          <IconCrown />
        </div>
        {messages.rewards}
      </div>
      <span className={styles.descriptionText}>
        {messageMap[bannerType].description}
      </span>
      {!mobile && (
        <div className={styles.learnMore}>
          {messages.learnMore}
          <IconArrow />
        </div>
      )}
    </div>
  )
}

export default RewardsBanner

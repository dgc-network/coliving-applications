import React from 'react'
import clsx from 'clsx'

import Paper from 'components/paper'
import styles from './RewardsCTABanner.module.css'
import { useIsMobile, useModalControls } from 'utils/hooks'
import DigitalcoinRewardsModal from 'components/digitalcoinRewardsModal'
import { IconArrow, IconCrown } from '@coliving/stems'

const messages = {
  rewards: '$DGC REWARDS',
  description: 'TOP 10 API APPS EACH MONTH WIN $DGC',
  learnMore: 'LEARN MORE'
}

type OwnProps = {
  className?: string
}

type RewardsCTABannerProps = OwnProps

const RewardsCTABanner: React.FC<RewardsCTABannerProps> = ({ className }) => {
  const { isOpen, onClick, onClose } = useModalControls()
  const isMobile = useIsMobile()

  return (
    <>
      <DigitalcoinRewardsModal isOpen={isOpen} onClose={onClose} />
      <Paper
        className={clsx(styles.container, {
          [className!]: className,
          [styles.mobile]: isMobile
        })}
        onClick={onClick}
      >
        <div className={styles.rewardsText}>
          <IconCrown className={styles.iconCrown} />
          {messages.rewards}
        </div>
        <span className={styles.descriptionText}>{messages.description}</span>

        {!isMobile && (
          <div className={styles.learnMore}>
            {messages.learnMore}
            <IconArrow />
          </div>
        )}
      </Paper>
    </>
  )
}

export default RewardsCTABanner

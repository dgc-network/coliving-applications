import { useCallback } from 'react'

import { useModalState } from 'common/hooks/useModalState'
import { useProfileTier } from 'common/hooks/wallet'
import Drawer from 'components/drawer/drawer'
import {
  liveTierMapPng,
  TierLevel,
  TierNumber
} from 'pages/digitalcoin-rewards-page/Tiers'
import { getKeyboardVisibility } from 'store/application/ui/mobileKeyboard/selectors'
import { useSelector } from 'utils/reducer'

import { BadgeTierText } from './profilePageBadge'
import styles from './TierExplainerDrawer.module.css'
import { messages } from './tierExplainerModal'

const TierExplainerDrawer = () => {
  const [isOpen, setIsOpen] = useModalState('TiersExplainer')
  const keyboardVisible = useSelector(getKeyboardVisibility)

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const tier = useProfileTier()

  return (
    <Drawer isOpen={isOpen} keyboardVisible={keyboardVisible} onClose={onClose}>
      <div className={styles.drawer}>
        <div className={styles.top}>
          {liveTierMapPng[tier]}
          <div className={styles.topText}>
            <TierNumber tier={tier} />
            <BadgeTierText
              tier={tier}
              fontSize={28}
              className={styles.badgeColoredText}
            />
            <TierLevel tier={tier} />
          </div>
        </div>
        <div className={styles.textContainer}>
          {messages.desc1}
          <br />
          <br />
          {messages.desc2}
        </div>
      </div>
    </Drawer>
  )
}

export default TierExplainerDrawer

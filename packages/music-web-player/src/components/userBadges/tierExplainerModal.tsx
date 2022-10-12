import { useCallback } from 'react'

import { Button, ButtonSize, ButtonType, Modal } from '@coliving/stems'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useProfileTier } from 'common/hooks/wallet'
import { Tier } from 'pages/digitalcoin-rewards-page/Tiers'
import { LIVE_PAGE } from 'utils/route'

import styles from './TierExplainerModal.module.css'

export const messages = {
  title: '$DGCO VIP Tiers',
  desc1: 'Unlock $DGCO VIP Tiers by simply holding more $DGCO.',
  desc2:
    'Advancing to a new tier will earn you a profile badge, visible throughout the app, and unlock various new features, as they are released.',
  learnMore: 'LEARN MORE'
}

const TierExplainerModal = () => {
  const dispatch = useDispatch()
  const tier = useProfileTier()

  const [isOpen, setIsOpen] = useModalState('TiersExplainer')

  const handleDismiss = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const onClickLearnMore = useCallback(() => {
    handleDismiss()
    dispatch(pushRoute(LIVE_PAGE))
  }, [dispatch, handleDismiss])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      bodyClassName={styles.modalBody}
      showTitleHeader
      title={messages.title}
      showDismissButton
      dismissOnClickOutside
      contentHorizontalPadding={48}
    >
      <div className={styles.container}>
        <div className={styles.left}>
          <div className={styles.textContainer}>
            {messages.desc1}
            <br />
            <br />
            {messages.desc2}
          </div>
          <Button
            type={ButtonType.PRIMARY_ALT}
            size={ButtonSize.MEDIUM}
            text={messages.learnMore}
            className={styles.button}
            onClick={onClickLearnMore}
          />
        </div>
        <div className={styles.tierWrapper}>
          <Tier isCompact tier={tier} />
        </div>
      </div>
    </Modal>
  )
}

export default TierExplainerModal

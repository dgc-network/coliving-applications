import { ReactComponent as IconGold } from 'assets/img/IconGoldBadge.svg'
import { useModalState } from 'common/hooks/useModalState'
import Drawer from 'components/drawer/drawer'

import styles from './transferAudioMobileDrawer.module.css'

const messages = {
  title: 'Transfer $DGCO',
  subtitle: 'To transfer LIVE please visit coliving.lol from a desktop browser'
}

const TransferAudioMobileDrawer = () => {
  const [isOpen, setOpen] = useModalState('TransferAudioMobileWarning')

  return (
    <Drawer isOpen={isOpen} onClose={() => setOpen(false)}>
      <div className={styles.container}>
        <IconGold />
        <span className={styles.title}>{messages.title}</span>
        <span className={styles.subtitle}>{messages.subtitle}</span>
      </div>
    </Drawer>
  )
}

export default TransferAudioMobileDrawer

import { BNWei } from '@coliving/common'
import { IconInfo } from '@coliving/stems'
import BN from 'bn.js'

import { useModalState } from 'common/hooks/useModalState'
import { getAssociatedWallets } from 'common/store/pages/token-dashboard/selectors'
import { getAccountBalance } from 'common/store/wallet/selectors'
import Tooltip from 'components/tooltip/Tooltip'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useSelector } from 'utils/reducer'

import DisplayLive from '../DisplayLive'
import WalletsTable from '../WalletsTable'

import styles from './AudioBreakdownModal.module.css'
import ModalDrawer from './ModalDrawer'

const messages = {
  modalTitle: '$LIVE BREAKDOWN',
  total: 'TOTAL $LIVE',
  colivingWallet: 'COLIVING WALLET',
  colivingWalletDescription: 'You can use this $LIVE throughout the app',
  linkedWallets: 'LINKED WALLETS',
  linkedWalletsDescription:
    'Linked wallets are more secure but not all features are supported',
  linkedWalletsTooltip:
    'Linked wallets affect VIP status and NFTs. Upcoming features may require different behavior to support linked wallets. '
}

const AudioBreakdownBody = () => {
  const wm = useWithMobileStyle(styles.mobile)
  const accountBalance = (useSelector(getAccountBalance) ??
    new BN('0')) as BNWei

  const { connectedEthWallets: ethWallets, connectedSolWallets: solWallets } =
    useSelector(getAssociatedWallets)

  const linkedWalletsBalance = ((ethWallets ?? [])
    .concat(solWallets ?? [])
    .reduce((total, wallet) => {
      return total.add(wallet.balance)
    }, new BN('0')) ?? new BN('0')) as BNWei

  const totalBalance = accountBalance.add(linkedWalletsBalance) as BNWei

  return (
    <div className={wm(styles.container)}>
      <DisplayLive
        showLabel={false}
        amount={totalBalance}
        className={wm(styles.sectionAmountContainer)}
        tokenClassName={wm(styles.totalAudio)}
      />
      <div className={wm(styles.totalText)}>{messages.total}</div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {messages.colivingWallet}
          <DisplayLive
            showLabel={false}
            amount={accountBalance}
            className={wm(styles.sectionAmountContainer)}
            tokenClassName={wm(styles.sectionAmount)}
          />
        </div>
        <div className={wm(styles.sectionDescription)}>
          {messages.colivingWalletDescription}
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {messages.linkedWallets}
          <DisplayLive
            showLabel={false}
            amount={linkedWalletsBalance}
            className={wm(styles.sectionAmountContainer)}
            tokenClassName={wm(styles.sectionAmount)}
          />
        </div>
        <WalletsTable className={styles.walletsTable} />
        <div className={wm(styles.sectionDescription)}>
          {messages.linkedWalletsDescription}
          <Tooltip
            text={messages.linkedWalletsTooltip}
            className={styles.tooltip}
            mouseEnterDelay={0.1}
            mount='body'
          >
            <IconInfo className={wm(styles.iconInfo)} />
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

const AudioBreakdownModal = () => {
  const [isOpen, setOpen] = useModalState('AudioBreakdown')
  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={messages.modalTitle}
      isFullscreen={true}
      showTitleHeader
      showDismissButton
      useGradientTitle={false}
    >
      <AudioBreakdownBody />
    </ModalDrawer>
  )
}

export default AudioBreakdownModal

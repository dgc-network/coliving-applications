import { WalletAddress, BNWei } from '@coliving/common'

import { formatWei } from 'common/utils/wallet'

import { ModalBodyTitle, ModalBodyWrapper } from '../WalletModal'

import DisplayLive from './DisplayLive'
import PurpleBox from './PurpleBox'
import { AddressWithArrow } from './SendInputConfirmation'
import styles from './SendInputSuccess.module.css'
import TokenHoverTooltip from './TokenHoverTooltip'

type SendInputSuccessProps = {
  sentAmount: BNWei
  recipientAddress: WalletAddress
  balance: BNWei
}

const messages = {
  success: 'YOU HAVE SUCCESSFULLY SENT',
  note: 'Note: The $LIVE may take a couple minutes to show up',
  newBalance: 'YOUR BALANCE IS NOW',
  currency: '$LIVE'
}

const SendInputSuccess = ({
  sentAmount,
  recipientAddress,
  balance
}: SendInputSuccessProps) => {
  return (
    <ModalBodyWrapper>
      <div className={styles.titleWrapper}>
        <ModalBodyTitle text={messages.success} />
      </div>
      <DisplayLive amount={sentAmount} />
      <AddressWithArrow address={recipientAddress} />
      <div className={styles.noteWrapper}>{messages.note}</div>
      <PurpleBox
        className={styles.box}
        label={messages.newBalance}
        text={
          <>
            <TokenHoverTooltip balance={balance}>
              <span className={styles.amount}>{formatWei(balance, true)}</span>
            </TokenHoverTooltip>
            <span className={styles.label}>{messages.currency}</span>
          </>
        }
      />
    </ModalBodyWrapper>
  )
}

export default SendInputSuccess

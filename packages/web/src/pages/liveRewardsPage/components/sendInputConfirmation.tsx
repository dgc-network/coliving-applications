import { BNWei, StringLive, WalletAddress } from '@coliving/common'
import { Button, ButtonType, IconArrow } from '@coliving/stems'

import { stringAudioToBN, weiToAudio } from 'common/utils/wallet'

import { ModalBodyTitle, ModalBodyWrapper } from '../walletModal'

import DashboardTokenValueSlider from './dashboardTokenValueSlider'
import DisplayLive from './DisplayLive'
import styles from './SendInputConfirmation.module.css'

const messages = {
  title: "YOU'RE ABOUT TO SEND",
  sendButton: 'SEND $LIVE'
}

type SendInputConfirmationProps = {
  balance: BNWei
  amountToTransfer: BNWei
  recipientAddress: WalletAddress
  onSend: () => void
}

export const AddressWithArrow = ({ address }: { address: WalletAddress }) => {
  return (
    <div className={styles.addressWrapper}>
      <IconArrow className={styles.arrow} />
      {address}
    </div>
  )
}

const SendInputConfirmation = ({
  amountToTransfer,
  balance,
  recipientAddress,
  onSend
}: SendInputConfirmationProps) => {
  return (
    <ModalBodyWrapper>
      <div className={styles.titleWrapper}>
        <ModalBodyTitle text={messages.title} />
      </div>
      <DashboardTokenValueSlider
        min={stringAudioToBN('0' as StringLive)}
        max={weiToAudio(balance)}
        value={weiToAudio(amountToTransfer)}
      />
      <DisplayLive amount={amountToTransfer} />
      <AddressWithArrow address={recipientAddress} />
      <div className={styles.buttonWrapper}>
        <Button
          text={messages.sendButton}
          onClick={onSend}
          type={ButtonType.PRIMARY_ALT}
        />
      </div>
    </ModalBodyWrapper>
  )
}

export default SendInputConfirmation

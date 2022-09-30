import { BNWei, WalletAddress } from '@coliving/common'
import cn from 'classnames'

import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'

import { ModalBodyTitle, ModalBodyWrapper } from '../walletModal'

import DisplayLive from './displayLive'
import { AddressWithArrow } from './sendInputConfirmation'
import styles from './sendingModalBody.module.css'

type SendingModalBodyProps = {
  amountToTransfer: BNWei
  recipientAddress: WalletAddress
}

const messages = {
  title: 'SENDING',
  message: "Please don't go anywhere. This may take a little while."
}

const SendingModalBody = ({
  amountToTransfer,
  recipientAddress
}: SendingModalBodyProps) => {
  return (
    <ModalBodyWrapper className={styles.container}>
      <div className={styles.titleWrapper}>
        <ModalBodyTitle text={messages.title} />
      </div>
      <DisplayLive amount={amountToTransfer} className={styles.displayAudio} />
      <AddressWithArrow address={recipientAddress} />
      <LoadingSpinner className={styles.spinner} />
      <div className={cn(styles.message, styles.msgWidth)}>
        {messages.message}
      </div>
    </ModalBodyWrapper>
  )
}

export default SendingModalBody

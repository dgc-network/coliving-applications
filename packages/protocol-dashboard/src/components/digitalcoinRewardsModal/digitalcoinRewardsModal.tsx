import React, { useCallback } from 'react'
import { ButtonType } from '@coliving/stems'

import Modal from 'components/modal'
import Button from 'components/button'
import styles from './DigitalcoinRewardsModal.module.css'
import apiLogo from 'assets/img/apiLogo.png'
import useOpenLink from 'hooks/useOpenLink'
import { COLIVING_API_URL } from 'utils/routes'

const messages = {
  title: '$DGC REWARDS',
  apiLogo: 'Coliving API Logo',
  header: 'It’s easy to build your own app on Coliving',
  description1: 'The top 10 Coliving API apps each month win.',
  description2: 'See your app on the leaderboard? Email api@.co',
  btn: 'LEARN MORE ABOUT USING THE API'
}

type OwnProps = {
  isOpen: boolean
  onClose: () => void
}

type DigitalcoinRewardsModalProps = OwnProps

const DigitalcoinRewardsModal: React.FC<DigitalcoinRewardsModalProps> = ({
  isOpen,
  onClose
}: DigitalcoinRewardsModalProps) => {
  const openLink = useOpenLink(COLIVING_API_URL)
  const onClickBtn = useCallback(
    (e: React.MouseEvent) => {
      openLink(e)
      onClose()
    },
    [openLink, onClose]
  )
  return (
    <Modal
      title={messages.title}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
      dismissOnClickOutside={true}
    >
      <img className={styles.apiLogo} src={apiLogo} alt={messages.apiLogo} />
      <h6 className={styles.header}>{messages.header}</h6>
      <p className={styles.description}>{messages.description1}</p>
      <p className={styles.description}>{messages.description2}</p>
      <Button
        text={messages.btn}
        className={styles.btn}
        type={ButtonType.PRIMARY}
        onClick={onClickBtn}
      />
    </Modal>
  )
}

export default DigitalcoinRewardsModal

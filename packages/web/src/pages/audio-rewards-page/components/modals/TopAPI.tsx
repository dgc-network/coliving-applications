import { useCallback } from 'react'

import ColivingAPI from 'assets/img/colivingAPI.png'
import { useModalState } from 'common/hooks/useModalState'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { COLIVING_API_LINK } from 'utils/route'

import ButtonWithArrow from '../ButtonWithArrow'

import ModalDrawer from './ModalDrawer'
import styles from './TopApi.module.css'

const messages = {
  modalTitle: 'Coliving API',
  title: "It's easy to build your own app on Coliving",
  description: 'The top 10 Coliving API apps each month win',
  button: 'Learn More About The Coliving API'
}

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const TopAPIBody = () => {
  const wm = useWithMobileStyle(styles.mobile)

  const onClickColivingAPI = useCallback(() => {
    window.open(COLIVING_API_LINK, '__blank')
  }, [])

  return (
    <div className={wm(styles.container)}>
      <img src={ColivingAPI} alt='Coliving API Logo' />
      <span className={styles.title}>{messages.title}</span>
      <span className={styles.subtitle}>{messages.description}</span>
      <ButtonWithArrow
        text={messages.button}
        className={styles.button}
        onClick={onClickColivingAPI}
        textClassName={styles.buttonText}
      />
    </div>
  )
}

const TopAPIModal = () => {
  const [isOpen, setOpen] = useModalState('APIRewardsExplainer')

  return (
    <ModalDrawer
      isOpen={!IS_NATIVE_MOBILE && isOpen}
      onClose={() => setOpen(false)}
      title={messages.modalTitle}
      isFullscreen={false}
      showTitleHeader
      showDismissButton
    >
      <TopAPIBody />
    </ModalDrawer>
  )
}

export default TopAPIModal

import { Button, ButtonType } from '@coliving/stems'

import Drawer from 'components/drawer/Drawer'

import styles from './RemovePlaylistAgreementDrawer.module.css'

const messages = {
  title: `Are You Sure?`,
  description: (agreementName: string) =>
    `Do you want to remove ${agreementName} from this playlist?`,
  submit: 'Remove Agreement',
  cancel: 'Nevermind'
}

type RemovePlaylistAgreementDrawerProps = {
  isOpen: boolean
  agreementTitle?: string
  onClose: () => void
  onConfirm: () => void
}

const RemovePlaylistAgreementDrawer = ({
  isOpen,
  onClose,
  agreementTitle = '',
  onConfirm
}: RemovePlaylistAgreementDrawerProps) => {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} shouldClose={!isOpen}>
      <div className={styles.drawer}>
        <h4 className={styles.title}>{messages.title}</h4>
        <div className={styles.description}>
          {messages.description(agreementTitle)}
        </div>
        <Button
          className={styles.submit}
          type={ButtonType.PRIMARY_ALT}
          text={messages.submit}
          textClassName={styles.submitText}
          onClick={onConfirm}
        />
        <div className={styles.cancel} onClick={onClose}>
          {messages.cancel}
        </div>
      </div>
    </Drawer>
  )
}

export default RemovePlaylistAgreementDrawer

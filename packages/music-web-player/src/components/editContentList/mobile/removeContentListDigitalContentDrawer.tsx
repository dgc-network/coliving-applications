import { Button, ButtonType } from '@coliving/stems'

import Drawer from 'components/drawer/drawer'

import styles from './RemoveContentListDigitalContentDrawer.module.css'

const messages = {
  title: `Are You Sure?`,
  description: (digitalContentName: string) =>
    `Do you want to remove ${digitalContentName} from this contentList?`,
  submit: 'Remove DigitalContent',
  cancel: 'Nevermind'
}

type RemoveContentListDigitalContentDrawerProps = {
  isOpen: boolean
  digitalContentTitle?: string
  onClose: () => void
  onConfirm: () => void
}

const RemoveContentListDigitalContentDrawer = ({
  isOpen,
  onClose,
  digitalContentTitle = '',
  onConfirm
}: RemoveContentListDigitalContentDrawerProps) => {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} shouldClose={!isOpen}>
      <div className={styles.drawer}>
        <h4 className={styles.title}>{messages.title}</h4>
        <div className={styles.description}>
          {messages.description(digitalContentTitle)}
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

export default RemoveContentListDigitalContentDrawer

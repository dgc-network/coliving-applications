import cn from 'classnames'

import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'

import { ModalBodyWrapper } from '../walletModal'

import styles from './migrationModalBody.module.css'

const messages = {
  description:
    'Please wait a moment. We’re performing some necessary one-time maintenance.',
  warning: 'Don’t close this window or refresh the page.'
}

const MigrationModalBody = () => {
  return (
    <ModalBodyWrapper className={cn(styles.container)}>
      <p className={styles.description}>{messages.description}</p>
      <LoadingSpinner className={styles.spinner} />
      <p className={styles.warning}>{messages.warning}</p>
    </ModalBodyWrapper>
  )
}

export default MigrationModalBody

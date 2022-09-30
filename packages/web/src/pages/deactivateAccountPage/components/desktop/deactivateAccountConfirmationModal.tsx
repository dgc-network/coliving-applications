import { Button, ButtonType, Modal } from '@coliving/stems'
import cn from 'classnames'

import LoadingSpinnerFullPage from 'components/loadingSpinnerFullPage/loadingSpinnerFullPage'

import { messages } from '../../deactivateAccountPage'

import styles from './deactivateAccountConfirmationModal.module.css'

type DeactivateAccountModalProps = {
  isLoading: boolean
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeactivateAccountConfirmationModal = ({
  isLoading,
  isVisible,
  onClose,
  onConfirm
}: DeactivateAccountModalProps) => {
  return (
    <Modal
      bodyClassName={styles.confirmModal}
      isOpen={isVisible}
      onClose={onClose}
      showDismissButton
      showTitleHeader
      title={messages.confirmTitle}
    >
      <div className={styles.container}>
        {isLoading ? (
          <LoadingSpinnerFullPage />
        ) : (
          <div className={styles.confirmText}>{messages.confirm}</div>
        )}
        <div className={styles.buttons}>
          <Button
            className={cn(styles.button, {
              [styles.buttonDanger]: !isLoading
            })}
            isDisabled={isLoading}
            onClick={onConfirm}
            textClassName={styles.deleteButtonText}
            text={messages.buttonDeactivate}
            type={isLoading ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT} css={undefined}          />
          <Button
            className={styles.button}
            isDisabled={isLoading}
            onClick={onClose}
            text={messages.buttonGoBack}
            type={isLoading ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT} css={undefined}          />
        </div>
      </div>
    </Modal>
  )
}

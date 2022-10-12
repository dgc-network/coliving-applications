import { useCallback, useMemo } from 'react'

import { Nullable } from '@coliving/common'
import {
  Button,
  Modal,
  ButtonType,
  IconTikTokInverted,
  IconTikTok
} from '@coliving/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import {
  getStatus,
  getDigitalContent
} from 'common/store/ui/shareSoundToTiktokModal/selectors'
import {
  authenticated,
  setStatus,
  share
} from 'common/store/ui/shareSoundToTiktokModal/slice'
import { Status } from 'common/store/ui/shareSoundToTiktokModal/types'
import Drawer from 'components/drawer/drawer'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import { useTikTokAuth } from 'hooks/useTikTokAuth'
import { isMobile } from 'utils/clientUtil'

import styles from './ShareSoundToTikTokModal.module.css'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

enum FileRequirementError {
  MIN_LENGTH,
  MAX_LENGTH
}

const messages = {
  completeButton: 'Done',
  confirmation: 'Are you sure you want to share "[DigitalContent Name]" to TikTok?',
  error: 'Something went wrong, please try again',
  errorMaxLength: 'Maximum Length for TikTok Sounds is 5 Minutes',
  errorMinLength: 'Minimum Length for TikTok Sounds is 10 Seconds',
  inProgress: 'Sharing "[DigitalContent Name]" to TikTok',
  shareButton: 'Share Sound to TikTok',
  success: '"[DigitalContent Name]" has been shared to TikTok!',
  title: 'Share to TikTok'
}

const fileRequirementErrorMessages = {
  [FileRequirementError.MAX_LENGTH]: messages.errorMaxLength,
  [FileRequirementError.MIN_LENGTH]: messages.errorMinLength
}

const ShareSoundToTikTokModal = () => {
  const mobile = isMobile()

  const [isOpen, setIsOpen] = useModalState('ShareSoundToTikTok')
  const dispatch = useDispatch()

  const digital_content = useSelector(getDigitalContent)
  const status = useSelector(getStatus)

  const withTikTokAuth = useTikTokAuth({
    onError: () => dispatch(setStatus({ status: Status.SHARE_ERROR }))
  })

  const fileRequirementError: Nullable<FileRequirementError> = useMemo(() => {
    if (digital_content) {
      if (digital_content.duration > 300) {
        return FileRequirementError.MAX_LENGTH
      }
      if (digital_content.duration < 10) {
        return FileRequirementError.MIN_LENGTH
      }
    }
    return null
  }, [digital_content])

  const handleShareButtonClick = () => {
    if (digital_content) {
      // Trigger the share process, which initially downloads the digital_content to the client
      dispatch(share())

      // Trigger the authentication process
      withTikTokAuth((accessToken, openId) =>
        dispatch(authenticated({ accessToken, openId }))
      )
    }
  }

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen])

  const renderMessage = () => {
    const hasError =
      fileRequirementError !== null || status === Status.SHARE_ERROR

    const rawMessage = {
      [Status.SHARE_STARTED]: messages.inProgress,
      [Status.SHARE_SUCCESS]: messages.success,
      [Status.SHARE_ERROR]: messages.error,
      [Status.SHARE_UNINITIALIZED]: messages.confirmation
    }[status as Status]

    if (hasError) {
      const errorMessage =
        status === Status.SHARE_ERROR
          ? messages.error
          : fileRequirementErrorMessages[fileRequirementError!]

      return (
        <div className={cn(styles.message, styles.errorMessage)}>
          {errorMessage}
        </div>
      )
    } else {
      return (
        <div className={styles.message}>
          {rawMessage.replace('[DigitalContent Name]', digital_content?.title ?? '')}
        </div>
      )
    }
  }

  const renderButton = () => {
    if (status === Status.SHARE_SUCCESS) {
      return (
        <Button
          className={styles.button}
          onClick={() => setIsOpen(false)}
          text={messages.completeButton}
        />
      )
    } else {
      const isButtonDisabled = fileRequirementError !== null
      return (
        <Button
          className={styles.button}
          type={isButtonDisabled ? ButtonType.DISABLED : ButtonType.PRIMARY}
          isDisabled={isButtonDisabled}
          onClick={handleShareButtonClick}
          text={
            <div className={styles.button}>
              <span>{messages.shareButton}</span>
              <IconTikTokInverted />
            </div>
          }
        />
      )
    }
  }

  return mobile ? (
    !IS_NATIVE_MOBILE ? (
      <Drawer onClose={handleClose} isOpen={isOpen}>
        <div className={cn(styles.modalContent, styles.mobile)}>
          <div className={cn(styles.modalHeader, styles.mobile)}>
            <div className={cn(styles.titleContainer, styles.mobile)}>
              <IconTikTok />
              <div>{messages.title}</div>
            </div>
          </div>
          {renderMessage()}
          {status === Status.SHARE_STARTED ? (
            <LoadingSpinner />
          ) : (
            renderButton()
          )}
        </div>
      </Drawer>
    ) : null
  ) : (
    <Modal
      allowScroll={false}
      bodyClassName={styles.modalBody}
      dismissOnClickOutside={status !== Status.SHARE_STARTED}
      headerContainerClassName={styles.modalHeader}
      isOpen={isOpen}
      onClose={handleClose}
      showTitleHeader
      showDismissButton
      title={
        <div className={styles.titleContainer}>
          <IconTikTok />
          <div>{messages.title}</div>
        </div>
      }
    >
      <div className={styles.modalContent}>
        {renderMessage()}
        {status === Status.SHARE_STARTED ? <LoadingSpinner /> : renderButton()}
      </div>
    </Modal>
  )
}

export default ShareSoundToTikTokModal

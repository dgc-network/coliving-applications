import { useCallback, useState, useEffect, useRef } from 'react'

import { ID, SquareSizes, DigitalContent, User } from '@coliving/common'
import { Modal, Button, ButtonSize, ButtonType } from '@coliving/stems'
import { debounce } from 'lodash'

import Input from 'components/dataEntry/input'
import DynamicImage from 'components/dynamicImage/dynamicImage'
import UserBadges from 'components/userBadges/userBadges'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'
import { fullAgreementPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixSettingsModal.module.css'

const INPUT_DEBOUNCE_MS = 1000

const messages = {
  done: 'DONE',
  title: 'REMIX SETTINGS',
  subtitle: 'Specify what digital_content you remixed here',
  remixOf: 'This is a Remix of: (Paste Coliving DigitalContent URL)',
  error: 'Please paste a valid Coliving digital_content URL',
  by: 'by'
}

type AgreementInfoProps = {
  digital_content: DigitalContent | null
  user: User | null
}

const g = withNullGuard(
  ({ digital_content, user, ...p }: AgreementInfoProps) =>
    digital_content && user && { ...p, digital_content, user }
)

const AgreementInfo = g(({ digital_content, user }) => {
  const image = useAgreementCoverArt(
    digital_content.digital_content_id,
    digital_content._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )
  return (
    <div className={styles.digital_content}>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      {digital_content.title}
      <div className={styles.by}>{messages.by}</div>
      <div className={styles.landlordName}>
        {user.name}
        <UserBadges
          className={styles.iconVerified}
          userId={user.user_id}
          badgeSize={8}
        />
      </div>
    </div>
  )
})

type RemixSettingsModalProps = {
  isOpen: boolean
  onClose: (agreementId: ID | null) => void
  onEditUrl: (url: string) => void
  isInvalidAgreement: boolean
  digital_content: DigitalContent | null
  user: User | null
}

const RemixSettingsModal = ({
  isOpen,
  onClose,
  onEditUrl,
  digital_content,
  user,
  isInvalidAgreement
}: RemixSettingsModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (url === null && digital_content && isOpen) {
      setUrl(fullAgreementPage(digital_content.permalink))
    }
  }, [isOpen, digital_content, url, setUrl])

  useEffect(() => {
    if (!isOpen) setUrl(null)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, inputRef])

  const onChange = useCallback(
    (url: string) => {
      // Need to decode the URL
      // here to properly show pasted
      // URLS with non-ascii chars
      const decoded = decodeURI(url)
      setUrl(decoded)
      debounce(() => onEditUrl(decoded), INPUT_DEBOUNCE_MS, {
        leading: true,
        trailing: false
      })()
    },
    [onEditUrl, setUrl]
  )

  const onCloseModal = useCallback(() => {
    const agreementId = url && digital_content && !isInvalidAgreement ? digital_content.digital_content_id : null
    onClose(agreementId)
  }, [onClose, digital_content, isInvalidAgreement, url])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCloseModal}
      showTitleHeader
      title={messages.title}
      subtitle={messages.subtitle}
      dismissOnClickOutside
      showDismissButton
      // Since this can be nested in the edit digital_content modal
      // Appear on top of it
      zIndex={1002}
      bodyClassName={styles.modalContainer}
      headerContainerClassName={styles.modalHeader}
      titleClassName={styles.modalTitle}
      subtitleClassName={styles.modalSubtitle}
    >
      <div className={styles.content}>
        <div className={styles.info}>{messages.remixOf}</div>
        <Input
          inputRef={inputRef}
          value={url}
          placeholder=''
          size='small'
          onChange={onChange}
        />
        {url && (
          <div className={styles.bottom}>
            {isInvalidAgreement ? (
              <div className={styles.error}>{messages.error}</div>
            ) : (
              <AgreementInfo user={user} digital_content={digital_content} />
            )}
          </div>
        )}
      </div>
      <Button
        className={styles.doneButton}
        text={messages.done}
        size={ButtonSize.TINY}
        type={ButtonType.SECONDARY}
        onClick={onCloseModal}
      />
    </Modal>
  )
}

export default RemixSettingsModal

import { Modal } from '@coliving/stems'
import cn from 'classnames'

import Switch from '../switch/switch'

import styles from './UnlistedAgreementModal.module.css'

const messages = {
  title: 'AGREEMENT VISIBILITY',
  subtitle:
    "Hidden agreements won't show up on your profile.\nAnyone who has the link will be able to listen.",
  hideAgreement: 'Hide DigitalContent'
}

// All possible toggleable fields
enum AgreementMetadataField {
  UNLISTED = 'unlisted',
  GENRE = 'genre',
  MOOD = 'mood',
  TAGS = 'tags',
  SHARE = 'share',
  PLAYS = 'plays'
}

// The order of toggles in the modal
const agreementMetadataOrder = [
  AgreementMetadataField.GENRE,
  AgreementMetadataField.MOOD,
  AgreementMetadataField.TAGS,
  AgreementMetadataField.SHARE,
  AgreementMetadataField.PLAYS
]

// Maps switch identifiers to section titles on the UI
const metadataTitleMap = {
  [AgreementMetadataField.UNLISTED]: 'DigitalContent',
  [AgreementMetadataField.GENRE]: 'Genre',
  [AgreementMetadataField.MOOD]: 'Mood',
  [AgreementMetadataField.TAGS]: 'Tags',
  [AgreementMetadataField.SHARE]: 'Share Button',
  [AgreementMetadataField.PLAYS]: 'Play Count'
}

type AgreementMetadataSectionProps = {
  title: string
  isVisible: boolean
  isDisabled: boolean
  didSet: (enabled: boolean) => void
}

// Individual section of the modal.
const AgreementMetadataSection = ({
  title,
  isVisible,
  isDisabled,
  didSet
}: AgreementMetadataSectionProps) => {
  return (
    <div
      className={cn(styles.section, { [styles.disabledSection]: isDisabled })}
    >
      <span>{title}</span>
      <div className={styles.switchContainer}>
        <Switch
          isOn={isVisible}
          handleToggle={() => {
            didSet(!isVisible)
          }}
          isDisabled={isDisabled}
        />
      </div>
    </div>
  )
}

type UnlistedAgreementModalProps = {
  // Whether or not to show the hide digital_content switch or just metadata switches..
  showHideAgreementSwitch: boolean
  isOpen: boolean
  metadataState: AgreementMetadataState
  didUpdateState: (newState: AgreementMetadataState) => void
  onClose: () => void
}

type AgreementMetadataState = {
  unlisted: boolean
  genre: boolean
  mood: boolean
  tags: boolean
  share: boolean
  plays: boolean
}

// A modal that allows you to toggle a digital_content to unlisted, as
// well as toggle individual metadata field visibility.
const UnlistedAgreementModal = ({
  showHideAgreementSwitch,
  isOpen,
  metadataState,
  didUpdateState,
  onClose
}: UnlistedAgreementModalProps) => {
  const makeDidSetField = (field: AgreementMetadataField) => (visible: boolean) => {
    const newState = { ...metadataState }
    newState[field] = visible
    didUpdateState(newState)
  }

  const makeSectionTitle = (metadata: AgreementMetadataField) =>
    `Show ${metadataTitleMap[metadata]}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showDismissButton
      showTitleHeader
      title={messages.title}
      subtitle={messages.subtitle}
      contentHorizontalPadding={32}
      bodyClassName={styles.modalBodyStyle}
      titleClassName={styles.modalTitleStyle}
    >
      <div className={styles.container}>
        {showHideAgreementSwitch && (
          <div className={styles.hideAgreementsSection}>
            <AgreementMetadataSection
              isDisabled={false}
              isVisible={metadataState.unlisted}
              title={messages.hideAgreement}
              didSet={makeDidSetField(AgreementMetadataField.UNLISTED)}
            />
          </div>
        )}
        {agreementMetadataOrder.map((field, i) => {
          return (
            <AgreementMetadataSection
              key={i}
              isDisabled={!metadataState.unlisted}
              isVisible={metadataState[field]}
              title={makeSectionTitle(field)}
              didSet={makeDidSetField(field)}
            />
          )
        })}
      </div>
    </Modal>
  )
}

export default UnlistedAgreementModal

import { Modal } from '@coliving/stems'
import cn from 'classnames'

import Switch from '../switch/switch'

import styles from './UnlistedDigitalContentModal.module.css'

const messages = {
  title: 'AGREEMENT VISIBILITY',
  subtitle:
    "Hidden digitalContents won't show up on your profile.\nAnyone who has the link will be able to listen.",
  hideDigitalContent: 'Hide DigitalContent'
}

// All possible toggleable fields
enum DigitalContentMetadataField {
  UNLISTED = 'unlisted',
  GENRE = 'genre',
  MOOD = 'mood',
  TAGS = 'tags',
  SHARE = 'share',
  PLAYS = 'plays'
}

// The order of toggles in the modal
const digitalContentMetadataOrder = [
  DigitalContentMetadataField.GENRE,
  DigitalContentMetadataField.MOOD,
  DigitalContentMetadataField.TAGS,
  DigitalContentMetadataField.SHARE,
  DigitalContentMetadataField.PLAYS
]

// Maps switch identifiers to section titles on the UI
const metadataTitleMap = {
  [DigitalContentMetadataField.UNLISTED]: 'DigitalContent',
  [DigitalContentMetadataField.GENRE]: 'Genre',
  [DigitalContentMetadataField.MOOD]: 'Mood',
  [DigitalContentMetadataField.TAGS]: 'Tags',
  [DigitalContentMetadataField.SHARE]: 'Share Button',
  [DigitalContentMetadataField.PLAYS]: 'Play Count'
}

type DigitalContentMetadataSectionProps = {
  title: string
  isVisible: boolean
  isDisabled: boolean
  didSet: (enabled: boolean) => void
}

// Individual section of the modal.
const DigitalContentMetadataSection = ({
  title,
  isVisible,
  isDisabled,
  didSet
}: DigitalContentMetadataSectionProps) => {
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

type UnlistedDigitalContentModalProps = {
  // Whether or not to show the hide digital_content switch or just metadata switches..
  showHideDigitalContentSwitch: boolean
  isOpen: boolean
  metadataState: DigitalContentMetadataState
  didUpdateState: (newState: DigitalContentMetadataState) => void
  onClose: () => void
}

type DigitalContentMetadataState = {
  unlisted: boolean
  genre: boolean
  mood: boolean
  tags: boolean
  share: boolean
  plays: boolean
}

// A modal that allows you to toggle a digital_content to unlisted, as
// well as toggle individual metadata field visibility.
const UnlistedDigitalContentModal = ({
  showHideDigitalContentSwitch,
  isOpen,
  metadataState,
  didUpdateState,
  onClose
}: UnlistedDigitalContentModalProps) => {
  const makeDidSetField = (field: DigitalContentMetadataField) => (visible: boolean) => {
    const newState = { ...metadataState }
    newState[field] = visible
    didUpdateState(newState)
  }

  const makeSectionTitle = (metadata: DigitalContentMetadataField) =>
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
        {showHideDigitalContentSwitch && (
          <div className={styles.hideDigitalContentsSection}>
            <DigitalContentMetadataSection
              isDisabled={false}
              isVisible={metadataState.unlisted}
              title={messages.hideDigitalContent}
              didSet={makeDidSetField(DigitalContentMetadataField.UNLISTED)}
            />
          </div>
        )}
        {digitalContentMetadataOrder.map((field, i) => {
          return (
            <DigitalContentMetadataSection
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

export default UnlistedDigitalContentModal

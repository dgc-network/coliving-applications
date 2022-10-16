import { useState, useEffect, useCallback } from 'react'

import { SquareSizes } from '@coliving/common'
import { Modal, Button, ButtonSize, ButtonType } from '@coliving/stems'
import { mapValues } from 'lodash'
import PropTypes from 'prop-types'

import FormTile from 'components/dataEntry/formTile'
import { useDigitalContentCoverArt } from 'hooks/useDigitalContentCoverArt'
import * as schemas from 'schemas'
import zIndex from 'utils/zIndex'

import styles from './EditDigitalContentModal.module.css'

const EditDigitalContentModal = ({
  visible,
  title,
  onCancel,
  onSave,
  metadata,
  showUnlistedToggle,
  stems,
  onAddStems,
  onSelectStemCategory,
  onDeleteStem,
  onDelete
}) => {
  const initialForm = schemas.newDigitalContentMetadata(metadata)
  const [formFields, setFormFields] = useState(initialForm)
  const [invalidFields, setInvalidFields] = useState(
    mapValues(formFields, (v) => false)
  )
  const requiredFields = mapValues(formFields, (v) => false)
  requiredFields.genre = true
  requiredFields.title = true

  const coverArt = useDigitalContentCoverArt(
    metadata ? metadata.digital_content_id : null,
    metadata ? metadata._cover_art_sizes : null,
    SquareSizes.SIZE_1000_BY_1000
  )

  useEffect(() => {
    // If we're visible, the local form state
    // should be considered the source of truth
    if (visible) return
    setFormFields({ ...metadata })
  }, [visible, metadata])

  const onClickSave = () => {
    if (validateFormFields(formFields)) {
      onSave(formFields)
    }
  }

  const onClose = () => {
    setFormFields(initialForm)
    onCancel()
  }

  const updateDigitalContent = (field, value, invalid) => {
    if (invalid) {
      setInvalidFields((oldInvalidFields) => ({
        ...oldInvalidFields,
        [field]: true
      }))
    } else {
      setInvalidFields((oldInvalidFields) => ({
        ...oldInvalidFields,
        [field]: false
      }))
      setFormFields((oldFields) => ({ ...oldFields, [field]: value }))
    }
  }

  const validateFormFields = (formFields) => {
    const newInvalidFields = {
      ...invalidFields,
      genre: !formFields.genre,
      title: !formFields.title
    }
    setInvalidFields(newInvalidFields)
    return Object.values(newInvalidFields).every((f) => !f)
  }

  const [isArtworkPopupOpen, setIsArtworkPopupOpen] = useState(false)
  const onOpenArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(true)
  }, [setIsArtworkPopupOpen])

  const onCloseArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(false)
  }, [setIsArtworkPopupOpen])

  return (
    <Modal
      title={title}
      isOpen={visible}
      onClose={onClose}
      // Antd modal default value, behind antd DropdownInput
      zIndex={zIndex.EDIT_DIGITAL_CONTENT_MODAL}
      bodyClassName={styles.modalBody}
      titleClassName={styles.modalTitle}
      headerContainerClassName={styles.modalHeader}
      showDismissButton
      showTitleHeader
      dismissOnClickOutside={!isArtworkPopupOpen}
    >
      <div className={styles.editDigitalContent}>
        <FormTile
          // Key the form tile by id so each id gets a different instance
          // of input fields to preserve correct default values
          key={formFields.digital_content_id}
          showPreview={false}
          defaultFields={formFields}
          coverArt={coverArt}
          invalidFields={invalidFields}
          requiredFields={requiredFields}
          onChangeField={(field, value, invalid) =>
            updateDigitalContent(field, value, invalid)
          }
          stems={stems}
          onDeleteStem={onDeleteStem}
          onAddStems={onAddStems}
          onSelectStemCategory={onSelectStemCategory}
          showUnlistedToggle={showUnlistedToggle}
          showHideDigitalContentSectionInModal={false}
          onOpenArtworkPopup={onOpenArtworkPopup}
          onCloseArtworkPopup={onCloseArtworkPopup}
        />
        <div className={styles.buttons}>
          <div className={styles.buttonsLeft}>
            {onDelete ? (
              <Button
                text='DELETE DIGITAL_CONTENT'
                size={ButtonSize.TINY}
                type={ButtonType.SECONDARY}
                onClick={onDelete}
                textClassName={styles.deleteButtonText}
                className={styles.deleteButton}
              />
            ) : null}
          </div>
          <div className={styles.buttonsLeft}>
            <Button
              text='CANCEL'
              size={ButtonSize.TINY}
              type={ButtonType.COMMON}
              onClick={onCancel}
            />
            <Button
              className={styles.saveChangesButton}
              text='SAVE CHANGES'
              size={ButtonSize.TINY}
              type={ButtonType.SECONDARY}
              onClick={onClickSave}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

EditDigitalContentModal.propTypes = {
  visible: PropTypes.bool,
  title: PropTypes.string,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  metadata: PropTypes.object,

  /** Whether to show the unlisted/public button the modal */
  showUnlistedToggle: PropTypes.bool,

  /** An array of type StemUpload */
  stems: PropTypes.array,

  /** function of type (category, digitalContentIndex, stemIndex) */
  onSelectStemCategory: PropTypes.func,

  /** function of type (selectedIndex, digitalContentIndex) */
  onAddStems: PropTypes.func,

  /** function of type (index) => void */
  onDeleteStem: PropTypes.func
}

EditDigitalContentModal.defaultProps = {
  visible: true,
  title: 'EDIT DIGITAL_CONTENT',
  onCancel: () => {},
  onSave: () => {},
  onDelete: () => {},
  metadata: schemas.newDigitalContentMetadata(),
  showUnlistedToggle: true
}

export default EditDigitalContentModal

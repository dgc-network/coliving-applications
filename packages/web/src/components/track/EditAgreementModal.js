import { useState, useEffect, useCallback } from 'react'

import { SquareSizes } from '@coliving/common'
import { Modal, Button, ButtonSize, ButtonType } from '@coliving/stems'
import { mapValues } from 'lodash'
import PropTypes from 'prop-types'

import FormTile from 'components/dataEntry/formTile'
import { useAgreementCoverArt } from 'hooks/useAgreementCoverArt'
import * as schemas from 'schemas'
import zIndex from 'utils/zIndex'

import styles from './EditAgreementModal.module.css'

const EditAgreementModal = ({
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
  const initialForm = schemas.newAgreementMetadata(metadata)
  const [formFields, setFormFields] = useState(initialForm)
  const [invalidFields, setInvalidFields] = useState(
    mapValues(formFields, (v) => false)
  )
  const requiredFields = mapValues(formFields, (v) => false)
  requiredFields.genre = true
  requiredFields.title = true

  const coverArt = useAgreementCoverArt(
    metadata ? metadata.agreement_id : null,
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

  const updateAgreement = (field, value, invalid) => {
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
      zIndex={zIndex.EDIT_AGREEMENT_MODAL}
      bodyClassName={styles.modalBody}
      titleClassName={styles.modalTitle}
      headerContainerClassName={styles.modalHeader}
      showDismissButton
      showTitleHeader
      dismissOnClickOutside={!isArtworkPopupOpen}
    >
      <div className={styles.editAgreement}>
        <FormTile
          // Key the form tile by id so each id gets a different instance
          // of input fields to preserve correct default values
          key={formFields.agreement_id}
          showPreview={false}
          defaultFields={formFields}
          coverArt={coverArt}
          invalidFields={invalidFields}
          requiredFields={requiredFields}
          onChangeField={(field, value, invalid) =>
            updateAgreement(field, value, invalid)
          }
          stems={stems}
          onDeleteStem={onDeleteStem}
          onAddStems={onAddStems}
          onSelectStemCategory={onSelectStemCategory}
          showUnlistedToggle={showUnlistedToggle}
          showHideAgreementSectionInModal={false}
          onOpenArtworkPopup={onOpenArtworkPopup}
          onCloseArtworkPopup={onCloseArtworkPopup}
        />
        <div className={styles.buttons}>
          <div className={styles.buttonsLeft}>
            {onDelete ? (
              <Button
                text='DELETE AGREEMENT'
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

EditAgreementModal.propTypes = {
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

  /** function of type (category, agreementIndex, stemIndex) */
  onSelectStemCategory: PropTypes.func,

  /** function of type (selectedIndex, agreementIndex) */
  onAddStems: PropTypes.func,

  /** function of type (index) => void */
  onDeleteStem: PropTypes.func
}

EditAgreementModal.defaultProps = {
  visible: true,
  title: 'EDIT AGREEMENT',
  onCancel: () => {},
  onSave: () => {},
  onDelete: () => {},
  metadata: schemas.newAgreementMetadata(),
  showUnlistedToggle: true
}

export default EditAgreementModal

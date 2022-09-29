import { useCallback, useState } from 'react'

import { Name, ContentListLibraryFolder } from '@coliving/common'
import {
  IconFolder,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@coliving/stems'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { getContentListLibrary } from 'common/store/account/selectors'
import {
  removeContentListFolderInLibrary,
  renameContentListFolderInLibrary
} from 'common/store/contentListLibrary/helpers'
import FolderForm from 'components/create-content-list/FolderForm'
import DeleteConfirmationModal from 'components/deleteConfirmation/deleteConfirmationModal'
import { make, useRecord } from 'store/analytics/actions'
import { getFolderId } from 'store/application/ui/editFolderModal/selectors'
import { setFolderId } from 'store/application/ui/editFolderModal/slice'
import { update as updateContentListLibrary } from 'store/contentListLibrary/slice'
import { useSelector } from 'utils/reducer'
import { zIndex } from 'utils/zIndex'

import styles from './EditFolderModal.module.css'

const messages = {
  editFolderModalTitle: 'Edit Folder',
  confirmDeleteFolderModalTitle: 'Delete Folder',
  confirmDeleteFolderModalHeader:
    'Are you sure you want to delete this folder?',
  confirmDeleteFolderModalDescription:
    'Any contentLists inside will be moved out before the folder is deleted.',
  folderEntity: 'Folder'
}

const EditFolderModal = () => {
  const record = useRecord()
  const folderId = useSelector(getFolderId)
  const contentListLibrary = useSelector(getContentListLibrary)
  const [isOpen, setIsOpen] = useModalState('EditFolder')
  const folder =
    contentListLibrary == null || folderId == null
      ? null
      : (contentListLibrary.contents.find(
          (item) => item.type === 'folder' && item.id === folderId
        ) as ContentListLibraryFolder | undefined)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const onCancelDelete = () => setShowDeleteConfirmation(false)

  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(setFolderId(null))
    setIsOpen(false)
  }, [dispatch, setIsOpen])

  const handleClickCancel = useCallback(() => {
    record(make(Name.FOLDER_CANCEL_EDIT, {}))
    handleClose()
  }, [handleClose, record])

  const handleSubmit = useCallback(
    (newName: string) => {
      if (
        !(contentListLibrary == null || folderId == null || folder == null) &&
        newName !== folder.name
      ) {
        const newLibrary = renameContentListFolderInLibrary(
          contentListLibrary,
          folderId,
          newName
        )
        dispatch(updateContentListLibrary({ contentListLibrary: newLibrary }))
      }
      record(make(Name.FOLDER_SUBMIT_EDIT, {}))
      handleClose()
    },
    [dispatch, folder, folderId, handleClose, contentListLibrary, record]
  )

  const handleClickDelete = useCallback(() => {
    setShowDeleteConfirmation(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!(contentListLibrary == null || folderId == null || folder == null)) {
      const newLibrary = removeContentListFolderInLibrary(
        contentListLibrary,
        folderId
      )
      setShowDeleteConfirmation(false)
      dispatch(updateContentListLibrary({ contentListLibrary: newLibrary }))
    }
    record(make(Name.FOLDER_DELETE, {}))
    handleClose()
  }, [dispatch, folder, folderId, handleClose, contentListLibrary, record])

  return (
    <>
      <Modal
        modalKey='editfolder'
        isOpen={isOpen}
        onClose={handleClose}
        zIndex={zIndex.EDIT_CONTENT_LIST_MODAL}
        bodyClassName={styles.modalBody}
      >
        <ModalHeader onClose={handleClose}>
          <ModalTitle
            icon={<IconFolder />}
            title={messages.editFolderModalTitle}
          />
        </ModalHeader>
        <ModalContent>
          <FolderForm
            isEditMode
            onSubmit={handleSubmit}
            onCancel={handleClickCancel}
            onDelete={handleClickDelete}
            initialFolderName={folder?.name}
          />
        </ModalContent>
      </Modal>
      <DeleteConfirmationModal
        customHeader={messages.confirmDeleteFolderModalHeader}
        customDescription={messages.confirmDeleteFolderModalDescription}
        title={messages.confirmDeleteFolderModalTitle}
        entity={messages.folderEntity}
        visible={showDeleteConfirmation}
        onDelete={handleConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  )
}

export default EditFolderModal

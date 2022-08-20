import { useCallback, useState } from 'react'

import { Name, PlaylistLibraryFolder } from '@coliving/common'
import {
  IconFolder,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@coliving/stems'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { getPlaylistLibrary } from 'common/store/account/selectors'
import {
  removePlaylistFolderInLibrary,
  renamePlaylistFolderInLibrary
} from 'common/store/content list-library/helpers'
import FolderForm from 'components/create-content list/FolderForm'
import DeleteConfirmationModal from 'components/delete-confirmation/DeleteConfirmationModal'
import { make, useRecord } from 'store/analytics/actions'
import { getFolderId } from 'store/application/ui/editFolderModal/selectors'
import { setFolderId } from 'store/application/ui/editFolderModal/slice'
import { update as updatePlaylistLibrary } from 'store/content list-library/slice'
import { useSelector } from 'utils/reducer'
import { zIndex } from 'utils/zIndex'

import styles from './EditFolderModal.module.css'

const messages = {
  editFolderModalTitle: 'Edit Folder',
  confirmDeleteFolderModalTitle: 'Delete Folder',
  confirmDeleteFolderModalHeader:
    'Are you sure you want to delete this folder?',
  confirmDeleteFolderModalDescription:
    'Any content lists inside will be moved out before the folder is deleted.',
  folderEntity: 'Folder'
}

const EditFolderModal = () => {
  const record = useRecord()
  const folderId = useSelector(getFolderId)
  const content listLibrary = useSelector(getPlaylistLibrary)
  const [isOpen, setIsOpen] = useModalState('EditFolder')
  const folder =
    content listLibrary == null || folderId == null
      ? null
      : (content listLibrary.contents.find(
          (item) => item.type === 'folder' && item.id === folderId
        ) as PlaylistLibraryFolder | undefined)
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
        !(content listLibrary == null || folderId == null || folder == null) &&
        newName !== folder.name
      ) {
        const newLibrary = renamePlaylistFolderInLibrary(
          content listLibrary,
          folderId,
          newName
        )
        dispatch(updatePlaylistLibrary({ content listLibrary: newLibrary }))
      }
      record(make(Name.FOLDER_SUBMIT_EDIT, {}))
      handleClose()
    },
    [dispatch, folder, folderId, handleClose, content listLibrary, record]
  )

  const handleClickDelete = useCallback(() => {
    setShowDeleteConfirmation(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!(content listLibrary == null || folderId == null || folder == null)) {
      const newLibrary = removePlaylistFolderInLibrary(
        content listLibrary,
        folderId
      )
      setShowDeleteConfirmation(false)
      dispatch(updatePlaylistLibrary({ content listLibrary: newLibrary }))
    }
    record(make(Name.FOLDER_DELETE, {}))
    handleClose()
  }, [dispatch, folder, folderId, handleClose, content listLibrary, record])

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

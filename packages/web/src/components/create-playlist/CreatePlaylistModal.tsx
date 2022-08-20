import { useCallback, useEffect, useState } from 'react'

import { Name, FeatureFlags } from '@coliving/common'
import {
  Modal,
  SegmentedControl,
  ModalHeader,
  ModalContent,
  ModalTitle,
  IconFolder,
  IconPlaylists
} from '@coliving/stems'

import { useFlag } from 'hooks/useRemoteConfig'
import { make, useRecord } from 'store/analytics/actions'
import zIndex from 'utils/zIndex'

import styles from './CreatePlaylistModal.module.css'
import FolderForm from './FolderForm'
import PlaylistForm, { PlaylistFormFields } from './PlaylistForm'

const messages = {
  createPlaylistTabTitle: 'Create Playlist',
  createFolderTabTitle: 'Create Folder'
}

type TabName = 'create-content list' | 'create-folder'
const INITIAL_TAB = 'create-content list' as TabName

type CreatePlaylistModalProps = {
  visible?: boolean
  hideFolderTab?: boolean
  onCancel: () => void
  onCreatePlaylist: (metadata: PlaylistFormFields) => void
  onCreateFolder: (name: string) => void
}

const CreatePlaylistModal = ({
  visible = true,
  hideFolderTab = false,
  onCancel,
  onCreateFolder,
  onCreatePlaylist
}: CreatePlaylistModalProps) => {
  const record = useRecord()
  const { isEnabled: isPlaylistFoldersEnabled } = useFlag(
    FeatureFlags.CONTENT_LIST_FOLDERS
  )

  const tabOptions = [
    {
      key: 'create-content list',
      text: messages.createPlaylistTabTitle
    },
    {
      key: 'create-folder',
      text: messages.createFolderTabTitle
    }
  ] as Array<{ key: TabName; text: string }>

  const [currentTabName, setCurrentTabName] = useState(INITIAL_TAB)

  useEffect(() => {
    if (!visible) {
      setCurrentTabName(INITIAL_TAB)
    }
  }, [visible])

  const [isArtworkPopupOpen, setIsArtworkPopupOpen] = useState(false)

  const onOpenArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(true)
  }, [setIsArtworkPopupOpen])

  const onCloseArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(false)
  }, [setIsArtworkPopupOpen])

  const handleSelectTabOption = useCallback(
    (key: string) => {
      setCurrentTabName(key as TabName)
      if (key === 'create-folder') {
        record(make(Name.FOLDER_OPEN_CREATE, {}))
      }
    },
    [setCurrentTabName, record]
  )

  const handleSubmitFolder = useCallback(
    (name: string) => {
      record(make(Name.FOLDER_SUBMIT_CREATE, {}))
      onCreateFolder(name)
    },
    [onCreateFolder, record]
  )

  const handleClose = useCallback(() => {
    if (currentTabName === 'create-folder') {
      record(make(Name.FOLDER_CANCEL_CREATE, {}))
    }
    onCancel()
  }, [currentTabName, onCancel, record])

  return (
    <Modal
      modalKey='createcontent list'
      dismissOnClickOutside={!isArtworkPopupOpen}
      bodyClassName={styles.modalBody}
      isOpen={visible}
      onClose={handleClose}
      zIndex={zIndex.CREATE_CONTENT_LIST_MODAL}
    >
      <ModalHeader onClose={handleClose}>
        <ModalTitle
          icon={
            currentTabName === 'create-content list' ? (
              <IconPlaylists />
            ) : (
              <IconFolder />
            )
          }
          title={
            currentTabName === 'create-content list'
              ? messages.createPlaylistTabTitle
              : messages.createFolderTabTitle
          }
        />
      </ModalHeader>
      <ModalContent>
        {!isPlaylistFoldersEnabled || hideFolderTab ? null : (
          <div className={styles.segmentedControlContainer}>
            <SegmentedControl
              options={tabOptions}
              selected={currentTabName}
              onSelectOption={handleSelectTabOption}
            />
          </div>
        )}
        {currentTabName === 'create-content list' ? (
          <PlaylistForm
            onOpenArtworkPopup={onOpenArtworkPopup}
            onCloseArtworkPopup={onCloseArtworkPopup}
            onSave={onCreatePlaylist}
          />
        ) : (
          <FolderForm onSubmit={handleSubmitFolder} />
        )}
      </ModalContent>
    </Modal>
  )
}

export default CreatePlaylistModal

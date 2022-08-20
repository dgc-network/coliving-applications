import { useCallback, useEffect, useState } from 'react'

import { Name, FeatureFlags } from '@coliving/common'
import {
  Modal,
  SegmentedControl,
  ModalHeader,
  ModalContent,
  ModalTitle,
  IconFolder,
  IconContentLists
} from '@coliving/stems'

import { useFlag } from 'hooks/useRemoteConfig'
import { make, useRecord } from 'store/analytics/actions'
import zIndex from 'utils/zIndex'

import styles from './CreateContentListModal.module.css'
import FolderForm from './FolderForm'
import ContentListForm, { ContentListFormFields } from './ContentListForm'

const messages = {
  createContentListTabTitle: 'Create ContentList',
  createFolderTabTitle: 'Create Folder'
}

type TabName = 'create-content list' | 'create-folder'
const INITIAL_TAB = 'create-content list' as TabName

type CreateContentListModalProps = {
  visible?: boolean
  hideFolderTab?: boolean
  onCancel: () => void
  onCreateContentList: (metadata: ContentListFormFields) => void
  onCreateFolder: (name: string) => void
}

const CreateContentListModal = ({
  visible = true,
  hideFolderTab = false,
  onCancel,
  onCreateFolder,
  onCreateContentList
}: CreateContentListModalProps) => {
  const record = useRecord()
  const { isEnabled: isContentListFoldersEnabled } = useFlag(
    FeatureFlags.CONTENT_LIST_FOLDERS
  )

  const tabOptions = [
    {
      key: 'create-content list',
      text: messages.createContentListTabTitle
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
              <IconContentLists />
            ) : (
              <IconFolder />
            )
          }
          title={
            currentTabName === 'create-content list'
              ? messages.createContentListTabTitle
              : messages.createFolderTabTitle
          }
        />
      </ModalHeader>
      <ModalContent>
        {!isContentListFoldersEnabled || hideFolderTab ? null : (
          <div className={styles.segmentedControlContainer}>
            <SegmentedControl
              options={tabOptions}
              selected={currentTabName}
              onSelectOption={handleSelectTabOption}
            />
          </div>
        )}
        {currentTabName === 'create-content list' ? (
          <ContentListForm
            onOpenArtworkPopup={onOpenArtworkPopup}
            onCloseArtworkPopup={onCloseArtworkPopup}
            onSave={onCreateContentList}
          />
        ) : (
          <FolderForm onSubmit={handleSubmitFolder} />
        )}
      </ModalContent>
    </Modal>
  )
}

export default CreateContentListModal

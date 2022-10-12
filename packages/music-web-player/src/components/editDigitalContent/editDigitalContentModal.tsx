import { useEffect, useState } from 'react'

import {
  ID,
  StemCategory,
  StemUploadWithFile,
  DigitalContent,
  removeNullable,
  uuid
} from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { matchPath } from 'react-router'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import * as cacheDigitalContentActions from 'common/store/cache/digital_contents/actions'
import { getCurrentUploads } from 'common/store/stemsUpload/selectors'
import { startStemUploads } from 'common/store/stemsUpload/slice'
import DeleteConfirmationModal from 'components/deleteConfirmation/deleteConfirmationModal'
import { dropdownRows } from 'components/sourceFilesModal/sourceFilesModal'
import EditDigitalContentModalComponent from 'components/digital_content/EditDigitalContentModal'
import { processFiles } from 'pages/uploadPage/store/utils/processFiles'
import * as editDigitalContentModalActions from 'store/application/ui/editDigitalContentModal/actions'
import {
  getMetadata,
  getIsOpen,
  getStems
} from 'store/application/ui/editDigitalContentModal/selectors'
import { AppState } from 'store/types'
import { FEED_PAGE, getPathname } from 'utils/route'

const messages = {
  deleteDigitalContent: 'DELETE AGREEMENT'
}

type OwnProps = {}

type EditDigitalContentModalProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const EditDigitalContentModal = ({
  isOpen,
  metadata,
  onEdit,
  onDelete,
  close,
  goToRoute,
  history,
  stems,
  uploadStems,
  currentUploads
}: EditDigitalContentModalProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  useEffect(() => {
    // Delay opening the modal until after we have digital_content metadata as well
    if (isOpen && metadata) {
      setIsModalOpen(true)
    }
    if (!isOpen && isModalOpen) {
      setIsModalOpen(false)
    }
  }, [isOpen, metadata, isModalOpen])

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const [pendingUploads, setPendingUploads] = useState<StemUploadWithFile[]>([])
  const [pendingDeletes, setPendingDeletes] = useState<ID[]>([])
  const onSaveEdit = (formFields: DigitalContent) => {
    if (!metadata) return
    onEdit(metadata.digital_content_id, formFields)
    if (pendingUploads.length) {
      uploadStems(metadata.digital_content_id, pendingUploads)
      setPendingUploads([])
    }
    if (pendingDeletes.length) {
      pendingDeletes.forEach((id) => onDelete(id))
      setPendingDeletes([])
    }
    close()
  }
  const onSelectDelete = () => {
    setShowDeleteConfirmation(true)
  }

  // Cleanup after ourselves if we cancel
  const onCancel = () => {
    setPendingUploads([])
    setPendingDeletes([])
    close()
  }

  const onDeleteDigitalContent = () => {
    if (!metadata) return
    onDelete(metadata.digital_content_id)
    setShowDeleteConfirmation(false)
    close()
    const match = matchPath<{ name: string; handle: string }>(
      getPathname(history.location),
      {
        path: '/:handle/:name',
        exact: true
      }
    )
    if (match) {
      goToRoute(FEED_PAGE)
    }
  }

  const getStemsFilteringPendingDeletes = () =>
    stems.filter((s) => !pendingDeletes.includes(s.digital_content_id))

  const onSelectStemCategory = (category: StemCategory, stemIndex: number) => {
    setPendingUploads((u) => {
      const newState = [...u]

      const pendingStemsLength = getStemsFilteringPendingDeletes().length
      const uploadingStemsLength = currentUploads.length
      // Have to take into account existing stems
      // in the edit modal
      const index = stemIndex - pendingStemsLength - uploadingStemsLength
      newState[index].category = category
      return newState
    })
  }

  const onAddStems = async (selectedStems: File[]) => {
    const processed = (
      await Promise.all(processFiles(selectedStems, false, () => {}))
    )
      .filter(removeNullable)
      .map((p) => ({
        ...p,
        allowDelete: true,
        allowCategorySwitch: true,
        category: dropdownRows[0]
      }))

    setPendingUploads((s) => [...s, ...processed])
  }

  const { combinedStems, onDeleteStem } = (() => {
    // Filter out pending deletes from the existing stems
    const existingStems = getStemsFilteringPendingDeletes().map((s) => ({
      metadata: s,
      category: s.stem_of.category,
      allowDelete: true,
      allowCategorySwitch: false
    }))

    const uploadingStems = currentUploads.map((s) => ({
      metadata: s.metadata,
      category: s.category,
      allowDelete: false,
      allowCategorySwitch: false
    }))

    const pendingStems = pendingUploads.map((u) => ({
      metadata: u.metadata,
      category: u.category,
      allowCategorySwitch: true,
      allowDelete: true
    }))

    const combinedStems = [...existingStems, ...uploadingStems, ...pendingStems]

    const onDeleteStem = (index: number) => {
      if (index < existingStems.length) {
        // If it's an existing stem, set is as a pending delete
        const id = existingStems[index].metadata.digital_content_id
        setPendingDeletes((s) => [...s, id])
      } else {
        // If it's a pending stem, delete it from local state
        const indexToDelete = index - existingStems.length
        setPendingUploads((s) => {
          const newState = [...s]
          newState.splice(indexToDelete, 1)
          return newState
        })
      }
    }

    return { combinedStems, onDeleteStem }
  })()

  return (
    <>
      <EditDigitalContentModalComponent
        visible={isModalOpen}
        metadata={metadata}
        onSave={onSaveEdit}
        onDelete={onSelectDelete}
        onCancel={onCancel}
        showUnlistedToggle={metadata ? metadata.is_unlisted : false}
        stems={combinedStems}
        onDeleteStem={onDeleteStem}
        onSelectStemCategory={onSelectStemCategory}
        onAddStems={onAddStems}
      />
      <DeleteConfirmationModal
        title={messages.deleteDigitalContent}
        entity='DigitalContent'
        visible={showDeleteConfirmation}
        onDelete={onDeleteDigitalContent}
        onCancel={() => setShowDeleteConfirmation(false)}
      />
    </>
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  const metadata = getMetadata(state)
  return {
    metadata,
    isOpen: getIsOpen(state),
    stems: getStems(state),
    currentUploads: metadata?.digital_content_id
      ? getCurrentUploads(state, metadata.digital_content_id)
      : []
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    onEdit: (digitalContentId: ID, formFields: any) =>
      dispatch(cacheDigitalContentActions.editDigitalContent(digitalContentId, formFields)),
    onDelete: (digitalContentId: ID) => dispatch(cacheDigitalContentActions.deleteDigitalContent(digitalContentId)),
    close: () => dispatch(editDigitalContentModalActions.close()),
    uploadStems: (parentId: ID, uploads: StemUploadWithFile[]) =>
      dispatch(startStemUploads({ parentId, uploads, batchUID: uuid() }))
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(EditDigitalContentModal)
)

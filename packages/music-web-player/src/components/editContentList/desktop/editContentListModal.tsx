import { useCallback, useEffect, useState } from 'react'

import { ID } from '@coliving/common'
import {
  IconContentLists,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@coliving/stems'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { Dispatch } from 'redux'

import { fetchSavedContentLists } from 'common/store/account/reducer'
import {
  deleteContentList,
  editContentList
} from 'common/store/cache/collections/actions'
import { getCollectionWithUser } from 'common/store/cache/collections/selectors'
import ContentListForm from 'components/create-content-list/ContentListForm'
import DeleteConfirmationModal from 'components/deleteConfirmation/deleteConfirmationModal'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import {
  getCollectionId,
  getIsOpen
} from 'store/application/ui/editContentListModal/selectors'
import { close } from 'store/application/ui/editContentListModal/slice'
import { AppState } from 'store/types'
import { FEED_PAGE, getPathname, contentListPage } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './EditContentListModal.module.css'

const messages = {
  edit: 'Edit',
  delete: 'Delete',
  title: {
    contentList: 'ContentList',
    album: 'Album'
  },
  type: {
    contentList: 'ContentList',
    album: 'Album'
  }
}

type OwnProps = {}
type EditContentListModalProps = OwnProps &
  RouteComponentProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const EditContentListModal = ({
  isOpen,
  collectionId,
  collection,
  location,
  onClose,
  fetchSavedContentLists,
  editContentList,
  deleteContentList,
  goToRoute
}: EditContentListModalProps) => {
  useEffect(() => {
    if (collection == null && collectionId != null) {
      fetchSavedContentLists()
    }
  }, [collection, collectionId, fetchSavedContentLists])

  const {
    content_list_id: contentListId,
    is_album: isAlbum,
    content_list_name: title,
    user
  } = collection || {}
  const { handle } = user || {}
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const onClickDelete = () => setShowDeleteConfirmation(true)
  const onCancelDelete = () => setShowDeleteConfirmation(false)
  const onDelete = () => {
    setShowDeleteConfirmation(false)
    onClose()
    deleteContentList(contentListId!)
    if (handle && title) {
      const contentListRoute = contentListPage(handle, title, contentListId!)
      // If on the contentList page, direct user to feed
      if (getPathname(location) === contentListRoute) goToRoute(FEED_PAGE)
    }
  }
  const onSaveEdit = (formFields: any) => {
    editContentList(contentListId!, formFields)
    onClose()
  }

  const editContentListModalTitle = `${messages.edit} ${
    isAlbum ? messages.title.album : messages.title.contentList
  }`

  const [isArtworkPopupOpen, setIsArtworkPopupOpen] = useState(false)

  const onOpenArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(true)
  }, [setIsArtworkPopupOpen])

  const onCloseArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(false)
  }, [setIsArtworkPopupOpen])

  return (
    <>
      <Modal
        bodyClassName={styles.modalBody}
        modalKey='editcontentList'
        dismissOnClickOutside={!isArtworkPopupOpen}
        isOpen={isOpen}
        onClose={onClose}
        zIndex={zIndex.EDIT_CONTENT_LIST_MODAL}
      >
        <ModalHeader onClose={onClose}>
          <ModalTitle icon={<IconContentLists />} title={editContentListModalTitle} />
        </ModalHeader>
        <ModalContent>
          {collection == null ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            <ContentListForm
              isEditMode
              onCloseArtworkPopup={onCloseArtworkPopup}
              onOpenArtworkPopup={onOpenArtworkPopup}
              metadata={collection}
              isAlbum={isAlbum}
              onDelete={onClickDelete}
              onCancel={onClose}
              onSave={onSaveEdit}
            />
          )}
        </ModalContent>
      </Modal>
      <DeleteConfirmationModal
        title={`${messages.delete} ${
          isAlbum ? messages.title.album : messages.title.contentList
        }`}
        entity={isAlbum ? messages.type.album : messages.type.contentList}
        visible={showDeleteConfirmation}
        onDelete={onDelete}
        onCancel={onCancelDelete}
      />
    </>
  )
}

const mapStateToProps = (state: AppState) => {
  const collectionId = getCollectionId(state)
  return {
    isOpen: getIsOpen(state),
    collectionId: getCollectionId(state),
    collection: getCollectionWithUser(state, { id: collectionId || undefined })
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onClose: () => dispatch(close()),
  fetchSavedContentLists: () => dispatch(fetchSavedContentLists()),
  goToRoute: (route: string) => dispatch(pushRoute(route)),
  editContentList: (contentListId: ID, formFields: any) =>
    dispatch(editContentList(contentListId, formFields)),
  deleteContentList: (contentListId: ID) => dispatch(deleteContentList(contentListId))
})

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(EditContentListModal)
)

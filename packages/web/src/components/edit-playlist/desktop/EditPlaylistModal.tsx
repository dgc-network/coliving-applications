import { useCallback, useEffect, useState } from 'react'

import { ID } from '@coliving/common'
import {
  IconPlaylists,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@coliving/stems'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { Dispatch } from 'redux'

import { fetchSavedPlaylists } from 'common/store/account/reducer'
import {
  deletePlaylist,
  editPlaylist
} from 'common/store/cache/collections/actions'
import { getCollectionWithUser } from 'common/store/cache/collections/selectors'
import PlaylistForm from 'components/create-content list/PlaylistForm'
import DeleteConfirmationModal from 'components/delete-confirmation/DeleteConfirmationModal'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import {
  getCollectionId,
  getIsOpen
} from 'store/application/ui/editPlaylistModal/selectors'
import { close } from 'store/application/ui/editPlaylistModal/slice'
import { AppState } from 'store/types'
import { FEED_PAGE, getPathname, content listPage } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './EditPlaylistModal.module.css'

const messages = {
  edit: 'Edit',
  delete: 'Delete',
  title: {
    content list: 'Playlist',
    album: 'Album'
  },
  type: {
    content list: 'Playlist',
    album: 'Album'
  }
}

type OwnProps = {}
type EditPlaylistModalProps = OwnProps &
  RouteComponentProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const EditPlaylistModal = ({
  isOpen,
  collectionId,
  collection,
  location,
  onClose,
  fetchSavedPlaylists,
  editPlaylist,
  deletePlaylist,
  goToRoute
}: EditPlaylistModalProps) => {
  useEffect(() => {
    if (collection == null && collectionId != null) {
      fetchSavedPlaylists()
    }
  }, [collection, collectionId, fetchSavedPlaylists])

  const {
    content list_id: content listId,
    is_album: isAlbum,
    content list_name: title,
    user
  } = collection || {}
  const { handle } = user || {}
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const onClickDelete = () => setShowDeleteConfirmation(true)
  const onCancelDelete = () => setShowDeleteConfirmation(false)
  const onDelete = () => {
    setShowDeleteConfirmation(false)
    onClose()
    deletePlaylist(content listId!)
    if (handle && title) {
      const content listRoute = content listPage(handle, title, content listId!)
      // If on the content list page, direct user to feed
      if (getPathname(location) === content listRoute) goToRoute(FEED_PAGE)
    }
  }
  const onSaveEdit = (formFields: any) => {
    editPlaylist(content listId!, formFields)
    onClose()
  }

  const editPlaylistModalTitle = `${messages.edit} ${
    isAlbum ? messages.title.album : messages.title.content list
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
        modalKey='editcontent list'
        dismissOnClickOutside={!isArtworkPopupOpen}
        isOpen={isOpen}
        onClose={onClose}
        zIndex={zIndex.EDIT_CONTENT_LIST_MODAL}
      >
        <ModalHeader onClose={onClose}>
          <ModalTitle icon={<IconPlaylists />} title={editPlaylistModalTitle} />
        </ModalHeader>
        <ModalContent>
          {collection == null ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            <PlaylistForm
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
          isAlbum ? messages.title.album : messages.title.content list
        }`}
        entity={isAlbum ? messages.type.album : messages.type.content list}
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
  fetchSavedPlaylists: () => dispatch(fetchSavedPlaylists()),
  goToRoute: (route: string) => dispatch(pushRoute(route)),
  editPlaylist: (content listId: ID, formFields: any) =>
    dispatch(editPlaylist(content listId, formFields)),
  deletePlaylist: (content listId: ID) => dispatch(deletePlaylist(content listId))
})

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(EditPlaylistModal)
)

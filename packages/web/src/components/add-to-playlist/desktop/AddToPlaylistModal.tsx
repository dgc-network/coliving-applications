import { useContext, useMemo, useState } from 'react'

import { CreatePlaylistSource, Collection, SquareSizes } from '@coliving/common'
import { Modal, Scrollbar } from '@coliving/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconMultiselectAdd } from 'assets/img/iconMultiselectAdd.svg'
import { useModalState } from 'common/hooks/useModalState'
import { getAccountWithOwnPlaylists } from 'common/store/account/selectors'
import {
  addAgreementToPlaylist,
  createPlaylist
} from 'common/store/cache/collections/actions'
import { getCollectionId } from 'common/store/pages/collection/selectors'
import {
  getAgreementId,
  getAgreementTitle
} from 'common/store/ui/add-to-content list/selectors'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import SearchBar from 'components/search-bar/SearchBar'
import { ToastContext } from 'components/toast/ToastContext'
import ToastLinkContent from 'components/toast/mobile/ToastLinkContent'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { newCollectionMetadata } from 'schemas'
import { AppState } from 'store/types'
import { content listPage } from 'utils/route'

import styles from './AddToPlaylistModal.module.css'

const messages = {
  title: 'Add to Playlist',
  newPlaylist: 'New Playlist',
  searchPlaceholder: 'Find one of your content lists',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!',
  view: 'View'
}

const AddToPlaylistModal = () => {
  const dispatch = useDispatch()
  const { toast } = useContext(ToastContext)

  const [isOpen, setIsOpen] = useModalState('AddToPlaylist')
  const agreementId = useSelector(getAgreementId)
  const agreementTitle = useSelector(getAgreementTitle)
  const currentCollectionId = useSelector(getCollectionId)
  const account = useSelector((state: AppState) =>
    getAccountWithOwnPlaylists(state)
  )

  const [searchValue, setSearchValue] = useState('')

  const filteredPlaylists = useMemo(() => {
    return (account?.content lists ?? []).filter(
      (content list: Collection) =>
        // Don't allow adding to this content list if already on this content list's page.
        content list.content list_id !== currentCollectionId &&
        (searchValue
          ? content list.content list_name
              .toLowerCase()
              .includes(searchValue.toLowerCase())
          : true)
    )
  }, [searchValue, account, currentCollectionId])

  const handlePlaylistClick = (content list: Collection) => {
    dispatch(addAgreementToPlaylist(agreementId, content list.content list_id))
    if (account && agreementTitle) {
      toast(
        <ToastLinkContent
          text={messages.addedToast}
          linkText={messages.view}
          link={content listPage(account.handle, agreementTitle, content list.content list_id)}
        />
      )
    }
    setIsOpen(false)
  }

  const handleCreatePlaylist = () => {
    const metadata = newCollectionMetadata({
      content list_name: agreementTitle,
      is_private: false
    })
    const tempId = `${Date.now()}`
    dispatch(
      createPlaylist(tempId, metadata, CreatePlaylistSource.FROM_AGREEMENT, agreementId)
    )
    dispatch(addAgreementToPlaylist(agreementId, tempId))
    if (account && agreementTitle) {
      toast(
        <ToastLinkContent
          text={messages.createdToast}
          linkText={messages.view}
          link={content listPage(account.handle, agreementTitle, tempId)}
        />
      )
    }
    setIsOpen(false)
  }

  return (
    <Modal
      isOpen={isOpen === true}
      showTitleHeader
      showDismissButton
      title={messages.title}
      onClose={() => setIsOpen(false)}
      allowScroll={false}
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.modalHeader}
    >
      <SearchBar
        className={styles.searchBar}
        iconClassname={styles.searchIcon}
        open
        value={searchValue}
        onSearch={setSearchValue}
        onOpen={() => {}}
        onClose={() => {}}
        placeholder={messages.searchPlaceholder}
        shouldAutoFocus={false}
      />
      <Scrollbar>
        <div className={styles.listContent}>
          <div className={cn(styles.listItem)} onClick={handleCreatePlaylist}>
            <IconMultiselectAdd className={styles.add} />
            <span>{messages.newPlaylist}</span>
          </div>
          <div className={styles.list}>
            {filteredPlaylists.map((content list) => (
              <div key={`${content list.content list_id}`}>
                <PlaylistItem
                  content list={content list}
                  handleClick={handlePlaylistClick}
                />
              </div>
            ))}
          </div>
        </div>
      </Scrollbar>
    </Modal>
  )
}

type PlaylistItemProps = {
  handleClick: (content list: Collection) => void
  content list: Collection
}

const PlaylistItem = ({ handleClick, content list }: PlaylistItemProps) => {
  const image = useCollectionCoverArt(
    content list.content list_id,
    content list._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div className={cn(styles.listItem)} onClick={() => handleClick(content list)}>
      <DynamicImage
        className={styles.image}
        wrapperClassName={styles.imageWrapper}
        image={image}
      />
      <span className={styles.content listName}>{content list.content list_name}</span>
    </div>
  )
}

export default AddToPlaylistModal

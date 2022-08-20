import { useCallback, useContext, useEffect, useMemo } from 'react'

import {
  ID,
  FavoriteSource,
  Name,
  PlaylistLibrary as PlaylistLibraryType,
  PlaylistLibraryFolder,
  SmartCollectionVariant,
  FeatureFlags
} from '@coliving/common'
import cn from 'classnames'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import {
  getAccountCollectibles,
  getAccountNavigationPlaylists,
  getAccountUser,
  getPlaylistLibrary
} from 'common/store/account/selectors'
import { addAgreementToPlaylist } from 'common/store/cache/collections/actions'
import { getPlaylistUpdates } from 'common/store/notifications/selectors'
import {
  addPlaylistToFolder,
  containsTempPlaylist,
  findInPlaylistLibrary,
  getPlaylistsNotInLibrary,
  isInsideFolder,
  reorderPlaylistLibrary
} from 'common/store/content list-library/helpers'
import { saveSmartCollection } from 'common/store/social/collections/actions'
import Droppable from 'components/dragndrop/Droppable'
import { ToastContext } from 'components/toast/ToastContext'
import { useFlag } from 'hooks/useRemoteConfig'
import {
  LIVE_NFT_CONTENT_LIST,
  SMART_COLLECTION_MAP
} from 'pages/smart-collection/smartCollections'
import { make, useRecord } from 'store/analytics/actions'
import { setFolderId as setEditFolderModalFolderId } from 'store/application/ui/editFolderModal/slice'
import { open as openEditPlaylistModal } from 'store/application/ui/editPlaylistModal/slice'
import { getIsDragging } from 'store/dragndrop/selectors'
import { update } from 'store/content list-library/slice'
import { useSelector } from 'utils/reducer'
import { liveNftPlaylistPage, getPathname, content listPage } from 'utils/route'

import navColumnStyles from './NavColumn.module.css'
import { PlaylistFolderNavItem } from './PlaylistFolderNavItem'
import styles from './PlaylistLibrary.module.css'
import { PlaylistNavItem, PlaylistNavLink } from './PlaylistNavItem'

type PlaylistLibraryProps = {
  onClickNavLinkWithAccount: () => void
}

type LibraryContentsLevelProps = {
  level?: number
  contents: PlaylistLibraryType['contents']
  renderPlaylist: (content listId: number, level: number) => void
  renderCollectionPlaylist: (
    content listId: SmartCollectionVariant,
    level: number
  ) => void
  renderFolder: (folder: PlaylistLibraryFolder, level: number) => void
}

const messages = {
  content listMovedToFolderToast: (folderName: string) =>
    `This content list was already in your library. It has now been moved to ${folderName}!`
}

/** Function component for rendering a single level of the content list library.
 * Playlist library consists of up to two content levels (root + inside a folder) */
const LibraryContentsLevel = ({
  level = 0,
  contents,
  renderPlaylist,
  renderCollectionPlaylist,
  renderFolder
}: LibraryContentsLevelProps) => {
  return (
    <>
      {contents.map((content) => {
        switch (content.type) {
          case 'explore_content list': {
            return renderCollectionPlaylist(content.content list_id, level)
          }
          case 'content list': {
            return renderPlaylist(content.content list_id, level)
          }
          case 'temp_content list': {
            return renderPlaylist(parseInt(content.content list_id), level)
          }
          case 'folder':
            return renderFolder(content, level)
          default:
            return null
        }
      })}
    </>
  )
}

const PlaylistLibrary = ({
  onClickNavLinkWithAccount
}: PlaylistLibraryProps) => {
  const account = useSelector(getAccountUser)
  const content lists = useSelector(getAccountNavigationPlaylists)
  const library = useSelector(getPlaylistLibrary)
  const updates = useSelector(getPlaylistUpdates)
  const updatesSet = new Set(updates)
  const { dragging, kind: draggingKind } = useSelector(getIsDragging)
  const dispatch = useDispatch()
  const { isEnabled: isPlaylistFoldersEnabled } = useFlag(
    FeatureFlags.CONTENT_LIST_FOLDERS
  )
  const { toast } = useContext(ToastContext)
  const record = useRecord()
  const [, setIsEditFolderModalOpen] = useModalState('EditFolder')

  const accountCollectibles = useSelector(getAccountCollectibles)
  const liveCollectibles = useMemo(
    () =>
      accountCollectibles?.filter((c) =>
        ['mp3', 'wav', 'oga', 'mp4'].some(
          (ext) => c.hasAudio || c.animationUrl?.endsWith(ext)
        )
      ),
    [accountCollectibles]
  )

  // Set live nft content list in library if it is not already set
  useEffect(() => {
    if (library) {
      const isAudioNftPlaylistInLibrary = !!findInPlaylistLibrary(
        library,
        SmartCollectionVariant.LIVE_NFT_CONTENT_LIST
      )
      if (liveCollectibles.length && !isAudioNftPlaylistInLibrary) {
        dispatch(
          saveSmartCollection(
            LIVE_NFT_CONTENT_LIST.content list_name,
            FavoriteSource.IMPLICIT
          )
        )
      }
    }
  }, [liveCollectibles, library, dispatch])

  const handleClickEditFolder = useCallback(
    (folderId) => {
      dispatch(setEditFolderModalFolderId(folderId))
      setIsEditFolderModalOpen(true)
      record(make(Name.FOLDER_OPEN_EDIT, {}))
    },
    [dispatch, record, setIsEditFolderModalOpen]
  )

  const handleClickEditPlaylist = useCallback(
    (content listId) => {
      dispatch(openEditPlaylistModal(content listId))
      record(make(Name.CONTENT_LIST_OPEN_EDIT_FROM_LIBRARY, {}))
    },
    [dispatch, record]
  )

  const handleDropInFolder = useCallback(
    (
      folder: PlaylistLibraryFolder,
      droppedKind: 'content list' | 'library-content list',
      droppedId: ID | string | SmartCollectionVariant
    ) => {
      if (!library) return
      const newLibrary = addPlaylistToFolder(library, droppedId, folder.id)

      // Show a toast if content list dragged from outside of library was already in the library so it simply got moved to the target folder.
      if (
        droppedKind === 'content list' &&
        library !== newLibrary &&
        findInPlaylistLibrary(library, droppedId)
      ) {
        toast(messages.content listMovedToFolderToast(folder.name))
      }
      if (library !== newLibrary) {
        record(make(Name.CONTENT_LIST_LIBRARY_ADD_CONTENT_LIST_TO_FOLDER, {}))
        dispatch(update({ content listLibrary: newLibrary }))
      }
    },
    [dispatch, library, record, toast]
  )

  const onReorder = useCallback(
    (
      draggingId: ID | SmartCollectionVariant | string,
      droppingId: ID | SmartCollectionVariant | string,
      draggingKind: 'library-content list' | 'content list' | 'content list-folder',
      reorderBeforeTarget = false
    ) => {
      if (!library) return
      if (draggingId === droppingId) return
      const libraryBeforeReorder = { ...library }
      const newLibrary = reorderPlaylistLibrary(
        library,
        draggingId,
        droppingId,
        draggingKind,
        reorderBeforeTarget
      )
      dispatch(update({ content listLibrary: newLibrary }))
      record(
        make(Name.CONTENT_LIST_LIBRARY_REORDER, {
          containsTemporaryPlaylists: containsTempPlaylist(newLibrary),
          kind: draggingKind
        })
      )
      const isDroppingIntoFolder = isInsideFolder(
        libraryBeforeReorder,
        droppingId
      )
      const isIdInFolderBeforeReorder = isInsideFolder(
        libraryBeforeReorder,
        draggingId
      )
      if (isIdInFolderBeforeReorder && !isDroppingIntoFolder) {
        record(make(Name.CONTENT_LIST_LIBRARY_MOVE_CONTENT_LIST_OUT_OF_FOLDER, {}))
      } else if (!isIdInFolderBeforeReorder && isDroppingIntoFolder) {
        record(make(Name.CONTENT_LIST_LIBRARY_MOVE_CONTENT_LIST_INTO_FOLDER, {}))
      }
    },
    [dispatch, library, record]
  )

  const renderCollectionPlaylist = (
    content listId: SmartCollectionVariant,
    level = 0
  ) => {
    const isAudioNftPlaylist =
      content listId === SmartCollectionVariant.LIVE_NFT_CONTENT_LIST
    if (isAudioNftPlaylist && !liveCollectibles.length) return null
    const content list = SMART_COLLECTION_MAP[content listId]
    if (!content list) return null

    const name = content list.content list_name
    const url = isAudioNftPlaylist
      ? liveNftPlaylistPage(account?.handle ?? '')
      : content list.link

    return (
      <PlaylistNavLink
        isInsideFolder={level > 0}
        key={content list.link}
        content listId={name as SmartCollectionVariant}
        droppableKey={name as SmartCollectionVariant}
        name={name}
        to={url}
        onReorder={onReorder}
        isActive={() => url === getPathname()}
        activeClassName='active'
        onClick={onClickNavLinkWithAccount}
        className={cn(navColumnStyles.link, {
          [navColumnStyles.disabledLink]:
            !account || (dragging && draggingKind !== 'library-content list')
        })}
      >
        {name}
      </PlaylistNavLink>
    )
  }

  const onClickPlaylist = useCallback(
    (content listId: ID, hasUpdate: boolean) => {
      onClickNavLinkWithAccount()
      record(
        make(Name.CONTENT_LIST_LIBRARY_CLICKED, {
          content listId,
          hasUpdate
        })
      )
    },
    [record, onClickNavLinkWithAccount]
  )
  const renderPlaylist = (content listId: ID, level = 0) => {
    const content list = content lists[content listId]
    if (!account || !content list) return null
    const { id, name } = content list
    const url = content listPage(content list.user.handle, name, id)
    const addAgreement = (agreementId: ID) => dispatch(addAgreementToPlaylist(agreementId, id))
    const isOwner = content list.user.handle === account.handle
    const hasUpdate = updatesSet.has(id)
    return (
      <PlaylistNavItem
        isInsideFolder={level > 0}
        key={id}
        content list={content list}
        hasUpdate={hasUpdate}
        url={url}
        addAgreement={addAgreement}
        isOwner={isOwner}
        onReorder={onReorder}
        dragging={dragging}
        draggingKind={draggingKind}
        onClickPlaylist={onClickPlaylist}
        onClickEdit={
          isOwner && isPlaylistFoldersEnabled
            ? handleClickEditPlaylist
            : undefined
        }
      />
    )
  }

  const renderFolder = (folder: PlaylistLibraryFolder, level = 0) => {
    return (
      <PlaylistFolderNavItem
        key={folder.id}
        folder={folder}
        hasUpdate={folder.contents.some(
          (c) => c.type !== 'folder' && updatesSet.has(Number(c.content list_id))
        )}
        dragging={dragging}
        draggingKind={draggingKind}
        onClickEdit={handleClickEditFolder}
        onDropBelowFolder={(folderId, draggingKind, draggingId) =>
          onReorder(draggingId, folderId, draggingKind)
        }
        onDropInFolder={handleDropInFolder}
      >
        {isEmpty(folder.contents) ? null : (
          <div className={styles.folderContentsContainer}>
            {/* This is the droppable area for reordering something in the first slot of the content list folder. */}
            <Droppable
              className={styles.droppable}
              hoverClassName={styles.droppableHover}
              onDrop={(draggingId, draggingKind) => {
                onReorder(
                  draggingId,
                  folder.contents[0].type === 'folder'
                    ? folder.contents[0].id
                    : folder.contents[0].content list_id,
                  draggingKind,
                  true
                )
              }}
              acceptedKinds={['content list-folder', 'library-content list']}
            />
            <LibraryContentsLevel
              level={level + 1}
              contents={folder.contents}
              renderPlaylist={renderPlaylist}
              renderCollectionPlaylist={renderCollectionPlaylist}
              renderFolder={renderFolder}
            />
          </div>
        )}
      </PlaylistFolderNavItem>
    )
  }

  /** We want to ensure that all content lists attached to the user's account show up in the library UI, even
  /* if the user's library itself does not contain some of the content lists (for example, if a write failed).
  /* This computes those content lists that are attached to the user's account but are not in the user library. */
  const content listsNotInLibrary = useMemo(() => {
    return getPlaylistsNotInLibrary(library, content lists)
  }, [library, content lists])

  /** Iterate over content list library and render out available explore/smart
  /* content lists and ordered content lists. Remaining content lists that are unordered
  /* are rendered afterwards by sort order. */
  return (
    <>
      <Droppable
        key={-1}
        className={cn(styles.droppable, styles.top)}
        hoverClassName={styles.droppableHover}
        onDrop={(id: ID | SmartCollectionVariant, kind) =>
          onReorder(id, -1, kind)
        }
        acceptedKinds={['library-content list', 'content list-folder']}
      />
      {account && content lists && library ? (
        <LibraryContentsLevel
          contents={library.contents || []}
          renderPlaylist={renderPlaylist}
          renderCollectionPlaylist={renderCollectionPlaylist}
          renderFolder={renderFolder}
        />
      ) : null}
      {Object.values(content listsNotInLibrary).map((content list) => {
        return renderPlaylist(content list.id)
      })}
      {isEmpty(library?.contents) ? (
        <div className={cn(navColumnStyles.link, navColumnStyles.disabled)}>
          Create your first content list!
        </div>
      ) : null}
    </>
  )
}

export default PlaylistLibrary

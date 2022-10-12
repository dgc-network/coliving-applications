import { useCallback, useContext, useEffect, useMemo } from 'react'

import {
  ID,
  FavoriteSource,
  Name,
  ContentListLibrary as ContentListLibraryType,
  ContentListLibraryFolder,
  SmartCollectionVariant,
  FeatureFlags
} from '@coliving/common'
import cn from 'classnames'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import {
  getAccountCollectibles,
  getAccountNavigationContentLists,
  getAccountUser,
  getContentListLibrary
} from 'common/store/account/selectors'
import { addDigitalContentToContentList } from 'common/store/cache/collections/actions'
import { getContentListUpdates } from 'common/store/notifications/selectors'
import {
  addContentListToFolder,
  containsTempContentList,
  findInContentListLibrary,
  getContentListsNotInLibrary,
  isInsideFolder,
  reorderContentListLibrary
} from 'common/store/contentListLibrary/helpers'
import { saveSmartCollection } from 'common/store/social/collections/actions'
import Droppable from 'components/dragndrop/droppable'
import { ToastContext } from 'components/toast/toastContext'
import { useFlag } from 'hooks/useRemoteConfig'
import {
  LIVE_NFT_CONTENT_LIST,
  SMART_COLLECTION_MAP
} from 'pages/smartCollection/smartCollections'
import { make, useRecord } from 'store/analytics/actions'
import { setFolderId as setEditFolderModalFolderId } from 'store/application/ui/editFolderModal/slice'
import { open as openEditContentListModal } from 'store/application/ui/editContentListModal/slice'
import { getIsDragging } from 'store/dragndrop/selectors'
import { update } from 'store/contentListLibrary/slice'
import { useSelector } from 'utils/reducer'
import { liveNftContentListPage, getPathname, contentListPage } from 'utils/route'

import navColumnStyles from './NavColumn.module.css'
import { ContentListFolderNavItem } from './contentListFolderNavItem'
import styles from './ContentListLibrary.module.css'
import { ContentListNavItem, ContentListNavLink } from './contentListNavItem'

type ContentListLibraryProps = {
  onClickNavLinkWithAccount: () => void
}

type LibraryContentsLevelProps = {
  level?: number
  contents: ContentListLibraryType['contents']
  renderContentList: (contentListId: number, level: number) => void
  renderCollectionContentList: (
    contentListId: SmartCollectionVariant,
    level: number
  ) => void
  renderFolder: (folder: ContentListLibraryFolder, level: number) => void
}

const messages = {
  contentListMovedToFolderToast: (folderName: string) =>
    `This contentList was already in your library. It has now been moved to ${folderName}!`
}

/** Function component for rendering a single level of the contentList library.
 * ContentList library consists of up to two content levels (root + inside a folder) */
const LibraryContentsLevel = ({
  level = 0,
  contents,
  renderContentList,
  renderCollectionContentList,
  renderFolder
}: LibraryContentsLevelProps) => {
  return (
    <>
      {contents.map((content) => {
        switch (content.type) {
          case 'explore_content_list': {
            return renderCollectionContentList(content.content_list_id, level)
          }
          case 'contentList': {
            return renderContentList(content.content_list_id, level)
          }
          case 'temp_content_list': {
            return renderContentList(parseInt(content.content_list_id), level)
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

const ContentListLibrary = ({
  onClickNavLinkWithAccount
}: ContentListLibraryProps) => {
  const account = useSelector(getAccountUser)
  const contentLists = useSelector(getAccountNavigationContentLists)
  const library = useSelector(getContentListLibrary)
  const updates = useSelector(getContentListUpdates)
  const updatesSet = new Set(updates)
  const { dragging, kind: draggingKind } = useSelector(getIsDragging)
  const dispatch = useDispatch()
  const { isEnabled: isContentListFoldersEnabled } = useFlag(
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

  // Set digitalcoin nft contentList in library if it is not already set
  useEffect(() => {
    if (library) {
      const isAudioNftContentListInLibrary = !!findInContentListLibrary(
        library,
        SmartCollectionVariant.LIVE_NFT_CONTENT_LIST
      )
      if (liveCollectibles.length && !isAudioNftContentListInLibrary) {
        dispatch(
          saveSmartCollection(
            LIVE_NFT_CONTENT_LIST.content_list_name,
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

  const handleClickEditContentList = useCallback(
    (contentListId) => {
      dispatch(openEditContentListModal(contentListId))
      record(make(Name.CONTENT_LIST_OPEN_EDIT_FROM_LIBRARY, {}))
    },
    [dispatch, record]
  )

  const handleDropInFolder = useCallback(
    (
      folder: ContentListLibraryFolder,
      droppedKind: 'contentList' | 'library-content-list',
      droppedId: ID | string | SmartCollectionVariant
    ) => {
      if (!library) return
      const newLibrary = addContentListToFolder(library, droppedId, folder.id)

      // Show a toast if contentList dragged from outside of library was already in the library so it simply got moved to the target folder.
      if (
        droppedKind === 'contentList' &&
        library !== newLibrary &&
        findInContentListLibrary(library, droppedId)
      ) {
        toast(messages.contentListMovedToFolderToast(folder.name))
      }
      if (library !== newLibrary) {
        record(make(Name.CONTENT_LIST_LIBRARY_ADD_CONTENT_LIST_TO_FOLDER, {}))
        dispatch(update({ contentListLibrary: newLibrary }))
      }
    },
    [dispatch, library, record, toast]
  )

  const onReorder = useCallback(
    (
      draggingId: ID | SmartCollectionVariant | string,
      droppingId: ID | SmartCollectionVariant | string,
      draggingKind: 'library-content-list' | 'contentList' | 'content-list-folder',
      reorderBeforeTarget = false
    ) => {
      if (!library) return
      if (draggingId === droppingId) return
      const libraryBeforeReorder = { ...library }
      const newLibrary = reorderContentListLibrary(
        library,
        draggingId,
        droppingId,
        draggingKind,
        reorderBeforeTarget
      )
      dispatch(update({ contentListLibrary: newLibrary }))
      record(
        make(Name.CONTENT_LIST_LIBRARY_REORDER, {
          containsTemporaryContentLists: containsTempContentList(newLibrary),
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

  const renderCollectionContentList = (
    contentListId: SmartCollectionVariant,
    level = 0
  ) => {
    const isAudioNftContentList =
      contentListId === SmartCollectionVariant.LIVE_NFT_CONTENT_LIST
    if (isAudioNftContentList && !liveCollectibles.length) return null
    const contentList = SMART_COLLECTION_MAP[contentListId]
    if (!contentList) return null

    const name = contentList.content_list_name
    const url = isAudioNftContentList
      ? liveNftContentListPage(account?.handle ?? '')
      : contentList.link

    return (
      <ContentListNavLink
        isInsideFolder={level > 0}
        key={contentList.link}
        contentListId={name as SmartCollectionVariant}
        droppableKey={name as SmartCollectionVariant}
        name={name}
        to={url}
        onReorder={onReorder}
        isActive={() => url === getPathname()}
        activeClassName='active'
        onClick={onClickNavLinkWithAccount}
        className={cn(navColumnStyles.link, {
          [navColumnStyles.disabledLink]:
            !account || (dragging && draggingKind !== 'library-content-list')
        })}
      >
        {name}
      </ContentListNavLink>
    )
  }

  const onClickContentList = useCallback(
    (contentListId: ID, hasUpdate: boolean) => {
      onClickNavLinkWithAccount()
      record(
        make(Name.CONTENT_LIST_LIBRARY_CLICKED, {
          contentListId,
          hasUpdate
        })
      )
    },
    [record, onClickNavLinkWithAccount]
  )
  const renderContentList = (contentListId: ID, level = 0) => {
    const contentList = contentLists[contentListId]
    if (!account || !contentList) return null
    const { id, name } = contentList
    const url = contentListPage(contentList.user.handle, name, id)
    const addDigitalContent = (digitalContentId: ID) => dispatch(addDigitalContentToContentList(digitalContentId, id))
    const isOwner = contentList.user.handle === account.handle
    const hasUpdate = updatesSet.has(id)
    return (
      <ContentListNavItem
        isInsideFolder={level > 0}
        key={id}
        contentList={contentList}
        hasUpdate={hasUpdate}
        url={url}
        addDigitalContent={addDigitalContent}
        isOwner={isOwner}
        onReorder={onReorder}
        dragging={dragging}
        draggingKind={draggingKind}
        onClickContentList={onClickContentList}
        onClickEdit={
          isOwner && isContentListFoldersEnabled
            ? handleClickEditContentList
            : undefined
        }
      />
    )
  }

  const renderFolder = (folder: ContentListLibraryFolder, level = 0) => {
    return (
      <ContentListFolderNavItem
        key={folder.id}
        folder={folder}
        hasUpdate={folder.contents.some(
          (c) => c.type !== 'folder' && updatesSet.has(Number(c.content_list_id))
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
            {/* This is the droppable area for reordering something in the first slot of the contentList folder. */}
            <Droppable
              className={styles.droppable}
              hoverClassName={styles.droppableHover}
              onDrop={(draggingId, draggingKind) => {
                onReorder(
                  draggingId,
                  folder.contents[0].type === 'folder'
                    ? folder.contents[0].id
                    : folder.contents[0].content_list_id,
                  draggingKind,
                  true
                )
              }}
              acceptedKinds={['content-list-folder', 'library-content-list']}
            />
            <LibraryContentsLevel
              level={level + 1}
              contents={folder.contents}
              renderContentList={renderContentList}
              renderCollectionContentList={renderCollectionContentList}
              renderFolder={renderFolder}
            />
          </div>
        )}
      </ContentListFolderNavItem>
    )
  }

  /** We want to ensure that all contentLists attached to the user's account show up in the library UI, even
  /* if the user's library itself does not contain some of the contentLists (for example, if a write failed).
  /* This computes those contentLists that are attached to the user's account but are not in the user library. */
  const contentListsNotInLibrary = useMemo(() => {
    return getContentListsNotInLibrary(library, contentLists)
  }, [library, contentLists])

  /** Iterate over contentList library and render out available explore/smart
  /* contentLists and ordered contentLists. Remaining contentLists that are unordered
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
        acceptedKinds={['library-content-list', 'content-list-folder']}
      />
      {account && contentLists && library ? (
        <LibraryContentsLevel
          contents={library.contents || []}
          renderContentList={renderContentList}
          renderCollectionContentList={renderCollectionContentList}
          renderFolder={renderFolder}
        />
      ) : null}
      {Object.values(contentListsNotInLibrary).map((contentList) => {
        return renderContentList(contentList.id)
      })}
      {isEmpty(library?.contents) ? (
        <div className={cn(navColumnStyles.link, navColumnStyles.disabled)}>
          Create your first contentList!
        </div>
      ) : null}
    </>
  )
}

export default ContentListLibrary

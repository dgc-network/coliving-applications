import { ReactNode, useCallback, useEffect, useContext } from 'react'

import { ID, UID, Name, Lineup, Status, User } from '@coliving/common'
import { Button, ButtonType } from '@coliving/stems'
import cn from 'classnames'

import { ReactComponent as IconAlbum } from 'assets/img/iconAlbum.svg'
import { ReactComponent as IconFilter } from 'assets/img/iconFilter.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import { ReactComponent as IconContentLists } from 'assets/img/iconContentLists.svg'
import {
  Tabs,
  SavedPageDigitalContent,
  SavedPageCollection
} from 'common/store/pages/savedPage/types'
import { QueueItem } from 'common/store/queue/types'
import Card from 'components/card/mobile/card'
import Header from 'components/header/mobile/header'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import CardLineup from 'components/lineup/cardLineup'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import { useMainPageHeader } from 'components/nav/store/context'
import DigitalContentList from 'components/digital_content/mobile/digitalContentList'
import { DigitalContentItemAction } from 'components/digital_content/mobile/digitalContentListItem'
import useTabs from 'hooks/useTabs/useTabs'
import { make, useRecord } from 'store/analytics/actions'
import { albumPage, TRENDING_PAGE, contentListPage } from 'utils/route'

import NewContentListButton from './newContentListButton'
import styles from './savedPage.module.css'

const emptyTabMessages = {
  afterSaved: "Once you have, this is where you'll find them!",
  goToTrending: 'Go to Trending'
}

type EmptyTabProps = {
  message: string | ReactNode
  onClick: () => void
}

export const EmptyTab = (props: EmptyTabProps) => {
  return (
    <div className={styles.emptyTab}>
      <div className={styles.message}>{props.message}</div>
      <div className={styles.afterSaved}>{emptyTabMessages.afterSaved}</div>
      <Button
        type={ButtonType.PRIMARY_ALT}
        className={styles.emptyButton}
        textClassName={styles.emptyButtonText}
        text={emptyTabMessages.goToTrending}
        onClick={props.onClick} css={undefined}      />
    </div>
  )
}

const OFFSET_HEIGHT = 142
const SCROLL_HEIGHT = 88

/**
 * The Filter input should be hidden and displayed on scroll down.
 * The content container's height is set as the height plus the scroll
 * height so the search conatiner can be hidden under the top bar.
 * On component mount, the child component is scrolled to hide the input.
 */
const useOffsetScroll = () => {
  // Set the child's height base on it's content vs window height
  const contentRefCallback = useCallback((node) => {
    if (node !== null) {
      const contentHeight = (window as any).innerHeight - OFFSET_HEIGHT
      const useContentHeight = contentHeight > node.scrollHeight
      node.style.height = useContentHeight
        ? `calc(${contentHeight}px + ${SCROLL_HEIGHT}px)`
        : `${node.scrollHeight + SCROLL_HEIGHT}px`
      window.scroll(0, SCROLL_HEIGHT)
    }
  }, [])

  return contentRefCallback
}

const DigitalContentsLineup = ({
  digitalContents,
  goToTrending,
  onFilterChange,
  filterText,
  getFilteredData,
  playingUid,
  queuedAndPlaying,
  onSave,
  onTogglePlay
}: {
  digitalContents: Lineup<SavedPageDigitalContent>
  goToTrending: () => void
  onFilterChange: (e: any) => void
  filterText: string
  getFilteredData: (digitalContentMetadatas: any) => [SavedPageDigitalContent[], number]
  playingUid: UID | null
  queuedAndPlaying: boolean
  onSave: (isSaved: boolean, digitalContentId: ID) => void
  onTogglePlay: (uid: UID, digitalContentId: ID) => void
}) => {
  const [digitalContentEntries] = getFilteredData(digitalContents.entries)
  const digitalContentList = digitalContentEntries.map((entry) => ({
    isLoading: false,
    isSaved: entry.has_current_user_saved,
    isReposted: entry.has_current_user_reposted,
    isActive: playingUid === entry.uid,
    isPlaying: queuedAndPlaying && playingUid === entry.uid,
    landlordName: entry.user.name,
    landlordHandle: entry.user.handle,
    digitalContentTitle: entry.title,
    digitalContentId: entry.digital_content_id,
    uid: entry.uid,
    isDeleted: entry.is_delete || !!entry.user.is_deactivated
  }))
  const contentRefCallback = useOffsetScroll()
  return (
    <div className={styles.digitalContentsLineupContainer}>
      {digitalContents.status !== Status.LOADING ? (
        digitalContents.entries.length === 0 ? (
          <EmptyTab
            message={
              <>
                {messages.emptyDigitalContents}
                <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
              </>
            }
            onClick={goToTrending}
          />
        ) : (
          <div ref={contentRefCallback} className={styles.tabContainer}>
            <div className={styles.searchContainer}>
              <div className={styles.searchInnerContainer}>
                <input
                  placeholder={messages.filterDigitalContents}
                  onChange={onFilterChange}
                  value={filterText}
                />
                <IconFilter className={styles.iconFilter} />
              </div>
            </div>
            {digitalContentList.length > 0 && (
              <div className={styles.digitalContentListContainer}>
                <DigitalContentList
                  digitalContents={digitalContentList}
                  showDivider
                  showBorder
                  onSave={onSave}
                  togglePlay={onTogglePlay}
                  digitalContentItemAction={DigitalContentItemAction.Save}
                />
              </div>
            )}
          </div>
        )
      ) : null}
    </div>
  )
}

const AlbumCardLineup = ({
  albums,
  goToTrending,
  onFilterChange,
  filterText,
  goToRoute,
  getFilteredAlbums,
  formatCardSecondaryText
}: {
  albums: SavedPageCollection[]
  goToTrending: () => void
  onFilterChange: (e: any) => void
  filterText: string
  formatCardSecondaryText: (saves: number, digitalContents: number) => string
  getFilteredAlbums: (albums: SavedPageCollection[]) => SavedPageCollection[]
  goToRoute: (route: string) => void
}) => {
  const filteredAlbums = getFilteredAlbums(albums || [])
  const albumCards = filteredAlbums.map((album) => {
    return (
      <Card
        key={album.content_list_id}
        id={album.content_list_id}
        userId={album.content_list_owner_id}
        imageSize={album._cover_art_sizes}
        primaryText={album.content_list_name}
        secondaryText={formatCardSecondaryText(
          album.save_count,
          album.content_list_contents.digital_content_ids.length
        )}
        onClick={() =>
          goToRoute(
            albumPage(album.ownerHandle, album.content_list_name, album.content_list_id)
          )
        }
      />
    )
  })

  const contentRefCallback = useOffsetScroll()

  return (
    <div className={styles.cardLineupContainer}>
      {albums.length === 0 ? (
        <EmptyTab
          message={
            <>
              {messages.emptyAlbums}
              <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
            </>
          }
          onClick={goToTrending}
        />
      ) : (
        <div ref={contentRefCallback} className={styles.tabContainer}>
          <div className={styles.searchContainer}>
            <div className={styles.searchInnerContainer}>
              <input
                placeholder={messages.filterAlbums}
                onChange={onFilterChange}
                value={filterText}
              />
              <IconFilter className={styles.iconFilter} />
            </div>
          </div>
          {filteredAlbums.length > 0 && (
            <div className={styles.cardsContainer}>
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={albumCards}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ContentListCardLineup = ({
  contentLists,
  goToTrending,
  onFilterChange,
  filterText,
  goToRoute,
  getFilteredContentLists,
  formatCardSecondaryText,
  contentListUpdates,
  updateContentListLastViewedAt
}: {
  contentLists: SavedPageCollection[]
  goToTrending: () => void
  onFilterChange: (e: any) => void
  filterText: string
  formatCardSecondaryText: (saves: number, digitalContents: number) => string
  getFilteredContentLists: (
    contentLists: SavedPageCollection[]
  ) => SavedPageCollection[]
  goToRoute: (route: string) => void
  contentListUpdates: number[]
  updateContentListLastViewedAt: (contentListId: number) => void
}) => {
  const record = useRecord()

  const filteredContentLists = getFilteredContentLists(contentLists || [])
  const contentListCards = filteredContentLists.map((contentList) => {
    const hasUpdate = contentListUpdates.includes(contentList.content_list_id)
    return (
      <Card
        key={contentList.content_list_id}
        id={contentList.content_list_id}
        userId={contentList.content_list_owner_id}
        imageSize={contentList._cover_art_sizes}
        primaryText={contentList.content_list_name}
        secondaryText={formatCardSecondaryText(
          contentList.save_count,
          contentList.content_list_contents.digital_content_ids.length
        )}
        onClick={() => {
          goToRoute(
            contentListPage(
              contentList.ownerHandle,
              contentList.content_list_name,
              contentList.content_list_id
            )
          )
          updateContentListLastViewedAt(contentList.content_list_id)
          record(
            make(Name.CONTENT_LIST_LIBRARY_CLICKED, {
              contentListId: contentList.content_list_id,
              hasUpdate
            })
          )
        }}
        updateDot={hasUpdate}
      />
    )
  })

  const contentRefCallback = useOffsetScroll()

  return (
    <div className={styles.cardLineupContainer}>
      {contentLists.length === 0 ? (
        <>
          <EmptyTab
            message={
              <>
                {messages.emptyContentLists}
                <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
              </>
            }
            onClick={goToTrending}
          />
          <NewContentListButton />
        </>
      ) : (
        <div ref={contentRefCallback} className={styles.tabContainer}>
          <div className={styles.searchContainer}>
            <div className={styles.searchInnerContainer}>
              <input
                placeholder={messages.filterContentLists}
                onChange={onFilterChange}
                value={filterText}
              />
              <IconFilter className={styles.iconFilter} />
            </div>
          </div>
          <NewContentListButton />
          {filteredContentLists.length > 0 && (
            <div className={styles.cardsContainer}>
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={contentListCards}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const messages = {
  emptyDigitalContents: "You haven't favorited any digitalContents yet.",
  emptyAlbums: "You haven't favorited any albums yet.",
  emptyContentLists: "You haven't favorited any contentLists yet.",
  filterDigitalContents: 'Filter DigitalContents',
  filterAlbums: 'Filter Albums',
  filterContentLists: 'Filter ContentLists',
  digitalContents: 'DigitalContents',
  albums: 'Albums',
  contentLists: 'ContentLists'
}

const tabHeaders = [
  { icon: <IconNote />, text: messages.digitalContents, label: Tabs.AGREEMENTS },
  { icon: <IconAlbum />, text: messages.albums, label: Tabs.ALBUMS },
  { icon: <IconContentLists />, text: messages.contentLists, label: Tabs.CONTENT_LISTS }
]

export type SavedPageProps = {
  title: string
  description: string
  onFilterChange: (e: any) => void
  isQueued: boolean
  playingUid: UID | null
  getFilteredData: (digitalContentMetadatas: any) => [SavedPageDigitalContent[], number]
  onTogglePlay: (uid: UID, digitalContentId: ID) => void

  onSave: (isSaved: boolean, digitalContentId: ID) => void
  onPlay: () => void
  onSortDigitalContents: (sorters: any) => void
  formatCardSecondaryText: (saves: number, digitalContents: number) => string
  filterText: string
  initialOrder: UID[] | null
  account:
    | (User & {
        albums: SavedPageCollection[]
        contentLists: SavedPageCollection[]
      })
    | undefined
  digitalContents: Lineup<SavedPageDigitalContent>
  currentQueueItem: QueueItem
  playing: boolean
  buffering: boolean
  fetchSavedDigitalContents: () => void
  resetSavedDigitalContents: () => void
  updateLineupOrder: (updatedOrderIndices: UID[]) => void
  getFilteredAlbums: (albums: SavedPageCollection[]) => SavedPageCollection[]
  getFilteredContentLists: (
    contentLists: SavedPageCollection[]
  ) => SavedPageCollection[]

  fetchSavedAlbums: () => void
  goToRoute: (route: string) => void
  repostDigitalContent: (digitalContentId: ID) => void
  undoRepostDigitalContent: (digitalContentId: ID) => void
  saveDigitalContent: (digitalContentId: ID) => void
  unsaveDigitalContent: (digitalContentId: ID) => void
  onClickRemove: any
  onReorderDigitalContents: any
  contentListUpdates: number[]
  updateContentListLastViewedAt: (contentListId: number) => void
}

const SavedPage = ({
  title,
  description,
  account,
  playingUid,
  digitalContents,
  goToRoute,
  playing,
  isQueued,
  onTogglePlay,
  getFilteredData,
  getFilteredAlbums,
  getFilteredContentLists,
  onFilterChange,
  filterText,
  formatCardSecondaryText,
  onSave,
  contentListUpdates,
  updateContentListLastViewedAt
}: SavedPageProps) => {
  useMainPageHeader()

  const queuedAndPlaying = playing && isQueued

  const goToTrending = () => goToRoute(TRENDING_PAGE)
  const elements = [
    <DigitalContentsLineup
      key='digitalContentsLineup'
      digitalContents={digitalContents}
      goToTrending={goToTrending}
      onFilterChange={onFilterChange}
      filterText={filterText}
      getFilteredData={getFilteredData}
      playingUid={playingUid}
      queuedAndPlaying={queuedAndPlaying}
      onSave={onSave}
      onTogglePlay={onTogglePlay}
    />,
    <AlbumCardLineup
      key='albumLineup'
      getFilteredAlbums={getFilteredAlbums}
      albums={account ? account.albums : []}
      goToTrending={goToTrending}
      onFilterChange={onFilterChange}
      filterText={filterText}
      goToRoute={goToRoute}
      formatCardSecondaryText={formatCardSecondaryText}
    />,
    <ContentListCardLineup
      key='contentListLineup'
      getFilteredContentLists={getFilteredContentLists}
      contentLists={account ? account.contentLists : []}
      goToTrending={goToTrending}
      onFilterChange={onFilterChange}
      filterText={filterText}
      goToRoute={goToRoute}
      formatCardSecondaryText={formatCardSecondaryText}
      contentListUpdates={contentListUpdates}
      updateContentListLastViewedAt={updateContentListLastViewedAt}
    />
  ]
  const { tabs, body } = useTabs({
    tabs: tabHeaders,
    elements,
    initialScrollOffset: SCROLL_HEIGHT
  })

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header className={styles.header} title={title} />
        <div className={styles.tabBar}>{tabs}</div>
      </>
    )
  }, [title, setHeader, tabs])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      containerClassName={styles.mobilePageContainer}
    >
      {digitalContents.status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <div className={styles.tabContainer}>
          <div className={styles.pageContainer}>{body}</div>
        </div>
      )}
    </MobilePageContainer>
  )
}

export default SavedPage

import { ID, UID, Lineup, Status, User } from '@coliving/common'
import { Button, ButtonType, IconPause, IconPlay } from '@coliving/stems'

import { ReactComponent as IconAlbum } from 'assets/img/iconAlbum.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import {
  Tabs as ProfileTabs,
  DigitalContentRecord,
  SavedPageDigitalContent,
  SavedPageCollection
} from 'common/store/pages/savedPage/types'
import { QueueItem } from 'common/store/queue/types'
import Card from 'components/card/desktop/card'
import FilterInput from 'components/filterInput/filterInput'
import Header from 'components/header/desktop/header'
import CardLineup from 'components/lineup/cardLineup'
import Page from 'components/page/page'
import EmptyTable from 'components/digitalContentsTable/emptyTable'
import DigitalContentsTable from 'components/digitalContentsTable/digitalContentsTable'
import { useOrderedLoad } from 'hooks/useOrderedLoad'
import useTabs from 'hooks/useTabs/useTabs'
import { albumPage } from 'utils/route'

import styles from './savedPage.module.css'

const messages = {
  filterPlaceholder: 'Filter DigitalContents'
}

export type SavedPageProps = {
  title: string
  description: string
  onFilterChange: (e: any) => void
  isQueued: boolean
  playingUid: UID | null
  getFilteredData: (
    digitalContentMetadatas: SavedPageDigitalContent[]
  ) => [SavedPageDigitalContent[], number]
  onClickRow: (record: DigitalContentRecord) => void
  onClickSave: (record: DigitalContentRecord) => void
  onClickDigitalContentName: (record: DigitalContentRecord) => void
  onClickLandlordName: (record: DigitalContentRecord) => void
  onClickRepost: (record: DigitalContentRecord) => void
  onPlay: () => void
  onSortDigitalContents: (sorters: any) => void
  onChangeTab: (tab: ProfileTabs) => void
  formatCardSecondaryText: (saves: number, digitalContents: number) => string
  filterText: string
  initialOrder: UID[] | null
  currentTab: ProfileTabs
  account: (User & { albums: SavedPageCollection[] }) | undefined
  digitalContents: Lineup<SavedPageDigitalContent>
  currentQueueItem: QueueItem
  playing: boolean
  buffering: boolean
  fetchSavedDigitalContents: () => void
  resetSavedDigitalContents: () => void
  updateLineupOrder: (updatedOrderIndices: UID[]) => void
  fetchSavedAlbums: () => void
  goToRoute: (route: string) => void
  play: (uid?: UID) => void
  pause: () => void
  repostDigitalContent: (digitalContentId: ID) => void
  undoRepostDigitalContent: (digitalContentId: ID) => void
  saveDigitalContent: (digitalContentId: ID) => void
  unsaveDigitalContent: (digitalContentId: ID) => void
  onClickRemove: any
  onReorderDigitalContents: any
}

const SavedPage = ({
  title,
  description,
  account,
  digitalContents: { status, entries },
  goToRoute,
  playing,
  currentTab,
  isQueued,
  getFilteredData,
  onPlay,
  onFilterChange,
  filterText,
  formatCardSecondaryText,
  onChangeTab,
  onClickRow,
  onClickSave,
  onClickDigitalContentName,
  onClickLandlordName,
  onClickRepost,
  onClickRemove,
  onSortDigitalContents,
  onReorderDigitalContents
}: SavedPageProps) => {
  const [dataSource, playingIndex] =
    status === Status.SUCCESS ? getFilteredData(entries) : [[], -1]
  const { isLoading: isLoadingAlbums, setDidLoad: setDidLoadAlbums } =
    useOrderedLoad(account ? account.albums.length : 0)
  const isEmpty = entries.length === 0
  const digitalContentsLoading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued

  // Setup play button
  const playButtonActive = currentTab === ProfileTabs.DIGITAL_CONTENTS && !digitalContentsLoading
  const playAllButton = (
    <div
      className={styles.playButtonContainer}
      style={{
        opacity: playButtonActive ? 1 : 0,
        pointerEvents: playButtonActive ? 'auto' : 'none'
      }}
    >
      <Button
        className={styles.playAllButton}
        iconClassName={styles.playAllButtonIcon}
        textClassName={styles.playAllButtonText}
        type={ButtonType.PRIMARY_ALT}
        text={queuedAndPlaying ? 'PAUSE' : 'PLAY'}
        leftIcon={queuedAndPlaying ? <IconPause /> : <IconPlay />}
        onClick={onPlay} css={undefined}      />
    </div>
  )

  // Setup filter
  const filterActive = currentTab === ProfileTabs.DIGITAL_CONTENTS
  const filter = (
    <div
      className={styles.filterContainer}
      style={{
        opacity: filterActive ? 1 : 0,
        pointerEvents: filterActive ? 'auto' : 'none'
      }}
    >
      <FilterInput
        placeholder={messages.filterPlaceholder}
        onChange={onFilterChange}
        value={filterText}
      />
    </div>
  )

  const cards = account
    ? account.albums.map((album, i) => {
        return (
          <Card
            index={i}
            isLoading={isLoadingAlbums(i)}
            setDidLoad={setDidLoadAlbums}
            key={album.content_list_id}
            id={album.content_list_id}
            userId={album.content_list_owner_id}
            imageSize={album._cover_art_sizes}
            size='medium'
            contentListName={album.content_list_name}
            contentListId={album.content_list_id}
            isContentList={false}
            isPublic={!album.is_private}
            handle={album.ownerHandle}
            primaryText={album.content_list_name}
            secondaryText={formatCardSecondaryText(
              album.save_count,
              album.content_list_contents.digital_content_ids.length
            )}
            isReposted={album.has_current_user_reposted}
            isSaved={album.has_current_user_saved}
            cardCoverImageSizes={album._cover_art_sizes}
            onClick={() =>
              goToRoute(
                albumPage(
                  album.ownerHandle,
                  album.content_list_name,
                  album.content_list_id
                )
              )
            }
          />
        )
      })
    : []

  const { tabs, body } = useTabs({
    isMobile: false,
    didChangeTabsFrom: (_, to) => {
      onChangeTab(to as ProfileTabs)
    },
    bodyClassName: styles.tabBody,
    elementClassName: styles.tabElement,
    tabs: [
      {
        icon: <IconNote />,
        text: ProfileTabs.DIGITAL_CONTENTS,
        label: ProfileTabs.DIGITAL_CONTENTS
      },
      {
        icon: <IconAlbum />,
        text: ProfileTabs.ALBUMS,
        label: ProfileTabs.ALBUMS
      }
    ],
    elements: [
      isEmpty && !digitalContentsLoading ? (
        <EmptyTable
          primaryText='You haven’t favorited any digitalContents yet.'
          secondaryText='Once you have, this is where you’ll find them!'
          buttonLabel='Go to Trending'
          onClick={() => goToRoute('/trending')}
        />
      ) : (
        <div className={styles.tableWrapper}>
          <DigitalContentsTable
            key='favorites'
            userId={account ? account.user_id : 0}
            loading={digitalContentsLoading}
            loadingRowsCount={account ? account.digital_content_save_count : 0}
            playing={queuedAndPlaying}
            playingIndex={playingIndex}
            dataSource={dataSource}
            onClickRow={onClickRow}
            onClickFavorite={onClickSave}
            onClickDigitalContentName={onClickDigitalContentName}
            onClickLandlordName={onClickLandlordName}
            onClickRepost={onClickRepost}
            onClickRemove={onClickRemove}
            onSortDigitalContents={onSortDigitalContents}
            onReorderDigitalContents={onReorderDigitalContents}
          />
        </div>
      ),
      <div key='albums'>
        {account && account.albums.length > 0 ? (
          <CardLineup cards={cards} cardsClassName={styles.cardsContainer} />
        ) : (
          <EmptyTable
            primaryText='You haven’t favorited any albums yet.'
            secondaryText='Once you have, this is where you’ll find them!'
            buttonLabel='Go to Trending'
            onClick={() => goToRoute('/trending')}
          />
        )}
      </div>
    ]
  })

  const header = (
    <Header
      primary='Favorites'
      secondary={isEmpty ? null : playAllButton}
      rightDecorator={filter}
      containerStyles={styles.savedPageHeader}
      bottomBar={tabs}
    />
  )

  return (
    <Page
      title={title}
      description={description}
      contentClassName={styles.savedPageWrapper}
      header={header}
    >
      <div className={styles.bodyWrapper}>{body}</div>
    </Page>
  )
}

export default SavedPage

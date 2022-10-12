import { useEffect, useContext } from 'react'

import { CID, ID, LineupState, DigitalContent, User } from '@coliving/common'

import { digitalContentsActions } from 'common/store/pages/digital_content/lineup/actions'
import { QueueItem } from 'common/store/queue/types'
import { OverflowAction } from 'common/store/ui/mobileOverflowMenu/types'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import Lineup from 'components/lineup/lineup'
import { LineupVariant } from 'components/lineup/types'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/store/context'
import NetworkConnectivityMonitor from 'components/networkConnectivity/networkConnectivityMonitor'
import SectionButton from 'components/sectionButton/sectionButton'
import { getDigitalContentDefaults, emptyStringGuard } from 'pages/digitalContentPage/utils'

import Remixes from './remixes'
import DigitalContentPageHeader from './digitalContentHeader'
import styles from './digitalContentPage.module.css'

const messages = {
  moreBy: 'More By',
  originalDigitalContent: 'Original DigitalContent',
  viewOtherRemixes: 'View Other Remixes'
}

export type OwnProps = {
  title: string
  description: string
  canonicalUrl: string
  hasValidRemixParent: boolean
  // Hero DigitalContent Props
  heroDigitalContent: DigitalContent | null
  user: User | null
  heroPlaying: boolean
  userId: ID | null
  onHeroPlay: (isPlaying: boolean) => void
  onHeroShare: (digitalContentId: ID) => void
  goToProfilePage: (handle: string) => void
  goToSearchResultsPage: (tag: string) => void
  goToAllRemixesPage: () => void
  goToParentRemixesPage: () => void
  onHeroRepost: (isReposted: boolean, digitalContentId: number) => void
  onClickMobileOverflow: (
    digitalContentId: ID,
    overflowActions: OverflowAction[]
  ) => void

  onSaveDigitalContent: (isSaved: boolean, digitalContentId: ID) => void
  onDownloadDigitalContent: (
    digitalContentId: ID,
    cid: CID,
    contentNodeEndpoints: string,
    category?: string,
    parentDigitalContentId?: ID
  ) => void
  // DigitalContents Lineup Props
  digitalContents: LineupState<{ id: ID }>
  currentQueueItem: QueueItem
  isPlaying: boolean
  isBuffering: boolean
  play: (uid?: string) => void
  pause: () => void
  goToFavoritesPage: (digitalContentId: ID) => void
  goToRepostsPage: (digitalContentId: ID) => void
}

const DigitalContentPage = ({
  title,
  description,
  canonicalUrl,
  hasValidRemixParent,
  // Hero DigitalContent Props
  heroDigitalContent,
  user,
  heroPlaying,
  userId,
  onHeroPlay,
  onHeroShare,
  goToProfilePage,
  goToSearchResultsPage,
  goToAllRemixesPage,
  goToParentRemixesPage,
  onSaveDigitalContent,
  onDownloadDigitalContent,
  onHeroRepost,
  onClickMobileOverflow,

  // DigitalContents Lineup Props
  digitalContents,
  currentQueueItem,
  isPlaying,
  isBuffering,
  play,
  pause,
  goToFavoritesPage,
  goToRepostsPage
}: OwnProps) => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(CenterPreset.LOGO)
    setRight(RightPreset.SEARCH)
  }, [setLeft, setCenter, setRight])

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(null)
  }, [setHeader])

  const { entries } = digitalContents
  const isOwner = heroDigitalContent ? heroDigitalContent.owner_id === userId : false
  const isSaved = heroDigitalContent ? heroDigitalContent.has_current_user_saved : false
  const isReposted = heroDigitalContent ? heroDigitalContent.has_current_user_reposted : false
  const isFollowing = user ? user.does_current_user_follow : false

  const loading = !heroDigitalContent

  const onPlay = () => onHeroPlay(heroPlaying)
  const onSave = isOwner
    ? () => {}
    : () => heroDigitalContent && onSaveDigitalContent(isSaved, heroDigitalContent.digital_content_id)
  const onRepost = isOwner
    ? () => {}
    : () => heroDigitalContent && onHeroRepost(isReposted, heroDigitalContent.digital_content_id)
  const onClickLandlordName = () => goToProfilePage(user ? user.handle : '')
  const onShare = () => {
    heroDigitalContent && onHeroShare(heroDigitalContent.digital_content_id)
  }

  const onClickTag = (tag: string) => goToSearchResultsPage(`#${tag}`)

  const defaults = getDigitalContentDefaults(heroDigitalContent)

  const renderOriginalDigitalContentTitle = () => (
    <div className={styles.lineupHeader}>{messages.originalDigitalContent}</div>
  )

  const onDownload = (
    digitalContentId: ID,
    cid: CID,
    category?: string,
    parentDigitalContentId?: ID
  ) => {
    if (!user) return
    const { content_node_endpoint } = user
    if (!content_node_endpoint) return
    onDownloadDigitalContent(
      digitalContentId,
      cid,
      content_node_endpoint,
      category,
      parentDigitalContentId
    )
  }

  const renderMoreByTitle = () =>
    (defaults.remixParentDigitalContentId && entries.length > 2) ||
    (!defaults.remixParentDigitalContentId && entries.length > 1) ? (
      <div
        className={styles.lineupHeader}
      >{`${messages.moreBy} ${user?.name}`}</div>
    ) : null

  return (
    <NetworkConnectivityMonitor pageDidLoad={!loading}>
      <MobilePageContainer
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
      >
        <div className={styles.digitalContent}>
          <DigitalContentPageHeader
            isLoading={loading}
            isPlaying={heroPlaying}
            isReposted={isReposted}
            isFollowing={isFollowing}
            title={defaults.title}
            digitalContentId={defaults.digitalContentId}
            userId={heroDigitalContent?.owner_id ?? 0}
            landlordName={emptyStringGuard(user?.name)}
            landlordVerified={user?.is_verified ?? false}
            coverArtSizes={defaults.coverArtSizes}
            tags={defaults.tags}
            description={defaults.description}
            listenCount={defaults.playCount}
            repostCount={defaults.repostCount}
            duration={defaults.duration}
            released={defaults.released}
            credits={defaults.credits}
            genre={defaults.genre}
            mood={defaults.mood}
            saveCount={defaults.saveCount}
            isOwner={isOwner}
            isSaved={isSaved}
            coSign={defaults.coSign}
            // Actions (Wire up once we add backend integrations)
            onClickLandlordName={onClickLandlordName}
            onClickMobileOverflow={onClickMobileOverflow}
            onClickTag={onClickTag}
            onPlay={onPlay}
            onSave={onSave}
            onShare={onShare}
            onRepost={onRepost}
            onDownload={onDownload}
            isUnlisted={defaults.isUnlisted}
            isRemix={!!defaults.remixParentDigitalContentId}
            fieldVisibility={defaults.fieldVisibility}
            goToFavoritesPage={goToFavoritesPage}
            goToRepostsPage={goToRepostsPage}
          />
          {defaults.fieldVisibility.remixes &&
            defaults.remixDigitalContentIds &&
            defaults.remixDigitalContentIds.length > 0 && (
              <div className={styles.remixes}>
                <Remixes
                  digitalContentIds={defaults.remixDigitalContentIds}
                  goToAllRemixes={goToAllRemixesPage}
                  count={defaults.remixesCount}
                />
              </div>
            )}
          <div className={styles.digitalContentsContainer}>
            {!hasValidRemixParent && renderMoreByTitle()}
            {hasValidRemixParent && renderOriginalDigitalContentTitle()}
            <Lineup
              lineup={digitalContents}
              // Styles for leading element (original digital_content if remix).
              leadingElementId={defaults.remixParentDigitalContentId}
              leadingElementDelineator={
                <div className={styles.originalDigitalContentDelineator}>
                  <SectionButton
                    isMobile
                    text={messages.viewOtherRemixes}
                    onClick={goToParentRemixesPage}
                  />
                  {renderMoreByTitle()}
                </div>
              }
              leadingElementClassName={styles.originalDigitalContent}
              showLeadingElementLandlordPick={false}
              // Don't render the first tile in the lineup.
              start={1}
              // Show max 5 loading tiles
              count={6}
              // Managed from the parent rather than allowing the lineup to fetch content itself.
              selfLoad={false}
              variant={LineupVariant.CONDENSED}
              playingUid={currentQueueItem.uid}
              playingSource={currentQueueItem.source}
              playingDigitalContentId={
                currentQueueItem.digital_content && currentQueueItem.digital_content.digital_content_id
              }
              playing={isPlaying}
              buffering={isBuffering}
              playDigitalContent={play}
              pauseDigitalContent={pause}
              actions={digitalContentsActions}
            />
          </div>
        </div>
      </MobilePageContainer>
    </NetworkConnectivityMonitor>
  )
}

export default DigitalContentPage

import { ID, CID, LineupState, DigitalContent, User } from '@coliving/common'
import cn from 'classnames'

import { digitalContentsActions } from 'common/store/pages/digital_content/lineup/actions'
import { QueueItem } from 'common/store/queue/types'
import CoverPhoto from 'components/coverPhoto/coverPhoto'
import Lineup from 'components/lineup/lineup'
import { LineupVariant } from 'components/lineup/types'
import NavBanner from 'components/navBanner/navBanner'
import Page from 'components/page/page'
import SectionButton from 'components/sectionButton/sectionButton'
import StatBanner from 'components/statBanner/statBanner'
import GiantDigitalContentTile from 'components/digital_content/giantDigitalContentTile'
import { DigitalContentTileSize } from 'components/digital_content/types'
import { getDigitalContentDefaults, emptyStringGuard } from 'pages/digitalContentPage/utils'

import Remixes from './remixes'
import styles from './DigitalContentPage.module.css'

const messages = {
  moreBy: 'More By',
  originalDigitalContent: 'Original DigitalContent',
  viewOtherRemixes: 'View Other Remixes'
}

export type OwnProps = {
  title: string
  description: string
  canonicalUrl: string
  // Hero DigitalContent Props
  heroDigitalContent: DigitalContent | null
  hasValidRemixParent: boolean
  user: User | null
  heroPlaying: boolean
  userId: ID | null
  badge: string | null
  onHeroPlay: (isPlaying: boolean) => void
  goToProfilePage: (handle: string) => void
  goToSearchResultsPage: (tag: string) => void
  goToAllRemixesPage: () => void
  goToParentRemixesPage: () => void
  onHeroShare: (digitalContentId: ID) => void
  onHeroRepost: (isReposted: boolean, digitalContentId: ID) => void
  onFollow: () => void
  onUnfollow: () => void
  onClickReposts: () => void
  onClickFavorites: () => void

  onSaveDigitalContent: (isSaved: boolean, digitalContentId: ID) => void
  onDownloadDigitalContent: (
    digitalContentId: ID,
    cid: CID,
    contentNodeEndpoints: string,
    category?: string,
    parentDigitalContentId?: ID
  ) => void
  makePublic: (digitalContentId: ID) => void
  // DigitalContents Lineup Props
  digitalContents: LineupState<{ id: ID }>
  currentQueueItem: QueueItem
  isPlaying: boolean
  isBuffering: boolean
  play: (uid?: string) => void
  pause: () => void
  onExternalLinkClick: (url: string) => void
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
  badge,
  onHeroPlay,
  goToProfilePage,
  goToSearchResultsPage,
  goToAllRemixesPage,
  goToParentRemixesPage,
  onHeroShare,
  onHeroRepost,
  onSaveDigitalContent,
  onFollow,
  onUnfollow,
  onDownloadDigitalContent,
  makePublic,
  onExternalLinkClick,
  onClickReposts,
  onClickFavorites,

  // DigitalContents Lineup Props
  digitalContents,
  currentQueueItem,
  isPlaying,
  isBuffering,
  play,
  pause
}: OwnProps) => {
  const { entries } = digitalContents
  const isOwner = heroDigitalContent?.owner_id === userId ?? false
  const following = user?.does_current_user_follow ?? false
  const isSaved = heroDigitalContent?.has_current_user_saved ?? false
  const isReposted = heroDigitalContent?.has_current_user_reposted ?? false
  const loading = !heroDigitalContent

  const onPlay = () => onHeroPlay(heroPlaying)
  const onSave = isOwner
    ? () => {}
    : () => heroDigitalContent && onSaveDigitalContent(isSaved, heroDigitalContent.digital_content_id)
  const onClickLandlordName = () =>
    goToProfilePage(emptyStringGuard(user?.handle))
  const onShare = () => (heroDigitalContent ? onHeroShare(heroDigitalContent.digital_content_id) : null)
  const onRepost = () =>
    heroDigitalContent ? onHeroRepost(isReposted, heroDigitalContent.digital_content_id) : null
  const onClickTag = (tag: string) => goToSearchResultsPage(`#${tag}`)
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

  const defaults = getDigitalContentDefaults(heroDigitalContent)

  const renderGiantDigitalContentTile = () => (
    <GiantDigitalContentTile
      loading={loading}
      playing={heroPlaying}
      digitalContentTitle={defaults.title}
      digitalContentId={defaults.digitalContentId}
      userId={user?.user_id ?? 0}
      landlordName={emptyStringGuard(user?.name)}
      landlordHandle={emptyStringGuard(user?.handle)}
      coverArtSizes={defaults.coverArtSizes}
      tags={defaults.tags}
      description={defaults.description}
      listenCount={defaults.playCount}
      duration={defaults.duration}
      released={defaults.released}
      credits={defaults.credits}
      genre={defaults.genre}
      mood={defaults.mood}
      repostCount={defaults.repostCount}
      saveCount={defaults.saveCount}
      isReposted={isReposted}
      isOwner={isOwner}
      currentUserId={userId}
      isLandlordPick={
        heroDigitalContent && user ? user._landlord_pick === heroDigitalContent.digital_content_id : false
      }
      isSaved={isSaved}
      badge={badge}
      onExternalLinkClick={onExternalLinkClick}
      isUnlisted={defaults.isUnlisted}
      isRemix={!!defaults.remixParentDigitalContentId}
      isPublishing={defaults.isPublishing}
      fieldVisibility={defaults.fieldVisibility}
      coSign={defaults.coSign}
      // Actions
      onClickLandlordName={onClickLandlordName}
      onClickTag={onClickTag}
      onPlay={onPlay}
      onShare={onShare}
      onRepost={onRepost}
      onSave={onSave}
      following={following}
      onFollow={onFollow}
      onUnfollow={onUnfollow}
      download={defaults.download}
      onDownload={onDownload}
      makePublic={makePublic}
      onClickReposts={onClickReposts}
      onClickFavorites={onClickFavorites}
    />
  )

  const renderOriginalDigitalContentTitle = () => (
    <div className={cn(styles.lineupHeader, styles.large)}>
      {messages.originalDigitalContent}
    </div>
  )

  const renderMoreByTitle = () =>
    (defaults.remixParentDigitalContentId && entries.length > 2) ||
    (!defaults.remixParentDigitalContentId && entries.length > 1) ? (
      <div
        className={styles.lineupHeader}
      >{`${messages.moreBy} ${user?.name}`}</div>
    ) : null

  return (
    <Page
      title={title}
      description={description}
      canonicalUrl={canonicalUrl}
      variant='flush'
      scrollableSearch
    >
      <div className={styles.headerWrapper}>
        <CoverPhoto
          loading={loading}
          userId={user ? user.user_id : null}
          coverPhotoSizes={user ? user._cover_photo_sizes : null}
        />
        <StatBanner empty />
        <NavBanner empty />
      </div>
      <div className={styles.contentWrapper}>{renderGiantDigitalContentTile()}</div>
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
      <div className={styles.moreByLandlordLineupWrapper}>
        {hasValidRemixParent ? renderOriginalDigitalContentTitle() : renderMoreByTitle()}
        <Lineup
          lineup={digitalContents}
          // Styles for leading element (original digital_content if remix).
          leadingElementId={defaults.remixParentDigitalContentId}
          leadingElementDelineator={
            <div className={styles.originalDigitalContentDelineator}>
              <SectionButton
                text={messages.viewOtherRemixes}
                onClick={goToParentRemixesPage}
              />
              {renderMoreByTitle()}
            </div>
          }
          leadingElementTileProps={{ size: DigitalContentTileSize.LARGE }}
          laggingContainerClassName={styles.moreByLandlordContainer}
          leadingElementClassName={styles.originalDigitalContent}
          showLeadingElementLandlordPick={false}
          applyLeadingElementStylesToSkeleton
          // Don't render the first tile in the lineup since it's actually the "giant"
          // digital_content tile this page is about.
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
    </Page>
  )
}

export default DigitalContentPage

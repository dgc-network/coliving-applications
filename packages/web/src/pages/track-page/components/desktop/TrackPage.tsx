import { ID, CID, LineupState, Agreement, User } from '@coliving/common'
import cn from 'classnames'

import { agreementsActions } from 'common/store/pages/agreement/lineup/actions'
import { QueueItem } from 'common/store/queue/types'
import CoverPhoto from 'components/cover-photo/CoverPhoto'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import NavBanner from 'components/nav-banner/NavBanner'
import Page from 'components/page/Page'
import SectionButton from 'components/section-button/SectionButton'
import StatBanner from 'components/stat-banner/StatBanner'
import GiantAgreementTile from 'components/agreement/GiantAgreementTile'
import { AgreementTileSize } from 'components/agreement/types'
import { getAgreementDefaults, emptyStringGuard } from 'pages/agreement-page/utils'

import Remixes from './Remixes'
import styles from './AgreementPage.module.css'

const messages = {
  moreBy: 'More By',
  originalAgreement: 'Original Agreement',
  viewOtherRemixes: 'View Other Remixes'
}

export type OwnProps = {
  title: string
  description: string
  canonicalUrl: string
  // Hero Agreement Props
  heroAgreement: Agreement | null
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
  onHeroShare: (agreementId: ID) => void
  onHeroRepost: (isReposted: boolean, agreementId: ID) => void
  onFollow: () => void
  onUnfollow: () => void
  onClickReposts: () => void
  onClickFavorites: () => void

  onSaveAgreement: (isSaved: boolean, agreementId: ID) => void
  onDownloadAgreement: (
    agreementId: ID,
    cid: CID,
    contentNodeEndpoints: string,
    category?: string,
    parentAgreementId?: ID
  ) => void
  makePublic: (agreementId: ID) => void
  // Agreements Lineup Props
  agreements: LineupState<{ id: ID }>
  currentQueueItem: QueueItem
  isPlaying: boolean
  isBuffering: boolean
  play: (uid?: string) => void
  pause: () => void
  onExternalLinkClick: (url: string) => void
}

const AgreementPage = ({
  title,
  description,
  canonicalUrl,
  hasValidRemixParent,
  // Hero Agreement Props
  heroAgreement,
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
  onSaveAgreement,
  onFollow,
  onUnfollow,
  onDownloadAgreement,
  makePublic,
  onExternalLinkClick,
  onClickReposts,
  onClickFavorites,

  // Agreements Lineup Props
  agreements,
  currentQueueItem,
  isPlaying,
  isBuffering,
  play,
  pause
}: OwnProps) => {
  const { entries } = agreements
  const isOwner = heroAgreement?.owner_id === userId ?? false
  const following = user?.does_current_user_follow ?? false
  const isSaved = heroAgreement?.has_current_user_saved ?? false
  const isReposted = heroAgreement?.has_current_user_reposted ?? false
  const loading = !heroAgreement

  const onPlay = () => onHeroPlay(heroPlaying)
  const onSave = isOwner
    ? () => {}
    : () => heroAgreement && onSaveAgreement(isSaved, heroAgreement.agreement_id)
  const onClickArtistName = () =>
    goToProfilePage(emptyStringGuard(user?.handle))
  const onShare = () => (heroAgreement ? onHeroShare(heroAgreement.agreement_id) : null)
  const onRepost = () =>
    heroAgreement ? onHeroRepost(isReposted, heroAgreement.agreement_id) : null
  const onClickTag = (tag: string) => goToSearchResultsPage(`#${tag}`)
  const onDownload = (
    agreementId: ID,
    cid: CID,
    category?: string,
    parentAgreementId?: ID
  ) => {
    if (!user) return
    const { content_node_endpoint } = user
    if (!content_node_endpoint) return
    onDownloadAgreement(
      agreementId,
      cid,
      content_node_endpoint,
      category,
      parentAgreementId
    )
  }

  const defaults = getAgreementDefaults(heroAgreement)

  const renderGiantAgreementTile = () => (
    <GiantAgreementTile
      loading={loading}
      playing={heroPlaying}
      agreementTitle={defaults.title}
      agreementId={defaults.agreementId}
      userId={user?.user_id ?? 0}
      artistName={emptyStringGuard(user?.name)}
      artistHandle={emptyStringGuard(user?.handle)}
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
      isArtistPick={
        heroAgreement && user ? user._artist_pick === heroAgreement.agreement_id : false
      }
      isSaved={isSaved}
      badge={badge}
      onExternalLinkClick={onExternalLinkClick}
      isUnlisted={defaults.isUnlisted}
      isRemix={!!defaults.remixParentAgreementId}
      isPublishing={defaults.isPublishing}
      fieldVisibility={defaults.fieldVisibility}
      coSign={defaults.coSign}
      // Actions
      onClickArtistName={onClickArtistName}
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

  const renderOriginalAgreementTitle = () => (
    <div className={cn(styles.lineupHeader, styles.large)}>
      {messages.originalAgreement}
    </div>
  )

  const renderMoreByTitle = () =>
    (defaults.remixParentAgreementId && entries.length > 2) ||
    (!defaults.remixParentAgreementId && entries.length > 1) ? (
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
      <div className={styles.contentWrapper}>{renderGiantAgreementTile()}</div>
      {defaults.fieldVisibility.remixes &&
        defaults.remixAgreementIds &&
        defaults.remixAgreementIds.length > 0 && (
          <div className={styles.remixes}>
            <Remixes
              agreementIds={defaults.remixAgreementIds}
              goToAllRemixes={goToAllRemixesPage}
              count={defaults.remixesCount}
            />
          </div>
        )}
      <div className={styles.moreByArtistLineupWrapper}>
        {hasValidRemixParent ? renderOriginalAgreementTitle() : renderMoreByTitle()}
        <Lineup
          lineup={agreements}
          // Styles for leading element (original agreement if remix).
          leadingElementId={defaults.remixParentAgreementId}
          leadingElementDelineator={
            <div className={styles.originalAgreementDelineator}>
              <SectionButton
                text={messages.viewOtherRemixes}
                onClick={goToParentRemixesPage}
              />
              {renderMoreByTitle()}
            </div>
          }
          leadingElementTileProps={{ size: AgreementTileSize.LARGE }}
          laggingContainerClassName={styles.moreByArtistContainer}
          leadingElementClassName={styles.originalAgreement}
          showLeadingElementArtistPick={false}
          applyLeadingElementStylesToSkeleton
          // Don't render the first tile in the lineup since it's actually the "giant"
          // agreement tile this page is about.
          start={1}
          // Show max 5 loading tiles
          count={6}
          // Managed from the parent rather than allowing the lineup to fetch content itself.
          selfLoad={false}
          variant={LineupVariant.CONDENSED}
          playingUid={currentQueueItem.uid}
          playingSource={currentQueueItem.source}
          playingAgreementId={
            currentQueueItem.agreement && currentQueueItem.agreement.agreement_id
          }
          playing={isPlaying}
          buffering={isBuffering}
          playAgreement={play}
          pauseAgreement={pause}
          actions={agreementsActions}
        />
      </div>
    </Page>
  )
}

export default AgreementPage

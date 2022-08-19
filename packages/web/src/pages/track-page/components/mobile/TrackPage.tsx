import { useEffect, useContext } from 'react'

import { CID, ID, LineupState, Agreement, User } from '@coliving/common'

import { agreementsActions } from 'common/store/pages/agreement/lineup/actions'
import { QueueItem } from 'common/store/queue/types'
import { OverflowAction } from 'common/store/ui/mobile-overflow-menu/types'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/store/context'
import NetworkConnectivityMonitor from 'components/network-connectivity/NetworkConnectivityMonitor'
import SectionButton from 'components/section-button/SectionButton'
import { getAgreementDefaults, emptyStringGuard } from 'pages/agreement-page/utils'

import Remixes from './Remixes'
import AgreementPageHeader from './AgreementHeader'
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
  hasValidRemixParent: boolean
  // Hero Agreement Props
  heroAgreement: Agreement | null
  user: User | null
  heroPlaying: boolean
  userId: ID | null
  onHeroPlay: (isPlaying: boolean) => void
  onHeroShare: (agreementId: ID) => void
  goToProfilePage: (handle: string) => void
  goToSearchResultsPage: (tag: string) => void
  goToAllRemixesPage: () => void
  goToParentRemixesPage: () => void
  onHeroRepost: (isReposted: boolean, agreementId: number) => void
  onClickMobileOverflow: (
    agreementId: ID,
    overflowActions: OverflowAction[]
  ) => void

  onSaveAgreement: (isSaved: boolean, agreementId: ID) => void
  onDownloadAgreement: (
    agreementId: ID,
    cid: CID,
    contentNodeEndpoints: string,
    category?: string,
    parentAgreementId?: ID
  ) => void
  // Agreements Lineup Props
  agreements: LineupState<{ id: ID }>
  currentQueueItem: QueueItem
  isPlaying: boolean
  isBuffering: boolean
  play: (uid?: string) => void
  pause: () => void
  goToFavoritesPage: (agreementId: ID) => void
  goToRepostsPage: (agreementId: ID) => void
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
  onHeroPlay,
  onHeroShare,
  goToProfilePage,
  goToSearchResultsPage,
  goToAllRemixesPage,
  goToParentRemixesPage,
  onSaveAgreement,
  onDownloadAgreement,
  onHeroRepost,
  onClickMobileOverflow,

  // Agreements Lineup Props
  agreements,
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

  const { entries } = agreements
  const isOwner = heroAgreement ? heroAgreement.owner_id === userId : false
  const isSaved = heroAgreement ? heroAgreement.has_current_user_saved : false
  const isReposted = heroAgreement ? heroAgreement.has_current_user_reposted : false
  const isFollowing = user ? user.does_current_user_follow : false

  const loading = !heroAgreement

  const onPlay = () => onHeroPlay(heroPlaying)
  const onSave = isOwner
    ? () => {}
    : () => heroAgreement && onSaveAgreement(isSaved, heroAgreement.agreement_id)
  const onRepost = isOwner
    ? () => {}
    : () => heroAgreement && onHeroRepost(isReposted, heroAgreement.agreement_id)
  const onClickArtistName = () => goToProfilePage(user ? user.handle : '')
  const onShare = () => {
    heroAgreement && onHeroShare(heroAgreement.agreement_id)
  }

  const onClickTag = (tag: string) => goToSearchResultsPage(`#${tag}`)

  const defaults = getAgreementDefaults(heroAgreement)

  const renderOriginalAgreementTitle = () => (
    <div className={styles.lineupHeader}>{messages.originalAgreement}</div>
  )

  const onDownload = (
    agreementId: ID,
    cid: CID,
    category?: string,
    parentAgreementId?: ID
  ) => {
    if (!user) return
    const { creator_node_endpoint } = user
    if (!creator_node_endpoint) return
    onDownloadAgreement(
      agreementId,
      cid,
      creator_node_endpoint,
      category,
      parentAgreementId
    )
  }

  const renderMoreByTitle = () =>
    (defaults.remixParentAgreementId && entries.length > 2) ||
    (!defaults.remixParentAgreementId && entries.length > 1) ? (
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
        <div className={styles.agreementContent}>
          <AgreementPageHeader
            isLoading={loading}
            isPlaying={heroPlaying}
            isReposted={isReposted}
            isFollowing={isFollowing}
            title={defaults.title}
            agreementId={defaults.agreementId}
            userId={heroAgreement?.owner_id ?? 0}
            artistName={emptyStringGuard(user?.name)}
            artistVerified={user?.is_verified ?? false}
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
            onClickArtistName={onClickArtistName}
            onClickMobileOverflow={onClickMobileOverflow}
            onClickTag={onClickTag}
            onPlay={onPlay}
            onSave={onSave}
            onShare={onShare}
            onRepost={onRepost}
            onDownload={onDownload}
            isUnlisted={defaults.isUnlisted}
            isRemix={!!defaults.remixParentAgreementId}
            fieldVisibility={defaults.fieldVisibility}
            goToFavoritesPage={goToFavoritesPage}
            goToRepostsPage={goToRepostsPage}
          />
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
          <div className={styles.agreementsContainer}>
            {!hasValidRemixParent && renderMoreByTitle()}
            {hasValidRemixParent && renderOriginalAgreementTitle()}
            <Lineup
              lineup={agreements}
              // Styles for leading element (original agreement if remix).
              leadingElementId={defaults.remixParentAgreementId}
              leadingElementDelineator={
                <div className={styles.originalAgreementDelineator}>
                  <SectionButton
                    isMobile
                    text={messages.viewOtherRemixes}
                    onClick={goToParentRemixesPage}
                  />
                  {renderMoreByTitle()}
                </div>
              }
              leadingElementClassName={styles.originalAgreement}
              showLeadingElementArtistPick={false}
              // Don't render the first tile in the lineup.
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
        </div>
      </MobilePageContainer>
    </NetworkConnectivityMonitor>
  )
}

export default AgreementPage

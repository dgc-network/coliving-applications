import { memo, useEffect, useContext } from 'react'

import {
  ID,
  Collection,
  SmartCollection,
  Variant,
  SmartCollectionVariant,
  Status,
  User
} from '@coliving/common'

import {
  CollectionsPageType,
  CollectionAgreement
} from 'common/store/pages/collection/types'
import { OverflowAction } from 'common/store/ui/mobileOverflowMenu/types'
import CollectionHeader from 'components/collection/mobile/collectionHeader'
import { HeaderContext } from 'components/header/mobile/headerContextProvider'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import MobilePageContainer from 'components/mobilePageContainer/mobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/store/context'
import NetworkConnectivityMonitor from 'components/networkConnectivity/networkConnectivityMonitor'
import AgreementList from 'components/agreement/mobile/AgreementList'
import { computeCollectionMetadataProps } from 'pages/collectionPage/store/utils'

import styles from './CollectionPage.module.css'

const messages = {
  emptyContentList: 'This contentList is empty.'
}

const EmptyAgreementList = ({
  customEmptyText
}: {
  customEmptyText?: string | null
}) => {
  return (
    <div className={styles.emptyListContainer}>
      <div>{customEmptyText || messages.emptyContentList}</div>
    </div>
  )
}

export type CollectionPageProps = {
  title: string
  description: string
  canonicalUrl: string
  contentListId: ID | SmartCollectionVariant
  playing: boolean
  getPlayingUid: () => string | null
  type: CollectionsPageType
  collection: {
    status: string
    metadata: Collection | SmartCollection | null
    user: User | null
  }
  agreements: {
    status: string
    entries: CollectionAgreement[]
  }
  userId?: ID | null
  userContentLists?: any
  isQueued: () => boolean
  onHeroAgreementClickLandlordName: () => void
  onPlay: (record: any) => void
  onHeroAgreementShare: () => void
  onHeroAgreementSave?: () => void
  onHeroAgreementRepost?: () => void
  onClickRow: (record: any) => void
  onClickSave?: (record: any) => void
  onClickMobileOverflow?: (
    collectionId: ID,
    overflowActions: OverflowAction[]
  ) => void
  onClickFavorites?: () => void
  onClickReposts?: () => void
  refresh?: () => void
}

const CollectionPage = ({
  title,
  description: pageDescription,
  canonicalUrl,
  contentListId,
  getPlayingUid,
  playing,
  type,
  collection: { status, metadata, user },
  agreements,
  userId,
  userContentLists,
  isQueued,
  onHeroAgreementClickLandlordName,
  onPlay,
  onHeroAgreementShare,
  onHeroAgreementSave,
  onClickRow,
  onClickSave,
  onHeroAgreementRepost,
  onClickMobileOverflow,
  onClickFavorites,
  onClickReposts,
  refresh
}: CollectionPageProps) => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    if (metadata) {
      // If the collection is deleted, don't update the nav
      if (
        metadata.variant !== Variant.SMART &&
        (metadata.is_delete || metadata._marked_deleted)
      ) {
        return
      }
      setLeft(LeftPreset.BACK)
      setRight(RightPreset.SEARCH)
      setCenter(CenterPreset.LOGO)
    }
  }, [setLeft, setCenter, setRight, metadata])

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(null)
  }, [setHeader])

  // TODO: Consider dynamic lineups, esp. for caching improvement.
  const collectionLoading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued()
  const agreementsLoading = agreements.status === Status.LOADING

  const coverArtSizes =
    metadata && metadata?.variant !== Variant.SMART
      ? metadata._cover_art_sizes
      : null
  const duration =
    agreements.entries?.reduce(
      (duration: number, entry: CollectionAgreement) =>
        duration + entry.duration || 0,
      0
    ) ?? 0

  const contentListOwnerName = user?.name ?? ''
  const contentListOwnerHandle = user?.handle ?? ''
  const contentListOwnerId = user?.user_id ?? null
  const isOwner = userId === contentListOwnerId

  const isSaved =
    metadata?.has_current_user_saved || contentListId in (userContentLists ?? {})
  const isPublishing =
    metadata && metadata?.variant !== Variant.SMART
      ? metadata._is_publishing
      : false

  const variant = metadata?.variant ?? null
  const gradient =
    metadata && metadata.variant === Variant.SMART ? metadata.gradient : ''
  const imageOverride =
    metadata && metadata.variant === Variant.SMART ? metadata.imageOverride : ''
  const icon =
    metadata && metadata.variant === Variant.SMART ? metadata.icon : null
  const typeTitle =
    metadata?.variant === Variant.SMART ? metadata?.typeTitle ?? type : type
  const customEmptyText =
    metadata?.variant === Variant.SMART ? metadata?.customEmptyText : null

  const {
    isEmpty,
    lastModified,
    contentListName,
    description,
    isPrivate,
    isAlbum,
    contentListSaveCount,
    contentListRepostCount,
    isReposted
  } = computeCollectionMetadataProps(metadata)

  const togglePlay = (uid: string, agreementId: ID) => {
    if (contentListId === SmartCollectionVariant.LIVE_NFT_CONTENT_LIST) {
      const agreement = agreements.entries.find((agreement) => agreement.uid === uid)

      if (agreement?.collectible) {
        const { collectible } = agreement

        onClickRow({
          ...collectible,
          uid: collectible.id,
          agreement_id: collectible.id
        })
      }
    } else {
      onClickRow({ uid, agreement_id: agreementId })
    }
  }
  const onSave = (isSaved: boolean, agreementId: number) => {
    if (!isOwner) {
      onClickSave?.({ has_current_user_saved: isSaved, agreement_id: agreementId })
    }
  }

  const playingUid = getPlayingUid()

  const agreementList = agreements.entries.map((entry) => ({
    isLoading: false,
    isSaved: entry.has_current_user_saved,
    isReposted: entry.has_current_user_reposted,
    isActive: playingUid === entry.uid,
    isPlaying: queuedAndPlaying && playingUid === entry.uid,
    landlordName: entry?.user?.name,
    landlordHandle: entry?.user?.handle,
    agreementTitle: entry.title,
    agreementId: entry.agreement_id,
    uid: entry.uid,
    isDeleted: entry.is_delete || !!entry?.user?.is_deactivated
  }))

  return (
    <NetworkConnectivityMonitor
      pageDidLoad={agreementsLoading}
      onDidRegainConnectivity={refresh}
    >
      <MobilePageContainer
        title={title}
        description={pageDescription}
        canonicalUrl={canonicalUrl}
      >
        <div className={styles.collectionContent}>
          <div>
            <CollectionHeader
              collectionId={contentListId}
              userId={user?.user_id ?? 0}
              loading={
                typeTitle === 'Audio NFT ContentList'
                  ? agreementsLoading
                  : collectionLoading
              }
              agreementsLoading={agreementsLoading}
              type={typeTitle}
              title={contentListName}
              landlordName={contentListOwnerName}
              landlordHandle={contentListOwnerHandle}
              coverArtSizes={coverArtSizes}
              description={description}
              isOwner={isOwner}
              isAlbum={isAlbum}
              numAgreements={agreementList.length}
              modified={lastModified || Date.now()}
              duration={duration}
              isPublished={!isPrivate}
              isPublishing={isPublishing}
              isSaved={isSaved}
              saves={contentListSaveCount}
              playing={queuedAndPlaying}
              repostCount={contentListRepostCount}
              isReposted={isReposted}
              // Actions
              onClickLandlordName={onHeroAgreementClickLandlordName}
              onPlay={onPlay}
              onShare={onHeroAgreementShare}
              onSave={onHeroAgreementSave}
              onRepost={onHeroAgreementRepost}
              onClickFavorites={onClickFavorites}
              onClickReposts={onClickReposts}
              onClickMobileOverflow={onClickMobileOverflow}
              // Smart collection
              variant={variant}
              gradient={gradient}
              imageOverride={imageOverride}
              icon={icon}
            />
          </div>
          <div className={styles.collectionAgreementsContainer}>
            {!agreementsLoading ? (
              isEmpty ? (
                <>
                  <div className={styles.divider}></div>
                  <EmptyAgreementList customEmptyText={customEmptyText} />
                </>
              ) : (
                <AgreementList
                  containerClassName={''}
                  itemClassName={''}
                  agreements={agreementList}
                  showTopDivider
                  showDivider
                  onSave={onSave}
                  togglePlay={togglePlay}
                />
              )
            ) : null}
            {collectionLoading && typeTitle === 'Audio NFT ContentList' ? (
              <LoadingSpinner className={styles.spinner} />
            ) : null}
          </div>
        </div>
      </MobilePageContainer>
    </NetworkConnectivityMonitor>
  )
}

export default memo(CollectionPage)

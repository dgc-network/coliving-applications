import { ChangeEvent } from 'react'

import {
  ID,
  Collection,
  SmartCollection,
  Variant,
  Status,
  User
} from '@coliving/common'

import {
  CollectionAgreement,
  AgreementRecord,
  CollectionsPageType
} from 'common/store/pages/collection/types'
import CollectionHeader from 'components/collection/desktop/CollectionHeader'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import AgreementsTable from 'components/agreements-table/AgreementsTable'
import { computeCollectionMetadataProps } from 'pages/collection-page/store/utils'

import styles from './CollectionPage.module.css'

const messages = {
  emptyPage: {
    owner:
      'Find a agreement you want to add and click the ••• button to add it to your contentList',
    visitor: 'This ContentList is Empty...'
  },
  type: {
    contentList: 'ContentList',
    album: 'Album'
  },
  remove: 'Remove from this'
}

const EmptyPage = (props: { text?: string | null; isOwner: boolean }) => {
  const text =
    props.text ||
    (props.isOwner ? messages.emptyPage.owner : messages.emptyPage.visitor)
  return (
    <div className={styles.emptyWrapper}>
      <div>{text}</div>
    </div>
  )
}

export type CollectionPageProps = {
  title: string
  description: string
  canonicalUrl: string
  contentListId: ID
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
  columns?: any
  userId?: ID | null
  userContentLists?: any
  isQueued: () => boolean
  onHeroAgreementClickArtistName: () => void
  onPlay: (record: AgreementRecord) => void
  onHeroAgreementShare: (record: AgreementRecord) => void
  onHeroAgreementSave?: (record: AgreementRecord) => void
  onClickRow: (record: AgreementRecord, index: number) => void
  onClickSave?: (record: AgreementRecord) => void
  allowReordering: boolean
  getFilteredData: (agreementMetadata: CollectionAgreement[]) => [AgreementRecord[], number]
  onFilterChange: (evt: ChangeEvent<HTMLInputElement>) => void
  onHeroAgreementEdit: () => void
  onPublish: () => void
  onHeroAgreementRepost?: any
  onClickAgreementName: (record: AgreementRecord) => void
  onClickArtistName: (record: AgreementRecord) => void
  onClickRepostAgreement: (record: AgreementRecord) => void
  onSortAgreements: (sorters: any) => void
  onReorderAgreements: (source: number, destination: number) => void
  onClickRemove: (
    agreementId: number,
    index: number,
    uid: string,
    timestamp: number
  ) => void
  onFollow: () => void
  onUnfollow: () => void
  onClickReposts?: () => void
  onClickFavorites?: () => void
  onClickDescriptionExternalLink: (e: any) => void
}

const CollectionPage = ({
  title,
  description: pageDescription,
  canonicalUrl,
  contentListId,
  allowReordering,
  playing,
  type,
  collection: { status, metadata, user },
  columns,
  agreements,
  userId,
  userContentLists,
  getFilteredData,
  isQueued,
  onHeroAgreementClickArtistName,
  onFilterChange,
  onPlay,
  onHeroAgreementEdit,
  onPublish,
  onHeroAgreementShare,
  onHeroAgreementSave,
  onHeroAgreementRepost,
  onClickRow,
  onClickSave,
  onClickAgreementName,
  onClickArtistName,
  onClickRepostAgreement,
  onSortAgreements,
  onReorderAgreements,
  onClickRemove,
  onFollow,
  onUnfollow,
  onClickReposts,
  onClickFavorites,
  onClickDescriptionExternalLink
}: CollectionPageProps) => {
  // TODO: Consider dynamic lineups, esp. for caching improvement.
  const [dataSource, playingIndex] =
    agreements.status === Status.SUCCESS
      ? getFilteredData(agreements.entries)
      : [[], -1]
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
  const isFollowing = user?.does_current_user_follow ?? false
  const isSaved =
    metadata?.has_current_user_saved || contentListId in (userContentLists ?? {})

  const variant = metadata?.variant ?? null
  const gradient =
    (metadata?.variant === Variant.SMART && metadata.gradient) ?? ''
  const icon = (metadata?.variant === Variant.SMART && metadata.icon) ?? null
  const imageOverride =
    (metadata?.variant === Variant.SMART && metadata.imageOverride) ?? ''
  const typeTitle =
    metadata?.variant === Variant.SMART ? metadata?.typeTitle ?? type : type
  const customEmptyText =
    metadata?.variant === Variant.SMART ? metadata?.customEmptyText : null

  const {
    agreementCount,
    isEmpty,
    lastModified,
    contentListName,
    description,
    isPrivate,
    isAlbum,
    isPublishing,
    contentListSaveCount,
    contentListRepostCount,
    isReposted
  } = computeCollectionMetadataProps(metadata)

  const topSection = (
    <CollectionHeader
      collectionId={contentListId}
      userId={contentListOwnerId}
      loading={
        typeTitle === 'Audio NFT ContentList' ? agreementsLoading : collectionLoading
      }
      agreementsLoading={agreementsLoading}
      type={typeTitle}
      title={contentListName}
      artistName={contentListOwnerName}
      artistHandle={contentListOwnerHandle}
      coverArtSizes={coverArtSizes}
      description={description}
      isOwner={isOwner}
      isAlbum={isAlbum}
      numAgreements={dataSource.length}
      modified={lastModified}
      duration={duration}
      isPublished={!isPrivate}
      isPublishing={isPublishing}
      isReposted={isReposted}
      isSaved={isSaved}
      isFollowing={isFollowing}
      reposts={contentListRepostCount}
      saves={contentListSaveCount}
      playing={queuedAndPlaying}
      // Actions
      onClickArtistName={onHeroAgreementClickArtistName}
      onFilterChange={onFilterChange}
      onPlay={onPlay}
      onEdit={onHeroAgreementEdit}
      onPublish={onPublish}
      onShare={onHeroAgreementShare}
      onSave={onHeroAgreementSave}
      onRepost={onHeroAgreementRepost}
      onFollow={onFollow}
      onUnfollow={onUnfollow}
      onClickReposts={onClickReposts}
      onClickFavorites={onClickFavorites}
      onClickDescriptionExternalLink={onClickDescriptionExternalLink}
      // Smart collection
      variant={variant}
      gradient={gradient}
      icon={icon}
      imageOverride={imageOverride}
    />
  )

  return (
    <Page
      title={title}
      description={pageDescription}
      canonicalUrl={canonicalUrl}
      containerClassName={styles.pageContainer}
      scrollableSearch
    >
      <div className={styles.bodyWrapper}>
        <div className={styles.topSectionWrapper}>{topSection}</div>
        {!collectionLoading && isEmpty ? (
          <EmptyPage isOwner={isOwner} text={customEmptyText} />
        ) : (
          <div className={styles.tableWrapper}>
            <AgreementsTable
              key={contentListName}
              loading={agreementsLoading}
              loadingRowsCount={agreementCount}
              columns={columns}
              userId={userId}
              playing={playing}
              playingIndex={playingIndex}
              dataSource={dataSource}
              allowReordering={
                userId !== null &&
                userId === contentListOwnerId &&
                allowReordering &&
                !isAlbum
              }
              onClickRow={onClickRow}
              onClickFavorite={onClickSave}
              onClickAgreementName={onClickAgreementName}
              onClickArtistName={onClickArtistName}
              onClickRepost={onClickRepostAgreement}
              onSortAgreements={onSortAgreements}
              onReorderAgreements={onReorderAgreements}
              onClickRemove={isOwner ? onClickRemove : null}
              removeText={`${messages.remove} ${
                isAlbum ? messages.type.album : messages.type.contentList
              }`}
            />
            {collectionLoading && typeTitle === 'Audio NFT ContentList' ? (
              <LoadingSpinner className={styles.spinner} />
            ) : null}
          </div>
        )}
      </div>
    </Page>
  )
}

export default CollectionPage

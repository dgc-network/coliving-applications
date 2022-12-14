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
  CollectionDigitalContent,
  DigitalContentRecord,
  CollectionsPageType
} from 'common/store/pages/collection/types'
import CollectionHeader from 'components/collection/desktop/collectionHeader'
import LoadingSpinner from 'components/loadingSpinner/loadingSpinner'
import Page from 'components/page/page'
import DigitalContentsTable from 'components/digitalContentsTable/digitalContentsTable'
import { computeCollectionMetadataProps } from 'pages/collectionPage/store/utils'

import styles from './collectionPage.module.css'

const messages = {
  emptyPage: {
    owner:
      'Find a digital_content you want to add and click the ••• button to add it to your contentList',
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
  digitalContents: {
    status: string
    entries: CollectionDigitalContent[]
  }
  columns?: any
  userId?: ID | null
  userContentLists?: any
  isQueued: () => boolean
  onHeroDigitalContentClickLandlordName: () => void
  onPlay: (record: DigitalContentRecord) => void
  onHeroDigitalContentShare: (record: DigitalContentRecord) => void
  onHeroDigitalContentSave?: (record: DigitalContentRecord) => void
  onClickRow: (record: DigitalContentRecord, index: number) => void
  onClickSave?: (record: DigitalContentRecord) => void
  allowReordering: boolean
  getFilteredData: (digitalContentMetadata: CollectionDigitalContent[]) => [DigitalContentRecord[], number]
  onFilterChange: (evt: ChangeEvent<HTMLInputElement>) => void
  onHeroDigitalContentEdit: () => void
  onPublish: () => void
  onHeroDigitalContentRepost?: any
  onClickDigitalContentName: (record: DigitalContentRecord) => void
  onClickLandlordName: (record: DigitalContentRecord) => void
  onClickRepostDigitalContent: (record: DigitalContentRecord) => void
  onSortDigitalContents: (sorters: any) => void
  onReorderDigitalContents: (source: number, destination: number) => void
  onClickRemove: (
    digitalContentId: number,
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
  digitalContents,
  userId,
  userContentLists,
  getFilteredData,
  isQueued,
  onHeroDigitalContentClickLandlordName,
  onFilterChange,
  onPlay,
  onHeroDigitalContentEdit,
  onPublish,
  onHeroDigitalContentShare,
  onHeroDigitalContentSave,
  onHeroDigitalContentRepost,
  onClickRow,
  onClickSave,
  onClickDigitalContentName,
  onClickLandlordName,
  onClickRepostDigitalContent,
  onSortDigitalContents,
  onReorderDigitalContents,
  onClickRemove,
  onFollow,
  onUnfollow,
  onClickReposts,
  onClickFavorites,
  onClickDescriptionExternalLink
}: CollectionPageProps) => {
  // TODO: Consider dynamic lineups, esp. for caching improvement.
  const [dataSource, playingIndex] =
    digitalContents.status === Status.SUCCESS
      ? getFilteredData(digitalContents.entries)
      : [[], -1]
  const collectionLoading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued()
  const digitalContentsLoading = digitalContents.status === Status.LOADING

  const coverArtSizes =
    metadata && metadata?.variant !== Variant.SMART
      ? metadata._cover_art_sizes
      : null
  const duration =
    digitalContents.entries?.reduce(
      (duration: number, entry: CollectionDigitalContent) =>
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
    digitalContentCount,
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
        typeTitle === 'Audio NFT ContentList' ? digitalContentsLoading : collectionLoading
      }
      digitalContentsLoading={digitalContentsLoading}
      type={typeTitle}
      title={contentListName}
      landlordName={contentListOwnerName}
      landlordHandle={contentListOwnerHandle}
      coverArtSizes={coverArtSizes}
      description={description}
      isOwner={isOwner}
      isAlbum={isAlbum}
      numDigitalContents={dataSource.length}
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
      onClickLandlordName={onHeroDigitalContentClickLandlordName}
      onFilterChange={onFilterChange}
      onPlay={onPlay}
      onEdit={onHeroDigitalContentEdit}
      onPublish={onPublish}
      onShare={onHeroDigitalContentShare}
      onSave={onHeroDigitalContentSave}
      onRepost={onHeroDigitalContentRepost}
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
            <DigitalContentsTable
              key={contentListName}
              loading={digitalContentsLoading}
              loadingRowsCount={digitalContentCount}
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
              onClickDigitalContentName={onClickDigitalContentName}
              onClickLandlordName={onClickLandlordName}
              onClickRepost={onClickRepostDigitalContent}
              onSortDigitalContents={onSortDigitalContents}
              onReorderDigitalContents={onReorderDigitalContents}
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

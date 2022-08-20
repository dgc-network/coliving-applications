import { Collection, SmartCollection, Variant } from '@coliving/common'

export const computeCollectionMetadataProps = (
  metadata: Collection | SmartCollection | null
) => {
  const agreementCount =
    metadata && metadata.contentList_contents
      ? metadata.contentList_contents.agreement_ids.length
      : 0
  const isEmpty = metadata && agreementCount === 0
  const lastModified =
    metadata && metadata.variant !== Variant.SMART
      ? metadata.updated_at || Date.now()
      : ''
  const contentListName = metadata ? metadata.contentList_name : ''
  const description =
    metadata && metadata.description ? metadata.description : ''
  const isPrivate =
    metadata && metadata.variant !== Variant.SMART ? metadata.is_private : false
  const isAlbum =
    metadata && metadata.variant !== Variant.SMART ? metadata.is_album : false
  const isPublishing =
    metadata && metadata.variant !== Variant.SMART
      ? metadata._is_publishing
      : false
  const contentListSaveCount =
    metadata && metadata.variant !== Variant.SMART
      ? metadata.save_count || 0
      : 0
  const contentListRepostCount =
    metadata && metadata.variant !== Variant.SMART
      ? metadata.repost_count || 0
      : 0
  const isReposted =
    metadata && metadata.variant !== Variant.SMART
      ? metadata.has_current_user_reposted
      : false

  return {
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
  }
}

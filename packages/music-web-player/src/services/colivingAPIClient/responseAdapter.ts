import {
  ID,
  UserCollectionMetadata,
  Variant,
  Favorite,
  Repost,
  Remix,
  StemDigitalContentMetadata,
  DigitalContentMetadata,
  UserDigitalContentMetadata,
  UserMetadata,
  StringWei,
  removeNullable
} from '@coliving/common'

import { decodeHashId } from 'utils/route/hashIds'

import {
  APIActivity,
  APIFavorite,
  APIRemix,
  APIRepost,
  APIDigitalContent,
  APIContentList,
  APISearchUser,
  APIUser,
  APIStem,
  APIResponse,
  APISearch,
  APISearchDigitalContent,
  APISearchAutocomplete,
  APISearchContentList
} from './types'

export const makeUser = (
  user: APISearchUser | APIUser
): UserMetadata | undefined => {
  const decodedUserId = decodeHashId(user.id)
  if (!decodedUserId) {
    return undefined
  }

  const balance = user.balance as StringWei
  const associated_wallets_balance =
    user.associated_wallets_balance as StringWei
  const album_count = 'album_count' in user ? user.album_count : 0
  const followee_count = 'followee_count' in user ? user.followee_count : 0
  const follower_count = 'follower_count' in user ? user.follower_count : 0
  const content_list_count = 'content_list_count' in user ? user.content_list_count : 0
  const repost_count = 'repost_count' in user ? user.repost_count : 0
  const digital_content_count = 'digital_content_count' in user ? user.digital_content_count : 0
  const current_user_followee_follow_count =
    'current_user_followee_follow_count' in user
      ? user.current_user_followee_follow_count
      : 0
  const does_current_user_follow =
    'does_current_user_follow' in user ? user.does_current_user_follow : false
  const supporter_count = user.supporter_count ?? 0
  const supporting_count = user.supporting_count ?? 0

  const newUser = {
    ...user,
    balance,
    associated_wallets_balance,
    album_count,
    followee_count,
    follower_count,
    content_list_count,
    repost_count,
    digital_content_count,
    current_user_followee_follow_count,
    does_current_user_follow,
    user_id: decodedUserId,
    cover_photo: user.cover_photo_sizes || user.cover_photo_legacy,
    profile_picture: user.profile_picture_sizes || user.profile_picture_legacy,
    metadata_multihash: user.metadata_multihash || null,
    id: undefined,
    supporter_count,
    supporting_count
  }

  delete newUser.id

  return newUser
}

const makeFavorite = (favorite: APIFavorite): Favorite | undefined => {
  const decodedSaveItemId = decodeHashId(favorite.favorite_item_id)
  const decodedUserId = decodeHashId(favorite.user_id)
  if (!decodedSaveItemId || !decodedUserId) {
    return undefined
  }
  return {
    save_item_id: decodedSaveItemId,
    user_id: decodedUserId,
    save_type: favorite.favorite_type
  }
}

const makeRepost = (repost: APIRepost): Repost | undefined => {
  const decodedRepostItemId = decodeHashId(repost.repost_item_id)
  const decodedUserId = decodeHashId(repost.user_id)
  if (!decodedRepostItemId || !decodedUserId) {
    return undefined
  }

  return {
    repost_item_id: decodedRepostItemId,
    user_id: decodedUserId,
    repost_type: repost.repost_type
  }
}

const makeRemix = (remix: APIRemix): Remix | undefined => {
  const decodedDigitalContentId = decodeHashId(remix.parent_digital_content_id)
  const user = makeUser(remix.user)
  if (!decodedDigitalContentId || !user) {
    return undefined
  }

  return {
    ...remix,
    parent_digital_content_id: decodedDigitalContentId,
    user
  }
}

export const makeUserlessDigitalContent = (
  digital_content: APIDigitalContent | APISearchDigitalContent
): DigitalContentMetadata | undefined => {
  const decodedDigitalContentId = decodeHashId(digital_content.id)
  const decodedOwnerId = decodeHashId(digital_content.user_id)
  if (!decodedDigitalContentId || !decodedOwnerId) return undefined

  const saves =
    'followee_favorites' in digital_content
      ? digital_content.followee_favorites?.map(makeFavorite).filter(removeNullable) ?? []
      : []

  const reposts =
    'followee_reposts' in digital_content
      ? digital_content.followee_reposts?.map(makeRepost).filter(removeNullable) ?? []
      : []

  const remixes =
    digital_content.remix_of.digitalContents?.map(makeRemix).filter(removeNullable) ?? []
  const play_count = 'play_count' in digital_content ? digital_content.play_count : 0
  const save_count = 'favorite_count' in digital_content ? digital_content.favorite_count : 0
  const repost_count = 'repost_count' in digital_content ? digital_content.repost_count : 0
  const has_current_user_reposted =
    'has_current_user_reposted' in digital_content
      ? digital_content.has_current_user_reposted
      : false
  const has_current_user_saved =
    'has_current_user_saved' in digital_content ? digital_content.has_current_user_saved : false
  const marshalled = {
    ...digital_content,
    digital_content_id: decodedDigitalContentId,
    owner_id: decodedOwnerId,
    followee_saves: saves,
    followee_reposts: reposts,
    play_count,
    save_count,
    repost_count,
    has_current_user_reposted,
    has_current_user_saved,
    remix_of:
      remixes.length > 0
        ? {
            digitalContents: remixes
          }
        : null,

    stem_of: digital_content.stem_of.parent_digital_content_id === null ? null : digital_content.stem_of,

    // Fields to prune
    id: undefined,
    user_id: undefined,
    followee_favorites: undefined,
    artwork: undefined,
    downloadable: undefined,
    favorite_count: undefined
  }

  delete marshalled.id
  delete marshalled.user_id
  delete marshalled.followee_favorites
  delete marshalled.artwork
  delete marshalled.downloadable
  delete marshalled.favorite_count

  return marshalled
}

export const makeDigitalContent = (
  digital_content: APIDigitalContent | APISearchDigitalContent
): UserDigitalContentMetadata | undefined => {
  const decodedDigitalContentId = decodeHashId(digital_content.id)
  const decodedOwnerId = decodeHashId(digital_content.user_id)
  const user = makeUser(digital_content.user)
  if (!decodedDigitalContentId || !decodedOwnerId || !user) {
    return undefined
  }

  const saves =
    'followee_favorites' in digital_content
      ? digital_content.followee_favorites?.map(makeFavorite).filter(removeNullable) ?? []
      : []

  const reposts =
    'followee_reposts' in digital_content
      ? digital_content.followee_reposts?.map(makeRepost).filter(removeNullable) ?? []
      : []

  const remixes =
    digital_content.remix_of.digitalContents?.map(makeRemix).filter(removeNullable) ?? []
  const play_count = 'play_count' in digital_content ? digital_content.play_count : 0
  const save_count = 'favorite_count' in digital_content ? digital_content.favorite_count : 0
  const repost_count = 'repost_count' in digital_content ? digital_content.repost_count : 0
  const has_current_user_reposted =
    'has_current_user_reposted' in digital_content
      ? digital_content.has_current_user_reposted
      : false
  const has_current_user_saved =
    'has_current_user_saved' in digital_content ? digital_content.has_current_user_saved : false
  const marshalled = {
    ...digital_content,
    user,
    digital_content_id: decodedDigitalContentId,
    owner_id: decodedOwnerId,
    followee_saves: saves,
    followee_reposts: reposts,
    play_count,
    save_count,
    repost_count,
    has_current_user_reposted,
    has_current_user_saved,
    remix_of:
      remixes.length > 0
        ? {
            digitalContents: remixes
          }
        : null,

    stem_of: digital_content.stem_of.parent_digital_content_id === null ? null : digital_content.stem_of,

    // Fields to prune
    id: undefined,
    user_id: undefined,
    followee_favorites: undefined,
    artwork: undefined,
    downloadable: undefined,
    favorite_count: undefined
  }

  delete marshalled.id
  delete marshalled.user_id
  delete marshalled.followee_favorites
  delete marshalled.artwork
  delete marshalled.downloadable
  delete marshalled.favorite_count

  return marshalled
}

export const makeDigitalContentId = (digital_content: { id: string }): ID | undefined => {
  const decodedDigitalContentId = decodeHashId(digital_content.id)
  if (!decodedDigitalContentId) {
    return undefined
  }
  return decodedDigitalContentId
}

export const makeContentList = (
  contentList: APIContentList | APISearchContentList
): UserCollectionMetadata | undefined => {
  const decodedContentListId = decodeHashId(contentList.id)
  const decodedOwnerId = decodeHashId(contentList.user_id)
  const user = makeUser(contentList.user)
  if (!decodedContentListId || !decodedOwnerId || !user) {
    return undefined
  }

  const saves =
    'followee_favorites' in contentList
      ? contentList.followee_favorites?.map(makeFavorite).filter(removeNullable) ??
        []
      : []

  const reposts =
    'followee_reposts' in contentList
      ? contentList.followee_reposts?.map(makeRepost).filter(removeNullable) ?? []
      : []
  const has_current_user_reposted =
    'has_current_user_reposted' in contentList
      ? contentList.has_current_user_reposted
      : false
  const has_current_user_saved =
    'has_current_user_saved' in contentList
      ? contentList.has_current_user_saved
      : false
  const save_count = 'favorite_count' in contentList ? contentList.favorite_count : 0
  const repost_count = 'repost_count' in contentList ? contentList.repost_count : 0
  const total_play_count =
    'total_play_count' in contentList ? contentList.total_play_count : 0
  const digital_content_count = 'digital_content_count' in contentList ? contentList.digital_content_count : 0

  const contentListContents = {
    digital_content_ids: contentList.added_timestamps
      .map((ts) => {
        const decoded = decodeHashId(ts.digital_content_id)
        if (decoded) {
          return {
            digital_content: decoded,
            time: ts.timestamp
          }
        }
        return null
      })
      .filter(removeNullable)
  }

  const digitalContents =
    'digitalContents' in contentList
      ? contentList.digitalContents
          ?.map((digital_content) => makeDigitalContent(digital_content))
          .filter(removeNullable) ?? []
      : []

  const marshalled = {
    ...contentList,
    variant: Variant.USER_GENERATED,
    user,
    digitalContents,
    content_list_id: decodedContentListId,
    content_list_owner_id: decodedOwnerId,
    followee_saves: saves,
    followee_reposts: reposts,
    has_current_user_reposted,
    has_current_user_saved,
    save_count,
    repost_count,
    digital_content_count,
    total_play_count,
    content_list_contents: contentListContents,

    // Fields to prune
    id: undefined,
    user_id: undefined,
    followee_favorites: undefined,
    artwork: undefined,
    favorite_count: undefined,
    added_timestamps: undefined
  }

  delete marshalled.id
  delete marshalled.user_id
  delete marshalled.followee_favorites
  delete marshalled.artwork
  delete marshalled.favorite_count
  delete marshalled.added_timestamps

  return marshalled as UserCollectionMetadata
}

export const makeActivity = (
  activity: APIActivity
): UserDigitalContentMetadata | UserCollectionMetadata | undefined => {
  switch (activity.item_type) {
    case 'digital_content':
      return makeDigitalContent(activity.item)
    case 'contentList':
      return makeContentList(activity.item)
  }
}

export const makeStemDigitalContent = (stem: APIStem): StemDigitalContentMetadata | undefined => {
  const [id, parentId, ownerId] = [stem.id, stem.parent_id, stem.user_id].map(
    decodeHashId
  )
  if (!(id && parentId && ownerId)) return undefined

  return {
    blocknumber: stem.blocknumber,
    is_delete: false,
    digital_content_id: id,
    created_at: '',
    isrc: null,
    iswc: null,
    credits_splits: null,
    description: null,
    followee_reposts: [],
    followee_saves: [],
    genre: '',
    has_current_user_reposted: false,
    has_current_user_saved: false,
    download: {
      is_downloadable: true,
      requires_follow: false,
      cid: stem.cid
    },
    license: null,
    mood: null,
    play_count: 0,
    owner_id: ownerId,
    release_date: null,
    repost_count: 0,
    save_count: 0,
    tags: null,
    title: '',
    digital_content_segments: [],
    cover_art: null,
    cover_art_sizes: null,
    is_unlisted: false,
    stem_of: {
      parent_digital_content_id: parentId,
      category: stem.category
    },
    remix_of: null,
    duration: 0,
    updated_at: '',
    permalink: '',
    is_available: true
  }
}

export const adaptSearchResponse = (searchResponse: APIResponse<APISearch>) => {
  return {
    digitalContents:
      searchResponse.data.digitalContents?.map(makeDigitalContent).filter(removeNullable) ??
      undefined,
    saved_digital_contents:
      searchResponse.data.saved_digital_contents?.map(makeDigitalContent).filter(removeNullable) ??
      undefined,
    users:
      searchResponse.data.users?.map(makeUser).filter(removeNullable) ??
      undefined,
    followed_users:
      searchResponse.data.followed_users
        ?.map(makeUser)
        .filter(removeNullable) ?? undefined,
    contentLists:
      searchResponse.data.contentLists?.map(makeContentList).filter(removeNullable) ??
      undefined,
    saved_content_lists:
      searchResponse.data.saved_content_lists
        ?.map(makeContentList)
        .filter(removeNullable) ?? undefined,
    albums:
      searchResponse.data.albums?.map(makeContentList).filter(removeNullable) ??
      undefined,
    saved_albums:
      searchResponse.data.saved_albums
        ?.map(makeContentList)
        .filter(removeNullable) ?? undefined
  }
}

export const adaptSearchAutocompleteResponse = (
  searchResponse: APIResponse<APISearchAutocomplete>
) => {
  return {
    digitalContents:
      searchResponse.data.digitalContents?.map(makeDigitalContent).filter(removeNullable) ??
      undefined,
    saved_digital_contents:
      searchResponse.data.saved_digital_contents?.map(makeDigitalContent).filter(removeNullable) ??
      undefined,
    users:
      searchResponse.data.users?.map(makeUser).filter(removeNullable) ??
      undefined,
    followed_users:
      searchResponse.data.followed_users
        ?.map(makeUser)
        .filter(removeNullable) ?? undefined,
    contentLists:
      searchResponse.data.contentLists?.map(makeContentList).filter(removeNullable) ??
      undefined,
    saved_content_lists:
      searchResponse.data.saved_content_lists
        ?.map(makeContentList)
        .filter(removeNullable) ?? undefined,
    albums:
      searchResponse.data.albums?.map(makeContentList).filter(removeNullable) ??
      undefined,
    saved_albums:
      searchResponse.data.saved_albums
        ?.map(makeContentList)
        .filter(removeNullable) ?? undefined
  }
}

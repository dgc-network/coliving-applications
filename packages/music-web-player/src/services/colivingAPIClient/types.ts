import {
  CID,
  FavoriteType,
  CoverArtSizes,
  CoverPhotoSizes,
  ProfilePictureSizes,
  StemCategory,
  Download,
  FieldVisibility,
  DigitalContentSegment,
  SolanaWalletAddress,
  WalletAddress,
  Nullable
} from '@coliving/common'

export type OpaqueID = string

export type APIUser = {
  album_count: number
  blocknumber: number
  balance: string
  associated_wallets_balance: string
  bio: Nullable<string>
  cover_photo: CoverPhotoSizes
  followee_count: number
  follower_count: number
  handle: string
  id: OpaqueID
  is_verified: boolean
  is_deactivated: boolean
  location: Nullable<string>
  name: string
  content_list_count: number
  profile_picture: ProfilePictureSizes
  repost_count: number
  digital_content_count: number
  created_at: string
  content_node_endpoint: Nullable<string>
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  handle_lc: string
  updated_at: string
  cover_photo_sizes: Nullable<CID>
  cover_photo_legacy: Nullable<CID>
  profile_picture_sizes: Nullable<CID>
  profile_picture_legacy: Nullable<CID>
  metadata_multihash: Nullable<CID>
  erc_wallet: WalletAddress
  spl_wallet: SolanaWalletAddress
  has_collectibles: boolean
  supporter_count: number
  supporting_count: number
}

export type APISearchUser = Omit<
  APIUser,
  | 'album_count'
  | 'followee_count'
  | 'follower_count'
  | 'content_list_count'
  | 'repost_count'
  | 'digital_content_count'
  | 'current_user_followee_follow_count'
  | 'does_current_user_follow'
>

export type APIRepost = {
  repost_item_id: string
  repost_type: string
  user_id: string
}

export type APIFavorite = {
  favorite_item_id: string
  favorite_type: FavoriteType
  user_id: string
}

export type APIRemix = {
  parent_digital_content_id: OpaqueID
  user: APIUser
  has_remix_author_reposted: boolean
  has_remix_author_saved: boolean
}

export type APIDigitalContent = {
  blocknumber: number
  artwork: CoverArtSizes
  description: Nullable<string>
  genre: string
  id: OpaqueID
  mood: Nullable<string>
  release_date: Nullable<string>
  remix_of: {
    digitalContents: null | APIRemix[]
  }
  repost_count: number
  favorite_count: number
  tags: Nullable<string>
  title: string
  user: APIUser
  duration: number
  downloadable: boolean
  create_date: Nullable<string>
  created_at: string
  credits_splits: Nullable<string>
  cover_art_sizes: string
  download: Download
  isrc: Nullable<string>
  license: Nullable<string>
  iswc: Nullable<string>
  field_visibility: FieldVisibility
  followee_reposts: APIRepost[]
  has_current_user_reposted: boolean
  is_unlisted: boolean
  has_current_user_saved: boolean
  followee_favorites: APIFavorite[]
  route_id: string
  stem_of: any
  digital_content_segments: DigitalContentSegment[]
  updated_at: string
  user_id: OpaqueID
  is_delete: boolean
  cover_art: Nullable<string>
  play_count: number
  permalink: string
  is_available: boolean
}

export type APISearchDigitalContent = Omit<
  APIDigitalContent,
  | 'repost_count'
  | 'favorite_count'
  | 'has_current_user_reposted'
  | 'has_current_user_saved'
  | 'followee_reposts'
  | 'followee_favorites'
  | 'play_count'
>

export type APIStem = {
  id: OpaqueID
  parent_id: OpaqueID
  user_id: OpaqueID
  category: StemCategory
  cid: CID
  blocknumber: number
}

export type APIContentListAddedTimestamp = {
  timestamp: number
  digital_content_id: OpaqueID
}

export type APIContentList = {
  blocknumber: number
  artwork: CoverArtSizes
  description: Nullable<string>
  id: OpaqueID
  is_album: boolean
  content_list_name: string
  repost_count: number
  favorite_count: number
  total_play_count: number
  user_id: OpaqueID
  user: APIUser
  created_at: string
  updated_at: string
  followee_reposts: APIRepost[]
  followee_favorites: APIFavorite[]
  has_current_user_reposted: boolean
  has_current_user_saved: boolean
  is_delete: boolean
  is_private: boolean
  added_timestamps: APIContentListAddedTimestamp[]
  digitalContents: APIDigitalContent[]
  digital_content_count: number
  cover_art: Nullable<string>
  cover_art_sizes: Nullable<string>
}

export type APISearchContentList = Omit<
  APIContentList,
  | 'repost_count'
  | 'favorite_count'
  | 'total_play_count'
  | 'followee_reposts'
  | 'followee_favorites'
  | 'has_current_user_reposted'
  | 'has_current_user_saved'
  | 'digitalContents'
>

export type APIItemType = 'digital_content' | 'contentList'

export type APIActivity = { timestamp: string } & (
  | { item_type: 'digital_content'; item: APIDigitalContent }
  | { item_type: 'contentList'; item: APIContentList }
)

export type APISearch = {
  users?: APIUser[]
  followed_users?: APIUser[]
  digitalContents?: APIDigitalContent[]
  saved_digital_contents?: APIDigitalContent[]
  contentLists?: APIContentList[]
  saved_content_lists?: APIContentList[]
  albums?: APIContentList[]
  saved_albums?: APIContentList[]
}

export type APISearchAutocomplete = {
  users?: APISearchUser[]
  followed_users?: APISearchUser[]
  digitalContents?: APISearchDigitalContent[]
  saved_digital_contents?: APISearchDigitalContent[]
  contentLists?: APISearchContentList[]
  saved_content_lists?: APISearchContentList[]
  albums?: APISearchContentList[]
  saved_albums?: APISearchContentList[]
}

export type APIBlockConfirmation = {
  block_found: boolean
  block_passed: boolean
}

export type APIResponse<T> = {
  data: T
}

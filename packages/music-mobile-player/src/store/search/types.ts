import type { Repost, AgreementSegment, User } from '@coliving/common'

import type { CollectionImage } from 'app/models/collection'
import type { AgreementImage } from 'app/models/digital_content'
import type { UserImage, UserMultihash } from 'app/models/user'

type BaseUser = Pick<
  User,
  'name' | 'is_verified' | 'associated_wallets_balance' | 'balance'
>

export type SearchUser = UserMultihash &
  UserImage &
  BaseUser & {
    album_count: null
    bio: string
    followee_count: null
    follower_count: 3
    handle: string
    is_verified: boolean
    location: string
    name: string
    content_list_count: null
    repost_count: null
    digital_content_count: null
    blocknumber: number
    wallet: string
    created_at: string
    current_user_followee_follow_count: number
    does_current_user_follow: boolean
    handle_lc: string
    updated_at: string
    has_collectibles: boolean
    user_id: number
  }

export type SearchAgreement = AgreementImage & {
  _co_sign: undefined
  _cover_art_sizes: null
  description: string | null
  genre: string
  mood: string
  release_date: null
  remix_of: null
  repost_count: number
  tags: null
  title: string
  user: SearchUser
  duration: number
  play_count: undefined
  blocknumber: number
  create_date: null
  created_at: string
  credits_splits: null
  download: {
    cid: null
    is_downloadable: false
    requires_follow: false
  }
  isrc: null
  license: null
  iswc: null
  field_visibility: {
    mood: boolean
    tags: boolean
    genre: boolean
    share: boolean
    play_count: boolean
    remixes: null
  }
  followee_reposts: Repost[]
  has_current_user_reposted: undefined
  is_unlisted: boolean
  has_current_user_saved: undefined
  stem_of: null
  updated_at: string
  is_delete: boolean
  digital_content_id: number
  owner_id: number
  followee_saves: []
  save_count: undefined
  digital_content_segments: AgreementSegment[]
  followee_favorites: null
  user_id: number
  permalink: string
  _remixes: undefined
  _remixes_count: undefined
}

export type SearchContentList = CollectionImage & {
  _cover_art_sizes: null
  _is_publishing?: boolean
  description: string | null
  is_album: boolean
  content_list_name: string
  repost_count: number
  total_play_count: null
  user: SearchUser
  blocknumber: number
  created_at: string
  followee_reposts: []
  has_current_user_reposted: undefined
  has_current_user_saved: undefined
  is_delete: boolean
  is_private: boolean
  updated_at: string
  agreements: []
  digital_content_count: number
  variant: string
  content_list_id: number
  content_list_owner_id: number
  followee_saves: []
  save_count: undefined
  content_list_contents: {
    digital_content_ids: {
      digital_content: number
      time: number
    }[]
  }
}

export type SearchResults = {
  users: SearchUser[]
  agreements: SearchAgreement[]
  contentLists: SearchContentList[]
  albums: SearchContentList[]
}
export type SectionHeader = keyof SearchResults

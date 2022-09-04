import type { ReactNode } from 'react'

import { CID, ID, UID } from 'models/Identifiers'
import { CoverArtSizes } from 'models/ImageSizes'
import { Repost } from 'models/Repost'
import { Nullable } from 'utils/typeUtils'

import { UserAgreementMetadata } from './Agreement'
import { Favorite } from './Favorite'
import { User, UserMetadata } from './User'

export enum Variant {
  USER_GENERATED = 'user-generated',
  SMART = 'smart'
}

type ContentListContents = {
  agreement_ids: Array<{ time: number; agreement: ID } | { agreement: string }>
}

export type CollectionMetadata = {
  blocknumber: number
  variant: Variant.USER_GENERATED
  description: Nullable<string>
  followee_reposts: Repost[]
  followee_saves: Favorite[]
  has_current_user_reposted: boolean
  has_current_user_saved: boolean
  is_album: boolean
  is_delete: boolean
  is_private: boolean
  content_list_contents: {
    agreement_ids: Array<{ time: number; agreement: ID; uid?: UID }>
  }
  agreements?: UserAgreementMetadata[]
  agreement_count: number
  content_list_id: ID
  cover_art: CID | null
  cover_art_sizes: Nullable<CID>
  content_list_name: string
  content_list_owner_id: ID
  repost_count: number
  save_count: number
  upc?: string | null
  updated_at: string
  activity_timestamp?: string
}

export type ComputedCollectionProperties = {
  _is_publishing?: boolean
  _marked_deleted?: boolean
  _cover_art_sizes: CoverArtSizes
  _moved?: UID
  _temp?: boolean
}

export type Collection = CollectionMetadata & ComputedCollectionProperties

export type UserCollectionMetadata = CollectionMetadata & { user: UserMetadata }

export type UserCollection = Collection & {
  user: User
}

export type SmartCollection = {
  variant: Variant.SMART
  content_list_name: string
  description?: string
  makeDescription?: (...args: any) => string
  // Where this type of contentList is given a different classification
  // e.g. "Audio NFT ContentList" instead of just "ContentList"
  typeTitle?: 'ContentList' | 'Audio NFT ContentList'
  gradient?: string
  imageOverride?: string
  shadow?: string
  icon?: ReactNode
  link: string
  content_list_contents?: ContentListContents
  has_current_user_saved?: boolean
  incentivized?: boolean // Whether we reward winners with Audio
  cardSensitivity?: number
  customEmptyText?: string
}

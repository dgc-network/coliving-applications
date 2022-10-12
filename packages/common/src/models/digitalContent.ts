import { Favorite } from 'models/favorite'
import { CID, ID, UID } from 'models/identifiers'
import { CoverArtSizes } from 'models/imageSizes'
import { Repost } from 'models/repost'
import { User, UserMetadata } from 'models/user'
import { Nullable } from 'utils/typeUtils'

import { StemCategory } from './stems'
import { Timestamped } from './timestamped'

export interface DigitalContentSegment {
  duration: string
  multihash: CID
}

interface Followee extends User {
  is_delete: boolean
  repost_item_id: string
  repost_type: string
}

export interface Download {
  // TODO: figure out why
  // is_downloadable and requires_follow
  // are randomly null on some digitalContents
  // returned from the API
  is_downloadable: Nullable<boolean>
  requires_follow: Nullable<boolean>
  cid: Nullable<string>
}

export type FieldVisibility = {
  genre: boolean
  mood: boolean
  tags: boolean
  share: boolean
  play_count: boolean
  remixes: boolean
}

export type Remix = {
  parent_digital_content_id: ID
  user: User | any
  has_remix_author_reposted: boolean
  has_remix_author_saved: boolean
}

export type RemixOf = {
  digitalContents: Remix[]
}

export type DigitalContentMetadata = {
  blocknumber: number
  activity_timestamp?: string
  is_delete: boolean
  digital_content_id: number
  created_at: string
  isrc: Nullable<string>
  iswc: Nullable<string>
  credits_splits: Nullable<string>
  description: Nullable<string>
  followee_reposts: Repost[]
  followee_saves: Favorite[]
  genre: string
  has_current_user_reposted: boolean
  has_current_user_saved: boolean
  download: Nullable<Download>
  license: Nullable<string>
  mood: Nullable<string>
  play_count: number
  owner_id: ID
  release_date: Nullable<string>
  repost_count: number
  save_count: number
  tags: Nullable<string>
  title: string
  digital_content_segments: DigitalContentSegment[]
  cover_art: Nullable<CID>
  cover_art_sizes: Nullable<CID>
  is_unlisted: boolean
  is_available: boolean
  field_visibility?: FieldVisibility
  listenCount?: number
  permalink: string

  // Optional Fields
  is_invalid?: boolean
  stem_of?: {
    parent_digital_content_id: ID
    category: StemCategory
  }
  remix_of: Nullable<RemixOf>

  // Added fields
  dateListened?: string
  duration: number
} & Timestamped

export type Stem = {
  digital_content_id: ID
  category: StemCategory
}

export type ComputedDigitalContentProperties = {
  // All below, added clientside
  _cover_art_sizes: CoverArtSizes
  _first_segment?: string
  _followees?: Followee[]
  _marked_deleted?: boolean
  _is_publishing?: boolean
  _stems?: Stem[]

  // Present iff remixes have been fetched for a digital_content
  _remixes?: Array<{ digital_content_id: ID }>
  _remixes_count?: number
  // Present iff remix parents have been fetched for a digital_content
  _remix_parents?: Array<{ digital_content_id: ID }>
  // Present iff the digital_content has been cosigned
  _co_sign?: Nullable<Remix>

  _blocked?: boolean
}

export type DigitalContent = DigitalContentMetadata & ComputedDigitalContentProperties

export type UserDigitalContentMetadata = DigitalContentMetadata & { user: UserMetadata }

export type UserDigitalContent = DigitalContent & {
  user: User
}

export type LineupDigitalContent = UserDigitalContent & {
  uid: UID
}

// DigitalContent with known non-optional stem
export type StemDigitalContentMetadata = DigitalContentMetadata &
  Required<Pick<DigitalContent, 'stem_of'>>
export type StemDigitalContent = DigitalContent & Required<Pick<DigitalContent, 'stem_of'>>
export type StemUserDigitalContent = UserDigitalContent &
  Required<Pick<DigitalContent, 'stem_of'>>

// DigitalContent with known non-optional remix parent
export type RemixDigitalContent = DigitalContent & Required<Pick<DigitalContent, 'remix_of'>>
export type RemixUserDigitalContent = UserDigitalContent &
  Required<Pick<DigitalContent, 'remix_of'>>

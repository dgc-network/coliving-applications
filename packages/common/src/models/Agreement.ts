import { Favorite } from 'models/Favorite'
import { CID, ID, UID } from 'models/Identifiers'
import { CoverArtSizes } from 'models/ImageSizes'
import { Repost } from 'models/Repost'
import { User, UserMetadata } from 'models/User'
import { Nullable } from 'utils/typeUtils'

import { StemCategory } from './Stems'
import { Timestamped } from './Timestamped'

export interface AgreementSegment {
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
  // are randomly null on some agreements
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
  parent_agreement_id: ID
  user: User | any
  has_remix_author_reposted: boolean
  has_remix_author_saved: boolean
}

export type RemixOf = {
  agreements: Remix[]
}

export type AgreementMetadata = {
  blocknumber: number
  activity_timestamp?: string
  is_delete: boolean
  agreement_id: number
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
  agreement_segments: AgreementSegment[]
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
    parent_agreement_id: ID
    category: StemCategory
  }
  remix_of: Nullable<RemixOf>

  // Added fields
  dateListened?: string
  duration: number
} & Timestamped

export type Stem = {
  agreement_id: ID
  category: StemCategory
}

export type ComputedAgreementProperties = {
  // All below, added clientside
  _cover_art_sizes: CoverArtSizes
  _first_segment?: string
  _followees?: Followee[]
  _marked_deleted?: boolean
  _is_publishing?: boolean
  _stems?: Stem[]

  // Present iff remixes have been fetched for a agreement
  _remixes?: Array<{ agreement_id: ID }>
  _remixes_count?: number
  // Present iff remix parents have been fetched for a agreement
  _remix_parents?: Array<{ agreement_id: ID }>
  // Present iff the agreement has been cosigned
  _co_sign?: Nullable<Remix>

  _blocked?: boolean
}

export type Agreement = AgreementMetadata & ComputedAgreementProperties

export type UserAgreementMetadata = AgreementMetadata & { user: UserMetadata }

export type UserAgreement = Agreement & {
  user: User
}

export type LineupAgreement = UserAgreement & {
  uid: UID
}

// Agreement with known non-optional stem
export type StemAgreementMetadata = AgreementMetadata &
  Required<Pick<Agreement, 'stem_of'>>
export type StemAgreement = Agreement & Required<Pick<Agreement, 'stem_of'>>
export type StemUserAgreement = UserAgreement &
  Required<Pick<Agreement, 'stem_of'>>

// Agreement with known non-optional remix parent
export type RemixAgreement = Agreement & Required<Pick<Agreement, 'remix_of'>>
export type RemixUserAgreement = UserAgreement &
  Required<Pick<Agreement, 'remix_of'>>

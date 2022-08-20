import {
  ID,
  UID,
  Collectible,
  LineupState,
  SmartCollectionVariant,
  Status,
  LineupAgreement
} from '@coliving/common'
import { Moment } from 'moment'

export type CollectionsPageState = {
  collectionId: ID | null
  collectionUid: UID | null
  status: Status | null
  agreements: LineupState<{ dateAdded: Moment }>
  userUid: UID | null
  smartCollectionVariant: SmartCollectionVariant
}

export type CollectionsPageType = 'content list' | 'album'

export type CollectionAgreement = LineupAgreement & { dateAdded: Moment } & {
  collectible?: Collectible
}

export type AgreementRecord = CollectionAgreement & {
  key: string
  name: string
  artist: string
  handle: string
  date: Moment
  time: number
  plays: number | undefined
}

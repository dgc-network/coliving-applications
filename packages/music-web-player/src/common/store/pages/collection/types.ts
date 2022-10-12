import {
  ID,
  UID,
  Collectible,
  LineupState,
  SmartCollectionVariant,
  Status,
  LineupDigitalContent
} from '@coliving/common'
import { Moment } from 'moment'

export type CollectionsPageState = {
  collectionId: ID | null
  collectionUid: UID | null
  status: Status | null
  digitalContents: LineupState<{ dateAdded: Moment }>
  userUid: UID | null
  smartCollectionVariant: SmartCollectionVariant
}

export type CollectionsPageType = 'contentList' | 'album'

export type CollectionDigitalContent = LineupDigitalContent & { dateAdded: Moment } & {
  collectible?: Collectible
}

export type DigitalContentRecord = CollectionDigitalContent & {
  key: string
  name: string
  author: string
  handle: string
  date: Moment
  time: number
  plays: number | undefined
}

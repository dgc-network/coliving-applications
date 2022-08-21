import { ID, UID, Collectible, Agreement, User } from '@coliving/common'

export enum RepeatMode {
  OFF = 'OFF',
  ALL = 'ALL',
  SINGLE = 'SINGLE'
}

export enum Source {
  COLLECTION_AGREEMENTS = 'COLLECTION_AGREEMENTS',
  DISCOVER_FEED = 'DISCOVER_FEED',
  DISCOVER_TRENDING = 'DISCOVER_TRENDING',
  HISTORY_AGREEMENTS = 'HISTORY_AGREEMENTS',
  COLLECTIBLE_CONTENT_LIST_AGREEMENTS = 'COLLECTIBLE_CONTENT_LIST_AGREEMENTS',
  PROFILE_FEED = 'PROFILE_FEED',
  PROFILE_AGREEMENTS = 'PROFILE_AGREEMENTS',
  SAVED_AGREEMENTS = 'SAVED_AGREEMENTS',
  SEARCH_AGREEMENTS = 'SEARCH_AGREEMENTS',
  AGREEMENT_AGREEMENTS = 'AGREEMENT_AGREEMENTS',
  RECOMMENDED_AGREEMENTS = 'RECOMMENDED_AGREEMENTS'
}

export type Queueable = {
  id: ID | string
  uid: UID
  landlordId?: ID
  collectible?: Collectible
  source: Source
}

export type QueueItem = {
  uid: UID | null
  source: Source | null
  agreement: Agreement | null
  user: User | null
}

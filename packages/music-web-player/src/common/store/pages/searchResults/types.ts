import { ID, LineupState, Status, DigitalContent } from '@coliving/common'

export type SearchPageState = {
  status: Status
  searchText: string
  agreementIds: ID[]
  albumIds: ID[]
  contentListIds: ID[]
  landlordIds: ID[]
  agreements: LineupState<DigitalContent>
}

export enum SearchKind {
  AGREEMENTS = 'agreements',
  USERS = 'users',
  CONTENT_LISTS = 'contentLists',
  ALBUMS = 'albums',
  ALL = 'all'
}

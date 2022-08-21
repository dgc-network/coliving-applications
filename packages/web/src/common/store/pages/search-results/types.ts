import { ID, LineupState, Status, Agreement } from '@coliving/common'

export type SearchPageState = {
  status: Status
  searchText: string
  agreementIds: ID[]
  albumIds: ID[]
  contentListIds: ID[]
  landlordIds: ID[]
  agreements: LineupState<Agreement>
}

export enum SearchKind {
  AGREEMENTS = 'agreements',
  USERS = 'users',
  CONTENT_LISTS = 'contentLists',
  ALBUMS = 'albums',
  ALL = 'all'
}

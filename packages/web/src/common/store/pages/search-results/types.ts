import { ID, LineupState, Status, Agreement } from '@coliving/common'

export type SearchPageState = {
  status: Status
  searchText: string
  agreementIds: ID[]
  albumIds: ID[]
  content listIds: ID[]
  artistIds: ID[]
  agreements: LineupState<Agreement>
}

export enum SearchKind {
  AGREEMENTS = 'agreements',
  USERS = 'users',
  CONTENT_LISTS = 'content lists',
  ALBUMS = 'albums',
  ALL = 'all'
}

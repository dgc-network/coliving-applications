import { ID, LineupState, Status, Agreement } from '@coliving/common'

export type SearchPageState = {
  status: Status
  searchText: string
  agreementIds: ID[]
  albumIds: ID[]
  playlistIds: ID[]
  artistIds: ID[]
  agreements: LineupState<Agreement>
}

export enum SearchKind {
  AGREEMENTS = 'agreements',
  USERS = 'users',
  PLAYLISTS = 'playlists',
  ALBUMS = 'albums',
  ALL = 'all'
}

import { ID, LineupState, Status, DigitalContent } from '@coliving/common'

export type SearchPageState = {
  status: Status
  searchText: string
  digitalContentIds: ID[]
  albumIds: ID[]
  contentListIds: ID[]
  landlordIds: ID[]
  digitalContents: LineupState<DigitalContent>
}

export enum SearchKind {
  DIGITAL_CONTENTS = 'digitalContents',
  USERS = 'users',
  CONTENT_LISTS = 'contentLists',
  ALBUMS = 'albums',
  ALL = 'all'
}

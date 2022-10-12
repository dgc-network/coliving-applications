import { Collection, Status, DigitalContent, User } from '@coliving/common'

export default interface SearchBarState {
  searchText: string
  digitalContents: DigitalContent[]
  users: User[]
  contentLists: Collection[]
  albums: Collection[]
  status: Status
  disregardResponses: boolean
}

import { Collection, Status, Agreement, User } from '@coliving/common'

export default interface SearchBarState {
  searchText: string
  agreements: Agreement[]
  users: User[]
  content lists: Collection[]
  albums: Collection[]
  status: Status
  disregardResponses: boolean
}

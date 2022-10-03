import { ID } from '@coliving/common'

import { UserListStoreState } from 'common/store/userList/types'

export enum RepostType {
  AGREEMENT = 'AGREEMENT',
  COLLECTION = 'COLLECTION'
}

export type RepostsOwnState = {
  id: ID | null
  repostType: RepostType
}

export type RepostsPageState = {
  repostsPage: RepostsOwnState
  userList: UserListStoreState
}

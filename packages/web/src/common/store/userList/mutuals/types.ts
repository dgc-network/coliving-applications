import { ID } from '@coliving/common'

import { UserListStoreState } from 'common/store/userList/types'

export type MutualsOwnState = {
  id: ID | null
}

export type MutualsPageState = {
  followingPage: MutualsOwnState
  userList: UserListStoreState
}

export const USER_LIST_TAG = 'MUTUALS'

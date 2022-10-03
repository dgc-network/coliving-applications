import { ID } from '@coliving/common'

import { UserListStoreState } from 'common/store/userList/types'

export type FollowersOwnState = {
  id: ID | null
}

export type FollowersPageState = {
  followersPage: FollowersOwnState
  userList: UserListStoreState
}

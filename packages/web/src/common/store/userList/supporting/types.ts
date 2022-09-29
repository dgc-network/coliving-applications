import { ID } from '@coliving/common'

import { UserListStoreState } from 'common/store/userList/types'

export type SupportingOwnState = {
  id: ID | null
}

export type SupportingPageState = {
  supportingPage: SupportingOwnState
  userList: UserListStoreState
}

import { ID, User } from '@coliving/common'
import { put, select } from 'typed-redux-saga/macro'

import { getUser } from 'common/store/cache/users/selectors'
import { getFollowingError } from 'common/store/userList/following/actions'
import { watchFollowingError } from 'common/store/userList/following/errorSagas'
import {
  getId,
  getUserList,
  getUserIds
} from 'common/store/userList/following/selectors'
import UserListSagaFactory from 'common/store/userList/sagas'
import { createUserListProvider } from 'components/userList/utils'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

export const USER_LIST_TAG = 'FOLLOWING'

const provider = createUserListProvider<User>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId,
    currentUserId
  }: {
    limit: number
    offset: number
    entityId: ID
    currentUserId: ID | null
  }) => {
    const users = await apiClient.getFollowing({
      currentUserId,
      profileUserId: entityId,
      limit,
      offset
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.followee_count,

  includeCurrentUser: (_) => false
})

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getFollowingError(id, error.message))
  }
}

function* getFollowing(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield* provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getFollowing,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchFollowingError]
}

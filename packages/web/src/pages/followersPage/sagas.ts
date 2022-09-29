import { ID, User } from '@coliving/common'
import { put, select } from 'typed-redux-saga/macro'

import { getUser } from 'common/store/cache/users/selectors'
import { getFollowersError } from 'common/store/userList/followers/actions'
import { watchFollowersError } from 'common/store/userList/followers/errorSagas'
import {
  getId,
  getUserList,
  getUserIds
} from 'common/store/userList/followers/selectors'
import UserListSagaFactory from 'common/store/userList/sagas'
import { createUserListProvider } from 'components/userList/utils'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'

export const USER_LIST_TAG = 'FOLLOWERS'

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
    const users = await apiClient.getFollowers({
      currentUserId,
      profileUserId: entityId,
      limit,
      offset
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.follower_count,
  includeCurrentUser: (u) => u.does_current_user_follow
})

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getFollowersError(id, error.message))
  }
}

function* getFollowers(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield* provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getFollowers,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchFollowersError]
}

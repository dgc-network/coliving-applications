import { ID, User } from '@coliving/common'
import { put, select } from 'typed-redux-saga/macro'

import { getUser } from 'common/store/cache/users/selectors'
import { getMutualsError } from 'common/store/userList/mutuals/actions'
import { watchMutualsError } from 'common/store/userList/mutuals/errorSagas'
import {
  getId,
  getUserList,
  getUserIds
} from 'common/store/userList/mutuals/selectors'
import { USER_LIST_TAG } from 'common/store/userList/mutuals/types'
import UserListSagaFactory from 'common/store/userList/sagas'
import { createUserListProvider } from 'components/userList/utils'
import ColivingBackend from 'services/colivingBackend'

type FetchMutualsConfig = {
  limit: number
  offset: number
  entityId: ID
  currentUserId: ID | null
}

const fetchAllUsersForEntity = async ({
  limit,
  offset,
  entityId: userId
}: FetchMutualsConfig) => {
  const mutuals = await ColivingBackend.getFolloweeFollows(userId, limit, offset)
  return { users: mutuals }
}

const provider = createUserListProvider<User>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity,
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.current_user_followee_follow_count,
  includeCurrentUser: (_) => false
})

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getMutualsError(id, error.message))
  }
}

function* getMutuals(currentPage: number, pageSize: number) {
  const id = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield* provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getMutuals,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchMutualsError]
}

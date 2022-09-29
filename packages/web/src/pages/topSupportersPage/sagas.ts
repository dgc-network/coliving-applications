import { ID, User, removeNullable } from '@coliving/common'
import { put, select } from 'typed-redux-saga/macro'

import { getUser } from 'common/store/cache/users/selectors'
import { setSupportersForUser } from 'common/store/tipping/slice'
import { SupportersMapForUser } from 'common/store/tipping/types'
import UserListSagaFactory from 'common/store/userList/sagas'
import { getTopSupportersError } from 'common/store/userList/topSupporters/actions'
import { watchTopSupportersError } from 'common/store/userList/topSupporters/errorSagas'
import {
  getId,
  getUserList,
  getUserIds
} from 'common/store/userList/topSupporters/selectors'
import { createUserListProvider } from 'components/userList/utils'
import * as adapter from 'services/colivingAPIClient/responseAdapter'
import {
  fetchSupporters,
  SupporterResponse
} from 'services/colivingBackend/tipping'
import { decodeHashId, encodeHashId } from 'utils/route/hashIds'

export const USER_LIST_TAG = 'TOP SUPPORTERS'

type SupportersProcessExtraType = {
  userId: ID
  supporters: SupporterResponse[]
}

const provider = createUserListProvider<User, SupportersProcessExtraType>({
  getExistingEntity: getUser,
  extractUserIDSubsetFromEntity: () => [],
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId
  }: {
    limit: number
    offset: number
    entityId: ID
    currentUserId: ID | null
  }) => {
    const encodedUserId = encodeHashId(entityId)
    if (!encodedUserId) return { users: [] }

    const supporters = await fetchSupporters({
      encodedUserId,
      limit,
      offset
    })
    const users = supporters
      .sort((s1, s2) => s1.rank - s2.rank)
      .map((s) => adapter.makeUser(s.sender))
      .filter(removeNullable)
    return { users, extra: { userId: entityId, supporters } }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (user: User, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < user.supporter_count,
  includeCurrentUser: (_) => false,
  /**
   * Tipping sagas for user list modals are special in that they require
   * tipping data on top of the otherwise independent user data.
   * We need to store the supporters data for the user
   * in the store. So we use this function, which is optional
   * in the interface, to update the store.
   */
  processExtra: function* ({ userId, supporters }) {
    const supportersMap: SupportersMapForUser = {}
    supporters.forEach((supporter: SupporterResponse) => {
      const supporterUserId = decodeHashId(supporter.sender.id)
      if (supporterUserId) {
        supportersMap[supporterUserId] = {
          sender_id: supporterUserId,
          rank: supporter.rank,
          amount: supporter.amount
        }
      }
    })
    yield* put(
      setSupportersForUser({
        id: userId,
        supportersForUser: supportersMap
      })
    )
  }
})

function* errorDispatcher(error: Error) {
  const id = yield* select(getId)
  if (id) {
    yield* put(getTopSupportersError(id, error.message))
  }
}

function* getTopSupporters(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  return yield* provider({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getTopSupporters,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchTopSupportersError]
}

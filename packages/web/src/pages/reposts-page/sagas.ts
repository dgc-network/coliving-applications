import { ID, Collection, Agreement } from '@coliving/common'
import { put, select } from 'typed-redux-saga'

import { getCollection } from 'common/store/cache/collections/selectors'
import { getAgreement } from 'common/store/cache/agreements/selectors'
import {
  agreementRepostError,
  contentListRepostError
} from 'common/store/userList/reposts/actions'
import { watchRepostsError } from 'common/store/userList/reposts/errorSagas'
import {
  getId,
  getRepostsType,
  getUserList,
  getUserIds
} from 'common/store/userList/reposts/selectors'
import { RepostType } from 'common/store/userList/reposts/types'
import UserListSagaFactory from 'common/store/userList/sagas'
import { createUserListProvider } from 'components/user-list/utils'
import apiClient from 'services/coliving-api-client/ColivingAPIClient'

export const USER_LIST_TAG = 'REPOSTS'

const getContentListReposts = createUserListProvider<Collection>({
  getExistingEntity: getCollection,
  extractUserIDSubsetFromEntity: (collection: Collection) =>
    collection.followee_reposts.map((r) => r.user_id),
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId,
    currentUserId
  }) => {
    const users = await apiClient.getContentListRepostUsers({
      limit,
      offset,
      contentListId: entityId,
      currentUserId
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (collection: Collection, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < collection.repost_count,
  includeCurrentUser: (p) => p.has_current_user_reposted
})

const getAgreementReposts = createUserListProvider<Agreement>({
  getExistingEntity: getAgreement,
  extractUserIDSubsetFromEntity: (agreement: Agreement) =>
    agreement.followee_reposts.map((r) => r.user_id),
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
    const users = await apiClient.getAgreementRepostUsers({
      limit,
      offset,
      agreementId: entityId,
      currentUserId
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (agreement: Agreement, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < agreement.repost_count,
  includeCurrentUser: (t) => t.has_current_user_reposted
})

function* errorDispatcher(error: Error) {
  const repostType = yield* select(getRepostsType)
  const id = yield* select(getId)
  if (!id) return

  if (repostType === RepostType.AGREEMENT) {
    yield* put(agreementRepostError(id, error.message))
  } else {
    yield* put(contentListRepostError(id, error.message))
  }
}

function* getReposts(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  const repostType = yield* select(getRepostsType)
  return yield* (
    repostType === RepostType.AGREEMENT ? getAgreementReposts : getContentListReposts
  )({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getReposts,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchRepostsError]
}

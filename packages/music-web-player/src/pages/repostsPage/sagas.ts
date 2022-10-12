import { ID, Collection, DigitalContent } from '@coliving/common'
import { put, select } from 'typed-redux-saga'

import { getCollection } from 'common/store/cache/collections/selectors'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import {
  digitalContentRepostError,
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
import { createUserListProvider } from 'components/userList/utils'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

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

const getDigitalContentReposts = createUserListProvider<DigitalContent>({
  getExistingEntity: getDigitalContent,
  extractUserIDSubsetFromEntity: (digital_content: DigitalContent) =>
    digital_content.followee_reposts.map((r) => r.user_id),
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
    const users = await apiClient.getDigitalContentRepostUsers({
      limit,
      offset,
      digitalContentId: entityId,
      currentUserId
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (digital_content: DigitalContent, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < digital_content.repost_count,
  includeCurrentUser: (t) => t.has_current_user_reposted
})

function* errorDispatcher(error: Error) {
  const repostType = yield* select(getRepostsType)
  const id = yield* select(getId)
  if (!id) return

  if (repostType === RepostType.AGREEMENT) {
    yield* put(digitalContentRepostError(id, error.message))
  } else {
    yield* put(contentListRepostError(id, error.message))
  }
}

function* getReposts(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  const repostType = yield* select(getRepostsType)
  return yield* (
    repostType === RepostType.AGREEMENT ? getDigitalContentReposts : getContentListReposts
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

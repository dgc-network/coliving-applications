import { ID, Collection, FavoriteType, DigitalContent } from '@coliving/common'
import { select, put } from 'typed-redux-saga/macro'

import { getCollection } from 'common/store/cache/collections/selectors'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import {
  digitalContentFavoriteError,
  contentListFavoriteError
} from 'common/store/userList/favorites/actions'
import { watchFavoriteError } from 'common/store/userList/favorites/errorSagas'
import {
  getId,
  getUserList,
  getUserIds,
  getFavoriteType
} from 'common/store/userList/favorites/selectors'
import UserListSagaFactory from 'common/store/userList/sagas'
import { createUserListProvider } from 'components/userList/utils'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'

export const USER_LIST_TAG = 'FAVORITES'

const getContentListFavorites = createUserListProvider<Collection>({
  getExistingEntity: getCollection,
  extractUserIDSubsetFromEntity: (collection: Collection) =>
    collection.followee_saves.map((r) => r.user_id),
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId,
    currentUserId
  }) => {
    const users = await apiClient.getContentListFavoriteUsers({
      limit,
      offset,
      contentListId: entityId,
      currentUserId
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (collection: Collection, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < collection.save_count,
  includeCurrentUser: (p) => p.has_current_user_saved
})

const getDigitalContentFavorites = createUserListProvider<DigitalContent>({
  getExistingEntity: getDigitalContent,
  extractUserIDSubsetFromEntity: (digital_content: DigitalContent) =>
    digital_content.followee_saves.map((r) => r.user_id),
  fetchAllUsersForEntity: async ({
    limit,
    offset,
    entityId,
    currentUserId
  }) => {
    const users = await apiClient.getDigitalContentFavoriteUsers({
      limit,
      offset,
      digitalContentId: entityId,
      currentUserId
    })
    return { users }
  },
  selectCurrentUserIDsInList: getUserIds,
  canFetchMoreUsers: (digital_content: DigitalContent, combinedUserIDs: ID[]) =>
    combinedUserIDs.length < digital_content.save_count,
  includeCurrentUser: (t) => t.has_current_user_saved
})

function* errorDispatcher(error: Error) {
  const favoriteType = yield* select(getFavoriteType)
  const id = yield* select(getId)
  if (!id) return

  if (favoriteType === FavoriteType.DIGITAL_CONTENT) {
    yield* put(digitalContentFavoriteError(id, error.message))
  } else {
    yield* put(contentListFavoriteError(id, error.message))
  }
}

function* getFavorites(currentPage: number, pageSize: number) {
  const id: number | null = yield* select(getId)
  if (!id) return { userIds: [], hasMore: false }
  const favoriteType = yield* select(getFavoriteType)
  return yield* (
    favoriteType === FavoriteType.DIGITAL_CONTENT
      ? getDigitalContentFavorites
      : getContentListFavorites
  )({ id, currentPage, pageSize })
}

const userListSagas = UserListSagaFactory.createSagas({
  tag: USER_LIST_TAG,
  fetchUsers: getFavorites,
  stateSelector: getUserList,
  errorDispatcher
})

export default function sagas() {
  return [userListSagas, watchFavoriteError]
}

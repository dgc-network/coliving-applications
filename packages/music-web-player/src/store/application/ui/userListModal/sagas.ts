import { FavoriteType } from '@coliving/common'
import { takeEvery, put } from 'redux-saga/effects'

import * as favoritesActions from 'common/store/userList/favorites/actions'
import * as followerActions from 'common/store/userList/followers/actions'
import * as followingActions from 'common/store/userList/following/actions'
import { setMutuals } from 'common/store/userList/mutuals/actions'
import * as notificationActions from 'common/store/userList/notifications/actions'
import * as repostActions from 'common/store/userList/reposts/actions'
import { RepostType } from 'common/store/userList/reposts/types'
import * as supportingActions from 'common/store/userList/supporting/actions'
import * as topSupporterActions from 'common/store/userList/topSupporters/actions'

import { setUsers } from './slice'
import { UserListType, UserListEntityType } from './types'

function* watchSetUsers() {
  yield takeEvery(
    setUsers.type,
    function* (action: ReturnType<typeof setUsers>) {
      const { userListType, entityType, id } = action.payload
      switch (userListType) {
        case UserListType.FAVORITE:
          yield put(
            favoritesActions.setFavorite(
              id,
              entityType === UserListEntityType.DIGITAL_CONTENT
                ? FavoriteType.DIGITAL_CONTENT
                : FavoriteType.CONTENT_LIST
            )
          )
          break
        case UserListType.REPOST:
          yield put(
            repostActions.setRepost(
              id,
              entityType === UserListEntityType.DIGITAL_CONTENT
                ? RepostType.DIGITAL_CONTENT
                : RepostType.COLLECTION
            )
          )
          break
        case UserListType.FOLLOWER:
          yield put(followerActions.setFollowers(id))
          break
        case UserListType.FOLLOWING:
          yield put(followingActions.setFollowing(id))
          break
        case UserListType.MUTUAL_FOLLOWER:
          yield put(setMutuals(id))
          break
        case UserListType.NOTIFICATION:
          yield put(
            notificationActions.setNotificationId(id as unknown as string)
          )
          break
        case UserListType.SUPPORTER:
          yield put(topSupporterActions.setTopSupporters(id))
          break
        case UserListType.SUPPORTING:
          yield put(supportingActions.setSupporting(id))
          break
        default:
          break
      }
    }
  )
}

export default function sagas() {
  return [watchSetUsers]
}

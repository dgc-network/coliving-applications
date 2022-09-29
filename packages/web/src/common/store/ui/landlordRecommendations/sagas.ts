import { ID, User, DoubleKeys } from '@coliving/common'
import { Action } from '@reduxjs/toolkit'
import { shuffle } from 'lodash'
import { call, put, select, takeEvery } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheUsers } from 'common/store/cache/users/utils'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'

import * as landlordRecommendationsActions from './slice'

export function* fetchRelatedLandlords(action: Action) {
  if (landlordRecommendationsActions.fetchRelatedLandlords.match(action)) {
    const userId = action.payload.userId
    const currentUserId: ID = yield select(getUserId)
    const relatedLandlords: User[] = yield apiClient.getRelatedLandlords({
      userId,
      currentUserId,
      limit: 50
    })

    let filteredLandlords = relatedLandlords
      .filter((user) => !user.does_current_user_follow && !user.is_deactivated)
      .slice(0, 5)
    if (filteredLandlords.length === 0) {
      const showTopLandlordRecommendationsPercent =
        remoteConfigInstance.getRemoteVar(
          DoubleKeys.SHOW_LANDLORD_RECOMMENDATIONS_FALLBACK_PERCENT
        ) || 0
      const showTopLandlords = Math.random() < showTopLandlordRecommendationsPercent
      if (showTopLandlords) {
        filteredLandlords = yield fetchTopLandlords()
      }
    }
    if (filteredLandlords.length > 0) {
      const relatedLandlordIds: ID[] = yield call(cacheUsers, filteredLandlords)
      yield put(
        landlordRecommendationsActions.fetchRelatedLandlordsSucceeded({
          userId,
          relatedLandlordIds
        })
      )
    }
  }
}

function* fetchTopLandlords() {
  const currentUserId: ID = yield select(getUserId)
  const topLandlords: User[] = yield apiClient.getTopLandlords({
    currentUserId,
    limit: 50
  })
  const filteredLandlords = topLandlords.filter(
    (user) => !user.does_current_user_follow && !user.is_deactivated
  )
  if (filteredLandlords.length > 0) {
    // Pick 5 at random
    const selectedLandlords = shuffle(filteredLandlords).slice(0, 5)
    return selectedLandlords
  }
  return []
}

function* cacheUsers(users: User[]) {
  const currentUserId: ID = yield select(getUserId)
  // Filter out the current user from the list to cache
  yield processAndCacheUsers(
    users.filter((user) => user.user_id !== currentUserId)
  )
  return users.map((f) => f.user_id)
}

function* watchFetchRelatedLandlords() {
  yield takeEvery(
    landlordRecommendationsActions.fetchRelatedLandlords,
    fetchRelatedLandlords
  )
}

export default function sagas() {
  return [watchFetchRelatedLandlords]
}

import { takeLatest, call, put, fork, select } from 'redux-saga/effects'

import { getAccountUser } from 'common/store/account/selectors'
import { processAndCacheDigitalContents } from 'common/store/cache/digital_contents/utils'
import * as actions from 'common/store/pages/savedPage/actions'
import { digitalContentsActions } from 'common/store/pages/savedPage/lineups/digital_contents/actions'
import { getSaves } from 'common/store/pages/savedPage/selectors'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { waitForValue } from 'utils/sagaHelpers'

import digitalContentsSagas from './lineups/digital_contents/sagas'

function* fetchDigitalContentsLineup() {
  yield put(digitalContentsActions.fetchLineupMetadatas())
}

function* watchFetchSaves() {
  yield takeLatest(actions.FETCH_SAVES, function* () {
    const account = yield call(waitForValue, getAccountUser)
    const userId = account.user_id
    const limit = account.digital_content_save_count
    const saves = yield select(getSaves)
    // Don't refetch saves in the same session
    if (saves && saves.length) {
      yield fork(fetchDigitalContentsLineup)
    } else {
      try {
        const savedDigitalContents = yield apiClient.getFavoritedDigitalContents({
          currentUserId: userId,
          profileUserId: userId,
          offset: 0,
          limit
        })
        const digitalContents = savedDigitalContents.map((save) => save.digital_content)

        yield processAndCacheDigitalContents(digitalContents)

        const saves = savedDigitalContents.map((save) => ({
          created_at: save.timestamp,
          save_item_id: save.digital_content.digital_content_id
        }))
        yield put(actions.fetchSavesSucceeded(saves))

        yield fork(fetchDigitalContentsLineup)
      } catch (e) {
        yield put(actions.fetchSavesFailed())
      }
    }
  })
}

export default function sagas() {
  return [...digitalContentsSagas(), watchFetchSaves]
}

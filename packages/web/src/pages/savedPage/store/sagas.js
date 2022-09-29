import { takeLatest, call, put, fork, select } from 'redux-saga/effects'

import { getAccountUser } from 'common/store/account/selectors'
import { processAndCacheAgreements } from 'common/store/cache/agreements/utils'
import * as actions from 'common/store/pages/savedPage/actions'
import { agreementsActions } from 'common/store/pages/savedPage/lineups/agreements/actions'
import { getSaves } from 'common/store/pages/savedPage/selectors'
import apiClient from 'services/colivingAPIClient/colivingAPIClient'
import { waitForValue } from 'utils/sagaHelpers'

import agreementsSagas from './lineups/agreements/sagas'

function* fetchAgreementsLineup() {
  yield put(agreementsActions.fetchLineupMetadatas())
}

function* watchFetchSaves() {
  yield takeLatest(actions.FETCH_SAVES, function* () {
    const account = yield call(waitForValue, getAccountUser)
    const userId = account.user_id
    const limit = account.agreement_save_count
    const saves = yield select(getSaves)
    // Don't refetch saves in the same session
    if (saves && saves.length) {
      yield fork(fetchAgreementsLineup)
    } else {
      try {
        const savedAgreements = yield apiClient.getFavoritedAgreements({
          currentUserId: userId,
          profileUserId: userId,
          offset: 0,
          limit
        })
        const agreements = savedAgreements.map((save) => save.agreement)

        yield processAndCacheAgreements(agreements)

        const saves = savedAgreements.map((save) => ({
          created_at: save.timestamp,
          save_item_id: save.agreement.agreement_id
        }))
        yield put(actions.fetchSavesSucceeded(saves))

        yield fork(fetchAgreementsLineup)
      } catch (e) {
        yield put(actions.fetchSavesFailed())
      }
    }
  })
}

export default function sagas() {
  return [...agreementsSagas(), watchFetchSaves]
}

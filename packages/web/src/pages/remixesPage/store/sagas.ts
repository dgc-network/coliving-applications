import { AgreementMetadata } from '@coliving/common'
import { takeEvery, call, put } from 'redux-saga/effects'

import { retrieveAgreementByHandleAndSlug } from 'common/store/cache/agreements/utils/retrieveAgreements'
import {
  fetchAgreement,
  fetchAgreementSucceeded
} from 'common/store/pages/remixes/slice'
import { waitForBackendSetup } from 'store/backend/sagas'

import agreementsSagas from './lineups/agreements/sagas'

function* watchFetch() {
  yield takeEvery(
    fetchAgreement.type,
    function* (action: ReturnType<typeof fetchAgreement>) {
      yield call(waitForBackendSetup)
      const { handle, slug } = action.payload

      const agreement: AgreementMetadata = yield call(retrieveAgreementByHandleAndSlug, {
        handle,
        slug
      })

      yield put(fetchAgreementSucceeded({ agreementId: agreement.agreement_id }))
    }
  )
}

export default function sagas() {
  return [...agreementsSagas(), watchFetch]
}

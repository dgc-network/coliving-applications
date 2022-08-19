import { Name } from '@coliving/common'
import { call, put, takeEvery } from 'redux-saga/effects'

import {
  confirmCredentials,
  confirmCredentialsSucceeded,
  confirmCredentialsFailed,
  changePassword,
  changePasswordSucceeded,
  changePasswordFailed
} from 'common/store/change-password/slice'
import ColivingBackend from 'services/ColivingBackend'
import { make, AgreementEvent } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'

function* handleConfirmCredentials(
  action: ReturnType<typeof confirmCredentials>
) {
  yield call(waitForBackendSetup)
  try {
    const confirmed: boolean = yield call(
      ColivingBackend.confirmCredentials,
      action.payload.email,
      action.payload.password
    )
    if (!confirmed) {
      throw new Error('Invalid credentials')
    }
    yield put(confirmCredentialsSucceeded())
  } catch {
    yield put(confirmCredentialsFailed())
  }
}

function* handleChangePassword(action: ReturnType<typeof changePassword>) {
  yield call(waitForBackendSetup)
  try {
    yield call(
      ColivingBackend.changePassword,
      action.payload.email,
      action.payload.password,
      action.payload.oldPassword
    )
    yield put(changePasswordSucceeded())
    const agreementEvent: AgreementEvent = make(
      Name.SETTINGS_COMPLETE_CHANGE_PASSWORD,
      {
        status: 'success'
      }
    )
    yield put(agreementEvent)
  } catch {
    yield put(changePasswordFailed())
    const agreementEvent: AgreementEvent = make(
      Name.SETTINGS_COMPLETE_CHANGE_PASSWORD,
      {
        status: 'failure'
      }
    )
    yield put(agreementEvent)
  }
}

function* watchConfirmCredentials() {
  yield takeEvery(confirmCredentials, handleConfirmCredentials)
}

function* watchChangePassword() {
  yield takeEvery(changePassword, handleChangePassword)
}

export default function sagas() {
  return [watchConfirmCredentials, watchChangePassword]
}

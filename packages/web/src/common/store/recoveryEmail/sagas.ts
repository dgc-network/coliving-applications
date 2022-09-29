import { Name } from '@coliving/common'
import { takeLatest, put } from 'redux-saga/effects'

import ColivingBackend from 'services/ColivingBackend'
import { make } from 'store/analytics/actions'

import { resendRecoveryEmail as resendRecoveryEmailAction } from './slice'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* watchResendRecoveryEmail() {
  yield takeLatest(resendRecoveryEmailAction.type, function* () {
    if (NATIVE_MOBILE) {
      yield put(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
      ColivingBackend.sendRecoveryEmail()
    } else {
      yield put(
        make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {
          callback: ColivingBackend.sendRecoveryEmail
        })
      )
    }
  })
}

export default function sagas() {
  return [watchResendRecoveryEmail]
}

import { call, put, takeEvery } from 'redux-saga/effects'

import ColivingBackend from 'services/colivingBackend'

import * as actions from './actions'

function* watchChangePassword() {
  yield takeEvery(
    actions.CHANGE_PASSWORD,
    function* (action: actions.ChangePasswordAction) {
      try {
        yield call(ColivingBackend.resetPassword, action.email, action.password)
      } catch (e) {
        yield put(actions.changePasswordFailed())
      }
      yield put(actions.changePasswordSucceeded())
    }
  )
}

export default function sagas() {
  return [watchChangePassword]
}

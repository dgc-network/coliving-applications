import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'

import {
  GET_DIGITAL_CONTENT_REPOST_ERROR,
  GET_CONTENT_LIST_REPOST_ERROR,
  digitalContentRepostError,
  contentListRepostError
} from './actions'

type ErrorActions =
  | ReturnType<typeof digitalContentRepostError>
  | ReturnType<typeof contentListRepostError>

export function* handleRepostError(action: ErrorActions) {
  yield put(
    errorActions.handleError({
      message: action.type,
      shouldRedirect: true,
      shouldReport: true,
      additionalInfo: {
        errorMessage: action.error,
        id: action.id
      }
    })
  )
}

export function* watchRepostsError() {
  yield takeEvery(
    [GET_DIGITAL_CONTENT_REPOST_ERROR, GET_CONTENT_LIST_REPOST_ERROR],
    handleRepostError
  )
}

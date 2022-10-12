import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'

import {
  GET_AGREEMENT_FAVORITE_ERROR,
  GET_CONTENT_LIST_FAVORITE_ERROR,
  digitalContentFavoriteError,
  contentListFavoriteError
} from './actions'

type ErrorActions =
  | ReturnType<typeof digitalContentFavoriteError>
  | ReturnType<typeof contentListFavoriteError>

export function* handleFavoriteError(action: ErrorActions) {
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

export function* watchFavoriteError() {
  yield takeEvery(
    [GET_AGREEMENT_FAVORITE_ERROR, GET_CONTENT_LIST_FAVORITE_ERROR],
    handleFavoriteError
  )
}

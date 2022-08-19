import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'

import {
  GET_AGREEMENT_REPOST_ERROR,
  GET_PLAYLIST_REPOST_ERROR,
  agreementRepostError,
  playlistRepostError
} from './actions'

type ErrorActions =
  | ReturnType<typeof agreementRepostError>
  | ReturnType<typeof playlistRepostError>

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
    [GET_AGREEMENT_REPOST_ERROR, GET_PLAYLIST_REPOST_ERROR],
    handleRepostError
  )
}

import { put, takeEvery } from 'redux-saga/effects'

import * as errorActions from 'common/store/errors/actions'

import * as uploadActions from './actions'

const BYTES_PER_MB = 1000 * 1000

const errorsWithoutRedirect = new Set([
  // Multiagreement shouldn't redirect b/c
  // some agreements are better than none
  uploadActions.MULTI_AGREEMENT_TIMEOUT_ERROR,
  uploadActions.MULTI_AGREEMENT_UPLOAD_ERROR,

  // Associate requires agreement cleanup
  uploadActions.COLLECTION_ASSOCIATE_AGREEMENTS_ERROR,

  // ContentList errors require
  // agreement & possibly contentList cleanup
  uploadActions.COLLECTION_CREATE_CONTENT_LIST_ID_EXISTS_ERROR,
  uploadActions.COLLECTION_CREATE_CONTENT_LIST_NO_ID_ERROR,
  uploadActions.COLLECTION_POLL_CONTENT_LIST_TIMEOUT_ERROR
])

// TODO: This definition should live in Upload Actions
// once we've settled on a pattern for defining actions in TS
type UploadErrorActions = {
  type: string
  error: string
  agreementSizeBytes?: number
  phase?: string
  numAgreements?: number
  isStem?: boolean
}

function* handleUploadError(action: UploadErrorActions) {
  const shouldRedirect = !errorsWithoutRedirect.has(action.type)

  // Append extra info depending on the action type
  const extras: {
    error?: string
    fileSize?: string
    phase?: string
    numAgreements?: number
    isStem?: boolean
  } = { error: action.error }
  switch (action.type) {
    case uploadActions.SINGLE_AGREEMENT_UPLOAD_ERROR:
      extras.fileSize = `${action.agreementSizeBytes! / BYTES_PER_MB} mb`
      extras.phase = action.phase!
      break
    case uploadActions.MULTI_AGREEMENT_UPLOAD_ERROR:
      extras.phase = action.phase!
      extras.numAgreements = action.numAgreements!
      extras.isStem = action.isStem!
      break
    default:
  }

  yield put(
    errorActions.handleError({
      message: action.type,
      shouldRedirect,
      shouldReport: true,
      additionalInfo: extras
    })
  )
}

export function* watchUploadErrors() {
  yield takeEvery(
    [
      uploadActions.UPGRADE_TO_CREATOR_ERROR,
      uploadActions.SINGLE_AGREEMENT_UPLOAD_ERROR,
      uploadActions.SINGLE_AGREEMENT_UPLOAD_TIMEOUT_ERROR,
      uploadActions.MULTI_AGREEMENT_UPLOAD_ERROR,
      uploadActions.MULTI_AGREEMENT_TIMEOUT_ERROR,
      uploadActions.COLLECTION_CONTENT_NODE_UPLOAD_ERROR,
      uploadActions.COLLECTION_CONTENT_NODE_TIMEOUT_ERROR,
      uploadActions.COLLECTION_ADD_AGREEMENT_TO_CHAIN_ERROR,
      uploadActions.COLLECTION_ASSOCIATE_AGREEMENTS_ERROR,
      uploadActions.COLLECTION_CREATE_CONTENT_LIST_NO_ID_ERROR,
      uploadActions.COLLECTION_CREATE_CONTENT_LIST_ID_EXISTS_ERROR,
      uploadActions.COLLECTION_POLL_CONTENT_LIST_TIMEOUT_ERROR
    ],
    handleUploadError
  )
}

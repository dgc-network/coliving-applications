import createErrorSagas from 'common/utils/errorSagas'

import * as collectionActions from './actions'

type CollectionErrors =
  | ReturnType<typeof collectionActions.createPlaylistFailed>
  | ReturnType<typeof collectionActions.editPlaylistFailed>
  | ReturnType<typeof collectionActions.addAgreementToPlaylistFailed>
  | ReturnType<typeof collectionActions.removeAgreementFromPlaylistFailed>
  | ReturnType<typeof collectionActions.orderPlaylistFailed>
  | ReturnType<typeof collectionActions.deletePlaylistFailed>
  | ReturnType<typeof collectionActions.publishPlaylistFailed>

const errorSagas = createErrorSagas<CollectionErrors>({
  errorTypes: [
    collectionActions.CREATE_CONTENT_LIST_FAILED,
    collectionActions.EDIT_CONTENT_LIST_FAILED,
    collectionActions.ADD_AGREEMENT_TO_CONTENT_LIST_FAILED,
    collectionActions.REMOVE_AGREEMENT_FROM_CONTENT_LIST_FAILED,
    collectionActions.ORDER_CONTENT_LIST_FAILED,
    collectionActions.DELETE_CONTENT_LIST_FAILED,
    collectionActions.PUBLISH_CONTENT_LIST_FAILED
  ],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: CollectionErrors) => ({
    error: action.error,
    params: action.params,
    metadata: action.metadata
  })
})

export default errorSagas

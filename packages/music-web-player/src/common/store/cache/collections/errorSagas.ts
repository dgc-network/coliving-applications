import createErrorSagas from 'common/utils/errorSagas'

import * as collectionActions from './actions'

type CollectionErrors =
  | ReturnType<typeof collectionActions.createContentListFailed>
  | ReturnType<typeof collectionActions.editContentListFailed>
  | ReturnType<typeof collectionActions.addAgreementToContentListFailed>
  | ReturnType<typeof collectionActions.removeAgreementFromContentListFailed>
  | ReturnType<typeof collectionActions.orderContentListFailed>
  | ReturnType<typeof collectionActions.deleteContentListFailed>
  | ReturnType<typeof collectionActions.publishContentListFailed>

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
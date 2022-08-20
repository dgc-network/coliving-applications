import { ID, UID, Collection, SquareSizes } from '@coliving/common'

export const CREATE_CONTENT_LIST = 'CREATE_CONTENT_LIST'
export const CREATE_CONTENT_LIST_REQUESTED = 'CREATE_CONTENT_LIST_REQUESTED'
export const CREATE_CONTENT_LIST_SUCCEEDED = 'CREATE_CONTENT_LIST_SUCCEEDED'
export const CREATE_CONTENT_LIST_FAILED = 'CREATE_CONTENT_LIST_FAILED'

export const EDIT_CONTENT_LIST = 'EDIT_CONTENT_LIST'
export const EDIT_CONTENT_LIST_SUCCEEDED = 'EDIT_CONTENT_LIST_SUCCEEDED'
export const EDIT_CONTENT_LIST_FAILED = 'EDIT_CONTENT_LIST_FAILED'

export const ADD_AGREEMENT_TO_CONTENT_LIST = 'ADD_AGREEMENT_TO_CONTENT_LIST'
export const ADD_AGREEMENT_TO_CONTENT_LIST_FAILED = 'ADD_AGREEMENT_TO_CONTENT_LIST_FAILED'

export const REMOVE_AGREEMENT_FROM_CONTENT_LIST = 'REMOVE_AGREEMENT_FROM_CONTENT_LIST'
export const REMOVE_AGREEMENT_FROM_CONTENT_LIST_FAILED =
  'REMOVE_AGREEMENT_FROM_CONTENT_LIST_FAILED'

export const ORDER_CONTENT_LIST = 'ORDER_CONTENT_LIST'
export const ORDER_CONTENT_LIST_FAILED = 'ORDER_CONTENT_LIST_FAILED'

export const PUBLISH_CONTENT_LIST = 'PUBLISH_CONTENT_LIST'
export const PUBLISH_CONTENT_LIST_FAILED = 'PUBLISH_CONTENT_LIST_FAILED'

export const DELETE_CONTENT_LIST = 'DELETE_CONTENT_LIST'
export const DELETE_CONTENT_LIST_REQUESTED = 'DELETE_CONTENT_LIST_REQUESTED'
export const DELETE_CONTENT_LIST_SUCCEEDED = 'DELETE_CONTENT_LIST_SUCCEEDED'
export const DELETE_CONTENT_LIST_FAILED = 'DELETE_CONTENT_LIST_FAILED'

export const FETCH_COVER_ART = 'AGREEMENTS/FETCH_COVER_ART'

/**
 * @param initAgreementId optional agreement id to pull artwork from.
 */
export function createContentList(
  tempId: number | string,
  formFields: Record<string, unknown>,
  source: string,
  initAgreementId?: number | null
) {
  return { type: CREATE_CONTENT_LIST, tempId, formFields, source, initAgreementId }
}

export function createContentListRequested() {
  return { type: CREATE_CONTENT_LIST_REQUESTED }
}

export function createContentListSucceeded() {
  return { type: CREATE_CONTENT_LIST_SUCCEEDED }
}

export function createContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: CREATE_CONTENT_LIST_FAILED, error, params, metadata }
}

export function editContentList(content listId: number, formFields: Collection) {
  return { type: EDIT_CONTENT_LIST, content listId, formFields }
}

export function editContentListSucceeded() {
  return { type: EDIT_CONTENT_LIST_SUCCEEDED }
}

export function editContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: EDIT_CONTENT_LIST_FAILED, error, params, metadata }
}

export function addAgreementToContentList(
  agreementId: ID | null,
  content listId: number | string
) {
  return { type: ADD_AGREEMENT_TO_CONTENT_LIST, agreementId, content listId }
}

export function addAgreementToContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: ADD_AGREEMENT_TO_CONTENT_LIST_FAILED, error, params, metadata }
}

export function removeAgreementFromContentList(
  agreementId: number,
  content listId: number,
  timestamp: number
) {
  return { type: REMOVE_AGREEMENT_FROM_CONTENT_LIST, agreementId, content listId, timestamp }
}

export function removeAgreementFromContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: REMOVE_AGREEMENT_FROM_CONTENT_LIST_FAILED, error, params, metadata }
}

export function orderContentList(
  content listId: number,
  agreementIdsAndTimes: { id: ID; time: number }[],
  agreementUids?: UID[]
) {
  return { type: ORDER_CONTENT_LIST, content listId, agreementIdsAndTimes, agreementUids }
}

export function orderContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: ORDER_CONTENT_LIST_FAILED, error, params, metadata }
}

export function publishContentList(content listId: ID) {
  return { type: PUBLISH_CONTENT_LIST, content listId }
}

export function publishContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: PUBLISH_CONTENT_LIST_FAILED, error, params, metadata }
}

export function deleteContentList(content listId: ID) {
  return { type: DELETE_CONTENT_LIST, content listId }
}

export function deleteContentListRequested() {
  return { type: DELETE_CONTENT_LIST_REQUESTED }
}

export function deleteContentListSucceeded() {
  return { type: DELETE_CONTENT_LIST_SUCCEEDED }
}

export function deleteContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: DELETE_CONTENT_LIST_FAILED, error, params, metadata }
}

export function fetchCoverArt(collectionId: ID, size: SquareSizes) {
  return { type: FETCH_COVER_ART, collectionId, size }
}

import { ID, UID, Collection, SquareSizes } from '@coliving/common'

export const CREATE_CONTENT_LIST = 'CREATE_CONTENT_LIST'
export const CREATE_CONTENT_LIST_REQUESTED = 'CREATE_CONTENT_LIST_REQUESTED'
export const CREATE_CONTENT_LIST_SUCCEEDED = 'CREATE_CONTENT_LIST_SUCCEEDED'
export const CREATE_CONTENT_LIST_FAILED = 'CREATE_CONTENT_LIST_FAILED'

export const EDIT_CONTENT_LIST = 'EDIT_CONTENT_LIST'
export const EDIT_CONTENT_LIST_SUCCEEDED = 'EDIT_CONTENT_LIST_SUCCEEDED'
export const EDIT_CONTENT_LIST_FAILED = 'EDIT_CONTENT_LIST_FAILED'

export const ADD_DIGITAL_CONTENT_TO_CONTENT_LIST = 'ADD_DIGITAL_CONTENT_TO_CONTENT_LIST'
export const ADD_DIGITAL_CONTENT_TO_CONTENT_LIST_FAILED = 'ADD_DIGITAL_CONTENT_TO_CONTENT_LIST_FAILED'

export const REMOVE_DIGITAL_CONTENT_FROM_CONTENT_LIST = 'REMOVE_DIGITAL_CONTENT_FROM_CONTENT_LIST'
export const REMOVE_DIGITAL_CONTENT_FROM_CONTENT_LIST_FAILED =
  'REMOVE_DIGITAL_CONTENT_FROM_CONTENT_LIST_FAILED'

export const ORDER_CONTENT_LIST = 'ORDER_CONTENT_LIST'
export const ORDER_CONTENT_LIST_FAILED = 'ORDER_CONTENT_LIST_FAILED'

export const PUBLISH_CONTENT_LIST = 'PUBLISH_CONTENT_LIST'
export const PUBLISH_CONTENT_LIST_FAILED = 'PUBLISH_CONTENT_LIST_FAILED'

export const DELETE_CONTENT_LIST = 'DELETE_CONTENT_LIST'
export const DELETE_CONTENT_LIST_REQUESTED = 'DELETE_CONTENT_LIST_REQUESTED'
export const DELETE_CONTENT_LIST_SUCCEEDED = 'DELETE_CONTENT_LIST_SUCCEEDED'
export const DELETE_CONTENT_LIST_FAILED = 'DELETE_CONTENT_LIST_FAILED'

export const FETCH_COVER_ART = 'DIGITAL_CONTENTS/FETCH_COVER_ART'

/**
 * @param initDigitalContentId optional digital_content id to pull artwork from.
 */
export function createContentList(
  tempId: number | string,
  formFields: Record<string, unknown>,
  source: string,
  initDigitalContentId?: number | null
) {
  return { type: CREATE_CONTENT_LIST, tempId, formFields, source, initDigitalContentId }
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

export function editContentList(contentListId: number, formFields: Collection) {
  return { type: EDIT_CONTENT_LIST, contentListId, formFields }
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

export function addDigitalContentToContentList(
  digitalContentId: ID | null,
  contentListId: number | string
) {
  return { type: ADD_DIGITAL_CONTENT_TO_CONTENT_LIST, digitalContentId, contentListId }
}

export function addDigitalContentToContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: ADD_DIGITAL_CONTENT_TO_CONTENT_LIST_FAILED, error, params, metadata }
}

export function removeDigitalContentFromContentList(
  digitalContentId: number,
  contentListId: number,
  timestamp: number
) {
  return { type: REMOVE_DIGITAL_CONTENT_FROM_CONTENT_LIST, digitalContentId, contentListId, timestamp }
}

export function removeDigitalContentFromContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: REMOVE_DIGITAL_CONTENT_FROM_CONTENT_LIST_FAILED, error, params, metadata }
}

export function orderContentList(
  contentListId: number,
  digitalContentIdsAndTimes: { id: ID; time: number }[],
  digitalContentUids?: UID[]
) {
  return { type: ORDER_CONTENT_LIST, contentListId, digitalContentIdsAndTimes, digitalContentUids }
}

export function orderContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: ORDER_CONTENT_LIST_FAILED, error, params, metadata }
}

export function publishContentList(contentListId: ID) {
  return { type: PUBLISH_CONTENT_LIST, contentListId }
}

export function publishContentListFailed(
  error: Error,
  params: Record<string, unknown>,
  metadata: Record<string, unknown>
) {
  return { type: PUBLISH_CONTENT_LIST_FAILED, error, params, metadata }
}

export function deleteContentList(contentListId: ID) {
  return { type: DELETE_CONTENT_LIST, contentListId }
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

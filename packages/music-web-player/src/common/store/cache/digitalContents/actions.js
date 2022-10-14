export const EDIT_AGREEMENT = 'CACHE/AGREEMENTS/EDIT_AGREEMENT'
export const EDIT_AGREEMENT_SUCCEEDED = 'CACHE/AGREEMENTS/EDIT_AGREEMENT_SUCCEEDED'
export const EDIT_AGREEMENT_FAILED = 'CACHE/AGREEMENTS/EDIT_AGREEMENT_FAILED'

export const DELETE_DIGITAL_CONTENT = 'CACHE/AGREEMENTS/DELETE_DIGITAL_CONTENT'
export const DELETE_DIGITAL_CONTENT_SUCCEEDED = 'CACHE/AGREEMENTS/DELETE_DIGITAL_CONTENT_SUCCEEDED'
export const DELETE_DIGITAL_CONTENT_FAILED = 'CACHE/AGREEMENTS/DELETE_DIGITAL_CONTENT_FAILED'

export const FETCH_COVER_ART = 'CACHE/AGREEMENTS/FETCH_COVER_ART'

export const CHECK_IS_DOWNLOADABLE = 'CACHE/AGREEMENTS/CHECK_IS_DOWNLOADABLE'

export const SET_PERMALINK_STATUS = 'CACHE/AGREEMENTS/SET_PERMALINK_STATUS'

export function editDigitalContent(digitalContentId, formFields) {
  return { type: EDIT_AGREEMENT, digitalContentId, formFields }
}

export function editDigitalContentSucceeded() {
  return { type: EDIT_AGREEMENT_SUCCEEDED }
}

export function editDigitalContentFailed() {
  return { type: EDIT_AGREEMENT_FAILED }
}

export function deleteDigitalContent(digitalContentId) {
  return { type: DELETE_DIGITAL_CONTENT, digitalContentId }
}

export function deleteDigitalContentSucceeded(digitalContentId) {
  return { type: DELETE_DIGITAL_CONTENT_SUCCEEDED, digitalContentId }
}

export function deleteDigitalContentFailed() {
  return { type: DELETE_DIGITAL_CONTENT_FAILED }
}

export function fetchCoverArt(digitalContentId, size) {
  return { type: FETCH_COVER_ART, digitalContentId, size }
}

export const checkIsDownloadable = (digitalContentId) => ({
  type: CHECK_IS_DOWNLOADABLE,
  digitalContentId
})

export const setPermalinkStatus = (statuses) => ({
  type: SET_PERMALINK_STATUS,
  statuses
})

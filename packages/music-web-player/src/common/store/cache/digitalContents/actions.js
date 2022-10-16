export const EDIT_DIGITAL_CONTENT = 'CACHE/DIGITAL_CONTENTS/EDIT_DIGITAL_CONTENT'
export const EDIT_DIGITAL_CONTENT_SUCCEEDED = 'CACHE/DIGITAL_CONTENTS/EDIT_DIGITAL_CONTENT_SUCCEEDED'
export const EDIT_DIGITAL_CONTENT_FAILED = 'CACHE/DIGITAL_CONTENTS/EDIT_DIGITAL_CONTENT_FAILED'

export const DELETE_DIGITAL_CONTENT = 'CACHE/DIGITAL_CONTENTS/DELETE_DIGITAL_CONTENT'
export const DELETE_DIGITAL_CONTENT_SUCCEEDED = 'CACHE/DIGITAL_CONTENTS/DELETE_DIGITAL_CONTENT_SUCCEEDED'
export const DELETE_DIGITAL_CONTENT_FAILED = 'CACHE/DIGITAL_CONTENTS/DELETE_DIGITAL_CONTENT_FAILED'

export const FETCH_COVER_ART = 'CACHE/DIGITAL_CONTENTS/FETCH_COVER_ART'

export const CHECK_IS_DOWNLOADABLE = 'CACHE/DIGITAL_CONTENTS/CHECK_IS_DOWNLOADABLE'

export const SET_PERMALINK_STATUS = 'CACHE/DIGITAL_CONTENTS/SET_PERMALINK_STATUS'

export function editDigitalContent(digitalContentId, formFields) {
  return { type: EDIT_DIGITAL_CONTENT, digitalContentId, formFields }
}

export function editDigitalContentSucceeded() {
  return { type: EDIT_DIGITAL_CONTENT_SUCCEEDED }
}

export function editDigitalContentFailed() {
  return { type: EDIT_DIGITAL_CONTENT_FAILED }
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

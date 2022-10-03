export const EDIT_AGREEMENT = 'CACHE/AGREEMENTS/EDIT_AGREEMENT'
export const EDIT_AGREEMENT_SUCCEEDED = 'CACHE/AGREEMENTS/EDIT_AGREEMENT_SUCCEEDED'
export const EDIT_AGREEMENT_FAILED = 'CACHE/AGREEMENTS/EDIT_AGREEMENT_FAILED'

export const DELETE_AGREEMENT = 'CACHE/AGREEMENTS/DELETE_AGREEMENT'
export const DELETE_AGREEMENT_SUCCEEDED = 'CACHE/AGREEMENTS/DELETE_AGREEMENT_SUCCEEDED'
export const DELETE_AGREEMENT_FAILED = 'CACHE/AGREEMENTS/DELETE_AGREEMENT_FAILED'

export const FETCH_COVER_ART = 'CACHE/AGREEMENTS/FETCH_COVER_ART'

export const CHECK_IS_DOWNLOADABLE = 'CACHE/AGREEMENTS/CHECK_IS_DOWNLOADABLE'

export const SET_PERMALINK_STATUS = 'CACHE/AGREEMENTS/SET_PERMALINK_STATUS'

export function editAgreement(agreementId, formFields) {
  return { type: EDIT_AGREEMENT, agreementId, formFields }
}

export function editAgreementSucceeded() {
  return { type: EDIT_AGREEMENT_SUCCEEDED }
}

export function editAgreementFailed() {
  return { type: EDIT_AGREEMENT_FAILED }
}

export function deleteAgreement(agreementId) {
  return { type: DELETE_AGREEMENT, agreementId }
}

export function deleteAgreementSucceeded(agreementId) {
  return { type: DELETE_AGREEMENT_SUCCEEDED, agreementId }
}

export function deleteAgreementFailed() {
  return { type: DELETE_AGREEMENT_FAILED }
}

export function fetchCoverArt(agreementId, size) {
  return { type: FETCH_COVER_ART, agreementId, size }
}

export const checkIsDownloadable = (agreementId) => ({
  type: CHECK_IS_DOWNLOADABLE,
  agreementId
})

export const setPermalinkStatus = (statuses) => ({
  type: SET_PERMALINK_STATUS,
  statuses
})

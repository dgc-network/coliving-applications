import { ID } from '@coliving/common'
import { createSelector } from 'reselect'

import { CommonState } from 'common/store'

const getBase = (state: CommonState) => state.stemsUpload

export const selectCurrentUploads = createSelector(
  [
    (state: CommonState) => getBase(state).uploadsInProgress,
    (_: CommonState, agreementId: ID | undefined) => agreementId
  ],
  (uploadsInProgress, agreementId) => {
    if (!agreementId) return []
    const uploads = uploadsInProgress[agreementId]
    if (!uploads) return []
    return Object.values(uploads).flat()
  }
)

export const getCurrentUploads = (state: CommonState, parentAgreementId: ID) => {
  const uploads = getBase(state).uploadsInProgress[parentAgreementId]
  if (!uploads) return []
  return Object.values(uploads).flat()
}

import { ID } from '@coliving/common'
import { createSelector } from 'reselect'

import { CommonState } from 'common/store'

const getBase = (state: CommonState) => state.stemsUpload

export const selectCurrentUploads = createSelector(
  [
    (state: CommonState) => getBase(state).uploadsInProgress,
    (_: CommonState, digitalContentId: ID | undefined) => digitalContentId
  ],
  (uploadsInProgress, digitalContentId) => {
    if (!digitalContentId) return []
    const uploads = uploadsInProgress[digitalContentId]
    if (!uploads) return []
    return Object.values(uploads).flat()
  }
)

export const getCurrentUploads = (state: CommonState, parentDigitalContentId: ID) => {
  const uploads = getBase(state).uploadsInProgress[parentDigitalContentId]
  if (!uploads) return []
  return Object.values(uploads).flat()
}

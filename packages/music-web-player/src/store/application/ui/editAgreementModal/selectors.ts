import { StemDigitalContent } from '@coliving/common'

import { getDigitalContent, getDigitalContents } from 'common/store/cache/digital_contents/selectors'
import { AppState } from 'store/types'

export const getBaseState = (state: AppState) =>
  state.application.ui.editDigitalContentModal

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
export const getDigitalContentId = (state: AppState) => getBaseState(state).digitalContentId

export const getMetadata = (state: AppState) => {
  const digitalContentId = getDigitalContentId(state)
  return getDigitalContent(state, { id: digitalContentId })
}

export const getStems = (state: AppState) => {
  const digitalContentId = getDigitalContentId(state)
  if (!digitalContentId) return []

  const digital_content = getDigitalContent(state, { id: digitalContentId })
  if (!digital_content?._stems?.length) return []

  const stemIds = digital_content._stems.map((s) => s.digital_content_id)

  const stemsMap = getDigitalContents(state, { ids: stemIds }) as {
    [id: number]: StemDigitalContent
  }
  const stems = Object.values(stemsMap).filter(
    (t) => !t.is_delete && !t._marked_deleted
  )
  return stems
}

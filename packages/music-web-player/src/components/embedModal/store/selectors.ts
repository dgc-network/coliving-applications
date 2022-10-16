import { PlayableType } from '@coliving/common'

import { getCollection } from 'common/store/cache/collections/selectors'
import { getDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { AppState } from 'store/types'

export const getIsOpen = (state: AppState) =>
  state.application.ui.embedModal.isOpen
export const getId = (state: AppState) => state.application.ui.embedModal.id
export const getKind = (state: AppState) => state.application.ui.embedModal.kind

export const getMetadata = (state: AppState) => {
  const id = getId(state)
  const kind = getKind(state)
  switch (kind) {
    case PlayableType.DIGITAL_CONTENT:
      return getDigitalContent(state, { id })
    case PlayableType.ALBUM:
    case PlayableType.CONTENT_LIST:
      return getCollection(state, { id })
    default:
      // should never happen, but I guess ts doesn't like combined cases
      return null
  }
}

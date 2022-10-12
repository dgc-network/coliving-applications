import { getDigitalContent as getCachedDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { getUserFromDigitalContent } from 'common/store/cache/users/selectors'
import { AppState } from 'store/types'

const getBaseState = (state: AppState) =>
  state.application.ui.remixSettingsModal
const getDigitalContentId = (state: AppState) => getBaseState(state).digitalContentId

export const getStatus = (state: AppState) => getBaseState(state).status

export const getDigitalContent = (state: AppState) => {
  const id = getDigitalContentId(state)
  if (!id) return null
  return getCachedDigitalContent(state, { id })
}

export const getUser = (state: AppState) => {
  const id = getDigitalContentId(state)
  if (!id) return null
  return getUserFromDigitalContent(state, { id })
}

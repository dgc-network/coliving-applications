import { CommonState } from 'common/store'
import { getDigitalContent as getCachedDigitalContent } from 'common/store/cache/digital_contents/selectors'
import { getUserFromDigitalContent } from 'common/store/cache/users/selectors'

export const getBaseState = (state: CommonState) => state.pages.remixes

export const getLineup = (state: CommonState) => getBaseState(state).digitalContents

export const getDigitalContentId = (state: CommonState) =>
  getBaseState(state).page.digitalContentId

export const getCount = (state: CommonState) => getBaseState(state).page.count

export const getDigitalContent = (state: CommonState) => {
  const id = getDigitalContentId(state)
  return getCachedDigitalContent(state, { id })
}

export const getUser = (state: CommonState) => {
  const id = getDigitalContentId(state)
  return getUserFromDigitalContent(state, { id })
}

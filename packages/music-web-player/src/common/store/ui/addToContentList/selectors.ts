import { CommonState } from 'common/store'

const getBaseState = (state: CommonState) => state.ui.addToContentList

export const getDigitalContentId = (state: CommonState) => getBaseState(state).digitalContentId
export const getDigitalContentTitle = (state: CommonState) =>
  getBaseState(state).digitalContentTitle

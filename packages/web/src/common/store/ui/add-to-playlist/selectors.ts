import { CommonState } from 'common/store'

const getBaseState = (state: CommonState) => state.ui.addToPlaylist

export const getAgreementId = (state: CommonState) => getBaseState(state).agreementId
export const getAgreementTitle = (state: CommonState) =>
  getBaseState(state).agreementTitle

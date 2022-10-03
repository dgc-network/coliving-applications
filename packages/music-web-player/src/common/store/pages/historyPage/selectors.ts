import { CommonState } from 'common/store'

export const getHistory = (state: CommonState) => state.pages.historyPage
export const getHistoryAgreementsLineup = (state: CommonState) =>
  state.pages.historyPage.agreements

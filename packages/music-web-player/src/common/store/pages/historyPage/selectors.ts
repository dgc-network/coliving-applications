import { CommonState } from 'common/store'

export const getHistory = (state: CommonState) => state.pages.historyPage
export const getHistoryDigitalContentsLineup = (state: CommonState) =>
  state.pages.historyPage.digitalContents

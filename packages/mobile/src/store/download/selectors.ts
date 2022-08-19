import type { AppState } from 'app/store'

export const getDownloadedPercentage = (state: AppState) =>
  state.downloads.downloadedPercentage
export const getFileName = (state: AppState) => state.downloads.fileName
export const getFetchCancel = (state: AppState) => state.downloads.fetchCancel
export const getAgreementName = (state: AppState) => state.downloads.agreementName

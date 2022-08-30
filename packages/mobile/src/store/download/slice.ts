import type { Nullable } from '@coliving/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type DownloadState = typeof initialState

type State = {
  downloadedPercentage: number
  fetchCancel: Nullable<() => void>
  agreementName: Nullable<string>
  fileName: Nullable<string>
}

const initialState: State = {
  downloadedPercentage: 0,
  fetchCancel: null,
  agreementName: null,
  fileName: null
}

const slice = createSlice({
  name: 'downloadAgreement',
  initialState,
  reducers: {
    setDownloadedPercentage: (state, action: PayloadAction<number>) => {
      state.downloadedPercentage = action.payload
    },
    setFileInfo: (
      state,
      action: PayloadAction<{
        agreementName: string
        fileName: string
      }>
    ) => {
      state.agreementName = action.payload.agreementName
      state.fileName = action.payload.fileName
    },
    setFetchCancel: (state, action: PayloadAction<() => void>) => {
      state.fetchCancel = action.payload
    }
  }
})

export const { setDownloadedPercentage, setFileInfo, setFetchCancel } =
  slice.actions

export default slice.reducer

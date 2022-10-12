import type { Nullable } from '@coliving/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type DownloadState = typeof initialState

type State = {
  downloadedPercentage: number
  fetchCancel: Nullable<() => void>
  digitalContentName: Nullable<string>
  fileName: Nullable<string>
}

const initialState: State = {
  downloadedPercentage: 0,
  fetchCancel: null,
  digitalContentName: null,
  fileName: null
}

const slice = createSlice({
  name: 'downloadDigitalContent',
  initialState,
  reducers: {
    setDownloadedPercentage: (state, action: PayloadAction<number>) => {
      state.downloadedPercentage = action.payload
    },
    setFileInfo: (
      state,
      action: PayloadAction<{
        digitalContentName: string
        fileName: string
      }>
    ) => {
      state.digitalContentName = action.payload.digitalContentName
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

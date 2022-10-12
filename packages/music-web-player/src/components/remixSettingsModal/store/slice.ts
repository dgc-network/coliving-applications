import { ID, Status } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type State = {
  digitalContentId: ID | null
  status: Status
}

const initialState: State = {
  digitalContentId: null,
  status: Status.SUCCESS
}

const slice = createSlice({
  name: 'application/ui/remixSettingsModal',
  initialState,
  reducers: {
    fetchDigitalContent: (state, action: PayloadAction<{ url: string }>) => {
      state.status = Status.LOADING
    },
    fetchDigitalContentSucceeded: (state, action: PayloadAction<{ digitalContentId: ID }>) => {
      const { digitalContentId } = action.payload

      state.status = Status.SUCCESS
      state.digitalContentId = digitalContentId
    },
    fetchDigitalContentFailed: (state) => {
      state.status = Status.ERROR
    },
    reset: () => initialState
  }
})

export const { fetchDigitalContent, fetchDigitalContentSucceeded, fetchDigitalContentFailed, reset } =
  slice.actions

export default slice.reducer

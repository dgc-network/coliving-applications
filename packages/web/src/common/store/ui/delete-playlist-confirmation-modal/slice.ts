import { ID, Nullable } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type DeleteContentListConfirmationState = {
  contentListId: Nullable<ID>
}

export type OpenPayload = PayloadAction<{ contentListId: ID }>

const initialState: DeleteContentListConfirmationState = {
  contentListId: null
}

const slice = createSlice({
  name: 'applications/ui/deleteContentListConfirmation',
  initialState,
  reducers: {
    requestOpen: (state, action: OpenPayload) => {},
    open: (state, action: OpenPayload) => {
      state.contentListId = action.payload.contentListId
    }
  }
})

export const { open, requestOpen } = slice.actions

export default slice.reducer

import { ID, Nullable } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type DeleteContentListConfirmationState = {
  content listId: Nullable<ID>
}

export type OpenPayload = PayloadAction<{ content listId: ID }>

const initialState: DeleteContentListConfirmationState = {
  content listId: null
}

const slice = createSlice({
  name: 'applications/ui/deleteContentListConfirmation',
  initialState,
  reducers: {
    requestOpen: (state, action: OpenPayload) => {},
    open: (state, action: OpenPayload) => {
      state.content listId = action.payload.content listId
    }
  }
})

export const { open, requestOpen } = slice.actions

export default slice.reducer

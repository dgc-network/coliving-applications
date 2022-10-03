import { ID } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type EditContentListModalState = {
  isOpen: boolean
  collectionId: ID | null
}

const initialState: EditContentListModalState = {
  isOpen: false,
  collectionId: null
}

type OpenPayload = ID

const slice = createSlice({
  name: 'application/ui/editContentListModal',
  initialState,
  reducers: {
    open: (state, action: PayloadAction<OpenPayload>) => {
      state.isOpen = true
      state.collectionId = action.payload
    },
    close: (state) => {
      state.isOpen = false
      state.collectionId = null
    }
  }
})

export const { open, close } = slice.actions

export default slice.reducer

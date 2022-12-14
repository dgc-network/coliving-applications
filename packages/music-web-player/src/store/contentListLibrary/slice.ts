import { ContentListLibrary } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {}

export type UpdatePayload = {
  contentListLibrary: ContentListLibrary
}

const slice = createSlice({
  name: 'content-list-library',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<UpdatePayload>) => {}
  }
})

export const { update } = slice.actions

export default slice.reducer

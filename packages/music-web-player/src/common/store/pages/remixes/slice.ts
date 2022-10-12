import { ID } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import { asLineup } from 'common/store/lineup/reducer'

import { PREFIX as remixesDigitalContentsPrefix } from './lineup/actions'
import remixesDigitalContentsReducer from './lineup/reducer'

type State = {
  digitalContentId: ID | null
  count: number | null
}

const initialState: State = {
  digitalContentId: null,
  count: null
}

const slice = createSlice({
  name: 'application/pages/remixes',
  initialState,
  reducers: {
    reset: (state) => {
      state.digitalContentId = null
    },
    fetchDigitalContent: (
      state,
      action: PayloadAction<{ handle: string; slug: string }>
    ) => {},
    fetchDigitalContentSucceeded: (state, action: PayloadAction<{ digitalContentId: ID }>) => {
      const { digitalContentId } = action.payload
      state.digitalContentId = digitalContentId
    },
    setCount: (state, action: PayloadAction<{ count: number }>) => {
      const { count } = action.payload
      state.count = count
    }
  }
})

const remixesLineupReducer = asLineup(remixesDigitalContentsPrefix, remixesDigitalContentsReducer)

export const { reset, setCount, fetchDigitalContent, fetchDigitalContentSucceeded } =
  slice.actions

export default combineReducers({
  page: slice.reducer,
  digitalContents: remixesLineupReducer
})

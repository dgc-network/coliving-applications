import { combineReducers, createSlice } from '@reduxjs/toolkit'

import { asLineup } from 'common/store/lineup/reducer'

import { PREFIX } from './lineups/actions'
import content listsReducer from './lineups/reducer'

const initialState = {}

const slice = createSlice({
  name: 'application/pages/trendingContentLists',
  initialState,
  reducers: {}
})

const trendingContentListsLineupReducer = asLineup(PREFIX, content listsReducer)

export default combineReducers({
  page: slice.reducer,
  trending: trendingContentListsLineupReducer
})

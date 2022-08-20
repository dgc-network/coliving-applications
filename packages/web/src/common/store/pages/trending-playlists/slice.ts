import { combineReducers, createSlice } from '@reduxjs/toolkit'

import { asLineup } from 'common/store/lineup/reducer'

import { PREFIX } from './lineups/actions'
import contentListsReducer from './lineups/reducer'

const initialState = {}

const slice = createSlice({
  name: 'application/pages/trendingContentLists',
  initialState,
  reducers: {}
})

const trendingContentListsLineupReducer = asLineup(PREFIX, contentListsReducer)

export default combineReducers({
  page: slice.reducer,
  trending: trendingContentListsLineupReducer
})

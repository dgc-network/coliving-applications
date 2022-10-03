import { ID } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import { asLineup } from 'common/store/lineup/reducer'

import { PREFIX as remixesAgreementsPrefix } from './lineup/actions'
import remixesAgreementsReducer from './lineup/reducer'

type State = {
  agreementId: ID | null
  count: number | null
}

const initialState: State = {
  agreementId: null,
  count: null
}

const slice = createSlice({
  name: 'application/pages/remixes',
  initialState,
  reducers: {
    reset: (state) => {
      state.agreementId = null
    },
    fetchAgreement: (
      state,
      action: PayloadAction<{ handle: string; slug: string }>
    ) => {},
    fetchAgreementSucceeded: (state, action: PayloadAction<{ agreementId: ID }>) => {
      const { agreementId } = action.payload
      state.agreementId = agreementId
    },
    setCount: (state, action: PayloadAction<{ count: number }>) => {
      const { count } = action.payload
      state.count = count
    }
  }
})

const remixesLineupReducer = asLineup(remixesAgreementsPrefix, remixesAgreementsReducer)

export const { reset, setCount, fetchAgreement, fetchAgreementSucceeded } =
  slice.actions

export default combineReducers({
  page: slice.reducer,
  agreements: remixesLineupReducer
})

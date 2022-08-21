import { ID, Status } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type LandlordRecommendationsState = Record<
  ID,
  { relatedLandlordIds: ID[]; status: Status }
>

const initialState: LandlordRecommendationsState = {}

const slice = createSlice({
  name: 'landlord-recommendations',
  initialState,
  reducers: {
    fetchRelatedLandlords: (state, action: PayloadAction<{ userId: ID }>) => {
      state[action.payload.userId] = {
        ...state[action.payload.userId],
        status: Status.LOADING
      }
    },
    fetchRelatedLandlordsSucceeded: (
      state,
      action: PayloadAction<{ userId: ID; relatedLandlordIds: ID[] }>
    ) => {
      if (!state[action.payload.userId].relatedLandlordIds) {
        state[action.payload.userId] = {
          relatedLandlordIds: action.payload.relatedLandlordIds,
          status: Status.SUCCESS
        }
      }
    }
  }
})

export const { fetchRelatedLandlords, fetchRelatedLandlordsSucceeded } =
  slice.actions
export default slice.reducer

import { ID, Status } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type State = {
  agreementId: ID | null
  status: Status
}

const initialState: State = {
  agreementId: null,
  status: Status.SUCCESS
}

const slice = createSlice({
  name: 'application/ui/remixSettingsModal',
  initialState,
  reducers: {
    fetchAgreement: (state, action: PayloadAction<{ url: string }>) => {
      state.status = Status.LOADING
    },
    fetchAgreementSucceeded: (state, action: PayloadAction<{ agreementId: ID }>) => {
      const { agreementId } = action.payload

      state.status = Status.SUCCESS
      state.agreementId = agreementId
    },
    fetchAgreementFailed: (state) => {
      state.status = Status.ERROR
    },
    reset: () => initialState
  }
})

export const { fetchAgreement, fetchAgreementSucceeded, fetchAgreementFailed, reset } =
  slice.actions

export default slice.reducer

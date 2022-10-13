import { AppState } from 'store/types'

export const getSetAsLandlordPickConfirmation = (state: AppState) => {
  return state.application.ui.setAsLandlordPickConfirmation
}

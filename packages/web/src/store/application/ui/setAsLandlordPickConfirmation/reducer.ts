import * as pinAgreementActions from 'store/application/ui/setAsLandlordPickConfirmation/actions'
import { makeReducer } from 'utils/reducer'

import { SetAsLandlordPickConfirmationState } from './types'

const initialState: SetAsLandlordPickConfirmationState = {
  isVisible: false
}

const actionMap = {
  [pinAgreementActions.SHOW_SET_AS_LANDLORD_PICK_CONFIRMATION](
    state: SetAsLandlordPickConfirmationState,
    action: pinAgreementActions.ShowSetAsLandlordPickConfirmation
  ): SetAsLandlordPickConfirmationState {
    return {
      isVisible: true,
      agreementId: action.agreementId
    }
  },
  [pinAgreementActions.HIDE_SET_AS_LANDLORD_PICK_CONFIRMATION](
    state: SetAsLandlordPickConfirmationState,
    action: pinAgreementActions.CancelSetAsLandlordPick
  ): SetAsLandlordPickConfirmationState {
    return { isVisible: false }
  }
}

export default makeReducer(actionMap, initialState)

import * as pinDigitalContentActions from 'store/application/ui/setAsAuthorPickConfirmation/actions'
import { makeReducer } from 'utils/reducer'

import { SetAsLandlordPickConfirmationState } from './types'

const initialState: SetAsLandlordPickConfirmationState = {
  isVisible: false
}

const actionMap = {
  [pinDigitalContentActions.SHOW_SET_AS_LANDLORD_PICK_CONFIRMATION](
    state: SetAsLandlordPickConfirmationState,
    action: pinDigitalContentActions.ShowSetAsLandlordPickConfirmation
  ): SetAsLandlordPickConfirmationState {
    return {
      isVisible: true,
      digitalContentId: action.digitalContentId
    }
  },
  [pinDigitalContentActions.HIDE_SET_AS_LANDLORD_PICK_CONFIRMATION](
    state: SetAsLandlordPickConfirmationState,
    action: pinDigitalContentActions.CancelSetAsLandlordPick
  ): SetAsLandlordPickConfirmationState {
    return { isVisible: false }
  }
}

export default makeReducer(actionMap, initialState)

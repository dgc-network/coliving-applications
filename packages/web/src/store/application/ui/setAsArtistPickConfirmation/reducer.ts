import * as pinAgreementActions from 'store/application/ui/setAsArtistPickConfirmation/actions'
import { makeReducer } from 'utils/reducer'

import { SetAsArtistPickConfirmationState } from './types'

const initialState: SetAsArtistPickConfirmationState = {
  isVisible: false
}

const actionMap = {
  [pinAgreementActions.SHOW_SET_AS_ARTIST_PICK_CONFIRMATION](
    state: SetAsArtistPickConfirmationState,
    action: pinAgreementActions.ShowSetAsArtistPickConfirmation
  ): SetAsArtistPickConfirmationState {
    return {
      isVisible: true,
      agreementId: action.agreementId
    }
  },
  [pinAgreementActions.HIDE_SET_AS_ARTIST_PICK_CONFIRMATION](
    state: SetAsArtistPickConfirmationState,
    action: pinAgreementActions.CancelSetAsArtistPick
  ): SetAsArtistPickConfirmationState {
    return { isVisible: false }
  }
}

export default makeReducer(actionMap, initialState)

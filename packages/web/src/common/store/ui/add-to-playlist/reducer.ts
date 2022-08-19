import { ID } from '@coliving/common'
import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'

type AddToPlaylistActions = ActionType<typeof actions>

export type AddToPlaylistState = {
  agreementId: ID | null
  agreementTitle: string | null
}

const initialState = {
  isOpen: false,
  agreementId: null,
  agreementTitle: null
}

const reducer = createReducer<AddToPlaylistState, AddToPlaylistActions>(
  initialState,
  {
    [actions.OPEN](state, action) {
      return {
        ...state,
        agreementId: action.agreementId,
        agreementTitle: action.agreementTitle
      }
    },
    [actions.CLOSE](state, action) {
      return {
        ...state,
        agreementId: null,
        agreementTitle: null
      }
    }
  }
)

export default reducer

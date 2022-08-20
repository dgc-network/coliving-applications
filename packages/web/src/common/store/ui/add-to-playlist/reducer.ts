import { ID } from '@coliving/common'
import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'

type AddToContentListActions = ActionType<typeof actions>

export type AddToContentListState = {
  agreementId: ID | null
  agreementTitle: string | null
}

const initialState = {
  isOpen: false,
  agreementId: null,
  agreementTitle: null
}

const reducer = createReducer<AddToContentListState, AddToContentListActions>(
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

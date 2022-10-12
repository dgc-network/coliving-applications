import { ID } from '@coliving/common'
import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'

type AddToContentListActions = ActionType<typeof actions>

export type AddToContentListState = {
  digitalContentId: ID | null
  digitalContentTitle: string | null
}

const initialState = {
  isOpen: false,
  digitalContentId: null,
  digitalContentTitle: null
}

const reducer = createReducer<AddToContentListState, AddToContentListActions>(
  initialState,
  {
    [actions.OPEN](state, action) {
      return {
        ...state,
        digitalContentId: action.digitalContentId,
        digitalContentTitle: action.digitalContentTitle
      }
    },
    [actions.CLOSE](state, action) {
      return {
        ...state,
        digitalContentId: null,
        digitalContentTitle: null
      }
    }
  }
)

export default reducer

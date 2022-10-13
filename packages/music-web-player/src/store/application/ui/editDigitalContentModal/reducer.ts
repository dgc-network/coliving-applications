import { ActionsMap } from 'utils/reducer'

import { OPEN, CLOSE, EditDigitalContentModalActions } from './actions'
import EditDigitalContentModalState from './types'

const initialState = {
  isOpen: false,
  digitalContentId: null
}

const actionsMap: ActionsMap<EditDigitalContentModalState> = {
  [OPEN](state, action) {
    return {
      ...state,
      isOpen: true,
      digitalContentId: action.digitalContentId
    }
  },
  [CLOSE](state, action) {
    return {
      ...state,
      isOpen: false,
      digitalContentId: null
    }
  }
}

export default function search(
  state = initialState,
  action: EditDigitalContentModalActions
) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

import { ActionsMap } from 'utils/reducer'

import { OPEN, CLOSE, EditAgreementModalActions } from './actions'
import EditAgreementModalState from './types'

const initialState = {
  isOpen: false,
  agreementId: null
}

const actionsMap: ActionsMap<EditAgreementModalState> = {
  [OPEN](state, action) {
    return {
      ...state,
      isOpen: true,
      agreementId: action.agreementId
    }
  },
  [CLOSE](state, action) {
    return {
      ...state,
      isOpen: false,
      agreementId: null
    }
  }
}

export default function search(
  state = initialState,
  action: EditAgreementModalActions
) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

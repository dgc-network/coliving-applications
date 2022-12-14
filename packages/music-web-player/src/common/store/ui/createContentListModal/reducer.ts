import { ID } from '@coliving/common'

import { OPEN, CLOSE } from './actions'
import { CreateContentListModalState } from './types'

const initialState = {
  isOpen: false,
  collectionId: null,
  hideFolderTab: false
}

const actionsMap = {
  [OPEN](
    state: CreateContentListModalState,
    action: { collectionId: ID; hideFolderTab: boolean }
  ) {
    return {
      ...state,
      isOpen: true,
      collectionId: action.collectionId,
      hideFolderTab: action.hideFolderTab
    }
  },
  [CLOSE](state: CreateContentListModalState) {
    return {
      ...state,
      isOpen: false,
      collectionId: null,
      hideFolderTab: false
    }
  }
}

const reducer = (
  state = initialState,
  action: { type: keyof typeof actionsMap }
) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action as any)
}

export default reducer

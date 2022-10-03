import { RESET_SUCCEEDED, stripPrefix } from 'common/store/lineup/actions'
import { initialLineupState } from 'common/store/lineup/reducer'
import { PREFIX } from 'common/store/pages/profile/lineups/agreements/actions'

const initialState = {
  ...initialLineupState,
  prefix: PREFIX,
  containsDeleted: false
}

const actionsMap = {
  [RESET_SUCCEEDED](state, action) {
    const newState = initialState
    return newState
  }
}

const agreements = (state = initialState, action) => {
  const baseActionType = stripPrefix(PREFIX, action.type)
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default agreements

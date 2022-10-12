import { asLineup } from 'common/store/lineup/reducer'

import { PREFIX as digitalContentsPrefix } from './lineups/digital_contents/actions'
import digitalContentsReducer from './lineups/digital_contents/reducer'

const initialState = {}

const actionsMap = {}

const digitalContentsLineupReducer = asLineup(digitalContentsPrefix, digitalContentsReducer)

const reducer = (state = initialState, action) => {
  const digitalContents = digitalContentsLineupReducer(state.digitalContents, action)
  if (digitalContents !== state.digitalContents) return { ...state, digitalContents }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer

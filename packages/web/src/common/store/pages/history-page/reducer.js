import { asLineup } from 'common/store/lineup/reducer'

import { PREFIX as agreementsPrefix } from './lineups/agreements/actions'
import agreementsReducer from './lineups/agreements/reducer'

const initialState = {}

const actionsMap = {}

const agreementsLineupReducer = asLineup(agreementsPrefix, agreementsReducer)

const reducer = (state = initialState, action) => {
  const agreements = agreementsLineupReducer(state.agreements, action)
  if (agreements !== state.agreements) return { ...state, agreements }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer

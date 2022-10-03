import { asLineup } from 'common/store/lineup/reducer'
import {
  FETCH_SAVES_SUCCEEDED,
  FETCH_SAVES_FAILED,
  ADD_LOCAL_SAVE,
  REMOVE_LOCAL_SAVE
} from 'common/store/pages/savedPage/actions'
import agreementsReducer from 'common/store/pages/savedPage/lineups/agreements/reducer'

import { PREFIX as agreementsPrefix } from './lineups/agreements/actions'

const initialState = {
  // id => uid
  localSaves: {},
  saves: []
}

const actionsMap = {
  [FETCH_SAVES_SUCCEEDED](state, action) {
    return {
      ...state,
      saves: action.saves
    }
  },
  [FETCH_SAVES_FAILED](state, action) {
    return {
      ...state,
      saves: []
    }
  },
  [ADD_LOCAL_SAVE](state, action) {
    return {
      ...state,
      localSaves: {
        ...state.localSaves,
        [action.agreementId]: action.uid
      }
    }
  },
  [REMOVE_LOCAL_SAVE](state, action) {
    const newState = { ...state }
    delete newState.localSaves[action.agreementId]
    newState.saves = newState.saves.filter(
      ({ save_item_id: id }) => id !== action.agreementId
    )
    return newState
  }
}

const agreementsLineupReducer = asLineup(agreementsPrefix, agreementsReducer)

const reducer = (state = initialState, action) => {
  const agreements = agreementsLineupReducer(state.agreements, action)
  if (agreements !== state.agreements) return { ...state, agreements }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer

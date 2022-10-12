import { asLineup } from 'common/store/lineup/reducer'
import {
  FETCH_SAVES_SUCCEEDED,
  FETCH_SAVES_FAILED,
  ADD_LOCAL_SAVE,
  REMOVE_LOCAL_SAVE
} from 'common/store/pages/savedPage/actions'
import digitalContentsReducer from 'common/store/pages/savedPage/lineups/digital_contents/reducer'

import { PREFIX as digitalContentsPrefix } from './lineups/digital_contents/actions'

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
        [action.digitalContentId]: action.uid
      }
    }
  },
  [REMOVE_LOCAL_SAVE](state, action) {
    const newState = { ...state }
    delete newState.localSaves[action.digitalContentId]
    newState.saves = newState.saves.filter(
      ({ save_item_id: id }) => id !== action.digitalContentId
    )
    return newState
  }
}

const digitalContentsLineupReducer = asLineup(digitalContentsPrefix, digitalContentsReducer)

const reducer = (state = initialState, action) => {
  const digitalContents = digitalContentsLineupReducer(state.digitalContents, action)
  if (digitalContents !== state.digitalContents) return { ...state, digitalContents }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer

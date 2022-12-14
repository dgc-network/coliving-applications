import { asLineup } from 'common/store/lineup/reducer'
import digitalContentsReducer from 'common/store/pages/digital_content/lineup/reducer'

import {
  SET_DIGITAL_CONTENT_ID,
  SET_DIGITAL_CONTENT_PERMALINK,
  RESET,
  SET_DIGITAL_CONTENT_RANK,
  SET_DIGITAL_CONTENT_TRENDING_RANKS
} from './actions'
import { PREFIX as digitalContentsPrefix } from './lineup/actions'

const initialState = {
  digitalContentId: null,
  rank: {
    week: null,
    month: null,
    year: null
  },
  trendingDigitalContentRanks: {
    week: null,
    month: null,
    year: null
  }
}

const actionsMap = {
  [SET_DIGITAL_CONTENT_ID](state, action) {
    return {
      ...state,
      digitalContentId: action.digitalContentId
    }
  },
  [SET_DIGITAL_CONTENT_PERMALINK](state, action) {
    return {
      ...state,
      digitalContentPermalink: action.permalink
    }
  },
  [SET_DIGITAL_CONTENT_RANK](state, action) {
    return {
      ...state,
      rank: {
        ...state.rank,
        [action.duration]: action.rank
      }
    }
  },
  [SET_DIGITAL_CONTENT_TRENDING_RANKS](state, action) {
    return {
      ...state,
      trendingDigitalContentRanks: {
        ...state.trendingDigitalContentRanks,
        ...action.trendingDigitalContentRanks
      }
    }
  },
  [RESET](state, action) {
    return {
      ...state,
      ...initialState
    }
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

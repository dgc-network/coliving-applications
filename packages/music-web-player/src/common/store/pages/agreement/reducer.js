import { asLineup } from 'common/store/lineup/reducer'
import agreementsReducer from 'common/store/pages/digital_content/lineup/reducer'

import {
  SET_AGREEMENT_ID,
  SET_AGREEMENT_PERMALINK,
  RESET,
  SET_AGREEMENT_RANK,
  SET_AGREEMENT_TRENDING_RANKS
} from './actions'
import { PREFIX as agreementsPrefix } from './lineup/actions'

const initialState = {
  agreementId: null,
  rank: {
    week: null,
    month: null,
    year: null
  },
  trendingAgreementRanks: {
    week: null,
    month: null,
    year: null
  }
}

const actionsMap = {
  [SET_AGREEMENT_ID](state, action) {
    return {
      ...state,
      agreementId: action.agreementId
    }
  },
  [SET_AGREEMENT_PERMALINK](state, action) {
    return {
      ...state,
      agreementPermalink: action.permalink
    }
  },
  [SET_AGREEMENT_RANK](state, action) {
    return {
      ...state,
      rank: {
        ...state.rank,
        [action.duration]: action.rank
      }
    }
  },
  [SET_AGREEMENT_TRENDING_RANKS](state, action) {
    return {
      ...state,
      trendingAgreementRanks: {
        ...state.trendingAgreementRanks,
        ...action.trendingAgreementRanks
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

const agreementsLineupReducer = asLineup(agreementsPrefix, agreementsReducer)

const reducer = (state = initialState, action) => {
  const agreements = agreementsLineupReducer(state.agreements, action)
  if (agreements !== state.agreements) return { ...state, agreements }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer

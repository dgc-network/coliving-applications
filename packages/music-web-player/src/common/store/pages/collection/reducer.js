import { Status } from '@coliving/common'

import { asLineup } from 'common/store/lineup/reducer'
import agreementsReducer from 'common/store/pages/collection/lineup/reducer'

import {
  FETCH_COLLECTION,
  FETCH_COLLECTION_SUCCEEDED,
  FETCH_COLLECTION_FAILED,
  RESET_COLLECTION,
  SET_SMART_COLLECTION
} from './actions'
import { PREFIX as agreementsPrefix } from './lineup/actions'

export const initialState = {
  collectionId: null,
  collectionUid: null,
  userUid: null,
  status: null,
  smartCollectionVariant: null
}

const actionsMap = {
  [FETCH_COLLECTION](state, action) {
    return {
      ...state,
      status: Status.LOADING,
      smartCollectionVariant: null
    }
  },
  [FETCH_COLLECTION_SUCCEEDED](state, action) {
    return {
      ...state,
      collectionId: action.collectionId,
      collectionUid: action.collectionUid,
      userUid: action.userUid,
      status: Status.SUCCESS
    }
  },
  [FETCH_COLLECTION_FAILED](state, action) {
    return {
      ...state,
      userUid: action.userUid,
      status: Status.ERROR
    }
  },
  [RESET_COLLECTION](state, action) {
    return {
      ...state,
      ...initialState
    }
  },
  [SET_SMART_COLLECTION](state, action) {
    return {
      ...state,
      smartCollectionVariant: action.smartCollectionVariant
    }
  }
}

const agreementsLineupReducer = asLineup(agreementsPrefix, agreementsReducer)

const reducer = (state = initialState, action) => {
  const updatedAgreements = agreementsLineupReducer(state.agreements, action)
  if (updatedAgreements !== state.agreements) return { ...state, agreements: updatedAgreements }
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer

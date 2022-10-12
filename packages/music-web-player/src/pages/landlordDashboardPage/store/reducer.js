import { Status } from '@coliving/common'

import {
  FETCH_DASHBOARD,
  FETCH_DASHBOARD_SUCCEEDED,
  FETCH_DASHBOARD_FAILED,
  FETCH_DASHBOARD_LISTEN_DATA_SUCCEEDED,
  FETCH_DASHBOARD_LISTEN_DATA_FAILED
} from './actions'

const initialState = {
  status: Status.LOADING,
  digitalContents: [],
  unlistedDigitalContents: [],
  collections: [],
  listenData: {}
}

const actionsMap = {
  [FETCH_DASHBOARD](state, action) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [FETCH_DASHBOARD_SUCCEEDED](state, action) {
    return {
      ...state,
      digitalContents: action.digitalContents,
      collections: action.collections,
      unlistedDigitalContents: action.unlistedDigitalContents,
      status: Status.SUCCESS
    }
  },
  [FETCH_DASHBOARD_FAILED](state, action) {
    return {
      ...state,
      status: Status.ERROR
    }
  },
  [FETCH_DASHBOARD_LISTEN_DATA_SUCCEEDED](state, action) {
    return {
      ...state,
      listenData: action.listenData
    }
  },
  [FETCH_DASHBOARD_LISTEN_DATA_FAILED](state, action) {
    return {
      ...state,
      listenData: {}
    }
  }
}

export default function dashboard(state = initialState, action) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

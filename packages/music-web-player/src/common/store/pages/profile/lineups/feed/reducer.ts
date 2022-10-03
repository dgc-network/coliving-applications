import { LineupState, Agreement } from '@coliving/common'

import { RESET_SUCCEEDED, stripPrefix } from 'common/store/lineup/actions'
import { initialLineupState } from 'common/store/lineup/reducer'
import { PREFIX } from 'common/store/pages/profile/lineups/feed/actions'

const initialState: LineupState<Agreement> = {
  ...initialLineupState,
  prefix: PREFIX,
  containsDeleted: false
}

type ResetSucceededAction = {
  type: typeof RESET_SUCCEEDED
}

const actionsMap = {
  [RESET_SUCCEEDED](state: LineupState<Agreement>, action: ResetSucceededAction) {
    const newState = initialState
    return newState
  }
}

const feed = (state = initialState, action: ResetSucceededAction) => {
  const baseActionType = stripPrefix(
    PREFIX,
    action.type
  ) as typeof RESET_SUCCEEDED
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default feed

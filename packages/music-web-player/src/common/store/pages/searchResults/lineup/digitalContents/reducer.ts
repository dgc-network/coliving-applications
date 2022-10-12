import { LineupState, DigitalContent } from '@coliving/common'

import { RESET_SUCCEEDED, stripPrefix } from 'common/store/lineup/actions'
import { initialLineupState } from 'common/store/lineup/reducer'
import { PREFIX } from 'common/store/pages/searchResults/lineup/digital_contents/actions'

const initialState: LineupState<DigitalContent> = {
  ...initialLineupState,
  prefix: PREFIX,
  containsDeleted: false
}

type ResetSucceededAction = {
  type: typeof RESET_SUCCEEDED
}

const actionsMap = {
  [RESET_SUCCEEDED](state: LineupState<DigitalContent>, action: ResetSucceededAction) {
    const newState = initialState
    return newState
  }
}

const digitalContents = (state = initialState, action: ResetSucceededAction) => {
  const baseActionType = stripPrefix(
    PREFIX,
    action.type
  ) as typeof RESET_SUCCEEDED
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default digitalContents

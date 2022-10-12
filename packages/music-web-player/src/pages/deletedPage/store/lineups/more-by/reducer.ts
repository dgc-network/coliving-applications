import { LineupState, DigitalContent } from '@coliving/common'

import { RESET_SUCCEEDED, stripPrefix } from 'common/store/lineup/actions'
import { initialLineupState } from 'common/store/lineup/reducer'
import { PREFIX } from 'pages/deletedPage/store/lineups/more-by/actions'

export const initialState: LineupState<DigitalContent> = {
  ...initialLineupState,
  prefix: PREFIX
}

const actionsMap: { [key in string]: any } = {
  [RESET_SUCCEEDED](state: typeof initialState) {
    const newState = initialState
    return newState
  }
}

const moreBy = (state = initialState, action: { type: string }) => {
  const baseActionType = stripPrefix(PREFIX, action.type)
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default moreBy

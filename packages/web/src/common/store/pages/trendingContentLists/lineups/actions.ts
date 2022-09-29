import { LineupActions } from 'common/store/lineup/actions'

export const PREFIX = 'TRENDING_CONTENT_LISTS'

class TrendingContentListLineupActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const trendingContentListLineupActions = new TrendingContentListLineupActions()

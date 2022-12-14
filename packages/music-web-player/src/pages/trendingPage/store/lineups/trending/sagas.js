import { TimeRange } from '@coliving/common'
import { select } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import {
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_ALL_TIME_PREFIX,
  trendingWeekActions,
  trendingMonthActions,
  trendingAllTimeActions
} from 'common/store/pages/trending/lineup/actions'
import { getTrendingGenre } from 'common/store/pages/trending/selectors'
import { retrieveTrending } from 'pages/digital-content-page/store/retrieveTrending'
import { LineupSagas } from 'store/lineup/sagas'

function getDigitalContents(timeRange) {
  return function* ({ offset, limit }) {
    const genreAtStart = yield select(getTrendingGenre)
    const userId = yield select(getUserId)
    try {
      const digitalContents = yield retrieveTrending({
        timeRange,
        limit,
        offset,
        genre: genreAtStart,
        currentUserId: userId
      })
      return digitalContents
    } catch (e) {
      console.error(`Trending error: ${e.message}`)
      return []
    }
  }
}

class TrendingWeekSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_WEEK_PREFIX,
      trendingWeekActions,
      (store) => store.pages.trending.trendingWeek,
      getDigitalContents(TimeRange.WEEK)
    )
  }
}

class TrendingMonthSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_MONTH_PREFIX,
      trendingMonthActions,
      (store) => store.pages.trending.trendingMonth,
      getDigitalContents(TimeRange.MONTH)
    )
  }
}

class TrendingAllTimeSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_ALL_TIME_PREFIX,
      trendingAllTimeActions,
      (store) => store.pages.trending.trendingAllTime,
      getDigitalContents(TimeRange.ALL_TIME)
    )
  }
}

export default function sagas() {
  return [
    ...new TrendingWeekSagas().getSagas(),
    ...new TrendingMonthSagas().getSagas(),
    ...new TrendingAllTimeSagas().getSagas()
  ]
}

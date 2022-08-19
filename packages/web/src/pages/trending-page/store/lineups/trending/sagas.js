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
import { retrieveTrending } from 'pages/agreement-page/store/retrieveTrending'
import { LineupSagas } from 'store/lineup/sagas'

function getAgreements(timeRange) {
  return function* ({ offset, limit }) {
    const genreAtStart = yield select(getTrendingGenre)
    const userId = yield select(getUserId)
    try {
      const agreements = yield retrieveTrending({
        timeRange,
        limit,
        offset,
        genre: genreAtStart,
        currentUserId: userId
      })
      return agreements
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
      getAgreements(TimeRange.WEEK)
    )
  }
}

class TrendingMonthSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_MONTH_PREFIX,
      trendingMonthActions,
      (store) => store.pages.trending.trendingMonth,
      getAgreements(TimeRange.MONTH)
    )
  }
}

class TrendingAllTimeSagas extends LineupSagas {
  constructor() {
    super(
      TRENDING_ALL_TIME_PREFIX,
      trendingAllTimeActions,
      (store) => store.pages.trending.trendingAllTime,
      getAgreements(TimeRange.ALL_TIME)
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

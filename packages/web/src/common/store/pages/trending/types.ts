import { ID, LineupState, TimeRange } from '@coliving/common'

export type TrendingPageState = {
  trendingWeek: LineupState<{ id: ID }>
  trendingMonth: LineupState<{ id: ID }>
  trendingAllTime: LineupState<{ id: ID }>
  trendingTimeRange: TimeRange
  trendingGenre: string | null
  lastFetchedTrendingGenre: string | null
}

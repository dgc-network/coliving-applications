import { ID, Lineup, TimeRange, DigitalContent, UID, User } from '@coliving/common'

type ExtraTrendingLineupProps = {}

export interface TrendingPageContentProps {
  trendingTitle: string
  trendingDescription: string
  trending: Lineup<any>
  trendingWeek: Lineup<any, ExtraTrendingLineupProps>
  trendingMonth: Lineup<any, ExtraTrendingLineupProps>
  trendingAllTime: Lineup<any, ExtraTrendingLineupProps>

  fetchSuggestedFollowUsers: () => void
  followUsers: (userIDs: ID[]) => void
  suggestedFollows: User[]
  playTrendingAgreement: (uid: UID) => void
  pauseTrendingAgreement: () => void
  refreshTrendingInView: (overwrite: boolean) => void
  hasAccount: boolean
  goToTrending: () => void
  goToSignUp: () => void
  goToGenreSelection: () => void
  setTrendingInView: (inView: boolean) => void
  switchView: () => void
  getLineupProps: (lineup: Lineup<any>) => {
    lineup: Lineup<any>
    playingUid: UID
    playingSource: string
    playingAgreementId: ID | null
    playing: boolean
    buffering: boolean
    scrollParent: HTMLElement | null
    selfLoad: boolean
  }
  resetTrendingLineup: () => void

  trendingGenre: string | null
  trendingTimeRange: TimeRange
  lastFetchedTrendingGenre: string | null
  setTrendingGenre: (genre: string | null) => void
  setTrendingTimeRange: (timeRange: TimeRange) => void

  makeLoadMore: (
    timeRange: TimeRange
  ) => (offset: number, limit: number, overwrite: boolean) => void
  makePlayAgreement: (timeRange: TimeRange) => (uid: string) => void
  makePauseAgreement: (timeRange: TimeRange) => () => void
  makeSetInView: (timeRange: TimeRange) => (inView: boolean) => void
  makeRefreshTrendingInView: (
    timeRange: TimeRange
  ) => (overwrite: boolean) => void
  makeResetTrending: (timeRange: TimeRange) => () => void

  getLineupForRange: (timeRange: TimeRange) => {
    playingUid: UID
    lineup: Lineup<DigitalContent>
    playingSource: any
    playingAgreementId: ID | null
    playing: boolean
    buffering: boolean
    scrollParent: HTMLElement | null
    selfLoad: boolean
  }
  scrollToTop: (timeRange: TimeRange) => void
}

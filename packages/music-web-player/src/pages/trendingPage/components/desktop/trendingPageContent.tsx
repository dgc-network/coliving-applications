import { useCallback, useRef, useState } from 'react'

import { Name, Status, TimeRange } from '@coliving/common'

import {
  trendingAllTimeActions,
  trendingMonthActions,
  trendingWeekActions
} from 'common/store/pages/trending/lineup/actions'
import { ELECTRONIC_PREFIX, TRENDING_GENRES } from 'common/utils/genres'
import Header from 'components/header/desktop/header'
import EndOfLineup from 'components/lineup/endOfLineup'
import Lineup from 'components/lineup/lineup'
import { LineupVariant } from 'components/lineup/types'
import Page from 'components/page/page'
import useTabs from 'hooks/useTabs/useTabs'
import { TrendingPageContentProps } from 'pages/trendingPage/types'
import { make, useRecord } from 'store/analytics/actions'

import RewardsBanner from '../rewardsBanner'

import GenreSelectionModal from './genreSelectionModal'
import TrendingGenreFilters from './trendingGenreFilters'
import styles from './trendingPageContent.module.css'

const messages = {
  thisWeek: 'THIS WEEK',
  thisMonth: 'THIS MONTH',
  allTime: 'ALL TIME',
  allGenres: 'All Genres',
  endOfLineupDescription: "Looks like you've reached the end of this list...",
  disabledTabTooltip: 'Nothing available'
}

const initialGenres = [
  messages.allGenres,
  'Electronic',
  'Hip-Hop/Rap',
  'Alternative'
]

const RANK_ICON_COUNT = 5

// Creates a unique cache key for a time range & genre combination
const getTimeGenreCacheKey = (timeRange: TimeRange, genre: string | null) => {
  const newGenre = genre || 'all'
  return `${timeRange}-${newGenre}`
}

// For a given timeRange with no digitalContents,
// what other time ranges do we need to disable?
const getRangesToDisable = (timeRange: TimeRange) => {
  switch (timeRange) {
    case TimeRange.ALL_TIME:
    case TimeRange.MONTH:
      // In the case of TimeRangeALL_TIME,
      // we don't want to return ALL_TIME because
      // we don't want to disable ALL_TIME (it's the only possible tab left, even if it's empty).
      return [TimeRange.MONTH, TimeRange.WEEK]
    case TimeRange.WEEK:
      return [TimeRange.WEEK]
  }
}

const TrendingPageContent = (props: TrendingPageContentProps) => {
  const {
    trendingTitle,
    trendingDescription,
    trendingWeek,
    trendingMonth,
    trendingAllTime,
    getLineupProps,
    trendingGenre,
    setTrendingGenre,
    setTrendingTimeRange,
    trendingTimeRange,
    lastFetchedTrendingGenre,
    makeLoadMore,
    makePlayDigitalContent,
    makePauseDigitalContent,
    makeSetInView,
    makeResetTrending,
    getLineupForRange,
    scrollToTop
  } = props

  const weekProps = getLineupProps(trendingWeek)
  const monthProps = getLineupProps(trendingMonth)
  const allTimeProps = getLineupProps(trendingAllTime)

  // Maintain a set of combinations of time range & genre that
  // have no digitalContents.
  const emptyTimeGenreSet = useRef(new Set())

  const getLimit = useCallback(
    (timeRange: TimeRange) => {
      return getLineupForRange(timeRange).lineup.total
    },
    [getLineupForRange]
  )

  const reloadAndSwitchTabs = (timeRange: TimeRange) => {
    makeResetTrending(timeRange)()
    setTrendingTimeRange(timeRange)
    scrollToTop(timeRange)
    const offset = 0
    makeLoadMore(timeRange)(offset, getLimit(timeRange), true)
  }

  // Called when we have an empty state
  const moveToNextTab = () => {
    switch (trendingTimeRange) {
      case TimeRange.WEEK: {
        // If week is empty, month might also be empty (because we accessed it previously.)
        // If month is also empty, jump straight to all time.
        const monthAlsoEmpty = emptyTimeGenreSet.current.has(
          getTimeGenreCacheKey(TimeRange.MONTH, trendingGenre!)
        )
        const newTimeRange = monthAlsoEmpty
          ? TimeRange.ALL_TIME
          : TimeRange.MONTH
        reloadAndSwitchTabs(newTimeRange)
        break
      }
      case TimeRange.MONTH:
        reloadAndSwitchTabs(TimeRange.ALL_TIME)
        break
      case TimeRange.ALL_TIME:
      default:
      // Nothing to do for all time
    }
  }

  const setGenreAndRefresh = useCallback(
    (genre: string | null) => {
      const trimmedGenre =
        genre !== null ? genre.replace(ELECTRONIC_PREFIX, '') : genre
      setTrendingGenre(trimmedGenre)

      // Call reset to change everything everything to skeleton tiles
      makeResetTrending(TimeRange.WEEK)()
      makeResetTrending(TimeRange.MONTH)()
      makeResetTrending(TimeRange.ALL_TIME)()

      scrollToTop(trendingTimeRange)

      const limit = getLimit(trendingTimeRange)
      const offset = 0
      makeLoadMore(trendingTimeRange)(offset, limit, true)
    },
    [
      setTrendingGenre,
      makeLoadMore,
      trendingTimeRange,
      scrollToTop,
      makeResetTrending,
      getLimit
    ]
  )

  const cacheKey = getTimeGenreCacheKey(trendingTimeRange, trendingGenre)
  const currentLineup = getLineupForRange(trendingTimeRange)

  // We switch genres slightly before we fetch new lineup metadata, so if we're on a dead page
  // (e.g. some obscure genre with no All Time digitalContents), and then switch to a more popular genre
  // we will briefly be in a state with the New Genre set, but lineup status === Success and an empty
  // entries list. This would errantly cause us to think the lineup was empty and insert it into the cache.
  const unfetchedLineup = trendingGenre !== lastFetchedTrendingGenre

  // Should move to next tab if:
  //  - We've already seen this tab is empty AND we're not in the loading state
  //  OR
  //  - The current lineup was the last lineup fetched
  //    AND
  //  - The current lineup has finished fetching
  //    AND
  //  - The current lineup has no trending order (to ensure we're not in the middle of resetting/refretching)
  //    AND
  //  - We're not in the all genres (genre = null) state
  const shouldMoveToNextTab =
    (emptyTimeGenreSet.current.has(cacheKey) &&
      currentLineup.lineup.status !== Status.LOADING) ||
    (!unfetchedLineup &&
      currentLineup.lineup.status === Status.SUCCESS &&
      !currentLineup.lineup.entries.length &&
      trendingGenre !== null)

  if (shouldMoveToNextTab) {
    getRangesToDisable(trendingTimeRange)
      .map((r) => getTimeGenreCacheKey(r, trendingGenre))
      .forEach((k) => {
        emptyTimeGenreSet.current.add(k)
      })

    moveToNextTab()
  }

  const mainLineupProps = {
    variant: LineupVariant.MAIN
  }

  const trendingLineups = [
    <div key='weekly-trending-digital-contents' className={styles.lineupContainer}>
      {trendingGenre === null ? (
        <div className={styles.bannerContainer}>
          <RewardsBanner bannerType='digitalContents' />
        </div>
      ) : null}
      <Lineup
        aria-label='weekly trending digitalContents'
        ordered
        rankIconCount={trendingGenre === null ? RANK_ICON_COUNT : undefined}
        {...weekProps}
        setInView={makeSetInView(TimeRange.WEEK)}
        loadMore={makeLoadMore(TimeRange.WEEK)}
        playDigitalContent={makePlayDigitalContent(TimeRange.WEEK)}
        pauseDigitalContent={makePauseDigitalContent(TimeRange.WEEK)}
        actions={trendingWeekActions}
        endOfLineup={
          <EndOfLineup
            key='endOfLineup'
            description={messages.endOfLineupDescription}
          />
        }
        {...mainLineupProps}
      />
    </div>,
    <div key='monthly-trending-digital-contents' className={styles.lineupContainer}>
      <Lineup
        aria-label='monthly trending digitalContents'
        ordered
        {...monthProps}
        setInView={makeSetInView(TimeRange.MONTH)}
        loadMore={makeLoadMore(TimeRange.MONTH)}
        playDigitalContent={makePlayDigitalContent(TimeRange.MONTH)}
        pauseDigitalContent={makePauseDigitalContent(TimeRange.MONTH)}
        endOfLineup={
          <EndOfLineup
            key='endOfLineup'
            description={messages.endOfLineupDescription}
          />
        }
        actions={trendingMonthActions}
        {...mainLineupProps}
      />
    </div>,
    <div key='all-time-trending-digital-contents' className={styles.lineupContainer}>
      <Lineup
        aria-label='all-time trending digitalContents'
        ordered
        {...allTimeProps}
        setInView={makeSetInView(TimeRange.ALL_TIME)}
        loadMore={makeLoadMore(TimeRange.ALL_TIME)}
        playDigitalContent={makePlayDigitalContent(TimeRange.ALL_TIME)}
        pauseDigitalContent={makePauseDigitalContent(TimeRange.ALL_TIME)}
        actions={trendingAllTimeActions}
        endOfLineup={
          <EndOfLineup
            key='endOfLineup'
            description={messages.endOfLineupDescription}
          />
        }
        {...mainLineupProps}
      />
    </div>
  ]
  const record = useRecord()

  // Setup tabs
  const didChangeTabs = (from: string, to: string) => {
    setTrendingTimeRange(to as TimeRange)
    scrollToTop(to as TimeRange)
    record(
      make(Name.TRENDING_CHANGE_VIEW, {
        timeframe: to as TimeRange,
        genre: trendingGenre || ''
      })
    )
  }

  const tabIsDisabled = (timeRange: TimeRange) =>
    emptyTimeGenreSet.current.has(
      getTimeGenreCacheKey(timeRange, trendingGenre)
    )
  const { tabs, body } = useTabs({
    isMobile: false,
    tabs: [
      {
        text: messages.thisWeek,
        label: TimeRange.WEEK,
        disabled: tabIsDisabled(TimeRange.WEEK)
      },
      {
        text: messages.thisMonth,
        label: TimeRange.MONTH,
        disabled: tabIsDisabled(TimeRange.MONTH)
      },
      {
        text: messages.allTime,
        label: TimeRange.ALL_TIME,
        disabled: tabIsDisabled(TimeRange.ALL_TIME)
      }
    ],
    selectedTabLabel: trendingTimeRange,
    elements: trendingLineups,
    didChangeTabsFrom: didChangeTabs,
    bodyClassName: styles.tabBody,
    elementClassName: styles.tabElement,
    interElementSpacing: 100,
    disabledTabTooltipText: messages.disabledTabTooltip
  })

  const setGenre = useCallback(
    (genre: string | null) => {
      setGenreAndRefresh(genre)
      record(
        make(Name.TRENDING_CHANGE_VIEW, {
          timeframe: trendingTimeRange,
          genre: genre || ''
        })
      )
    },
    [setGenreAndRefresh, record, trendingTimeRange]
  )

  // Setup Modal
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const didSelectModalGenre = (genre: string | null) => {
    const trimmedGenre =
      genre !== null ? genre.replace(ELECTRONIC_PREFIX, '') : genre
    setGenre(trimmedGenre)
    setModalIsOpen(false)
  }

  // Setup Header
  const header = (
    <Header
      primary={trendingTitle}
      variant={'main'}
      bottomBar={tabs}
      rightDecorator={
        <TrendingGenreFilters
          initialGenres={initialGenres}
          genre={trendingGenre}
          didSelectGenre={setGenre}
          didSelectMore={() => setModalIsOpen(true)}
        />
      }
    />
  )

  return (
    <>
      <Page
        title={trendingTitle}
        description={trendingDescription}
        size='large'
        header={header}
      >
        {body}
      </Page>
      <GenreSelectionModal
        genres={TRENDING_GENRES}
        selectedGenre={trendingGenre}
        didClose={() => {
          setModalIsOpen(false)
        }}
        didSelectGenre={didSelectModalGenre}
        isOpen={modalIsOpen}
      />
    </>
  )
}

export default TrendingPageContent

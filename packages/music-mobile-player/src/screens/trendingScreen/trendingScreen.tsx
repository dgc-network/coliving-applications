import { TimeRange } from '@coliving/common'
import { getTrendingGenre } from '@coliving/web/src/common/store/pages/trending/selectors'

import IconAllTime from 'app/assets/images/iconAllTime.svg'
import IconDay from 'app/assets/images/iconDay.svg'
import IconMonth from 'app/assets/images/iconMonth.svg'
import { RewardsBanner } from 'app/components/digitalcoinRewards'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { TopTabNavigator } from 'app/components/topTabBar'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TrendingFilterButton } from './trendingFilterButton'
import { TrendingLineup } from './trendingLineup'

const ThisWeekTab = () => {
  const trendingGenre = useSelectorWeb(getTrendingGenre)
  return (
    <TrendingLineup
      header={trendingGenre ? null : <RewardsBanner type='digitalContents' />}
      timeRange={TimeRange.WEEK}
      rankIconCount={5}
    />
  )
}
const ThisMonthTab = () => {
  return <TrendingLineup timeRange={TimeRange.MONTH} />
}

const AllTimeTab = () => {
  return <TrendingLineup timeRange={TimeRange.ALL_TIME} />
}

const trendingScreens = [
  {
    name: 'ThisWeek',
    label: 'This Week',
    Icon: IconDay,
    component: ThisWeekTab
  },
  {
    name: 'ThisMonth',
    label: 'This Month',
    Icon: IconMonth,
    component: ThisMonthTab
  },
  {
    name: 'AllTime',
    label: 'All Time',
    Icon: IconAllTime,
    component: AllTimeTab
  }
]

export const TrendingScreen = () => {
  usePopToTopOnDrawerOpen()

  return (
    <Screen>
      <Header text='Trending'>
        <TrendingFilterButton />
      </Header>
      <TopTabNavigator screens={trendingScreens} />
    </Screen>
  )
}

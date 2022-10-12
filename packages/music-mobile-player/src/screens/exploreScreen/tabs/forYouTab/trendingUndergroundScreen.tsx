import { makeGetLineupMetadatas } from '@coliving/web/src/common/store/lineup/selectors'
import { trendingUndergroundLineupActions } from '@coliving/web/src/common/store/pages/trending-underground/lineup/actions'
import { getLineup } from '@coliving/web/src/common/store/pages/trendingUnderground/lineup/selectors'

import { RewardsBanner } from 'app/components/digitalcoinRewards'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

const getTrendingUndergroundLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'Underground Trending'
}

export const TrendingUndergroundScreen = () => {
  const lineup = useSelectorWeb(getTrendingUndergroundLineup)

  return (
    <>
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        header={<RewardsBanner type='underground' />}
        actions={trendingUndergroundLineupActions}
        rankIconCount={5}
        isTrending
      />
    </>
  )
}

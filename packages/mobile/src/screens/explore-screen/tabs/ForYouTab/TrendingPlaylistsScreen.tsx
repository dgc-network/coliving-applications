import { makeGetLineupMetadatas } from '-client/src/common/store/lineup/selectors'
import { trendingContentListLineupActions } from '-client/src/common/store/pages/trending-contentLists/lineups/actions'
import { getLineup } from '-client/src/common/store/pages/trending-contentLists/lineups/selectors'

import { RewardsBanner } from 'app/components/live-rewards'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

const getTrendingContentListsLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'Trending ContentLists'
}

export const TrendingContentListsScreen = () => {
  const lineup = useSelectorWeb(getTrendingContentListsLineup)

  return (
    <Screen>
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        header={<RewardsBanner type='contentLists' />}
        actions={trendingContentListLineupActions}
        rankIconCount={5}
        isTrending
      />
    </Screen>
  )
}

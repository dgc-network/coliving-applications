import { makeGetLineupMetadatas } from '-client/src/common/store/lineup/selectors'
import { trendingPlaylistLineupActions } from '-client/src/common/store/pages/trending-content lists/lineups/actions'
import { getLineup } from '-client/src/common/store/pages/trending-content lists/lineups/selectors'

import { RewardsBanner } from 'app/components/live-rewards'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

const getTrendingPlaylistsLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'Trending Playlists'
}

export const TrendingPlaylistsScreen = () => {
  const lineup = useSelectorWeb(getTrendingPlaylistsLineup)

  return (
    <Screen>
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        header={<RewardsBanner type='content lists' />}
        actions={trendingPlaylistLineupActions}
        rankIconCount={5}
        isTrending
      />
    </Screen>
  )
}

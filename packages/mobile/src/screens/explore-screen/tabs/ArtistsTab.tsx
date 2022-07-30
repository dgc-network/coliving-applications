import { makeGetExplore } from '-client/src/common/store/pages/explore/selectors'
import { EXPLORE_PAGE } from '-client/src/utils/route'

import { ArtistCard } from 'app/components/artist-card'
import { CardList } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Artists'
}

const getExplore = makeGetExplore()

export const ArtistsTab = () => {
  const { profiles } = useSelectorWeb(getExplore)

  return (
    <CardList
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      data={profiles}
      renderItem={({ item }) => (
        <ArtistCard artist={item} fromPage={EXPLORE_PAGE} />
      )}
    />
  )
}

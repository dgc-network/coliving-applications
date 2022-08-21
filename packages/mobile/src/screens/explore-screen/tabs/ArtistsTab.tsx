import { makeGetExplore } from '-client/src/common/store/pages/explore/selectors'
import { EXPLORE_PAGE } from '-client/src/utils/route'

import { LandlordCard } from 'app/components/landlord-card'
import { CardList } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Landlords'
}

const getExplore = makeGetExplore()

export const LandlordsTab = () => {
  const { profiles } = useSelectorWeb(getExplore)

  return (
    <CardList
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      data={profiles}
      renderItem={({ item }) => (
        <LandlordCard landlord={item} fromPage={EXPLORE_PAGE} />
      )}
    />
  )
}

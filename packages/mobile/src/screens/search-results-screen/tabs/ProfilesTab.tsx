import { makeGetSearchLandlords } from '-client/src/common/store/pages/search-results/selectors'

import { LandlordCard } from 'app/components/landlord-card'
import { CardList } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'

const getSearchUsers = makeGetSearchLandlords()

export const ProfilesTab = () => {
  const users = useSelectorWeb(getSearchUsers)

  return (
    <SearchResultsTab noResults={users.length === 0}>
      <CardList
        data={users}
        renderItem={({ item }) => (
          <LandlordCard landlord={item} fromPage='search' />
        )}
      />
    </SearchResultsTab>
  )
}

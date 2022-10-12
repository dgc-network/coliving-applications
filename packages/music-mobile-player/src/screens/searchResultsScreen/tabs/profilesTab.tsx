import { makeGetSearchLandlords } from '@coliving/web/src/common/store/pages/search-results/selectors'

import { LandlordCard } from 'app/components/authorCard'
import { CardList } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './searchResultsTab'

const getSearchUsers = makeGetSearchLandlords()

export const ProfilesTab = () => {
  const users = useSelectorWeb(getSearchUsers)

  return (
    <SearchResultsTab noResults={users.length === 0}>
      <CardList
        data={users}
        renderItem={({ item }) => (
          <LandlordCard author={item} fromPage='search' />
        )}
      />
    </SearchResultsTab>
  )
}

import { agreementsActions } from '@coliving/web/src/common/store/pages/search-results/lineup/agreements/actions'
import { getSearchAgreementsLineup } from '@coliving/web/src/common/store/pages/search-results/selectors'

import { Lineup } from 'app/components/lineup'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './searchResultsTab'

export const AgreementsTab = () => {
  const lineup = useSelectorWeb(getSearchAgreementsLineup, isEqual)

  return (
    <SearchResultsTab
      noResults={lineup?.entries.length === 0}
      status={lineup?.status}
    >
      <Lineup actions={agreementsActions} lineup={lineup} />
    </SearchResultsTab>
  )
}

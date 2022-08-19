import { agreementsActions } from '-client/src/common/store/pages/search-results/lineup/agreements/actions'
import { getSearchAgreementsLineup } from '-client/src/common/store/pages/search-results/selectors'

import { Lineup } from 'app/components/lineup'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'

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

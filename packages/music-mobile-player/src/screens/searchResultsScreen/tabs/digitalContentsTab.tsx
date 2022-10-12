import { digitalContentsActions } from '@coliving/web/src/common/store/pages/search-results/lineup/digital_contents/actions'
import { getSearchDigitalContentsLineup } from '@coliving/web/src/common/store/pages/search-results/selectors'

import { Lineup } from 'app/components/lineup'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './searchResultsTab'

export const DigitalContentsTab = () => {
  const lineup = useSelectorWeb(getSearchDigitalContentsLineup, isEqual)

  return (
    <SearchResultsTab
      noResults={lineup?.entries.length === 0}
      status={lineup?.status}
    >
      <Lineup actions={digitalContentsActions} lineup={lineup} />
    </SearchResultsTab>
  )
}

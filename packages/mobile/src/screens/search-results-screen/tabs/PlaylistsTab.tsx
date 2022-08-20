import { makeGetSearchContentLists } from '-client/src/common/store/pages/search-results/selectors'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'

const getSearchContentLists = makeGetSearchContentLists()

export const ContentListsTab = () => {
  const content lists = useSelectorWeb(getSearchContentLists, isEqual)

  return (
    <SearchResultsTab noResults={content lists.length === 0}>
      <CollectionList
        listKey='search-content lists'
        collection={content lists}
        fromPage='search'
      />
    </SearchResultsTab>
  )
}

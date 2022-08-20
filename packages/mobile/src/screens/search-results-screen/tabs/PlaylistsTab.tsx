import { makeGetSearchContentLists } from '-client/src/common/store/pages/search-results/selectors'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'

const getSearchContentLists = makeGetSearchContentLists()

export const ContentListsTab = () => {
  const contentLists = useSelectorWeb(getSearchContentLists, isEqual)

  return (
    <SearchResultsTab noResults={contentLists.length === 0}>
      <CollectionList
        listKey='search-contentLists'
        collection={contentLists}
        fromPage='search'
      />
    </SearchResultsTab>
  )
}

import { makeGetSearchContentLists } from '@coliving/web/src/common/store/pages/search-results/selectors'

import { CollectionList } from 'app/components/collectionList/collectionList'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './searchResultsTab'

const getSearchContentLists = makeGetSearchContentLists()

export const ContentListsTab = () => {
  const contentLists = useSelectorWeb(getSearchContentLists, isEqual)

  return (
    <SearchResultsTab noResults={contentLists.length === 0}>
      <CollectionList
        listKey='search-content-lists'
        collection={contentLists}
        fromPage='search'
      />
    </SearchResultsTab>
  )
}

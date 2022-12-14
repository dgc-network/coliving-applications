import { makeGetSearchAlbums } from '@coliving/web/src/common/store/pages/search-results/selectors'

import { CollectionList } from 'app/components/collectionList/collectionList'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './searchResultsTab'

const getSearchAlbums = makeGetSearchAlbums()

export const AlbumsTab = () => {
  const albums = useSelectorWeb(getSearchAlbums, isEqual)

  return (
    <SearchResultsTab noResults={albums.length === 0}>
      <CollectionList
        listKey='search-albums'
        collection={albums}
        fromPage='search'
      />
    </SearchResultsTab>
  )
}

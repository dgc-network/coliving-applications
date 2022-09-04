import { useState } from 'react'

import { getAccountWithAlbums } from '@coliving/web/src/common/store/account/selectors'
import { FAVORITES_PAGE } from '@coliving/web/src/utils/route'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'
import type { ExtendedCollection } from './types'

const messages = {
  emptyTabText: "You haven't favorited any albums yet.",
  inputPlaceholder: 'Filter Albums'
}

export const AlbumsTab = () => {
  const [filterValue, setFilterValue] = useState('')
  const user = useSelectorWeb(getAccountWithAlbums)

  const matchesFilter = (contentList: ExtendedCollection) => {
    const matchValue = filterValue.toLowerCase()
    return (
      contentList.content_list_name.toLowerCase().indexOf(matchValue) > -1 ||
      contentList.ownerName.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const userAlbums = user?.albums
    ?.filter(
      (contentList) =>
        contentList.is_album &&
        contentList.ownerHandle !== user.handle &&
        matchesFilter(contentList)
    )
    .map((contentList) => ({ ...contentList, user }))

  return (
    <VirtualizedScrollView listKey='favorites-albums-view'>
      {!userAlbums?.length && !filterValue ? (
        <EmptyTab message={messages.emptyTabText} />
      ) : (
        <>
          <FilterInput
            value={filterValue}
            placeholder={messages.inputPlaceholder}
            onChangeText={setFilterValue}
          />
          <CollectionList
            listKey='favorites-albums'
            scrollEnabled={false}
            collection={userAlbums ?? []}
            style={{ marginVertical: 12 }}
            fromPage={FAVORITES_PAGE}
          />
        </>
      )}
    </VirtualizedScrollView>
  )
}

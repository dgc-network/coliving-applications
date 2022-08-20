import { useState } from 'react'

import { getAccountWithAlbums } from '-client/src/common/store/account/selectors'
import { FAVORITES_PAGE } from '-client/src/utils/route'

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

  const matchesFilter = (content list: ExtendedCollection) => {
    const matchValue = filterValue.toLowerCase()
    return (
      content list.content list_name.toLowerCase().indexOf(matchValue) > -1 ||
      content list.ownerName.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const userAlbums = user?.albums
    ?.filter(
      (content list) =>
        content list.is_album &&
        content list.ownerHandle !== user.handle &&
        matchesFilter(content list)
    )
    .map((content list) => ({ ...content list, user }))

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

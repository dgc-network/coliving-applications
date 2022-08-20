import { useCallback, useState } from 'react'

import { getAccountWithPlaylists } from '-client/src/common/store/account/selectors'
import { FAVORITES_PAGE } from '-client/src/utils/route'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView, Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import type { FavoritesTabScreenParamList } from '../app-screen/FavoritesTabScreen'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'
import type { ExtendedCollection } from './types'

const messages = {
  emptyTabText: "You haven't favorited any content lists yet.",
  inputPlaceholder: 'Filter Playlists'
}

export const PlaylistsTab = () => {
  const navigation = useNavigation<FavoritesTabScreenParamList>()
  const [filterValue, setFilterValue] = useState('')
  const user = useSelectorWeb(getAccountWithPlaylists)

  const matchesFilter = (content list: ExtendedCollection) => {
    const matchValue = filterValue.toLowerCase()
    return (
      content list.content list_name.toLowerCase().indexOf(matchValue) > -1 ||
      content list.ownerName.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const userPlaylists = user?.content lists
    ?.filter(
      (content list) =>
        !content list.is_album &&
        content list.ownerHandle !== user.handle &&
        matchesFilter(content list)
    )
    .map((content list) => ({ ...content list, user }))

  const handleNavigateToNewPlaylist = useCallback(() => {
    navigation.push({ native: { screen: 'CreatePlaylist' } })
  }, [navigation])

  return (
    <VirtualizedScrollView listKey='favorites-content lists-view'>
      {!userPlaylists?.length && !filterValue ? (
        <EmptyTab message={messages.emptyTabText} />
      ) : (
        <FilterInput
          value={filterValue}
          placeholder={messages.inputPlaceholder}
          onChangeText={setFilterValue}
        />
      )}
      <Button
        title='Create a New Playlist'
        variant='commonAlt'
        onPress={handleNavigateToNewPlaylist}
      />
      <CollectionList
        listKey='favorites-content lists'
        scrollEnabled={false}
        collection={userPlaylists ?? []}
        fromPage={FAVORITES_PAGE}
      />
    </VirtualizedScrollView>
  )
}

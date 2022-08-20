import { useCallback, useState } from 'react'

import { getAccountWithContentLists } from '-client/src/common/store/account/selectors'
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
  inputPlaceholder: 'Filter ContentLists'
}

export const ContentListsTab = () => {
  const navigation = useNavigation<FavoritesTabScreenParamList>()
  const [filterValue, setFilterValue] = useState('')
  const user = useSelectorWeb(getAccountWithContentLists)

  const matchesFilter = (content list: ExtendedCollection) => {
    const matchValue = filterValue.toLowerCase()
    return (
      content list.content list_name.toLowerCase().indexOf(matchValue) > -1 ||
      content list.ownerName.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const userContentLists = user?.content lists
    ?.filter(
      (content list) =>
        !content list.is_album &&
        content list.ownerHandle !== user.handle &&
        matchesFilter(content list)
    )
    .map((content list) => ({ ...content list, user }))

  const handleNavigateToNewContentList = useCallback(() => {
    navigation.push({ native: { screen: 'CreateContentList' } })
  }, [navigation])

  return (
    <VirtualizedScrollView listKey='favorites-content lists-view'>
      {!userContentLists?.length && !filterValue ? (
        <EmptyTab message={messages.emptyTabText} />
      ) : (
        <FilterInput
          value={filterValue}
          placeholder={messages.inputPlaceholder}
          onChangeText={setFilterValue}
        />
      )}
      <Button
        title='Create a New ContentList'
        variant='commonAlt'
        onPress={handleNavigateToNewContentList}
      />
      <CollectionList
        listKey='favorites-content lists'
        scrollEnabled={false}
        collection={userContentLists ?? []}
        fromPage={FAVORITES_PAGE}
      />
    </VirtualizedScrollView>
  )
}

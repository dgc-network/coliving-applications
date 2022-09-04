import { useCallback, useState } from 'react'

import { getAccountWithContentLists } from '@coliving/web/src/common/store/account/selectors'
import { FAVORITES_PAGE } from '@coliving/web/src/utils/route'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView, Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import type { FavoritesTabScreenParamList } from '../app-screen/FavoritesTabScreen'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'
import type { ExtendedCollection } from './types'

const messages = {
  emptyTabText: "You haven't favorited any contentLists yet.",
  inputPlaceholder: 'Filter ContentLists'
}

export const ContentListsTab = () => {
  const navigation = useNavigation<FavoritesTabScreenParamList>()
  const [filterValue, setFilterValue] = useState('')
  const user = useSelectorWeb(getAccountWithContentLists)

  const matchesFilter = (contentList: ExtendedCollection) => {
    const matchValue = filterValue.toLowerCase()
    return (
      contentList.content_list_name.toLowerCase().indexOf(matchValue) > -1 ||
      contentList.ownerName.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const userContentLists = user?.contentLists
    ?.filter(
      (contentList) =>
        !contentList.is_album &&
        contentList.ownerHandle !== user.handle &&
        matchesFilter(contentList)
    )
    .map((contentList) => ({ ...contentList, user }))

  const handleNavigateToNewContentList = useCallback(() => {
    navigation.push({ native: { screen: 'CreateContentList' } })
  }, [navigation])

  return (
    <VirtualizedScrollView listKey='favorites-content-lists-view'>
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
        listKey='favorites-content-lists'
        scrollEnabled={false}
        collection={userContentLists ?? []}
        fromPage={FAVORITES_PAGE}
      />
    </VirtualizedScrollView>
  )
}

import { getProfileContentLists } from '-client/src/common/store/pages/profile/selectors'

import { CollectionList } from 'app/components/collection-list'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { useEmptyProfileText } from './EmptyProfileTile'

export const ContentListsTab = () => {
  const contentLists = useSelectorWeb(getProfileContentLists)

  const emptyListText = useEmptyProfileText('contentLists')

  return (
    <CollectionList
      listKey='profile-contentLists'
      collection={contentLists}
      emptyListText={emptyListText}
      disableTopTabScroll
      fromPage='profile'
      showsVerticalScrollIndicator={false}
    />
  )
}

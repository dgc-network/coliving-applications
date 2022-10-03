import { getProfileContentLists } from '@coliving/web/src/common/store/pages/profile/selectors'

import { CollectionList } from 'app/components/collectionList'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { useEmptyProfileText } from './emptyProfileTile'

export const ContentListsTab = () => {
  const contentLists = useSelectorWeb(getProfileContentLists)

  const emptyListText = useEmptyProfileText('contentLists')

  return (
    <CollectionList
      listKey='profile-content-lists'
      collection={contentLists}
      emptyListText={emptyListText}
      disableTopTabScroll
      fromPage='profile'
      showsVerticalScrollIndicator={false}
    />
  )
}

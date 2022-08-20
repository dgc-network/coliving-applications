import { getProfilePlaylists } from '-client/src/common/store/pages/profile/selectors'

import { CollectionList } from 'app/components/collection-list'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { useEmptyProfileText } from './EmptyProfileTile'

export const PlaylistsTab = () => {
  const content lists = useSelectorWeb(getProfilePlaylists)

  const emptyListText = useEmptyProfileText('content lists')

  return (
    <CollectionList
      listKey='profile-content lists'
      collection={content lists}
      emptyListText={emptyListText}
      disableTopTabScroll
      fromPage='profile'
      showsVerticalScrollIndicator={false}
    />
  )
}

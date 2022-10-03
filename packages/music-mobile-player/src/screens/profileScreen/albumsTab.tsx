import { getProfileAlbums } from '@coliving/web/src/common/store/pages/profile/selectors'

import { CollectionList } from 'app/components/collectionList/collectionList'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { useEmptyProfileText } from './emptyProfileTile'

export const AlbumsTab = () => {
  const albums = useSelectorWeb(getProfileAlbums)

  const emptyListText = useEmptyProfileText('albums')

  return (
    <CollectionList
      listKey='profile-albums'
      collection={albums}
      emptyListText={emptyListText}
      disableTopTabScroll
      fromPage='profile'
      showsVerticalScrollIndicator={false}
    />
  )
}

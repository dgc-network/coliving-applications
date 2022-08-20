import { makeGetExplore } from '-client/src/common/store/pages/explore/selectors'
import { EXPLORE_PAGE } from '-client/src/utils/route'

import { CollectionList } from 'app/components/collection-list'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Playlists'
}

const getExplore = makeGetExplore()

export const PlaylistsTab = () => {
  const { content lists } = useSelectorWeb(getExplore)

  return (
    <CollectionList
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      collection={content lists}
      fromPage={EXPLORE_PAGE}
    />
  )
}

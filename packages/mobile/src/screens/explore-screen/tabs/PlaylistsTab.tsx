import { makeGetExplore } from '@coliving/web/src/common/store/pages/explore/selectors'
import { EXPLORE_PAGE } from '@coliving/web/src/utils/route'

import { CollectionList } from 'app/components/collection-list'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured ContentLists'
}

const getExplore = makeGetExplore()

export const ContentListsTab = () => {
  const { contentLists } = useSelectorWeb(getExplore)

  return (
    <CollectionList
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      collection={contentLists}
      fromPage={EXPLORE_PAGE}
    />
  )
}

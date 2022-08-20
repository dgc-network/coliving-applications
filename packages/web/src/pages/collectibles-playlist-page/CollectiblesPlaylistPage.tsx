import { isMobile } from 'utils/clientUtil'

import DesktopCollectionPage from '../collection-page/components/desktop/CollectionPage'
import MobileCollectionPage from '../collection-page/components/mobile/CollectionPage'

import { CollectiblesContentListPageProvider } from './CollectiblesContentListPageProvider'

const isMobileClient = isMobile()

export const CollectiblesContentListPage = () => {
  const content = isMobileClient ? MobileCollectionPage : DesktopCollectionPage

  return (
    <CollectiblesContentListPageProvider>
      {content}
    </CollectiblesContentListPageProvider>
  )
}

import { isMobile } from 'utils/clientUtil'

import DesktopCollectionPage from '../collectionPage/components/desktop/collectionPage'
import MobileCollectionPage from '../collectionPage/components/mobile/collectionPage'

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

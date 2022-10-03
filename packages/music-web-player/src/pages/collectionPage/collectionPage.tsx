import { SmartCollection } from '@coliving/common'
import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import { CollectionsPageType } from '../../common/store/pages/collection/types'

import CollectionPageProvider from './collectionPageProvider'
import DesktopCollectionPage from './components/desktop/collectionPage'
import MobileCollectionPage from './components/mobile/collectionPage'

type OwnProps = {
  type: CollectionsPageType
  smartCollection?: SmartCollection
}

const isMobileClient = isMobile()

type CollectionPageProps = ReturnType<typeof mapStateToProps> & OwnProps

const CollectionPage = ({ type, smartCollection }: CollectionPageProps) => {
  const content = isMobileClient ? MobileCollectionPage : DesktopCollectionPage

  return (
    <CollectionPageProvider
      isMobile={isMobileClient}
      smartCollection={smartCollection}
      type={type}
    >
      {content}
    </CollectionPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {}
}

export default connect(mapStateToProps)(CollectionPage)

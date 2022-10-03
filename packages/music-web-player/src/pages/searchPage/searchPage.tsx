import { ReactNode } from 'react'

import { Client } from '@coliving/common'
import { connect } from 'react-redux'

import SearchPageProvider from 'pages/searchPage/searchPageProvider'
import DesktopSearchPageContent from 'pages/searchPage/components/desktop/searchPageContent'
import MobileSearchPageContent from 'pages/searchPage/components/mobile/searchPageContent'
import { AppState } from 'store/types'
import { getClient } from 'utils/clientUtil'

type ownProps = {
  scrollToTop: () => void
  containerRef: ReactNode
}

type SearchPageProps = ownProps & ReturnType<typeof mapStateToProps>

const SearchPage = ({ scrollToTop, containerRef }: SearchPageProps) => {
  const client = getClient()
  const isMobile = client === Client.MOBILE
  const content = isMobile ? MobileSearchPageContent : DesktopSearchPageContent

  return (
    <SearchPageProvider
      scrollToTop={scrollToTop}
      containerRef={containerRef}
      isMobile={isMobile}
    >
      {content}
    </SearchPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {}
}

export default connect(mapStateToProps)(SearchPage)

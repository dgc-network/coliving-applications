import { RefObject } from 'react'

import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import TrendingPageProvider from './trendingPageProvider'
import TrendingPageContent from './components/desktop/trendingPageContent'
import TrendingPageMobileContent from './components/mobile/trendingPageContent'

interface OwnProps {
  containerRef: RefObject<HTMLDivElement>
}

type TrendingPageContentProps = ReturnType<typeof mapStateToProps> & OwnProps

const TrendingPage = ({ containerRef, isMobile }: TrendingPageContentProps) => {
  const content = isMobile ? TrendingPageMobileContent : TrendingPageContent

  return (
    <TrendingPageProvider
      // @ts-ignore
      containerRef={containerRef}
    >
      {content}
    </TrendingPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(TrendingPage)

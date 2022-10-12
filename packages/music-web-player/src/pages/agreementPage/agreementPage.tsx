import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import DigitalContentPageProvider from './digitalContentPageProvider'
import DigitalContentPageDesktopContent from './components/desktop/digitalContentPage'
import DigitalContentPageMobileContent from './components/mobile/digitalContentPage'

interface OwnProps {}

type DigitalContentPageContentProps = ReturnType<typeof mapStateToProps> & OwnProps

const DigitalContentPage = ({ isMobile }: DigitalContentPageContentProps) => {
  const content = isMobile ? DigitalContentPageMobileContent : DigitalContentPageDesktopContent

  return <DigitalContentPageProvider>{content}</DigitalContentPageProvider>
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(DigitalContentPage)

import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import AgreementPageProvider from './AgreementPageProvider'
import AgreementPageDesktopContent from './components/desktop/AgreementPage'
import AgreementPageMobileContent from './components/mobile/AgreementPage'

interface OwnProps {}

type AgreementPageContentProps = ReturnType<typeof mapStateToProps> & OwnProps

const AgreementPage = ({ isMobile }: AgreementPageContentProps) => {
  const content = isMobile ? AgreementPageMobileContent : AgreementPageDesktopContent

  return <AgreementPageProvider>{content}</AgreementPageProvider>
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(AgreementPage)

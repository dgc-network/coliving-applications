import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import AgreementPageProvider from './agreementPageProvider'
import AgreementPageDesktopContent from './components/desktop/agreementPage'
import AgreementPageMobileContent from './components/mobile/agreementPage'

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

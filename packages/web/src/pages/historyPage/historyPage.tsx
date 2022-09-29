import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import HistoryPageProvider from './historyPageProvider'
import DesktopHistoryPage from './components/desktop/historyPage'
import MobileHistoryPage from './components/mobile/historyPage'

type HistoryPageProps = ReturnType<typeof mapStateToProps>
const HistoryPage = ({ isMobile }: HistoryPageProps) => {
  const content = isMobile ? MobileHistoryPage : DesktopHistoryPage

  return <HistoryPageProvider>{content}</HistoryPageProvider>
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(HistoryPage)

import { RefObject } from 'react'

import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import SettingsPageProvider from './settingsPageProvider'
import DesktopSettingsPage from './components/desktop/settingsPage'
import MobileSettingsPage, { SubPage } from './components/mobile/settingsPage'

type OwnProps = {
  containerRef: RefObject<HTMLDivElement>
  subPage?: SubPage
}

type SettingsPageProps = ReturnType<typeof mapStateToProps> & OwnProps
const SettingsPage = ({ isMobile, subPage }: SettingsPageProps) => {
  const content = isMobile ? MobileSettingsPage : DesktopSettingsPage

  return (
    <SettingsPageProvider subPage={subPage}>{content}</SettingsPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(SettingsPage)

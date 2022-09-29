import { RefObject } from 'react'

import { useIsMobile } from 'utils/clientUtil'

import ProfilePageProvider from './profilePageProvider'
import DesktopProfilePage from './components/desktop/profilePage'
import MobileProfilePage from './components/mobile/profilePage'

type ProfilePageProps = {
  containerRef: RefObject<HTMLDivElement>
}

const ProfilePage = ({ containerRef }: ProfilePageProps) => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileProfilePage : DesktopProfilePage

  return (
    <ProfilePageProvider containerRef={containerRef}>
      {content}
    </ProfilePageProvider>
  )
}

export default ProfilePage

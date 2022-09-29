import { RefObject } from 'react'

import { useIsMobile } from 'utils/clientUtil'

import RemixesPageProvider from './remixesPageProvider'
import RemixesPageDesktopContent from './components/desktop/remixesPage'
import RemixesPageMobileContent from './components/mobile/remixesPage'

type RemixesPageProps = {
  containerRef: RefObject<HTMLDivElement>
}

const RemixesPage = ({ containerRef }: RemixesPageProps) => {
  const isMobile = useIsMobile()
  const content = isMobile
    ? RemixesPageMobileContent
    : RemixesPageDesktopContent

  return (
    <RemixesPageProvider containerRef={containerRef}>
      {content}
    </RemixesPageProvider>
  )
}

export default RemixesPage

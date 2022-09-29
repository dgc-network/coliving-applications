import { Suspense, useState, useEffect, useCallback, lazy } from 'react'

import { getCurrentUserExists } from 'services/localStorage'
import { setupMobileLogging } from 'services/logging'
import { BackendDidSetup } from 'services/nativeMobileInterface/lifecycle'
import { useIsMobile, isElectron } from 'utils/clientUtil'
import { getPathname, HOME_PAGE, publicSiteRoutes } from 'utils/route'

import Dapp from './app'

const REACT_APP_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const NoConnectivityPage = lazy(
  () => import('components/noConnectivityPage/noConnectivityPage')
)

const PublicSite = lazy(() => import('./pages/publicSite'))

const isPublicSiteRoute = (location = window.location) => {
  const pathname = getPathname(location).toLowerCase()
  return [...publicSiteRoutes, HOME_PAGE].includes(pathname)
}

const isPublicSiteSubRoute = (location = window.location) => {
  const pathname = getPathname(location).toLowerCase()
  return publicSiteRoutes.includes(pathname)
}

const clientIsElectron = isElectron()

const foundUser = getCurrentUserExists()

const Root = () => {
  const [dappReady, setDappReady] = useState(false)
  const [connectivityFailure, setConnectivityFailure] = useState(false)
  const [renderPublicSite, setRenderPublicSite] = useState(isPublicSiteRoute())
  const isMobileClient = useIsMobile()

  useEffect(() => {
    // TODO: listen to history and change routes based on history...
    window.onpopstate = () => {
      setRenderPublicSite(isPublicSiteRoute())
    }
  }, [])

  const setReady = useCallback(() => setDappReady(true), [])

  useEffect(() => {
    if (dappReady || connectivityFailure) {
      new BackendDidSetup().send()
    }
  }, [connectivityFailure, dappReady])

  useEffect(() => {
    setupMobileLogging()
  }, [])

  const [shouldShowPopover, setShouldShowPopover] = useState(true)

  const shouldRedirectToApp = foundUser && !isPublicSiteSubRoute()
  if (
    renderPublicSite &&
    !clientIsElectron &&
    !REACT_APP_NATIVE_MOBILE &&
    !shouldRedirectToApp
  ) {
    return (
      <Suspense fallback={<div style={{ width: '100vw', height: '100vh' }} />}>
        <PublicSite
          isMobile={isMobileClient}
          onClickAppRedirect={() => setShouldShowPopover(false)}
          onDismissAppRedirect={() => setShouldShowPopover(false)}
          setRenderPublicSite={setRenderPublicSite}
        />
      </Suspense>
    )
  }

  return (
    <>
      {connectivityFailure && <NoConnectivityPage />}
      <Dapp
        isReady={dappReady}
        setReady={setReady}
        setConnectivityFailure={setConnectivityFailure}
        shouldShowPopover={shouldShowPopover}
      />
    </>
  )
}

export default Root

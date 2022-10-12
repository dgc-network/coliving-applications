import { useRef, useEffect } from 'react'

import { PortalProvider } from '@gorhom/portal'
import * as Sentry from '@sentry/react-native'
import { Platform } from 'react-native'
import Config from 'react-native-config'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type WebView from 'react-native-webview'
import { Provider } from 'react-redux'

import Audio from 'app/components/audio/audio'
import HCaptcha from 'app/components/hcaptcha'
import NavigationContainer from 'app/components/navigationContainer'
import OAuth from 'app/components/oAuth/oAuth'
import { ReachabilityBar } from 'app/components/reachabilityBar'
import { ThemeProvider } from 'app/components/theme/themeContext'
import { ToastContextProvider } from 'app/components/toast/toastContext'
import { WebRefContextProvider } from 'app/components/web/webRef'
import useConnectivity from 'app/components/web/useConnectivity'
import { incrementSessionCount } from 'app/hooks/useSessionCount'
import PushNotifications from 'app/notifications'
import { RootScreen } from 'app/screens/rootScreen'
import createStore from 'app/store'
import { setup as setupAnalytics } from 'app/utils/analytics'

import { Drawers } from './drawers'
import ErrorBoundary from './errorBoundary'
import { WebAppManager } from './webAppManager'

Sentry.init({
  dsn: Config.SENTRY_DSN
})

const store = createStore()
export const dispatch = store.dispatch

const Airplay = Platform.select({
  ios: () => require('./components/digitalcoin/Airplay').default,
  android: () => () => null
})?.()

// Increment the session count when the App.tsx code is first run
incrementSessionCount()

const Modals = () => {
  return <HCaptcha />
}

const App = () => {
  // DigitalContent the web view as a top-level ref so that any children can use it
  // to send messages to the dapp
  const webRef = useRef<WebView>(null)

  // Broadcast connectivity to the wrapped dapp
  useConnectivity({ webRef })

  // Configure push notifications so that it has access to the web view
  // and can message pass to it
  useEffect(() => {
    PushNotifications.setWebRef(webRef)
  }, [webRef])

  useEffect(() => {
    setupAnalytics()
  }, [])

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PortalProvider>
          <ToastContextProvider>
            <ErrorBoundary>
              <WebRefContextProvider>
                <WebAppManager webRef={webRef}>
                  <ThemeProvider>
                    <NavigationContainer>
                      <Airplay />
                      <ReachabilityBar />
                      <RootScreen />
                      <Drawers />
                      <Modals />
                      <Audio webRef={webRef} />
                      <OAuth webRef={webRef} />
                    </NavigationContainer>
                  </ThemeProvider>
                </WebAppManager>
              </WebRefContextProvider>
            </ErrorBoundary>
          </ToastContextProvider>
        </PortalProvider>
      </Provider>
    </SafeAreaProvider>
  )
}

export default Sentry.wrap(App)

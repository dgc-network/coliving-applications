import '@coliving/stems/dist/stems.css'

import { ConnectedRouter } from 'connected-react-router'
import { Provider } from 'react-redux'
import { Route, Switch } from 'react-router-dom'
import { LastLocationProvider } from 'react-router-last-location'

import App from 'pages/app'
import AppContext from 'pages/appContext'
import { AppErrorBoundary } from 'pages/appErrorBoundary'
import { MainContentContext } from 'pages/mainContentContext'
import { OAuthLoginPage } from 'pages/oauthLoginPage/oauthLoginPage'
import { SomethingWrong } from 'pages/somethingWrong/somethingWrong'
import history from 'utils/history'

import { store } from './store/configureStore'

import './services/webVitals'
import './index.css'

type ColivingAppProps = {
  setReady: () => void
  isReady: boolean
  setConnectivityFailure: (failure: boolean) => void
  shouldShowPopover: boolean
}

const ColivingApp = ({
  setReady,
  isReady,
  setConnectivityFailure,
  shouldShowPopover
}: ColivingAppProps) => {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <LastLocationProvider>
          <AppContext>
            <MainContentContext.Consumer>
              {({ mainContentRef }) => (
                <Switch>
                  <Route path='/error'>
                    <SomethingWrong />
                  </Route>
                  <Route
                    exact
                    path={'/oauth/auth'}
                    component={OAuthLoginPage}
                  />
                  <Route path='/'>
                    <AppErrorBoundary>
                      <App
                        setReady={setReady}
                        isReady={isReady}
                        mainContentRef={mainContentRef}
                        setConnectivityFailure={setConnectivityFailure}
                        shouldShowPopover={shouldShowPopover}
                      />
                    </AppErrorBoundary>
                  </Route>
                </Switch>
              )}
            </MainContentContext.Consumer>
          </AppContext>
        </LastLocationProvider>
      </ConnectedRouter>
    </Provider>
  )
}

export default ColivingApp

import { RouterContextProvider } from 'components/animatedSwitch/routerContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/headerContextProvider'
import { NavProvider } from 'components/nav/store/context'
import { ScrollProvider } from 'components/scrollProvider/scrollProvider'
import { ToastContextProvider } from 'components/toast/toastContext'
import { MainContentContextProvider } from 'pages/mainContentContext'

type AppContextProps = {
  children: JSX.Element
}

const AppContext = ({ children }: AppContextProps) => {
  return (
    <NavProvider>
      <ScrollProvider>
        <RouterContextProvider>
          <MainContentContextProvider>
            <HeaderContextProvider>
              <ToastContextProvider>{children}</ToastContextProvider>
            </HeaderContextProvider>
          </MainContentContextProvider>
        </RouterContextProvider>
      </ScrollProvider>
    </NavProvider>
  )
}

export default AppContext

import { connectRouter } from 'connected-react-router'
import { History } from 'history'
import { combineReducers } from 'redux'

import { reducers as clientStoreReducers } from 'common/store'
import profile from 'common/store/pages/profile/reducer'
import queue from 'common/store/queue/slice'
import remoteConfig from 'common/store/remoteConfig/slice'
import embedModal from 'components/embedModal/store/reducers'
import firstUploadModal from 'components/firstUploadModal/store/slice'
import musicConfetti from 'components/musicConfetti/store/slice'
import passwordReset from 'components/passwordReset/store/reducer'
import remixSettingsModal from 'components/remixSettingsModal/store/slice'
import searchBar from 'components/searchBar/store/reducer'
import serviceSelection from 'components/serviceSelection/store/slice'
import unfollowConfirmation from 'components/unfollowConfirmationModal/store/reducers'
import dashboard from 'pages/landlord-dashboard-page/store/reducer'
import deactivateAccount from 'pages/deactivateAccountPage/store/slice'
import deleted from 'pages/deletedPage/store/slice'
import signOn from 'pages/signOn/store/reducer'
import upload from 'pages/upload-page/store/reducer'
import visualizer from 'pages/visualizer/store/slice'
import appCTAModal from 'store/application/ui/app-cta-modal/slice'
import cookieBanner from 'store/application/ui/cookieBanner/reducer'
import editFolderModal from 'store/application/ui/editFolderModal/slice'
import editContentListModal from 'store/application/ui/editContentListModal/slice'
import editAgreementModal from 'store/application/ui/editAgreementModal/reducer'
import mobileKeyboard from 'store/application/ui/mobileKeyboard/reducer'
import scrollLock from 'store/application/ui/scrollLock/reducer'
import setAsLandlordPickConfirmation from 'store/application/ui/setAsLandlordPickConfirmation/reducer'
import userListModal from 'store/application/ui/userListModal/slice'
import backend from 'store/backend/reducer'
import confirmer from 'store/confirmer/reducer'
import dragndrop from 'store/dragndrop/reducer'
import player from 'store/player/slice'
import contentListLibrary from 'store/content-list-library/slice'

import { webStoreContext } from './storeContext'

export const commonStoreReducers = clientStoreReducers(webStoreContext)

const createRootReducer = (routeHistory: History) =>
  combineReducers({
    // Common store
    ...commonStoreReducers,

    // Router
    router: connectRouter(routeHistory),

    // Config
    backend,
    confirmer,

    // Account
    passwordReset,
    contentListLibrary,

    // UI Functions
    dragndrop,

    // Pages
    upload,
    profile,
    dashboard,
    signOn,
    searchBar,
    serviceSelection,

    // Playback
    queue,
    player,

    // Remote config/flags
    remoteConfig,

    application: combineReducers({
      ui: combineReducers({
        appCTAModal,
        cookieBanner,
        deactivateAccount,
        editFolderModal,
        editContentListModal,
        editAgreementModal,
        embedModal,
        firstUploadModal,
        mobileKeyboard,
        musicConfetti,
        remixSettingsModal,
        scrollLock,
        setAsLandlordPickConfirmation,
        userListModal,
        visualizer
      }),
      pages: combineReducers({
        deleted,
        unfollowConfirmation
      })
    })
  })

export default createRootReducer

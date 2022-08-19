import { BADGE_LOCAL_STORAGE_KEY } from 'pages/live-rewards-page/Tiers'
import ColivingBackend from 'services/ColivingBackend'
import {
  clearColivingAccount,
  clearColivingAccountUser
} from 'services/LocalStorage'
import { SignedOut } from 'services/native-mobile-interface/lifecycle'
import { ReloadMessage } from 'services/native-mobile-interface/linking'
import { IS_MOBILE_USER_KEY } from 'store/account/mobileSagas'
import { removeHasRequestedBrowserPermission } from 'utils/browserNotifications'

import { clearTheme } from './theme/theme'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const COLIVING_EVENTS = 'events'
const COLIVING_USE_METAMASK = 'useMetaMask'

const removeLocalStorageItems = () => {
  const items = [
    COLIVING_EVENTS,
    COLIVING_USE_METAMASK,
    BADGE_LOCAL_STORAGE_KEY,
    IS_MOBILE_USER_KEY
  ]
  items.map((k) => localStorage.removeItem(k))
}

export const signOut = async () => {
  removeLocalStorageItems()
  clearColivingAccount()
  clearColivingAccountUser()
  removeHasRequestedBrowserPermission()
  await ColivingBackend.signOut()
  clearTheme()

  if (NATIVE_MOBILE) {
    new SignedOut().send()
    new ReloadMessage().send()
  } else {
    window.location.reload()
  }
}

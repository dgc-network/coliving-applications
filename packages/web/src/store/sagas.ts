import { all, fork } from 'redux-saga/effects'

import collectionsSagas from 'common/store/cache/collections/sagas'
import coreCacheSagas from 'common/store/cache/sagas'
import agreementsSagas from 'common/store/cache/agreements/sagas'
import usersSagas from 'common/store/cache/users/sagas'
import { sagas as castSagas } from 'common/store/cast/sagas'
import errorSagas from 'common/store/errors/sagas'
import exploreCollectionsPageSagas from 'common/store/pages/explore/exploreCollections/sagas'
import explorePageSagas from 'common/store/pages/explore/sagas'
import reachabilitySagas from 'common/store/reachability/sagas'
import recoveryEmailSagas from 'common/store/recoveryEmail/sagas'
import remoteConfigSagas from 'common/store/remoteConfig/sagas'
import signOutSagas from 'common/store/signOut/sagas'
import landlordRecommendationsSagas from 'common/store/ui/landlordRecommendations/sagas'
import deleteContentListConfirmationModalSagas from 'common/store/ui/deleteContentListConfirmationModal/sagas'
import overflowMenuSagas from 'common/store/ui/mobileOverflowMenu/sagas'
import reactionSagas from 'common/store/ui/reactions/sagas'
import shareModalSagas from 'common/store/ui/shareModal/sagas'
import toastSagas from 'common/store/ui/toast/sagas'
import notificationUsersPageSagas from 'common/store/userList/notifications/sagas'
import addToContentListSagas from 'components/addToContentList/store/sagas'
import changePasswordSagas from 'components/changePassword/store/sagas'
import firstUploadModalSagas from 'components/firstUploadModal/store/sagas'
import notificationSagas from 'components/notification/store/sagas'
import passwordResetSagas from 'components/passwordReset/store/sagas'
import remixSettingsModalSagas from 'components/remixSettingsModal/store/sagas'
import searchBarSagas from 'components/searchBar/store/sagas'
import serviceSelectionSagas from 'components/serviceSelection/store/sagas'
import shareSoundToTikTokModalSagas from 'components/shareSoundToTiktokModal/store/sagas'
import dashboardSagas from 'pages/landlordDashboardPage/store/sagas'
import rewardsPageSagas from 'pages/liveRewardsPage/store/sagas'
import collectionSagas from 'pages/collectionPage/store/sagas'
import deactivateAccountSagas from 'pages/deactivateAccountPage/store/sagas'
import deletedSagas from 'pages/deletedPage/store/sagas'
import favoritePageSagas from 'pages/favoritesPage/sagas'
import feedPageSagas from 'pages/feedPage/store/sagas'
import followersPageSagas from 'pages/followersPage/sagas'
import followingPageSagas from 'pages/followingPage/sagas'
import historySagas from 'pages/historyPage/store/sagas'
import mutualsPageSagas from 'pages/mutualsPage/sagas'
import profileSagas from 'pages/profilePage/sagas'
import remixesSagas from 'pages/remixesPage/store/sagas'
import repostPageSagas from 'pages/repostsPage/sagas'
import savedSagas from 'pages/savedPage/store/sagas'
import searchPageSagas from 'pages/searchPage/store/sagas'
import settingsSagas from 'pages/settingsPage/store/sagas'
import signOnSaga from 'pages/signOn/store/sagas'
import smartCollectionPageSagas from 'pages/smartCollection/store/sagas'
import supportingPageSagas from 'pages/supportingPage/sagas'
import topSupportersPageSagas from 'pages/topSupportersPage/sagas'
import agreementSagas from 'pages/agreementPage/store/sagas'
import trendingPageSagas from 'pages/trendingPage/store/sagas'
import trendingContentListSagas from 'pages/trendingContentLists/store/sagas'
import trendingUndergroundSagas from 'pages/trendingUnderground/store/sagas'
import uploadSagas from 'pages/uploadPage/store/sagas'
import { initInterface } from 'services/nativeMobileInterface/helpers'
import { remoteConfigInstance } from 'services/remoteConfig/remoteConfigInstance'
import accountSagas from 'store/account/sagas'
import analyticsSagas from 'store/analytics/sagas'
import cookieBannerSagas from 'store/application/ui/cookieBanner/sagas'
import scrollLockSagas from 'store/application/ui/scrollLock/sagas'
import stemUploadSagas from 'store/application/ui/stemsUpload/sagas'
import themeSagas from 'store/application/ui/theme/sagas'
import userListModalSagas from 'store/application/ui/userListModal/sagas'
import backendSagas, { setupBackend } from 'store/backend/sagas'
import confirmerSagas from 'store/confirmer/sagas'
import oauthSagas from 'store/oauth/sagas'
import playerSagas from 'store/player/sagas'
import contentListLibrarySagas from 'store/contentListLibrary/sagas'
import queueSagas from 'store/queue/sagas'
import routingSagas from 'store/routing/sagas'
import socialSagas from 'store/social/sagas'
import solanaSagas from 'store/solana/sagas'
import tippingSagas from 'store/tipping/sagas'
import tokenDashboardSagas from 'store/tokenDashboard/sagas'
import walletSagas from 'store/wallet/sagas'

import { webStoreContext } from './storeContext'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export default function* rootSaga() {
  yield fork(setupBackend)
  const sagas = ([] as (() => Generator<any, void, any>)[]).concat(
    // Config
    analyticsSagas(),
    backendSagas(),
    confirmerSagas(),
    cookieBannerSagas(),
    reachabilitySagas(),
    routingSagas(),

    // Account
    accountSagas(),
    contentListLibrarySagas(),
    recoveryEmailSagas(),
    signOutSagas(),

    // Pages
    collectionSagas(),
    dashboardSagas(),
    exploreCollectionsPageSagas(),
    explorePageSagas(),
    feedPageSagas(),
    historySagas(),
    notificationSagas(),
    passwordResetSagas(),
    profileSagas(),
    reactionSagas(),
    rewardsPageSagas(),
    savedSagas(),
    searchBarSagas(),
    searchPageSagas(),
    serviceSelectionSagas(),
    settingsSagas(),
    signOnSaga(),
    socialSagas(),
    agreementSagas(),
    trendingPageSagas(),
    trendingContentListSagas(),
    trendingUndergroundSagas(),
    uploadSagas(),

    // Cache
    coreCacheSagas(),
    collectionsSagas(),
    agreementsSagas(),
    usersSagas(),

    // Playback
    playerSagas(),
    queueSagas(),

    // Wallet
    walletSagas(),

    // Cast
    castSagas(webStoreContext),

    // Application
    addToContentListSagas(),
    landlordRecommendationsSagas(),
    changePasswordSagas(),
    deactivateAccountSagas(),
    deletedSagas(),
    deleteContentListConfirmationModalSagas(),
    favoritePageSagas(),
    firstUploadModalSagas(),
    followersPageSagas(),
    followingPageSagas(),
    supportingPageSagas(),
    topSupportersPageSagas(),
    mutualsPageSagas(),
    notificationUsersPageSagas(),
    remixesSagas(),
    remixSettingsModalSagas(),
    repostPageSagas(),
    scrollLockSagas(),
    shareModalSagas(),
    overflowMenuSagas(),
    toastSagas(),
    shareSoundToTikTokModalSagas(),
    smartCollectionPageSagas(),
    stemUploadSagas(),
    themeSagas(),
    tokenDashboardSagas(),
    userListModalSagas(),
    oauthSagas(),

    // Remote config
    remoteConfigSagas(remoteConfigInstance),

    // Solana
    solanaSagas(),

    // Tipping
    tippingSagas(),

    // Error
    errorSagas()
  )
  if (NATIVE_MOBILE) {
    sagas.push(initInterface)
  }
  yield all(sagas.map(fork))
}

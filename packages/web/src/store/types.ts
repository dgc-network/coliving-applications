import { RouterState } from 'connected-react-router'

import { CommonState } from 'common/store'
import averageColor from 'common/store/averageColor/slice'
import { ChangePasswordState } from 'common/store/changePassword/slice'
import NotificationState from 'common/store/notifications/types'
import { CollectionsPageState } from 'common/store/pages/collection/types'
import HistoryPageState from 'common/store/pages/historyPage/types'
import RemixesPageReducer from 'common/store/pages/remixes/slice'
import { SmartCollectionState } from 'common/store/pages/smartCollection/slice'
import QueueReducer from 'common/store/queue/slice'
import { ReachabilityState } from 'common/store/reachability/types'
import RemoteConfigReducer from 'common/store/remoteConfig/slice'
import StemsUploadReducer from 'common/store/stemsUpload/slice'
import { CreateContentListModalState } from 'common/store/ui/createContentListModal/types'
import { FavoritesPageState } from 'common/store/userList/favorites/types'
import { FollowersPageState } from 'common/store/userList/followers/types'
import { FollowingPageState } from 'common/store/userList/following/types'
import { NotificationUsersPageState } from 'common/store/userList/notifications/types'
import { RepostsPageState } from 'common/store/userList/reposts/types'
import { EmbedModalState } from 'components/embedModal/store/types'
import { FirstUploadModalState } from 'components/firstUploadModal/store/slice'
import MusicConfetti from 'components/musicConfetti/store/slice'
import { PasswordResetState } from 'components/passwordReset/store/types'
import RemixSettingsModalReducer from 'components/remixSettingsModal/store/slice'
import SearchBarState from 'components/searchBar/store/types'
import ServiceSelectionReducer from 'components/serviceSelection/store/slice'
import { UnfollowConfirmationModalState } from 'components/unfollowConfirmationModal/store/types'
import LandlordDashboardState from 'pages/landlord-dashboard-page/store/types'
import { DeactivateAccountState } from 'pages/deactivateAccountPage/store/slice'
import DeletedPageReducer from 'pages/deletedPage/store/slice'
import SignOnPageState from 'pages/signOn/store/types'
import { UploadPageState } from 'pages/upload-page/store/types'
import VisualizerReducer from 'pages/visualizer/store/slice'
import AppCTAModalReducer from 'store/application/ui/app-cta-modal/slice'
import PlayerReducer from 'store/player/slice'
import ContentListLibraryReducer from 'store/content-list-library/slice'

import { CookieBannerState } from './application/ui/cookieBanner/types'
import { EditFolderModalState } from './application/ui/editFolderModal/slice'
import { EditContentListModalState } from './application/ui/editContentListModal/slice'
import EditAgreementModalState from './application/ui/editAgreementModal/types'
import { MobileKeyboardState } from './application/ui/mobileKeyboard/types'
import { ScrollLockState } from './application/ui/scrollLock/types'
import { SetAsLandlordPickConfirmationState } from './application/ui/setAsLandlordPickConfirmation/types'
import { UserListModalState } from './application/ui/userListModal/types'
import { BackendState } from './backend/types'
import { ConfirmerState } from './confirmer/types'
import { DragNDropState } from './dragndrop/types'

export type AppState = CommonState & {
  // Config
  backend: BackendState
  confirmer: ConfirmerState
  reachability: ReachabilityState

  // Account
  passwordReset: PasswordResetState
  contentListLibrary: ReturnType<typeof ContentListLibraryReducer>

  // UI
  dragndrop: DragNDropState
  serviceSelection: ReturnType<typeof ServiceSelectionReducer>

  // Global
  application: {
    ui: {
      appCTAModal: ReturnType<typeof AppCTAModalReducer>
      averageColor: ReturnType<typeof averageColor>
      changePassword: ChangePasswordState
      cookieBanner: CookieBannerState
      createContentListModal: CreateContentListModalState
      editContentListModal: EditContentListModalState
      editFolderModal: EditFolderModalState
      editAgreementModal: EditAgreementModalState
      embedModal: EmbedModalState
      deactivateAccount: DeactivateAccountState
      firstUploadModal: FirstUploadModalState
      mobileKeyboard: MobileKeyboardState
      musicConfetti: ReturnType<typeof MusicConfetti>
      remixSettingsModal: ReturnType<typeof RemixSettingsModalReducer>
      scrollLock: ScrollLockState
      setAsLandlordPickConfirmation: SetAsLandlordPickConfirmationState
      stemsUpload: ReturnType<typeof StemsUploadReducer>
      userListModal: UserListModalState
      visualizer: ReturnType<typeof VisualizerReducer>
    }
    pages: {
      reposts: RepostsPageState
      favorites: FavoritesPageState
      followers: FollowersPageState
      following: FollowingPageState
      notificationUsers: NotificationUsersPageState
      unfollowConfirmation: UnfollowConfirmationModalState
      smartCollection: SmartCollectionState
      remixes: ReturnType<typeof RemixesPageReducer>
      deleted: ReturnType<typeof DeletedPageReducer>
    }
  }

  // Pages
  upload: UploadPageState
  dashboard: LandlordDashboardState
  signOn: SignOnPageState
  history: HistoryPageState
  searchBar: SearchBarState
  collection: CollectionsPageState
  notification: NotificationState

  // Playback
  queue: ReturnType<typeof QueueReducer>
  player: ReturnType<typeof PlayerReducer>

  // Misc
  router: RouterState

  // Remote Config + Flags
  remoteConfig: ReturnType<typeof RemoteConfigReducer>
}

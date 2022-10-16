import { FeedFilter } from 'models/feedFilter'
import { ID, PlayableType } from 'models/identifiers'
import { MonitorPayload, ServiceMonitorType } from 'models/services'
import { TimeRange } from 'models/timeRange'
import { SolanaWalletAddress, StringDigitalcoin, WalletAddress } from 'models/wallet'

const ANALYTICS_DIGITAL_CONTENT_EVENT = 'ANALYTICS/DIGITAL_CONTENT_EVENT'

export enum Name {
  SESSION_START = 'Session Start',
  // Account creation
  // When the user opens the create account page
  CREATE_ACCOUNT_OPEN = 'Create Account: Open',
  // When the user continues past the email page
  CREATE_ACCOUNT_COMPLETE_EMAIL = 'Create Account: Complete Email',
  // When the user continues past the password page
  CREATE_ACCOUNT_COMPLETE_PASSWORD = 'Create Account: Complete Password',
  // When the user starts integrating with twitter
  CREATE_ACCOUNT_START_TWITTER = 'Create Account: Start Twitter',
  // When the user continues past the "twitter connection page"
  CREATE_ACCOUNT_COMPLETE_TWITTER = 'Create Account: Complete Twitter',
  // When the user starts integrating with instagram
  CREATE_ACCOUNT_START_INSTAGRAM = 'Create Account: Start Instagram',
  // When the user continues past the "instagram connection page"
  CREATE_ACCOUNT_COMPLETE_INSTAGRAM = 'Create Account: Complete Instagram',
  // When the user continues past the "profile info page"
  CREATE_ACCOUNT_COMPLETE_PROFILE = 'Create Account: Complete Profile',
  // When the user continues past the follow page
  CREATE_ACCOUNT_COMPLETE_FOLLOW = 'Create Account: Complete Follow',
  // When the user continues past the loading page
  CREATE_ACCOUNT_COMPLETE_CREATING = 'Create Account: Complete Creating',
  // When the user continues past the entire signup modal
  CREATE_ACCOUNT_FINISH = 'Create Account: Finish',
  // When the user gets rate limited during signup auth
  CREATE_ACCOUNT_RATE_LIMIT = 'Create Account: Rate Limit',

  // Sign in
  SIGN_IN_OPEN = 'Sign In: Open',
  SIGN_IN_FINISH = 'Sign In: Finish',
  SIGN_IN_WITH_INCOMPLETE_ACCOUNT = 'Sign In: Incomplete Account',

  // Settings
  SETTINGS_CHANGE_THEME = 'Settings: Change Theme',
  SETTINGS_START_TWITTER_OAUTH = 'Settings: Start Twitter OAuth',
  SETTINGS_COMPLETE_TWITTER_OAUTH = 'Settings: Complete Twitter OAuth',
  SETTINGS_START_INSTAGRAM_OAUTH = 'Settings: Start Instagram OAuth',
  SETTINGS_COMPLETE_INSTAGRAM_OAUTH = 'Settings: Complete Instagram OAuth',
  SETTINGS_RESEND_ACCOUNT_RECOVERY = 'Settings: Resend Account Recovery',
  SETTINGS_START_CHANGE_PASSWORD = 'Settings: Start Change Password',
  SETTINGS_COMPLETE_CHANGE_PASSWORD = 'Settings: Complete Change Password',
  SETTINGS_LOG_OUT = 'Settings: Log Out',

  // TikTok
  TIKTOK_START_OAUTH = 'TikTok: Start TikTok OAuth',
  TIKTOK_COMPLETE_OAUTH = 'TikTok: Complete TikTok OAuth',
  TIKTOK_OAUTH_ERROR = 'TikTok: TikTok OAuth Error',
  TIKTOK_START_SHARE_SOUND = 'TikTok: Start Share Sound',
  TIKTOK_COMPLETE_SHARE_SOUND = 'TikTok: Complete Share Sound',
  TIKTOK_SHARE_SOUND_ERROR = 'TikTok: Share Sound Error',

  // Coliving OAuth Login Page
  COLIVING_OAUTH_START = 'Coliving Oauth: Open Login (authenticate)',
  COLIVING_OAUTH_SUBMIT = 'Coliving Oauth: Submit Login (authenticate)',
  COLIVING_OAUTH_COMPLETE = 'Coliving Oauth: Login (authenticate) Success',
  COLIVING_OAUTH_ERROR = 'Coliving Oauth: Login (authenticate) Failed',

  // Visualizer
  VISUALIZER_OPEN = 'Visualizer: Open',
  VISUALIZER_CLOSE = 'Visualizer: Close',

  // Profile completion
  ACCOUNT_HEALTH_METER_FULL = 'Account Health: Meter Full',
  ACCOUNT_HEALTH_UPLOAD_COVER_PHOTO = 'Account Health: Upload Cover Photo',
  ACCOUNT_HEALTH_UPLOAD_PROFILE_PICTURE = 'Account Health: Upload Profile Picture',
  ACCOUNT_HEALTH_DOWNLOAD_DESKTOP = 'Account Health: Download Desktop',
  ACCOUNT_HEALTH_CLICK_APP_CTA_BANNER = 'Account Health: App CTA Banner',

  // Social actions
  SHARE = 'Share',
  SHARE_TO_TWITTER = 'Share to Twitter',
  REPOST = 'Repost',
  UNDO_REPOST = 'Undo Repost',
  FAVORITE = 'Favorite',
  UNFAVORITE = 'Unfavorite',
  LANDLORD_PICK_SELECT_DIGITAL_CONTENT = 'Author Pick: Select DigitalContent',
  FOLLOW = 'Follow',
  UNFOLLOW = 'Unfollow',

  // ContentList creation
  CONTENT_LIST_ADD = 'ContentList: Add To ContentList',
  CONTENT_LIST_OPEN_CREATE = 'ContentList: Open Create ContentList',
  CONTENT_LIST_START_CREATE = 'ContentList: Start Create ContentList',
  CONTENT_LIST_COMPLETE_CREATE = 'ContentList: Complete Create ContentList',
  CONTENT_LIST_MAKE_PUBLIC = 'ContentList: Make Public',
  CONTENT_LIST_OPEN_EDIT_FROM_LIBRARY = 'ContentList: Open Edit ContentList From Sidebar',

  DELETE = 'Delete',

  // Folders
  FOLDER_OPEN_CREATE = 'Folder: Open Create ContentList Folder',
  FOLDER_SUBMIT_CREATE = 'Folder: Submit Create ContentList Folder',
  FOLDER_CANCEL_CREATE = 'Folder: Cancel Create ContentList Folder',
  FOLDER_OPEN_EDIT = 'Folder: Open Edit ContentList Folder',
  FOLDER_SUBMIT_EDIT = 'Folder: Submit Edit ContentList Folder',
  FOLDER_DELETE = 'Folder: Delete ContentList Folder',
  FOLDER_CANCEL_EDIT = 'Folder: Cancel Edit ContentList Folder',

  // Embed
  EMBED_OPEN = 'Embed: Open modal',
  EMBED_COPY = 'Embed: Copy',

  // Upload
  DIGITAL_CONTENT_UPLOAD_OPEN = 'DigitalContent Upload: Open',
  DIGITAL_CONTENT_UPLOAD_START_UPLOADING = 'DigitalContent Upload: Start Upload',
  DIGITAL_CONTENT_UPLOAD_DIGITAL_CONTENT_UPLOADING = 'DigitalContent Upload: DigitalContent Uploading',
  DIGITAL_CONTENT_UPLOAD_COMPLETE_UPLOAD = 'DigitalContent Upload: Complete Upload',
  DIGITAL_CONTENT_UPLOAD_COPY_LINK = 'DigitalContent Upload: Copy Link',
  DIGITAL_CONTENT_UPLOAD_SHARE_WITH_FANS = 'DigitalContent Upload: Share with your residents',
  DIGITAL_CONTENT_UPLOAD_SHARE_SOUND_TO_TIKTOK = 'DigitalContent Upload: Share sound to TikTok',
  DIGITAL_CONTENT_UPLOAD_VIEW_DIGITAL_CONTENT_PAGE = 'DigitalContent Upload: View DigitalContent page',
  DIGITAL_CONTENT_UPLOAD_SUCCESS = 'DigitalContent Upload: Success',
  DIGITAL_CONTENT_UPLOAD_FAILURE = 'DigitalContent Upload: Failure',
  TWEET_FIRST_UPLOAD = 'Tweet First Upload',

  // Trending
  TRENDING_CHANGE_VIEW = 'Trending: Change view',
  TRENDING_PAGINATE = 'Trending: Fetch next page',

  // Feed
  FEED_CHANGE_VIEW = 'Feed: Change view',
  FEED_PAGINATE = 'Feed: Fetch next page',

  // Notifications
  NOTIFICATIONS_OPEN = 'Notifications: Open',
  NOTIFICATIONS_CLICK_TILE = 'Notifications: Clicked Tile',
  NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE = 'Notifications: Clicked Milestone Twitter Share',
  NOTIFICATIONS_CLICK_REMIX_CREATE_TWITTER_SHARE = 'Notifications: Clicked Remix Create Twitter Share',
  NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE = 'Notifications: Clicked Remix Co-Sign Twitter Share',
  NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE = 'Notifications: Clicked Tip Reaction Twitter Share',
  NOTIFICATIONS_CLICK_TIP_RECEIVED_TWITTER_SHARE = 'Notifications: Clicked Tip Received Twitter Share',
  NOTIFICATIONS_CLICK_TIP_SENT_TWITTER_SHARE = 'Notifications: Clicked Tip Sent Twitter Share',
  NOTIFICATIONS_CLICK_SUPPORTER_RANK_UP_TWITTER_SHARE = 'Notifications: Clicked Supporter Rank Up Twitter Share',
  NOTIFICATIONS_CLICK_SUPPORTING_RANK_UP_TWITTER_SHARE = 'Notifications: Clicked Supporting Rank Up Twitter Share',
  NOTIFICATIONS_CLICK_ADD_DIGITAL_CONTENT_TO_CONTENT_LIST_TWITTER_SHARE = 'Notifications: Clicked Add DigitalContent to ContentList Twitter Share',
  NOTIFICATIONS_TOGGLE_SETTINGS = 'Notifications: Toggle Setting',
  BROWSER_NOTIFICATION_SETTINGS = 'Browser Push Notification',

  // Profile page
  PROFILE_PAGE_TAB_CLICK = 'Profile Page: Tab Click',
  PROFILE_PAGE_SORT = 'Profile Page: Sort',
  PROFILE_PAGE_CLICK_INSTAGRAM = 'Profile Page: Go To Instagram',
  PROFILE_PAGE_CLICK_TWITTER = 'Profile Page: Go To Twitter',
  PROFILE_PAGE_CLICK_TIKTOK = 'Profile Page: Go To TikTok',
  PROFILE_PAGE_CLICK_WEBSITE = 'ProfilePage: Go To Website',
  PROFILE_PAGE_CLICK_DONATION = 'ProfilePage: Go To Donation',
  PROFILE_PAGE_SHOWN_LANDLORD_RECOMMENDATIONS = 'ProfilePage: Shown Author Recommendations',

  // DigitalContent page
  DIGITAL_CONTENT_PAGE_DOWNLOAD = 'DigitalContent Page: Download',
  DIGITAL_CONTENT_PAGE_PLAY_MORE = 'DigitalContent Page: Play More By This Author',

  // Playback
  PLAYBACK_PLAY = 'Playback: Play',
  PLAYBACK_PAUSE = 'Playback: Pause',
  // A listen is when we record against the backend vs. a play which is a UI action
  LISTEN = 'Listen',

  // Navigation
  PAGE_VIEW = 'Page View',
  ON_FIRST_PAGE = 'nav-on-first-page',
  NOT_ON_FIRST_PAGE = 'nav-not-on-first-page',
  LINK_CLICKING = 'Link Click',
  TAG_CLICKING = 'Tag Click',

  // Search
  SEARCH_SEARCH = 'Search: Search',
  SEARCH_TAG_SEARCH = 'Search: Tag Search',
  SEARCH_MORE_RESULTS = 'Search: More Results',
  SEARCH_RESULT_SELECT = 'Search: Result Select',
  SEARCH_TAB_CLICK = 'Search: Tab Click',

  // Errors
  ERROR_PAGE = 'Error Page',
  NOT_FOUND_PAGE = 'Not Found Page',

  // System
  WEB_VITALS = 'Web Vitals',
  PERFORMANCE = 'Performance',
  DISCOVERY_PROVIDER_SELECTION = 'Discovery Node Selection',
  CONTENT_NODE_SELECTION = 'Creator Node Selection',

  // Remixes
  STEM_COMPLETE_UPLOAD = 'Stem: Complete Upload',
  STEM_DELETE = 'Stem: Delete',
  REMIX_NEW_REMIX = 'Remix: New Remix',
  REMIX_COSIGN = 'Remix: CoSign',
  REMIX_COSIGN_INDICATOR = 'Remix: CoSign Indicator',
  REMIX_HIDE = 'Remix: Hide',

  // $DGCO
  SEND_DGCO_REQUEST = 'Send $DGCO: Request',
  SEND_DGCO_SUCCESS = 'Send $DGCO: Success',
  SEND_DGCO_FAILURE = 'Send $DGCO: Failure',

  // LIVE Manager
  TRANSFER_DGCO_TO_WLIVE_REQUEST = 'TRANSFER_DGCO_TO_WLIVE_REQUEST',
  TRANSFER_DGCO_TO_WLIVE_SUCCESS = 'TRANSFER_DGCO_TO_WLIVE_SUCCESS',
  TRANSFER_DGCO_TO_WLIVE_FAILURE = 'TRANSFER_DGCO_TO_WLIVE_FAILURE',

  // Service monitoring
  SERVICE_MONITOR_REQUEST = 'Service Monitor: Request',
  SERVICE_MONITOR_HEALTH_CHECK = 'Service Monitor: Status',

  // ContentList library
  CONTENT_LIST_LIBRARY_REORDER = 'ContentList Library: Reorder',
  CONTENT_LIST_LIBRARY_MOVE_CONTENT_LIST_INTO_FOLDER = 'ContentList Library: Move ContentList Into Folder',
  CONTENT_LIST_LIBRARY_ADD_CONTENT_LIST_TO_FOLDER = 'ContentList Library: Add ContentList To Folder',
  CONTENT_LIST_LIBRARY_MOVE_CONTENT_LIST_OUT_OF_FOLDER = 'ContentList Library: Move ContentList Out of Folder',
  CONTENT_LIST_LIBRARY_EXPAND_FOLDER = 'ContentList Library: Expand Folder',
  CONTENT_LIST_LIBRARY_COLLAPSE_FOLDER = 'ContentList Library: Collapse Folder',
  // When an update is available in the contentList library
  CONTENT_LIST_LIBRARY_HAS_UPDATE = 'ContentList Library: Has Update',
  // When a user clicks on a contentList in the library
  CONTENT_LIST_LIBRARY_CLICKED = 'ContentList Library: Clicked',

  // Deactivate Account
  DEACTIVATE_ACCOUNT_PAGE_VIEW = 'Deactivate Account: Page View',
  DEACTIVATE_ACCOUNT_REQUEST = 'Deactivate Account: Request',
  DEACTIVATE_ACCOUNT_SUCCESS = 'Deactivate Account: Success',
  DEACTIVATE_ACCOUNT_FAILURE = 'Deactivate Account: Failure',

  // Create User Bank
  CREATE_USER_BANK_REQUEST = 'Create User Bank: Request',
  CREATE_USER_BANK_SUCCESS = 'Create User Bank: Success',
  CREATE_USER_BANK_FAILURE = 'Create User Bank: Failure',

  // Rewards
  REWARDS_CLAIM_START = 'Rewards Claim: Start Claim',
  REWARDS_CLAIM_SUCCESS = 'Rewards Claim: Success',
  REWARDS_CLAIM_RETRY = 'Rewards Claim: Retry',
  REWARDS_CLAIM_FAILURE = 'Rewards Claim: Failure',
  REWARDS_CLAIM_HCAPTCHA = 'Rewards Claim: Hcaptcha',
  REWARDS_CLAIM_COGNITO = 'Rewards Claim: Cognito',
  REWARDS_CLAIM_REJECTION = 'Rewards Claim: Rejection',
  REWARDS_CLAIM_UNKNOWN = 'Rewards Claim: Unknown',
  REWARDS_CLAIM_START_COGNITO_FLOW = 'Rewards Claim: Start Cognito Flow',
  REWARDS_CLAIM_FINISH_COGNITO_FLOW = 'Rewards Claim: Finish Cognito Flow',

  // Tipping
  TIP_DGCO_REQUEST = 'Tip Audio: Request',
  TIP_DGCO_SUCCESS = 'Tip Audio: Success',
  TIP_DGCO_FAILURE = 'Tip Audio: Failure',
  TIP_DGCO_TWITTER_SHARE = 'Tip Audio: Twitter Share',
  TIP_FEED_TILE_DISMISS = 'Tip Feed Tile: Dismiss',

  // Social Proof
  SOCIAL_PROOF_OPEN = 'Social Proof: Open',
  SOCIAL_PROOF_SUCCESS = 'Social Proof: Success',
  SOCIAL_PROOF_ERROR = 'Social Proof: Error'
}

type PageView = {
  eventName: Name.PAGE_VIEW
  route: string
}

// Create Account
type CreateAccountOpen = {
  eventName: Name.CREATE_ACCOUNT_OPEN
  source:
    | 'nav profile'
    | 'nav button'
    | 'landing page'
    | 'account icon'
    | 'social action'
    | 'sign in page'
  // todo: are we missing 'restricted page' in this list?
}
type CreateAccountCompleteEmail = {
  eventName: Name.CREATE_ACCOUNT_COMPLETE_EMAIL
  emailAddress: string
}
type CreateAccountCompletePassword = {
  eventName: Name.CREATE_ACCOUNT_COMPLETE_PASSWORD
  emailAddress: string
}
type CreateAccountStartTwitter = {
  eventName: Name.CREATE_ACCOUNT_START_TWITTER
  emailAddress: string
}
type CreateAccountCompleteTwitter = {
  eventName: Name.CREATE_ACCOUNT_COMPLETE_TWITTER
  isVerified: boolean
  emailAddress: string
  handle: string
}
type CreateAccountStartInstagram = {
  eventName: Name.CREATE_ACCOUNT_START_INSTAGRAM
  emailAddress: string
}
type CreateAccountCompleteInstagram = {
  eventName: Name.CREATE_ACCOUNT_COMPLETE_INSTAGRAM
  isVerified: boolean
  emailAddress: string
  handle: string
}
type CreateAccountCompleteProfile = {
  eventName: Name.CREATE_ACCOUNT_COMPLETE_PROFILE
  emailAddress: string
  handle: string
}
type CreateAccountCompleteFollow = {
  eventName: Name.CREATE_ACCOUNT_COMPLETE_FOLLOW
  emailAddress: string
  handle: string
  users: string
  count: number
}
type CreateAccountCompleteCreating = {
  eventName: Name.CREATE_ACCOUNT_COMPLETE_CREATING
  emailAddress: string
  handle: string
}
type CreateAccountOpenFinish = {
  eventName: Name.CREATE_ACCOUNT_FINISH
  emailAddress: string
  handle: string
}

// Sign In
type SignInOpen = {
  eventName: Name.SIGN_IN_OPEN
  source: 'sign up page'
}
type SignInFinish = {
  eventName: Name.SIGN_IN_FINISH
  status: 'success' | 'invalid credentials'
}

type SignInWithIncompleteAccount = {
  eventName: Name.SIGN_IN_WITH_INCOMPLETE_ACCOUNT
  handle: string
}

// Settings
type SettingsChangeTheme = {
  eventName: Name.SETTINGS_CHANGE_THEME
  mode: 'dark' | 'light' | 'matrix' | 'auto'
}
type SettingsStartTwitterOauth = {
  eventName: Name.SETTINGS_START_TWITTER_OAUTH
  handle: string
}
type SettingsCompleteTwitterOauth = {
  eventName: Name.SETTINGS_COMPLETE_TWITTER_OAUTH
  handle: string
  screen_name: string
  is_verified: boolean
}
type SettingsStartInstagramOauth = {
  eventName: Name.SETTINGS_START_INSTAGRAM_OAUTH
  handle: string
}
type SettingsCompleteInstagramOauth = {
  eventName: Name.SETTINGS_COMPLETE_INSTAGRAM_OAUTH
  handle: string
  username: string
  is_verified: boolean
}
type SettingsResetAccountRecovery = {
  eventName: Name.SETTINGS_RESEND_ACCOUNT_RECOVERY
}
type SettingsStartChangePassword = {
  eventName: Name.SETTINGS_START_CHANGE_PASSWORD
}
type SettingsCompleteChangePassword = {
  eventName: Name.SETTINGS_COMPLETE_CHANGE_PASSWORD
  status: 'success' | 'failure'
}
type SettingsLogOut = {
  eventName: Name.SETTINGS_LOG_OUT
}

// TikTok
type TikTokStartOAuth = {
  eventName: Name.TIKTOK_START_OAUTH
}

type TikTokCompleteOAuth = {
  eventName: Name.TIKTOK_COMPLETE_OAUTH
}

type TikTokOAuthError = {
  eventName: Name.TIKTOK_OAUTH_ERROR
  error: string
}

type TikTokStartShareSound = {
  eventName: Name.TIKTOK_START_SHARE_SOUND
}

type TikTokCompleteShareSound = {
  eventName: Name.TIKTOK_COMPLETE_SHARE_SOUND
}

type TikTokShareSoundError = {
  eventName: Name.TIKTOK_SHARE_SOUND_ERROR
  error: string
}

// Error
type ErrorPage = {
  eventName: Name.ERROR_PAGE
  error: string
  name: string
}
type NotFoundPage = {
  eventName: Name.NOT_FOUND_PAGE
}

// Visualizer
type VisualizerOpen = {
  eventName: Name.VISUALIZER_OPEN
}
type VisualizerClose = {
  eventName: Name.VISUALIZER_CLOSE
}

type AccountHealthMeterFull = {
  eventName: Name.ACCOUNT_HEALTH_METER_FULL
}
type AccountHealthUploadCoverPhoto = {
  eventName: Name.ACCOUNT_HEALTH_UPLOAD_COVER_PHOTO
  source: 'original' | 'unsplash' | 'url'
}
type AccountHealthUploadProfilePhoto = {
  eventName: Name.ACCOUNT_HEALTH_UPLOAD_PROFILE_PICTURE
  source: 'original' | 'unsplash' | 'url'
}
type AccountHealthDownloadDesktop = {
  eventName: Name.ACCOUNT_HEALTH_DOWNLOAD_DESKTOP
  source: 'banner' | 'settings'
}

type AccountHealthCTABanner = {
  eventName: Name.ACCOUNT_HEALTH_CLICK_APP_CTA_BANNER
}

// Social
export enum ShareSource {
  TILE = 'tile',
  PAGE = 'page',
  NOW_PLAYING = 'now playing',
  OVERFLOW = 'overflow'
}
export enum RepostSource {
  TILE = 'tile',
  PLAYBAR = 'playbar',
  NOW_PLAYING = 'now playing',
  DIGITAL_CONTENT_PAGE = 'page',
  COLLECTION_PAGE = 'collection page',
  HISTORY_PAGE = 'history page',
  FAVORITES_PAGE = 'favorites page',
  OVERFLOW = 'overflow',
  DIGITAL_CONTENT_LIST = 'digital_content list'
}
export enum FavoriteSource {
  TILE = 'tile',
  PLAYBAR = 'playbar',
  NOW_PLAYING = 'now playing',
  DIGITAL_CONTENT_PAGE = 'page',
  COLLECTION_PAGE = 'collection page',
  HISTORY_PAGE = 'history page',
  FAVORITES_PAGE = 'favorites page',
  OVERFLOW = 'overflow',
  DIGITAL_CONTENT_LIST = 'digital_content list',
  SIGN_UP = 'sign up',
  // Favorite triggered by some implicit action, e.g.
  // you had a smart collection and it was favorited so it
  // shows in your left-nav.
  IMPLICIT = 'implicit',
  NAVIGATOR = 'navigator'
}
export enum FollowSource {
  PROFILE_PAGE = 'profile page',
  DIGITAL_CONTENT_PAGE = 'digital_content page',
  COLLECTION_PAGE = 'collection page',
  HOVER_TILE = 'hover tile',
  OVERFLOW = 'overflow',
  USER_LIST = 'user list',
  LANDLORD_RECOMMENDATIONS_POPUP = 'author recommendations popup',
  EMPTY_FEED = 'empty feed'
}

type Share = {
  eventName: Name.SHARE
  kind: 'profile' | 'album' | 'contentList' | 'digital_content'
  source: ShareSource
  id: string
  url: string
}

export type ShareToTwitter = {
  eventName: Name.SHARE_TO_TWITTER
  kind: 'profile' | 'album' | 'contentList' | 'digital_content' | 'liveNftContentList'
  source: ShareSource
  id: number
  url: string
}

type Repost = {
  eventName: Name.REPOST
  kind: PlayableType
  source: RepostSource
  id: string
}
type UndoRepost = {
  eventName: Name.UNDO_REPOST
  kind: PlayableType
  source: RepostSource
  id: string
}
type Favorite = {
  eventName: Name.FAVORITE
  kind: PlayableType
  source: FavoriteSource
  id: string
}
type Unfavorite = {
  eventName: Name.UNFAVORITE
  kind: PlayableType
  source: FavoriteSource
  id: string
}
type LandlordPickSelectDigitalContent = {
  eventName: Name.LANDLORD_PICK_SELECT_DIGITAL_CONTENT
  id: string
}
type Follow = {
  eventName: Name.FOLLOW
  id: string
  source: FollowSource
}
type Unfollow = {
  eventName: Name.UNFOLLOW
  id: string
  source: FollowSource
}
type TweetFirstUpload = {
  eventName: Name.TWEET_FIRST_UPLOAD
  handle: string
}

// ContentList
export enum CreateContentListSource {
  NAV = 'nav',
  CREATE_PAGE = 'create page',
  FROM_DIGITAL_CONTENT = 'from digital_content',
  FAVORITES_PAGE = 'favorites page'
}

type ContentListAdd = {
  eventName: Name.CONTENT_LIST_ADD
  digitalContentId: string
  contentListId: string
}
type ContentListOpenCreate = {
  eventName: Name.CONTENT_LIST_OPEN_CREATE
  source: CreateContentListSource
}
type ContentListStartCreate = {
  eventName: Name.CONTENT_LIST_START_CREATE
  source: CreateContentListSource
  artworkSource: 'unsplash' | 'original'
}
type ContentListCompleteCreate = {
  eventName: Name.CONTENT_LIST_COMPLETE_CREATE
  source: CreateContentListSource
  status: 'success' | 'failure'
}
type ContentListMakePublic = {
  eventName: Name.CONTENT_LIST_MAKE_PUBLIC
  id: string
}

type ContentListOpenEditFromLibrary = {
  eventName: Name.CONTENT_LIST_OPEN_EDIT_FROM_LIBRARY
}

type Delete = {
  eventName: Name.DELETE
  kind: PlayableType
  id: string
}

// Folder

type FolderOpenCreate = {
  eventName: Name.FOLDER_OPEN_CREATE
}

type FolderSubmitCreate = {
  eventName: Name.FOLDER_SUBMIT_CREATE
}

type FolderCancelCreate = {
  eventName: Name.FOLDER_CANCEL_CREATE
}

type FolderOpenEdit = {
  eventName: Name.FOLDER_OPEN_EDIT
}

type FolderSubmitEdit = {
  eventName: Name.FOLDER_SUBMIT_EDIT
}

type FolderDelete = {
  eventName: Name.FOLDER_DELETE
}

type FolderCancelEdit = {
  eventName: Name.FOLDER_CANCEL_EDIT
}

// Embed
type EmbedOpen = {
  eventName: Name.EMBED_OPEN
  kind: PlayableType
  id: string
}
type EmbedCopy = {
  eventName: Name.EMBED_COPY
  kind: PlayableType
  id: string
  size: 'card' | 'compact' | 'tiny'
}

// DigitalContent Upload
type DigitalContentUploadOpen = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_OPEN
  source: 'nav' | 'profile' | 'signup'
}
type DigitalContentUploadStartUploading = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_START_UPLOADING
  count: number
  kind: 'digitalContents' | 'album' | 'contentList'
}
type DigitalContentUploadDigitalContentUploading = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_DIGITAL_CONTENT_UPLOADING
  artworkSource: 'unsplash' | 'original'
  genre: string
  mood: string
  downloadable: 'yes' | 'no' | 'follow'
}
type DigitalContentUploadCompleteUpload = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_COMPLETE_UPLOAD
  count: number
  kind: 'digitalContents' | 'album' | 'contentList'
}

type DigitalContentUploadSuccess = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_SUCCESS
  endpoint: string
  kind: 'single_digital_content' | 'multi_digital_content' | 'album' | 'contentList'
}

type DigitalContentUploadFailure = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_FAILURE
  endpoint: string
  kind: 'single_digital_content' | 'multi_digital_content' | 'album' | 'contentList'
  error?: string
}

type DigitalContentUploadCopyLink = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_COPY_LINK
  uploadType: string
  url: string
}
type DigitalContentUploadShareWithFans = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_SHARE_WITH_FANS
  uploadType: string
  text: string
}
type DigitalContentUploadShareSoundToTikTok = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_SHARE_SOUND_TO_TIKTOK
}
type DigitalContentUploadViewDigitalContentPage = {
  eventName: Name.DIGITAL_CONTENT_UPLOAD_VIEW_DIGITAL_CONTENT_PAGE
  uploadType: string
}

// Trending
type TrendingChangeView = {
  eventName: Name.TRENDING_CHANGE_VIEW
  timeframe: TimeRange
  genre: string
}
type TrendingPaginate = {
  eventName: Name.TRENDING_PAGINATE
  offset: number
  limit: number
}

// Feed
type FeedChangeView = {
  eventName: Name.FEED_CHANGE_VIEW
  view: FeedFilter
}
type FeedPaginate = {
  eventName: Name.FEED_PAGINATE
  offset: number
  limit: number
}

// Notifications
type NotificationsOpen = {
  eventName: Name.NOTIFICATIONS_OPEN
  source: 'button' | 'push notifications'
}
type NotificationsClickTile = {
  eventName: Name.NOTIFICATIONS_CLICK_TILE
  kind: string
  link_to: string
}
type NotificationsClickMilestone = {
  eventName: Name.NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE
  milestone: string
}
type NotificationsClickRemixCreate = {
  eventName: Name.NOTIFICATIONS_CLICK_REMIX_CREATE_TWITTER_SHARE
  text: string
}
type NotificationsClickRemixCosign = {
  eventName: Name.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE
  text: string
}
type NotificationsClickTipReaction = {
  eventName: Name.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE
  text: string
}
type NotificationsClickTipReceived = {
  eventName: Name.NOTIFICATIONS_CLICK_TIP_RECEIVED_TWITTER_SHARE
  text: string
}
type NotificationsClickTipSent = {
  eventName: Name.NOTIFICATIONS_CLICK_TIP_SENT_TWITTER_SHARE
  text: string
}
type NotificationsClickSupporterRankUp = {
  eventName: Name.NOTIFICATIONS_CLICK_SUPPORTER_RANK_UP_TWITTER_SHARE
  text: string
}
type NotificationsClickSupportingRankUp = {
  eventName: Name.NOTIFICATIONS_CLICK_SUPPORTING_RANK_UP_TWITTER_SHARE
  text: string
}
type NotificationsClickAddDigitalContentToContentList = {
  eventName: Name.NOTIFICATIONS_CLICK_ADD_DIGITAL_CONTENT_TO_CONTENT_LIST_TWITTER_SHARE
  text: string
}
type NotificationsToggleSettings = {
  eventName: Name.NOTIFICATIONS_TOGGLE_SETTINGS
  settings: string
  enabled: boolean
}

// Profile
type ProfilePageTabClick = {
  eventName: Name.PROFILE_PAGE_TAB_CLICK
  tab: 'digitalContents' | 'albums' | 'reposts' | 'contentLists' | 'collectibles'
}
type ProfilePageSort = {
  eventName: Name.PROFILE_PAGE_SORT
  sort: 'recent' | 'popular'
}
type ProfilePageClickInstagram = {
  eventName: Name.PROFILE_PAGE_CLICK_INSTAGRAM
  handle: string
  instagramHandle: string
}
type ProfilePageClickTwitter = {
  eventName: Name.PROFILE_PAGE_CLICK_TWITTER
  handle: string
  twitterHandle: string
}
type ProfilePageClickTikTok = {
  eventName: Name.PROFILE_PAGE_CLICK_TIKTOK
  handle: string
  tikTokHandle: string
}
type ProfilePageClickWebsite = {
  eventName: Name.PROFILE_PAGE_CLICK_WEBSITE
  handle: string
  website: string
}
type ProfilePageClickDonation = {
  eventName: Name.PROFILE_PAGE_CLICK_DONATION
  handle: string
  donation: string
}
type ProfilePageShownLandlordRecommendations = {
  eventName: Name.PROFILE_PAGE_SHOWN_LANDLORD_RECOMMENDATIONS
  userId: number
}

// DigitalContent Page
type DigitalContentPageDownload = {
  eventName: Name.DIGITAL_CONTENT_PAGE_DOWNLOAD
  id: ID
  category?: string
  parent_digital_content_id?: ID
}
type DigitalContentPagePlayMore = {
  eventName: Name.DIGITAL_CONTENT_PAGE_PLAY_MORE
  id: ID
}

// Playback
export enum PlaybackSource {
  PLAYBAR = 'playbar',
  NOW_PLAYING = 'now playing',
  CONTENT_LIST_PAGE = 'contentList page',
  DIGITAL_CONTENT_PAGE = 'digital_content page',
  DIGITAL_CONTENT_TILE = 'digital_content tile',
  CONTENT_LIST_DIGITAL_CONTENT = 'contentList page digital_content list',
  CONTENT_LIST_TILE_DIGITAL_CONTENT = 'contentList digital_content tile',
  HISTORY_PAGE = 'history page',
  FAVORITES_PAGE = 'favorites page',
  PASSIVE = 'passive',
  EMBED_PLAYER = 'embed player'
}

type PlaybackPlay = {
  eventName: Name.PLAYBACK_PLAY
  id?: string
  source: PlaybackSource
}
type PlaybackPause = {
  eventName: Name.PLAYBACK_PAUSE
  id?: string
  source: PlaybackSource
}

// Linking
type LinkClicking = {
  eventName: Name.LINK_CLICKING
  url: string
  source: 'profile page' | 'digital_content page' | 'collection page'
}
type TagClicking = {
  eventName: Name.TAG_CLICKING
  tag: string
  source: 'profile page' | 'digital_content page' | 'collection page'
}

// Search
type SearchTerm = {
  eventName: Name.SEARCH_SEARCH
  term: string
  source: 'autocomplete' | 'search results page' | 'more results page'
}

type SearchTag = {
  eventName: Name.SEARCH_TAG_SEARCH
  tag: string
  source: 'autocomplete' | 'search results page' | 'more results page'
}

type SearchMoreResults = {
  eventName: Name.SEARCH_MORE_RESULTS
  term: string
  source: 'autocomplete' | 'search results page' | 'more results page'
}

type SearchResultSelect = {
  eventName: Name.SEARCH_RESULT_SELECT
  term: string
  source: 'autocomplete' | 'search results page' | 'more results page'
  id: ID
  kind: 'digital_content' | 'profile' | 'contentList' | 'album'
}

type SearchTabClick = {
  eventName: Name.SEARCH_TAB_CLICK
  term: string
  tab: 'people' | 'digitalContents' | 'albums' | 'contentLists'
}
type Listen = {
  eventName: Name.LISTEN
  digitalContentId: string
}

type OnFirstPage = {
  eventName: Name.ON_FIRST_PAGE
}

type NotOnFirstPage = {
  eventName: Name.NOT_ON_FIRST_PAGE
}

type BrowserNotificationSetting = {
  eventName: Name.BROWSER_NOTIFICATION_SETTINGS
  provider: 'safari' | 'gcm'
  enabled: boolean
}

type WebVitals = {
  eventName: Name.WEB_VITALS
  metric: string
  value: number
  route: string
}

type Performance = {
  eventName: Name.PERFORMANCE
  metric: string
  value: number
}

type DiscoveryNodeSelection = {
  eventName: Name.DISCOVERY_PROVIDER_SELECTION
  endpoint: string
  reason: string
}

type ContentNodeSelection = {
  eventName: Name.CONTENT_NODE_SELECTION
  selectedAs: 'primary' | 'secondary'
  endpoint: string
  reason: string
}

type StemCompleteUpload = {
  eventName: Name.STEM_COMPLETE_UPLOAD
  id: number
  parent_digital_content_id: number
  category: string
}

type StemDelete = {
  eventName: Name.STEM_DELETE
  id: number
  parent_digital_content_id: number
}

type RemixNewRemix = {
  eventName: Name.REMIX_NEW_REMIX
  id: number
  handle: string
  title: string
  parent_digital_content_id: number
  parent_digital_content_title: string
  parent_digital_content_user_handle: string
}

type RemixCosign = {
  eventName: Name.REMIX_COSIGN
  id: number
  handle: string
  action: 'reposted' | 'favorited'
  original_digital_content_id: number
  original_digital_content_title: string
}

type RemixCosignIndicator = {
  eventName: Name.REMIX_COSIGN_INDICATOR
  id: number
  handle: string
  action: 'reposted' | 'favorited'
  original_digital_content_id: number
  original_digital_content_title: string
}

type RemixHide = {
  eventName: Name.REMIX_HIDE
  id: number
  handle: string
}

type SendAudioRequest = {
  eventName: Name.SEND_DGCO_REQUEST
  from: WalletAddress
  recipient: WalletAddress
}

type SendAudioSuccess = {
  eventName: Name.SEND_DGCO_SUCCESS
  from: WalletAddress
  recipient: WalletAddress
}

type SendAudioFailure = {
  eventName: Name.SEND_DGCO_FAILURE
  from: WalletAddress
  recipient: WalletAddress
  error: string
}

type TransferAudioToWAudioRequest = {
  eventName: Name.TRANSFER_DGCO_TO_WLIVE_REQUEST
  from: WalletAddress
}

type TransferAudioToWAudioSuccess = {
  eventName: Name.TRANSFER_DGCO_TO_WLIVE_SUCCESS
  from: WalletAddress
  txSignature: string
  logs: string
}

type TransferAudioToWAudioFailure = {
  eventName: Name.TRANSFER_DGCO_TO_WLIVE_FAILURE
  from: WalletAddress
}

type ServiceMonitorRequest = {
  eventName: Name.SERVICE_MONITOR_REQUEST
  type: ServiceMonitorType
} & MonitorPayload

type ServiceMonitorHealthCheck = {
  eventName: Name.SERVICE_MONITOR_HEALTH_CHECK
  type: ServiceMonitorType
} & MonitorPayload

type ContentListLibraryReorder = {
  eventName: Name.CONTENT_LIST_LIBRARY_REORDER
  // Whether or not the reorder contains newly created temp contentLists
  containsTemporaryContentLists: boolean
  kind: 'library-content-list' | 'contentList' | 'content-list-folder'
}

type ContentListLibraryHasUpdate = {
  eventName: Name.CONTENT_LIST_LIBRARY_HAS_UPDATE
  count: number
}

type ContentListLibraryClicked = {
  eventName: Name.CONTENT_LIST_LIBRARY_CLICKED
  contentListId: ID
  hasUpdate: boolean
}

type ContentListLibraryMoveContentListIntoFolder = {
  eventName: Name.CONTENT_LIST_LIBRARY_MOVE_CONTENT_LIST_INTO_FOLDER
}

type ContentListLibraryAddContentListToFolder = {
  eventName: Name.CONTENT_LIST_LIBRARY_ADD_CONTENT_LIST_TO_FOLDER
}

type ContentListLibraryMoveContentListOutOfFolder = {
  eventName: Name.CONTENT_LIST_LIBRARY_MOVE_CONTENT_LIST_OUT_OF_FOLDER
}

type ContentListLibraryExpandFolder = {
  eventName: Name.CONTENT_LIST_LIBRARY_EXPAND_FOLDER
}

type ContentListLibraryCollapseFolder = {
  eventName: Name.CONTENT_LIST_LIBRARY_COLLAPSE_FOLDER
}

type DeactivateAccountPageView = {
  eventName: Name.DEACTIVATE_ACCOUNT_PAGE_VIEW
}
type DeactivateAccountRequest = {
  eventName: Name.DEACTIVATE_ACCOUNT_REQUEST
}
type DeactivateAccountSuccess = {
  eventName: Name.DEACTIVATE_ACCOUNT_SUCCESS
}
type DeactivateAccountFailure = {
  eventName: Name.DEACTIVATE_ACCOUNT_FAILURE
}

type CreateUserBankRequest = {
  eventName: Name.CREATE_USER_BANK_REQUEST
  userId: ID
}

type CreateUserBankSuccess = {
  eventName: Name.CREATE_USER_BANK_SUCCESS
  userId: ID
}

type CreateUserBankFailure = {
  eventName: Name.CREATE_USER_BANK_FAILURE
  userId: ID
  errorCode: string
  error: string
}

type RewardsClaimStart = {
  eventName: Name.REWARDS_CLAIM_START
  userId: string
  challengeId: string
  specifier: string
  amount: number
  source: string
}

type RewardsClaimSuccess = {
  eventName: Name.REWARDS_CLAIM_SUCCESS
  userId: string
  challengeId: string
  specifier: string
  amount: number
  source: string
}

type RewardsClaimRetry = {
  eventName: Name.REWARDS_CLAIM_RETRY
  userId: string
  challengeId: string
  specifier: string
  amount: number
  source: string
  error: string
  phase: string
}

type RewardsClaimFailure = {
  eventName: Name.REWARDS_CLAIM_FAILURE
  userId: string
  challengeId: string
  specifier: string
  amount: number
  source: string
  error: string
  phase: string
}

type RewardsClaimRejection = {
  eventName: Name.REWARDS_CLAIM_REJECTION
  userId: string
  challengeId: string
  specifier: string
  amount: number
  source: string
  error: string
}

type RewardsClaimUnknown = {
  eventName: Name.REWARDS_CLAIM_UNKNOWN
  userId: string
  challengeId: string
  specifier: string
  amount: number
  source: string
  error: string
}

type TipAudioRequest = {
  eventName: Name.TIP_DGCO_REQUEST
  amount: StringDigitalcoin
  senderWallet: SolanaWalletAddress
  recipientWallet: SolanaWalletAddress
  senderHandle: string
  recipientHandle: string
  source: 'profile' | 'feed'
  device: 'web' | 'native'
}

type TipAudioSuccess = {
  eventName: Name.TIP_DGCO_SUCCESS
  amount: StringDigitalcoin
  senderWallet: SolanaWalletAddress
  recipientWallet: SolanaWalletAddress
  senderHandle: string
  recipientHandle: string
  source: 'profile' | 'feed'
  device: 'web' | 'native'
}

type TipAudioFailure = {
  eventName: Name.TIP_DGCO_FAILURE
  amount: StringDigitalcoin
  senderWallet: SolanaWalletAddress
  recipientWallet: SolanaWalletAddress
  senderHandle: string
  recipientHandle: string
  error: string
  source: 'profile' | 'feed'
  device: 'web' | 'native'
}

type TipAudioTwitterShare = {
  eventName: Name.TIP_DGCO_TWITTER_SHARE
  amount: StringDigitalcoin
  senderWallet: SolanaWalletAddress
  recipientWallet: SolanaWalletAddress
  senderHandle: string
  recipientHandle: string
  source: 'profile' | 'feed'
  device: 'web' | 'native'
}

type TipFeedTileDismiss = {
  eventName: Name.TIP_FEED_TILE_DISMISS
  accountId: string
  receiverId: string
  device: 'web' | 'native'
}

type SocialProofOpen = {
  eventName: Name.SOCIAL_PROOF_OPEN
  kind: 'instagram' | 'twitter'
  handle: string
}

type SocialProofSuccess = {
  eventName: Name.SOCIAL_PROOF_SUCCESS
  kind: 'instagram' | 'twitter'
  handle: string
  screenName: string
}

type SocialProofError = {
  eventName: Name.SOCIAL_PROOF_ERROR
  kind: 'instagram' | 'twitter'
  handle: string
  error: string
}

type ColivingOauthStart = {
  eventName: Name.COLIVING_OAUTH_START
  redirectUriParam: string | string[]
  originParam: string | string[] | undefined | null
  appNameParam: string | string[]
  responseMode: string | string[] | undefined | null
}

type ColivingOauthSubmit = {
  eventName: Name.COLIVING_OAUTH_SUBMIT
  alreadySignedIn: boolean
}

type ColivingOauthComplete = {
  eventName: Name.COLIVING_OAUTH_COMPLETE
}

type ColivingOauthError = {
  eventName: Name.COLIVING_OAUTH_ERROR
  isUserError: boolean
  error: string
}

export type BaseAnalyticsEvent = { type: typeof ANALYTICS_DIGITAL_CONTENT_EVENT }

export type AllTrackingEvents =
  | CreateAccountOpen
  | CreateAccountCompleteEmail
  | CreateAccountCompletePassword
  | CreateAccountStartTwitter
  | CreateAccountCompleteTwitter
  | CreateAccountStartInstagram
  | CreateAccountCompleteInstagram
  | CreateAccountCompleteProfile
  | CreateAccountCompleteFollow
  | CreateAccountCompleteCreating
  | CreateAccountOpenFinish
  | SignInOpen
  | SignInFinish
  | SignInWithIncompleteAccount
  | SettingsChangeTheme
  | SettingsStartTwitterOauth
  | SettingsCompleteTwitterOauth
  | SettingsStartInstagramOauth
  | SettingsCompleteInstagramOauth
  | SettingsResetAccountRecovery
  | SettingsStartChangePassword
  | SettingsCompleteChangePassword
  | SettingsLogOut
  | TikTokStartOAuth
  | TikTokCompleteOAuth
  | TikTokOAuthError
  | TikTokStartShareSound
  | TikTokCompleteShareSound
  | TikTokShareSoundError
  | VisualizerOpen
  | VisualizerClose
  | AccountHealthMeterFull
  | AccountHealthUploadCoverPhoto
  | AccountHealthUploadProfilePhoto
  | AccountHealthDownloadDesktop
  | AccountHealthCTABanner
  | Share
  | ShareToTwitter
  | Repost
  | UndoRepost
  | Favorite
  | Unfavorite
  | LandlordPickSelectDigitalContent
  | ContentListAdd
  | ContentListOpenCreate
  | ContentListStartCreate
  | ContentListCompleteCreate
  | ContentListMakePublic
  | ContentListOpenEditFromLibrary
  | Delete
  | EmbedOpen
  | EmbedCopy
  | DigitalContentUploadOpen
  | DigitalContentUploadStartUploading
  | DigitalContentUploadDigitalContentUploading
  | DigitalContentUploadCompleteUpload
  | DigitalContentUploadSuccess
  | DigitalContentUploadFailure
  | DigitalContentUploadCopyLink
  | DigitalContentUploadShareWithFans
  | DigitalContentUploadShareSoundToTikTok
  | DigitalContentUploadViewDigitalContentPage
  | TrendingChangeView
  | TrendingPaginate
  | FeedChangeView
  | FeedPaginate
  | NotificationsOpen
  | NotificationsClickTile
  | NotificationsClickMilestone
  | NotificationsClickRemixCreate
  | NotificationsClickRemixCosign
  | NotificationsClickTipReaction
  | NotificationsClickTipReceived
  | NotificationsClickTipSent
  | NotificationsClickSupporterRankUp
  | NotificationsClickSupportingRankUp
  | NotificationsClickAddDigitalContentToContentList
  | NotificationsToggleSettings
  | ProfilePageTabClick
  | ProfilePageSort
  | ProfilePageClickInstagram
  | ProfilePageClickTwitter
  | ProfilePageClickTikTok
  | ProfilePageClickWebsite
  | ProfilePageClickDonation
  | ProfilePageShownLandlordRecommendations
  | DigitalContentPageDownload
  | DigitalContentPagePlayMore
  | PlaybackPlay
  | PlaybackPause
  | Follow
  | Unfollow
  | LinkClicking
  | TagClicking
  | SearchTerm
  | SearchTag
  | SearchMoreResults
  | SearchResultSelect
  | SearchTabClick
  | Listen
  | ErrorPage
  | NotFoundPage
  | PageView
  | OnFirstPage
  | NotOnFirstPage
  | BrowserNotificationSetting
  | TweetFirstUpload
  | DiscoveryNodeSelection
  | ContentNodeSelection
  | WebVitals
  | Performance
  | StemCompleteUpload
  | StemDelete
  | RemixNewRemix
  | RemixCosign
  | RemixCosignIndicator
  | RemixHide
  | SendAudioRequest
  | SendAudioSuccess
  | SendAudioFailure
  | ServiceMonitorRequest
  | ServiceMonitorHealthCheck
  | ContentListLibraryReorder
  | ContentListLibraryHasUpdate
  | ContentListLibraryClicked
  | ContentListLibraryMoveContentListIntoFolder
  | ContentListLibraryAddContentListToFolder
  | ContentListLibraryMoveContentListOutOfFolder
  | ContentListLibraryExpandFolder
  | ContentListLibraryCollapseFolder
  | TransferAudioToWAudioRequest
  | TransferAudioToWAudioSuccess
  | TransferAudioToWAudioFailure
  | DeactivateAccountPageView
  | DeactivateAccountRequest
  | DeactivateAccountSuccess
  | DeactivateAccountFailure
  | CreateUserBankRequest
  | CreateUserBankSuccess
  | CreateUserBankFailure
  | RewardsClaimStart
  | RewardsClaimSuccess
  | RewardsClaimRetry
  | RewardsClaimFailure
  | RewardsClaimRejection
  | RewardsClaimUnknown
  | TipAudioRequest
  | TipAudioSuccess
  | TipAudioFailure
  | TipAudioTwitterShare
  | TipFeedTileDismiss
  | SocialProofOpen
  | SocialProofSuccess
  | SocialProofError
  | FolderOpenCreate
  | FolderSubmitCreate
  | FolderCancelCreate
  | FolderOpenEdit
  | FolderSubmitEdit
  | FolderDelete
  | FolderCancelEdit
  | ColivingOauthStart
  | ColivingOauthComplete
  | ColivingOauthSubmit
  | ColivingOauthError

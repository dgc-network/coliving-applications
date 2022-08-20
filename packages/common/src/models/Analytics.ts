import { FeedFilter } from 'models/FeedFilter'
import { ID, PlayableType } from 'models/Identifiers'
import { MonitorPayload, ServiceMonitorType } from 'models/Services'
import { TimeRange } from 'models/TimeRange'
import { SolanaWalletAddress, StringAudio, WalletAddress } from 'models/Wallet'

const ANALYTICS_AGREEMENT_EVENT = 'ANALYTICS/AGREEMENT_EVENT'

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
  ARTIST_PICK_SELECT_AGREEMENT = 'Artist Pick: Select Agreement',
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
  AGREEMENT_UPLOAD_OPEN = 'Agreement Upload: Open',
  AGREEMENT_UPLOAD_START_UPLOADING = 'Agreement Upload: Start Upload',
  AGREEMENT_UPLOAD_AGREEMENT_UPLOADING = 'Agreement Upload: Agreement Uploading',
  AGREEMENT_UPLOAD_COMPLETE_UPLOAD = 'Agreement Upload: Complete Upload',
  AGREEMENT_UPLOAD_COPY_LINK = 'Agreement Upload: Copy Link',
  AGREEMENT_UPLOAD_SHARE_WITH_FANS = 'Agreement Upload: Share with your fans',
  AGREEMENT_UPLOAD_SHARE_SOUND_TO_TIKTOK = 'Agreement Upload: Share sound to TikTok',
  AGREEMENT_UPLOAD_VIEW_AGREEMENT_PAGE = 'Agreement Upload: View Agreement page',
  AGREEMENT_UPLOAD_SUCCESS = 'Agreement Upload: Success',
  AGREEMENT_UPLOAD_FAILURE = 'Agreement Upload: Failure',
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
  NOTIFICATIONS_CLICK_ADD_AGREEMENT_TO_CONTENT_LIST_TWITTER_SHARE = 'Notifications: Clicked Add Agreement to ContentList Twitter Share',
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
  PROFILE_PAGE_SHOWN_ARTIST_RECOMMENDATIONS = 'ProfilePage: Shown Artist Recommendations',

  // Agreement page
  AGREEMENT_PAGE_DOWNLOAD = 'Agreement Page: Download',
  AGREEMENT_PAGE_PLAY_MORE = 'Agreement Page: Play More By This Artist',

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

  // $LIVE
  SEND_LIVE_REQUEST = 'Send $LIVE: Request',
  SEND_LIVE_SUCCESS = 'Send $LIVE: Success',
  SEND_LIVE_FAILURE = 'Send $LIVE: Failure',

  // LIVE Manager
  TRANSFER_LIVE_TO_WLIVE_REQUEST = 'TRANSFER_LIVE_TO_WLIVE_REQUEST',
  TRANSFER_LIVE_TO_WLIVE_SUCCESS = 'TRANSFER_LIVE_TO_WLIVE_SUCCESS',
  TRANSFER_LIVE_TO_WLIVE_FAILURE = 'TRANSFER_LIVE_TO_WLIVE_FAILURE',

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
  TIP_LIVE_REQUEST = 'Tip Audio: Request',
  TIP_LIVE_SUCCESS = 'Tip Audio: Success',
  TIP_LIVE_FAILURE = 'Tip Audio: Failure',
  TIP_LIVE_TWITTER_SHARE = 'Tip Audio: Twitter Share',
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
  AGREEMENT_PAGE = 'page',
  COLLECTION_PAGE = 'collection page',
  HISTORY_PAGE = 'history page',
  FAVORITES_PAGE = 'favorites page',
  OVERFLOW = 'overflow',
  AGREEMENT_LIST = 'agreement list'
}
export enum FavoriteSource {
  TILE = 'tile',
  PLAYBAR = 'playbar',
  NOW_PLAYING = 'now playing',
  AGREEMENT_PAGE = 'page',
  COLLECTION_PAGE = 'collection page',
  HISTORY_PAGE = 'history page',
  FAVORITES_PAGE = 'favorites page',
  OVERFLOW = 'overflow',
  AGREEMENT_LIST = 'agreement list',
  SIGN_UP = 'sign up',
  // Favorite triggered by some implicit action, e.g.
  // you had a smart collection and it was favorited so it
  // shows in your left-nav.
  IMPLICIT = 'implicit',
  NAVIGATOR = 'navigator'
}
export enum FollowSource {
  PROFILE_PAGE = 'profile page',
  AGREEMENT_PAGE = 'agreement page',
  COLLECTION_PAGE = 'collection page',
  HOVER_TILE = 'hover tile',
  OVERFLOW = 'overflow',
  USER_LIST = 'user list',
  ARTIST_RECOMMENDATIONS_POPUP = 'artist recommendations popup',
  EMPTY_FEED = 'empty feed'
}

type Share = {
  eventName: Name.SHARE
  kind: 'profile' | 'album' | 'contentList' | 'agreement'
  source: ShareSource
  id: string
  url: string
}

export type ShareToTwitter = {
  eventName: Name.SHARE_TO_TWITTER
  kind: 'profile' | 'album' | 'contentList' | 'agreement' | 'liveNftContentList'
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
type ArtistPickSelectAgreement = {
  eventName: Name.ARTIST_PICK_SELECT_AGREEMENT
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
  FROM_AGREEMENT = 'from agreement',
  FAVORITES_PAGE = 'favorites page'
}

type ContentListAdd = {
  eventName: Name.CONTENT_LIST_ADD
  agreementId: string
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

// Agreement Upload
type AgreementUploadOpen = {
  eventName: Name.AGREEMENT_UPLOAD_OPEN
  source: 'nav' | 'profile' | 'signup'
}
type AgreementUploadStartUploading = {
  eventName: Name.AGREEMENT_UPLOAD_START_UPLOADING
  count: number
  kind: 'agreements' | 'album' | 'contentList'
}
type AgreementUploadAgreementUploading = {
  eventName: Name.AGREEMENT_UPLOAD_AGREEMENT_UPLOADING
  artworkSource: 'unsplash' | 'original'
  genre: string
  mood: string
  downloadable: 'yes' | 'no' | 'follow'
}
type AgreementUploadCompleteUpload = {
  eventName: Name.AGREEMENT_UPLOAD_COMPLETE_UPLOAD
  count: number
  kind: 'agreements' | 'album' | 'contentList'
}

type AgreementUploadSuccess = {
  eventName: Name.AGREEMENT_UPLOAD_SUCCESS
  endpoint: string
  kind: 'single_agreement' | 'multi_agreement' | 'album' | 'contentList'
}

type AgreementUploadFailure = {
  eventName: Name.AGREEMENT_UPLOAD_FAILURE
  endpoint: string
  kind: 'single_agreement' | 'multi_agreement' | 'album' | 'contentList'
  error?: string
}

type AgreementUploadCopyLink = {
  eventName: Name.AGREEMENT_UPLOAD_COPY_LINK
  uploadType: string
  url: string
}
type AgreementUploadShareWithFans = {
  eventName: Name.AGREEMENT_UPLOAD_SHARE_WITH_FANS
  uploadType: string
  text: string
}
type AgreementUploadShareSoundToTikTok = {
  eventName: Name.AGREEMENT_UPLOAD_SHARE_SOUND_TO_TIKTOK
}
type AgreementUploadViewAgreementPage = {
  eventName: Name.AGREEMENT_UPLOAD_VIEW_AGREEMENT_PAGE
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
type NotificationsClickAddAgreementToContentList = {
  eventName: Name.NOTIFICATIONS_CLICK_ADD_AGREEMENT_TO_CONTENT_LIST_TWITTER_SHARE
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
  tab: 'agreements' | 'albums' | 'reposts' | 'contentLists' | 'collectibles'
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
type ProfilePageShownArtistRecommendations = {
  eventName: Name.PROFILE_PAGE_SHOWN_ARTIST_RECOMMENDATIONS
  userId: number
}

// Agreement Page
type AgreementPageDownload = {
  eventName: Name.AGREEMENT_PAGE_DOWNLOAD
  id: ID
  category?: string
  parent_agreement_id?: ID
}
type AgreementPagePlayMore = {
  eventName: Name.AGREEMENT_PAGE_PLAY_MORE
  id: ID
}

// Playback
export enum PlaybackSource {
  PLAYBAR = 'playbar',
  NOW_PLAYING = 'now playing',
  CONTENT_LIST_PAGE = 'contentList page',
  AGREEMENT_PAGE = 'agreement page',
  AGREEMENT_TILE = 'agreement tile',
  CONTENT_LIST_AGREEMENT = 'contentList page agreement list',
  CONTENT_LIST_TILE_AGREEMENT = 'contentList agreement tile',
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
  source: 'profile page' | 'agreement page' | 'collection page'
}
type TagClicking = {
  eventName: Name.TAG_CLICKING
  tag: string
  source: 'profile page' | 'agreement page' | 'collection page'
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
  kind: 'agreement' | 'profile' | 'contentList' | 'album'
}

type SearchTabClick = {
  eventName: Name.SEARCH_TAB_CLICK
  term: string
  tab: 'people' | 'agreements' | 'albums' | 'contentLists'
}
type Listen = {
  eventName: Name.LISTEN
  agreementId: string
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

type DiscoveryProviderSelection = {
  eventName: Name.DISCOVERY_PROVIDER_SELECTION
  endpoint: string
  reason: string
}

type CreatorNodeSelection = {
  eventName: Name.CONTENT_NODE_SELECTION
  selectedAs: 'primary' | 'secondary'
  endpoint: string
  reason: string
}

type StemCompleteUpload = {
  eventName: Name.STEM_COMPLETE_UPLOAD
  id: number
  parent_agreement_id: number
  category: string
}

type StemDelete = {
  eventName: Name.STEM_DELETE
  id: number
  parent_agreement_id: number
}

type RemixNewRemix = {
  eventName: Name.REMIX_NEW_REMIX
  id: number
  handle: string
  title: string
  parent_agreement_id: number
  parent_agreement_title: string
  parent_agreement_user_handle: string
}

type RemixCosign = {
  eventName: Name.REMIX_COSIGN
  id: number
  handle: string
  action: 'reposted' | 'favorited'
  original_agreement_id: number
  original_agreement_title: string
}

type RemixCosignIndicator = {
  eventName: Name.REMIX_COSIGN_INDICATOR
  id: number
  handle: string
  action: 'reposted' | 'favorited'
  original_agreement_id: number
  original_agreement_title: string
}

type RemixHide = {
  eventName: Name.REMIX_HIDE
  id: number
  handle: string
}

type SendAudioRequest = {
  eventName: Name.SEND_LIVE_REQUEST
  from: WalletAddress
  recipient: WalletAddress
}

type SendAudioSuccess = {
  eventName: Name.SEND_LIVE_SUCCESS
  from: WalletAddress
  recipient: WalletAddress
}

type SendAudioFailure = {
  eventName: Name.SEND_LIVE_FAILURE
  from: WalletAddress
  recipient: WalletAddress
  error: string
}

type TransferAudioToWAudioRequest = {
  eventName: Name.TRANSFER_LIVE_TO_WLIVE_REQUEST
  from: WalletAddress
}

type TransferAudioToWAudioSuccess = {
  eventName: Name.TRANSFER_LIVE_TO_WLIVE_SUCCESS
  from: WalletAddress
  txSignature: string
  logs: string
}

type TransferAudioToWAudioFailure = {
  eventName: Name.TRANSFER_LIVE_TO_WLIVE_FAILURE
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
  kind: 'library-contentList' | 'contentList' | 'contentList-folder'
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
  eventName: Name.TIP_LIVE_REQUEST
  amount: StringAudio
  senderWallet: SolanaWalletAddress
  recipientWallet: SolanaWalletAddress
  senderHandle: string
  recipientHandle: string
  source: 'profile' | 'feed'
  device: 'web' | 'native'
}

type TipAudioSuccess = {
  eventName: Name.TIP_LIVE_SUCCESS
  amount: StringAudio
  senderWallet: SolanaWalletAddress
  recipientWallet: SolanaWalletAddress
  senderHandle: string
  recipientHandle: string
  source: 'profile' | 'feed'
  device: 'web' | 'native'
}

type TipAudioFailure = {
  eventName: Name.TIP_LIVE_FAILURE
  amount: StringAudio
  senderWallet: SolanaWalletAddress
  recipientWallet: SolanaWalletAddress
  senderHandle: string
  recipientHandle: string
  error: string
  source: 'profile' | 'feed'
  device: 'web' | 'native'
}

type TipAudioTwitterShare = {
  eventName: Name.TIP_LIVE_TWITTER_SHARE
  amount: StringAudio
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

export type BaseAnalyticsEvent = { type: typeof ANALYTICS_AGREEMENT_EVENT }

export type AllAgreementingEvents =
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
  | ArtistPickSelectAgreement
  | ContentListAdd
  | ContentListOpenCreate
  | ContentListStartCreate
  | ContentListCompleteCreate
  | ContentListMakePublic
  | ContentListOpenEditFromLibrary
  | Delete
  | EmbedOpen
  | EmbedCopy
  | AgreementUploadOpen
  | AgreementUploadStartUploading
  | AgreementUploadAgreementUploading
  | AgreementUploadCompleteUpload
  | AgreementUploadSuccess
  | AgreementUploadFailure
  | AgreementUploadCopyLink
  | AgreementUploadShareWithFans
  | AgreementUploadShareSoundToTikTok
  | AgreementUploadViewAgreementPage
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
  | NotificationsClickAddAgreementToContentList
  | NotificationsToggleSettings
  | ProfilePageTabClick
  | ProfilePageSort
  | ProfilePageClickInstagram
  | ProfilePageClickTwitter
  | ProfilePageClickTikTok
  | ProfilePageClickWebsite
  | ProfilePageClickDonation
  | ProfilePageShownArtistRecommendations
  | AgreementPageDownload
  | AgreementPagePlayMore
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
  | DiscoveryProviderSelection
  | CreatorNodeSelection
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

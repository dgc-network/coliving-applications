import { ID } from '@coliving/common'
import { push as pushRoute } from 'connected-react-router'
import { Location as HistoryLocation } from 'history'
import { matchPath } from 'react-router'

import { encodeUrlName } from 'common/utils/formatUtil'

/**
 * Generate a short base36 hash for a given string.
 * Used to generate short hashes for for queries and urls.
 */
export const getHash = (str: string) =>
  Math.abs(
    str.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
  ).toString(36)

const USE_HASH_ROUTING = process.env.REACT_APP_USE_HASH_ROUTING === 'true'

// Host/protocol.
export const BASE_URL = `${
  process.env.REACT_APP_PUBLIC_PROTOCOL || 'https:'
}//${process.env.REACT_APP_PUBLIC_HOSTNAME || 'coliving.lol'}`
export const BASE_GA_URL = `${
  process.env.REACT_APP_PUBLIC_PROTOCOL || 'https:'
}//${process.env.REACT_APP_GA_HOSTNAME || 'coliving.lol'}`
export const BASENAME = process.env.PUBLIC_URL

// External Routes
export const PRIVACY_POLICY = '/legal/privacy-policy'
export const COOKIE_POLICY = `${BASE_URL}${PRIVACY_POLICY}`
export const TERMS_OF_SERVICE = '/legal/terms-of-use'
export const DOWNLOAD_START_LINK = '/download?start_download=true'
export const DOWNLOAD_LINK = '/download'
export const PRESS_PAGE = '/press'
export const AUTH_REDIRECT = '/auth-redirect'

// App Routes
export const ANDROID_PLAY_STORE_LINK =
  'https://play.google.com/store/apps/details?id=co.coliving.app'
export const IOS_WEBSITE_STORE_LINK =
  'https://apps.apple.com/us/app/coliving-music/id1491270519'
export const IOS_APP_STORE_LINK = 'itms-apps://us/app/coliving-music/id1491270519'

// Static routes.
export const FEED_PAGE = '/feed'
export const TRENDING_PAGE = '/trending'
export const TRENDING_CONTENT_LISTS_PAGE_LEGACY = '/trending/contentLists'

export const EXPLORE_PAGE = '/explore'
export const EXPLORE_HEAVY_ROTATION_PAGE = '/explore/heavy-rotation'
export const EXPLORE_LET_THEM_DJ_PAGE = '/explore/let-them-dj'
export const EXPLORE_BEST_NEW_RELEASES_PAGE = '/explore/best-new-releases'
export const EXPLORE_UNDER_THE_RADAR_PAGE = '/explore/under-the-radar'
export const EXPLORE_TOP_ALBUMS_PAGE = '/explore/top-albums'
export const EXPLORE_MOST_LOVED_PAGE = '/explore/most-loved'
export const EXPLORE_FEELING_LUCKY_PAGE = '/explore/feeling-lucky'
export const EXPLORE_MOOD_CONTENT_LISTS_PAGE = '/explore/:mood'
export const TRENDING_CONTENT_LISTS_PAGE = '/explore/contentLists'
export const TRENDING_UNDERGROUND_PAGE = '/explore/underground'
export const EXPLORE_REMIXABLES_PAGE = '/explore/remixables'

export const LIVE_NFT_CONTENT_LIST_PAGE = '/:handle/digitalcoin-nft-content-list'

export const SAVED_PAGE = '/favorites'
export const FAVORITES_PAGE = '/favorites'
export const HISTORY_PAGE = '/history'
export const DASHBOARD_PAGE = '/dashboard'
export const LIVE_PAGE = '/digitalcoin'
export const UPLOAD_PAGE = '/upload'
export const UPLOAD_ALBUM_PAGE = '/upload/album'
export const UPLOAD_CONTENT_LIST_PAGE = '/upload/contentList'
export const SETTINGS_PAGE = '/settings'
export const HOME_PAGE = '/'
export const NOT_FOUND_PAGE = '/404'
export const SIGN_IN_PAGE = '/signin'
export const SIGN_UP_PAGE = '/signup'
export const ERROR_PAGE = '/error'
export const OAUTH_LOGIN_PAGE = '/oauth/auth'
export const NOTIFICATION_PAGE = '/notifications'
export const APP_REDIRECT = '/app-redirect'
export const CHECK_PAGE = '/check'
export const DEACTIVATE_PAGE = '/deactivate'

// Param routes.
export const NOTIFICATION_USERS_PAGE = '/notification/:notificationId/users'
export const ANNOUNCEMENT_PAGE = '/notification/:notificationId'
export const SEARCH_CATEGORY_PAGE = '/search/:query/:category'
export const SEARCH_PAGE = '/search/:query?'
export const CONTENT_LIST_PAGE = '/:handle/contentList/:contentListName'
export const ALBUM_PAGE = '/:handle/album/:albumName'
export const DIGITAL_CONTENT_PAGE = '/:handle/:slug'
export const DIGITAL_CONTENT_REMIXES_PAGE = '/:handle/:slug/remixes'
export const PROFILE_PAGE = '/:handle'
export const PROFILE_PAGE_DIGITAL_CONTENTS = '/:handle/digitalContents'
export const PROFILE_PAGE_ALBUMS = '/:handle/albums'
export const PROFILE_PAGE_CONTENT_LISTS = '/:handle/contentLists'
export const PROFILE_PAGE_REPOSTS = '/:handle/reposts'
export const PROFILE_PAGE_COLLECTIBLES = '/:handle/collectibles'
export const PROFILE_PAGE_COLLECTIBLE_DETAILS =
  '/:handle/collectibles/:collectibleId'
// Opaque id routes
export const DIGITAL_CONTENT_ID_PAGE = '/digital_contents/:id'
export const USER_ID_PAGE = '/users/:id'
export const CONTENT_LIST_ID_PAGE = '/contentLists/:id'

// Mobile Only Routes
export const REPOSTING_USERS_ROUTE = '/reposting_users'
export const FAVORITING_USERS_ROUTE = '/favoriting_users'
export const FOLLOWING_USERS_ROUTE = '/following'
export const FOLLOWERS_USERS_ROUTE = '/followers'
export const SUPPORTING_USERS_ROUTE = '/supporting'
export const TOP_SUPPORTERS_USERS_ROUTE = '/top-supporters'
export const ACCOUNT_SETTINGS_PAGE = '/settings/account'
export const ACCOUNT_VERIFICATION_SETTINGS_PAGE =
  '/settings/account/verification'
export const NOTIFICATION_SETTINGS_PAGE = '/settings/notifications'
export const ABOUT_SETTINGS_PAGE = '/settings/about'
export const CHANGE_PASSWORD_SETTINGS_PAGE = '/settings/change-password'
export const TRENDING_GENRES = '/trending/genres'
export const EMPTY_PAGE = '/empty_page'

// External Links
export const COLIVING_TWITTER_LINK = 'https://twitter.com/dgc-network'
export const COLIVING_INSTAMGRAM_LINK = 'https://www.instagram.com/colivingmusic'
export const COLIVING_DISCORD_LINK = 'https://discord.gg/coliving'
export const COLIVING_PRESS_LINK = 'https://brand.coliving.lol'
export const COLIVING_MERCH_LINK = 'https://merch.coliving.lol/'
export const COLIVING_REMIX_CONTESTS_LINK = 'https://remix.coliving.lol/'
export const COLIVING_BLOG_LINK = 'https://blog.coliving.lol/'

// Org Links
export const COLIVING_ORG = 'https://coliving.lol'
export const COLIVING_DOCS_LINK = 'https://docs.coliving.lol'
export const COLIVING_TEAM_LINK = 'https://coliving.lol/team'
export const COLIVING_DEV_STAKER_LINK = 'https://coliving.lol/protocol'

export const COLIVING_HOME_LINK = '/'
export const COLIVING_LISTENING_LINK = '/trending'
export const COLIVING_SIGN_UP_LINK = '/signup'
export const COLIVING_HOT_AND_NEW =
  '/coliving/contentList/hot-new-on-coliving-%F0%9F%94%A5-4281'
export const COLIVING_EXPLORE_LINK = '/explore'

export const COLIVING_CAREERS_LINK = 'https://jobs.lever.co/coliving'
export const COLIVING_PODCAST_LINK =
  'https://www.youtube.com/contentList?list=PLKEECkHRxmPag5iYp4dTK5fGoRcoX40RY'
export const COLIVING_CYPHER_LINK = 'https://discord.gg/coliving'
export const COLIVING_API_LINK = 'https://coliving.lol/api'

export const authenticatedRoutes = [
  FEED_PAGE,
  SAVED_PAGE,
  HISTORY_PAGE,
  UPLOAD_PAGE,
  SETTINGS_PAGE,
  DEACTIVATE_PAGE
]

export const publicSiteRoutes = [
  PRESS_PAGE,
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  DOWNLOAD_LINK,
  AUTH_REDIRECT
]

// ordered list of routes the App attempts to match in increasing order of route selectivity
export const orderedRoutes = [
  ERROR_PAGE,
  SIGN_IN_PAGE,
  SIGN_UP_PAGE,
  FEED_PAGE,
  NOTIFICATION_USERS_PAGE,
  ANNOUNCEMENT_PAGE,
  NOTIFICATION_PAGE,
  TRENDING_GENRES,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  EMPTY_PAGE,
  SEARCH_CATEGORY_PAGE,
  SEARCH_PAGE,
  UPLOAD_ALBUM_PAGE,
  UPLOAD_CONTENT_LIST_PAGE,
  UPLOAD_PAGE,
  SAVED_PAGE,
  HISTORY_PAGE,
  DASHBOARD_PAGE,
  LIVE_PAGE,
  SETTINGS_PAGE,
  ACCOUNT_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE,
  ABOUT_SETTINGS_PAGE,
  NOT_FOUND_PAGE,
  HOME_PAGE,
  CONTENT_LIST_PAGE,
  ALBUM_PAGE,
  DIGITAL_CONTENT_PAGE,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  FOLLOWING_USERS_ROUTE,
  FOLLOWERS_USERS_ROUTE,
  SUPPORTING_USERS_ROUTE,
  TOP_SUPPORTERS_USERS_ROUTE,
  PROFILE_PAGE,
  PROFILE_PAGE_COLLECTIBLES,
  PROFILE_PAGE_COLLECTIBLE_DETAILS
]

export const staticRoutes = new Set([
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  SAVED_PAGE,
  FAVORITES_PAGE,
  HISTORY_PAGE,
  DASHBOARD_PAGE,
  LIVE_PAGE,
  UPLOAD_PAGE,
  UPLOAD_ALBUM_PAGE,
  UPLOAD_CONTENT_LIST_PAGE,
  SETTINGS_PAGE,
  HOME_PAGE,
  NOT_FOUND_PAGE,
  EMPTY_PAGE,
  SIGN_IN_PAGE,
  SIGN_UP_PAGE,
  ERROR_PAGE,
  NOTIFICATION_PAGE,
  APP_REDIRECT,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  FOLLOWING_USERS_ROUTE,
  FOLLOWERS_USERS_ROUTE,
  SUPPORTING_USERS_ROUTE,
  TOP_SUPPORTERS_USERS_ROUTE,
  ACCOUNT_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE,
  ABOUT_SETTINGS_PAGE,
  TRENDING_GENRES
])

/** Given a pathname, finds a matching route */
export const findRoute = (pathname: string) => {
  for (const route of orderedRoutes) {
    const match = matchPath(pathname, { path: route, exact: true })
    if (match) {
      return route
    }
  }
  return null
}

// Create full formed urls for routes.
export const fullDigitalContentPage = (permalink: string) => {
  return `${BASE_URL}${permalink}`
}

export const digitalContentRemixesPage = (permalink: string) => {
  return `${permalink}/remixes`
}
export const fullDigitalContentRemixesPage = (permalink: string) => {
  return `${fullDigitalContentPage(permalink)}/remixes`
}

export const albumPage = (handle: string, title: string, id: ID) => {
  return `/${encodeUrlName(handle)}/album/${encodeUrlName(title)}-${id}`
}
export const fullAlbumPage = (handle: string, title: string, id: ID) => {
  return `${BASE_URL}${albumPage(handle, title, id)}`
}

export const contentListPage = (
  handle: string,
  title: string,
  id: ID | string
) => {
  return `/${encodeUrlName(handle)}/contentList/${encodeUrlName(title)}-${id}`
}
export const fullContentListPage = (handle: string, title: string, id: ID) => {
  return `${BASE_URL}${contentListPage(handle, title, id)}`
}

export const liveNftContentListPage = (handle: string) => {
  return `/${encodeUrlName(handle)}/digitalcoin-nft-content-list`
}
export const fullAudioNftContentListPage = (handle: string) => {
  return `${BASE_URL}${liveNftContentListPage(handle)}`
}

export const collectibleDetailsPage = (
  handle: string,
  collectibleId: string
) => {
  return `/${encodeUrlName(handle)}/collectibles/${getHash(collectibleId)}`
}
export const fullCollectibleDetailsPage = (
  handle: string,
  collectibleId: string
) => {
  return `${BASE_URL}${collectibleDetailsPage(handle, collectibleId)}`
}

export const profilePage = (handle: string) => {
  return `/${encodeUrlName(handle)}`
}
export const fullProfilePage = (handle: string) => {
  return `${BASE_URL}${profilePage(handle)}`
}

export const searchResultsPage = (query: string) => {
  return `/search/${query}`
}

export const fullSearchResultsPage = (query: string) => {
  return `${BASE_URL}${searchResultsPage(query)}`
}

export const exploreMoodContentListsPage = (mood: string) => {
  return `/explore/${mood}`
}

export const doesMatchRoute = (route: string, exact = true) => {
  return matchPath(getPathname(), {
    path: route,
    exact
  })
}

export const stripBaseUrl = (url: string) => url.replace(BASE_URL, '')

/**
 * Gets the pathname from the location or the hashed path name
 * if using hash routing
 * @param {Location} location
 */
export const getPathname = (
  location: Location | HistoryLocation = window.location
) => {
  // If this is a Location, pathname will have a host. If it's a HistoryLocation,
  // the hashrouter will automatically understand the pathname to be the hash route
  if (USE_HASH_ROUTING && 'host' in location) {
    return location.hash.replace('#', '')
  }
  return BASENAME ? location.pathname.replace(BASENAME, '') : location.pathname
}

/**
 * For a given route, checks if any of the previous routes in the `orderedRoutes` array matches the window's pathname
 * Returns true if none of the previous routes mach and it does, otherwise false.
 */
export const doesRenderPage = (pageRoute: string) => {
  const pgIndex = orderedRoutes.findIndex((route) => route === pageRoute)
  if (pgIndex === -1) return false
  const noPreviousMatches = orderedRoutes.slice(0, pgIndex).every((route) => {
    return !matchPath(getPathname(), {
      path: route,
      exact: true
    })
  })
  if (!noPreviousMatches) return false
  return matchPath(getPathname(), {
    path: pageRoute,
    exact: true
  })
}

export const recordGoToSignup = (callback: () => void) => {
  if ((window as any).analytics) {
    ;(window as any).analytics.digital_content(
      'Create Account: Open',
      { source: 'landing page' },
      null,
      callback
    )
  } else {
    callback()
  }
}

/**
 * Forces a reload of the window by manually setting the location.href
 */
export const pushWindowRoute = (route: string) => {
  let routeToPush: string
  if (USE_HASH_ROUTING) {
    routeToPush = `/#${route}`
  } else {
    routeToPush = route
  }

  if (route === COLIVING_SIGN_UP_LINK) {
    recordGoToSignup(() => {
      window.location.href = `${BASENAME}${routeToPush}`
    })
  } else {
    window.location.href = `${BASENAME}${routeToPush}`
  }
}

/**
 * Only calls push route if unique (not current route)
 */
export const pushUniqueRoute = (route: string) => {
  const pathname = getPathname()
  if (route !== pathname) {
    return pushRoute(route)
  }
  return { type: '' }
}

import { matchPath } from 'react-router'

import { getCollectionAgreementsLineup } from 'common/store/pages/collection/selectors'
import { getDiscoverFeedLineup } from 'common/store/pages/feed/selectors'
import { getHistoryAgreementsLineup } from 'common/store/pages/historyPage/selectors'
import { getProfileAgreementsLineup } from 'common/store/pages/profile/selectors'
import { getSavedAgreementsLineup } from 'common/store/pages/savedPage/selectors'
import { getSearchAgreementsLineup } from 'common/store/pages/searchResults/selectors'
import { getLineup } from 'common/store/pages/agreement/selectors'
import { getCurrentDiscoverTrendingLineup } from 'common/store/pages/trending/selectors'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  SAVED_PAGE,
  HISTORY_PAGE,
  SEARCH_CATEGORY_PAGE,
  SEARCH_PAGE,
  CONTENT_LIST_PAGE,
  ALBUM_PAGE,
  AGREEMENT_PAGE,
  PROFILE_PAGE,
  UPLOAD_PAGE,
  DASHBOARD_PAGE,
  SETTINGS_PAGE,
  NOT_FOUND_PAGE,
  getPathname
} from 'utils/route'

export const getLineupSelectorForRoute = (state) => {
  const matchPage = (path) => {
    const match = matchPath(getPathname(), {
      path,
      exact: true
    })
    return !!match
  }

  if (
    matchPage(UPLOAD_PAGE) ||
    matchPage(DASHBOARD_PAGE) ||
    matchPage(SETTINGS_PAGE) ||
    matchPage(NOT_FOUND_PAGE)
  ) {
    return () => null
  }

  if (matchPage(FEED_PAGE)) {
    return getDiscoverFeedLineup
  }
  if (matchPage(TRENDING_PAGE)) {
    return getCurrentDiscoverTrendingLineup
  }
  if (matchPage(SEARCH_CATEGORY_PAGE) || matchPage(SEARCH_PAGE)) {
    return getSearchAgreementsLineup
  }
  if (matchPage(SAVED_PAGE)) {
    return getSavedAgreementsLineup
  }
  if (matchPage(HISTORY_PAGE)) {
    return getHistoryAgreementsLineup
  }
  if (matchPage(CONTENT_LIST_PAGE) || matchPage(ALBUM_PAGE)) {
    return getCollectionAgreementsLineup
  }
  if (matchPage(AGREEMENT_PAGE)) {
    return getLineup
  }
  if (matchPage(PROFILE_PAGE)) {
    return getProfileAgreementsLineup
  }
  return getDiscoverFeedLineup
}

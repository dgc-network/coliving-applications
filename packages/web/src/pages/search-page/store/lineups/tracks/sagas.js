import { select, all, call } from 'redux-saga/effects'

import { getAgreements } from 'common/store/cache/agreements/selectors'
import {
  PREFIX,
  agreementsActions
} from 'common/store/pages/searchResults/lineup/agreements/actions'
import {
  getSearchAgreementsLineup,
  getSearchResultsPageAgreements
} from 'common/store/pages/searchResults/selectors'
import { SearchKind } from 'common/store/pages/searchResults/types'
import {
  getCategory,
  getQuery,
  isTagSearch,
  getSearchTag
} from 'pages/search-page/helpers'
import {
  getSearchResults,
  getTagSearchResults
} from 'pages/search-page/store/sagas'
import { LineupSagas } from 'store/lineup/sagas'
import { isMobile } from 'utils/clientUtil'

function* getSearchPageResultsAgreements({ offset, limit, payload }) {
  const category = getCategory()

  if (category === SearchKind.AGREEMENTS || isMobile()) {
    // If we are on the agreements sub-page of search or mobile, which we should paginate on
    let results
    if (isTagSearch()) {
      const tag = getSearchTag()
      const { agreements } = yield call(
        getTagSearchResults,
        tag,
        category,
        limit,
        offset
      )
      results = agreements
    } else {
      const query = getQuery()
      const { agreements } = yield call(
        getSearchResults,
        query,
        category,
        limit,
        offset
      )
      results = agreements
    }
    if (results) return results
    return []
  } else {
    // If we are part of the all results search page
    try {
      const agreementIds = yield select(getSearchResultsPageAgreements)

      // getAgreements returns an unsorted map of ID to agreement metadata.
      // We sort this object by agreementIds, which is returned sorted by discprov.
      const [agreements, sortedIds] = yield all([
        select(getAgreements, { ids: agreementIds }),
        select(getSearchResultsPageAgreements)
      ])
      const sortedAgreements = sortedIds.map((id) => agreements[id])
      return sortedAgreements
    } catch (e) {
      console.error(e)
      return []
    }
  }
}

class SearchPageResultsSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      agreementsActions,
      getSearchAgreementsLineup,
      getSearchPageResultsAgreements
    )
  }
}

export default function sagas() {
  return new SearchPageResultsSagas().getSagas()
}

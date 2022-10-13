import { select, all, call } from 'redux-saga/effects'

import { getDigitalContents } from 'common/store/cache/digital_contents/selectors'
import {
  PREFIX,
  digitalContentsActions
} from 'common/store/pages/searchResults/lineup/digital_contents/actions'
import {
  getSearchDigitalContentsLineup,
  getSearchResultsPageDigitalContents
} from 'common/store/pages/searchResults/selectors'
import { SearchKind } from 'common/store/pages/searchResults/types'
import {
  getCategory,
  getQuery,
  isTagSearch,
  getSearchTag
} from 'pages/searchPage/helpers'
import {
  getSearchResults,
  getTagSearchResults
} from 'pages/searchPage/store/sagas'
import { LineupSagas } from 'store/lineup/sagas'
import { isMobile } from 'utils/clientUtil'

function* getSearchPageResultsDigitalContents({ offset, limit, payload }) {
  const category = getCategory()

  if (category === SearchKind.AGREEMENTS || isMobile()) {
    // If we are on the digitalContents sub-page of search or mobile, which we should paginate on
    let results
    if (isTagSearch()) {
      const tag = getSearchTag()
      const { digitalContents } = yield call(
        getTagSearchResults,
        tag,
        category,
        limit,
        offset
      )
      results = digitalContents
    } else {
      const query = getQuery()
      const { digitalContents } = yield call(
        getSearchResults,
        query,
        category,
        limit,
        offset
      )
      results = digitalContents
    }
    if (results) return results
    return []
  } else {
    // If we are part of the all results search page
    try {
      const digitalContentIds = yield select(getSearchResultsPageDigitalContents)

      // getDigitalContents returns an unsorted map of ID to digital_content metadata.
      // We sort this object by digitalContentIds, which is returned sorted by discprov.
      const [digitalContents, sortedIds] = yield all([
        select(getDigitalContents, { ids: digitalContentIds }),
        select(getSearchResultsPageDigitalContents)
      ])
      const sortedDigitalContents = sortedIds.map((id) => digitalContents[id])
      return sortedDigitalContents
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
      digitalContentsActions,
      getSearchDigitalContentsLineup,
      getSearchPageResultsDigitalContents
    )
  }
}

export default function sagas() {
  return new SearchPageResultsSagas().getSagas()
}

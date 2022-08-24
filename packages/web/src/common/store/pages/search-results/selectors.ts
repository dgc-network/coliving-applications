import { createSelector } from 'reselect'

import { CommonState } from 'common/store'
import { getCollections } from 'common/store/cache/collections/selectors'
import { getUsers } from 'common/store/cache/users/selectors'
import { createShallowSelector } from 'common/utils/selectorHelpers'

// Search Results selectors
export const getBaseState = (state: CommonState) => state.pages.searchResults
export const getSearchAgreementsLineup = (state: CommonState) =>
  getBaseState(state).agreements
export const getSearchResults = (state: CommonState) => getBaseState(state)
export const getSearchStatus = (state: CommonState) =>
  getBaseState(state).status
export const getSearchResultsPageAgreements = (state: CommonState) =>
  getBaseState(state).agreementIds || []

const getSearchLandlordsIds = (state: CommonState) =>
  getBaseState(state).landlordIds || []
const getUnsortedSearchLandlords = createShallowSelector(
  [getSearchLandlordsIds, (state) => state],
  (landlordIds, state) => getUsers(state, { ids: landlordIds })
)
export const makeGetSearchLandlords = () => {
  return createSelector(
    [getSearchLandlordsIds, getUnsortedSearchLandlords],
    (ids, landlords) =>
      ids.map((id) => landlords[id]).filter((a) => !a.is_deactivated)
  )
}

const getSearchAlbums = (state: CommonState) =>
  getCollections(state, { ids: getBaseState(state).albumIds })
export const makeGetSearchAlbums = () => {
  return createShallowSelector([getSearchAlbums, getUsers], (albums, users) =>
    Object.values(albums)
      .map((album) => {
        return {
          ...album,
          user: users[album.content_list_owner_id]
        }
      })
      .filter((album) => !!album.user && !album.user.is_deactivated)
  )
}

const getSearchContentLists = (state: CommonState) =>
  getCollections(state, { ids: getBaseState(state).contentListIds })
export const makeGetSearchContentLists = () => {
  return createShallowSelector(
    [getSearchContentLists, getUsers],
    (contentLists, users) =>
      Object.values(contentLists)
        .map((contentList) => {
          return {
            ...contentList,
            user: users[contentList.content_list_owner_id],
            agreementCount: (contentList.content_list_contents.agreement_ids || []).length
          }
        })
        .filter((contentList) => !!contentList.user && !contentList.user.is_deactivated)
  )
}

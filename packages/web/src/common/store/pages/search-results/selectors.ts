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

const getSearchArtistsIds = (state: CommonState) =>
  getBaseState(state).artistIds || []
const getUnsortedSearchArtists = createShallowSelector(
  [getSearchArtistsIds, (state) => state],
  (artistIds, state) => getUsers(state, { ids: artistIds })
)
export const makeGetSearchArtists = () => {
  return createSelector(
    [getSearchArtistsIds, getUnsortedSearchArtists],
    (ids, artists) =>
      ids.map((id) => artists[id]).filter((a) => !a.is_deactivated)
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
          user: users[album.content list_owner_id]
        }
      })
      .filter((album) => !!album.user && !album.user.is_deactivated)
  )
}

const getSearchContentLists = (state: CommonState) =>
  getCollections(state, { ids: getBaseState(state).content listIds })
export const makeGetSearchContentLists = () => {
  return createShallowSelector(
    [getSearchContentLists, getUsers],
    (content lists, users) =>
      Object.values(content lists)
        .map((content list) => {
          return {
            ...content list,
            user: users[content list.content list_owner_id],
            agreementCount: (content list.content list_contents.agreement_ids || []).length
          }
        })
        .filter((content list) => !!content list.user && !content list.user.is_deactivated)
  )
}

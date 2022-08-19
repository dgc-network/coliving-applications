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
          user: users[album.playlist_owner_id]
        }
      })
      .filter((album) => !!album.user && !album.user.is_deactivated)
  )
}

const getSearchPlaylists = (state: CommonState) =>
  getCollections(state, { ids: getBaseState(state).playlistIds })
export const makeGetSearchPlaylists = () => {
  return createShallowSelector(
    [getSearchPlaylists, getUsers],
    (playlists, users) =>
      Object.values(playlists)
        .map((playlist) => {
          return {
            ...playlist,
            user: users[playlist.playlist_owner_id],
            agreementCount: (playlist.playlist_contents.agreement_ids || []).length
          }
        })
        .filter((playlist) => !!playlist.user && !playlist.user.is_deactivated)
  )
}

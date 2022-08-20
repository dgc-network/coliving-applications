import { removeNullable } from '@coliving/common'
import { createSelector } from 'reselect'

import { CommonState } from 'common/store'
import { getCollections } from 'common/store/cache/collections/selectors'
import { getUser, getUsers } from 'common/store/cache/users/selectors'

import { AccountCollection } from './reducer'

const internalGetAccountCollections = (state: CommonState) =>
  state.account.collections
const internalGetUserPlaylists = (state: CommonState) =>
  Object.values(state.account.collections)
const internalGetAccountUser = (state: CommonState) =>
  getUser(state, { id: getUserId(state) })

export const getHasAccount = (state: CommonState) => !!state.account.userId
export const getUserId = (state: CommonState) => state.account.userId
export const getAccountStatus = (state: CommonState) => state.account.status
export const getUserPlaylistOrder = (state: CommonState) =>
  state.account.orderedPlaylists
export const getConnectivityFailure = (state: CommonState) =>
  state.account.connectivityFailure
export const getNeedsAccountRecovery = (state: CommonState) =>
  state.account.needsAccountRecovery
export const getAccountToCache = (state: CommonState) => ({
  userId: state.account.userId,
  collections: state.account.collections,
  hasFavoritedItem: state.account.hasFavoritedItem
})

export const getAccountUser = createSelector(
  [internalGetAccountUser],
  (user) => user
)
export const getUserHandle = createSelector([internalGetAccountUser], (user) =>
  user ? user.handle : null
)
export const getUserName = createSelector([internalGetAccountUser], (user) =>
  user ? user.name : null
)
export const getAccountVerified = createSelector(
  [internalGetAccountUser],
  (user) => (user ? user.is_verified : false)
)
export const getAccountHasAgreements = createSelector(
  [internalGetAccountUser],
  (user) => (user ? user.agreement_count > 0 : false)
)
export const getAccountCollectibles = createSelector(
  [internalGetAccountUser],
  (user) => [
    ...(user?.collectibleList ?? []),
    ...(user?.solanaCollectibleList ?? [])
  ]
)
export const getAccountProfilePictureSizes = (state: CommonState) => {
  const user = internalGetAccountUser(state)
  return user ? user._profile_picture_sizes : null
}
export const getPlaylistLibrary = (state: CommonState) => {
  return getAccountUser(state)?.content list_library ?? null
}

/**
 * Gets the account and full content list metadatas.
 * TODO: Add handle directly to content list metadata so we don't need to join against users.
 */
export const getAccountWithCollections = createSelector(
  [getAccountUser, internalGetUserPlaylists, getCollections, getUsers],
  (account, userPlaylists, collections, users) => {
    if (!account) return undefined
    return {
      ...account,
      collections: [...userPlaylists]
        .map((collection) =>
          collections[collection.id] &&
          !collections[collection.id]?._marked_deleted &&
          !collections[collection.id]?.is_delete &&
          collection.user.id in users &&
          !users[collection.user.id].is_deactivated
            ? {
                ...collections[collection.id],
                ownerHandle: collection.user.handle,
                ownerName: users[collection.user.id].name
              }
            : null
        )
        .filter(removeNullable)
    }
  }
)

/**
 * Gets the account's content list nav bar info
 */
export const getAccountNavigationPlaylists = (state: CommonState) => {
  return Object.keys(state.account.collections).reduce((acc, cur) => {
    const collection = state.account.collections[cur as unknown as number]
    if (collection.is_album) return acc
    if (getUser(state, { id: collection.user.id })?.is_deactivated) return acc
    return {
      ...acc,
      [cur]: collection
    }
  }, {} as { [id: number]: AccountCollection })
}

/**
 * Gets user content lists with content lists marked delete removed.
 */
export const getUserPlaylists = createSelector(
  [internalGetUserPlaylists, getCollections],
  (content lists, collections) => {
    // Strange filter:
    // If we haven't cached the collection (e.g. on first load), always return it.
    // If we have cached it and it's marked delete, don't return it bc we know better now.
    return content lists.filter(
      (p) => !collections[p.id] || !collections[p.id]._marked_deleted
    )
  }
)

export const getAccountCollections = createSelector(
  [internalGetAccountCollections, getCollections],
  (accountCollections, collections) => {
    return Object.keys(accountCollections).reduce((acc, cur) => {
      const agreement = accountCollections[cur as unknown as number]
      if (!collections[agreement.id] || collections[agreement.id]._marked_deleted)
        return acc
      return {
        ...acc,
        [agreement.id]: agreement
      }
    }, {} as { [id: number]: AccountCollection })
  }
)

export const getAccountWithPlaylists = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      content lists: account.collections.filter((c) => !c.is_album)
    }
  }
)

export const getAccountWithOwnPlaylists = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      content lists: account.collections.filter(
        (c) => account && !c.is_album && account.user_id === c.content list_owner_id
      )
    }
  }
)

export const getAccountWithAlbums = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      albums: account.collections.filter((c) => c.is_album)
    }
  }
)

export const getAccountWithPlaylistsAndAlbums = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      content lists: account.collections.filter((c) => !c.is_album),
      albums: account.collections.filter((c) => c.is_album)
    }
  }
)

export const getAccountWithSavedPlaylistsAndAlbums = createSelector(
  [getUserHandle, getAccountWithCollections],
  (handle, account) => {
    if (!account) return undefined
    return {
      ...account,
      content lists: account.collections.filter(
        (c) => !c.is_album && c.ownerHandle !== handle
      ),
      albums: account.collections.filter(
        (c) => c.is_album && c.ownerHandle !== handle
      )
    }
  }
)

export const getAccountOwnedPlaylists = createSelector(
  [getUserPlaylists, getUserId],
  (collections, userId) =>
    collections.filter((c) => !c.is_album && c.user.id === userId)
)

export const getAccountAlbumIds = createSelector(
  [getUserPlaylists],
  (collections) => collections.filter((c) => c.is_album).map(({ id }) => id)
)

export const getAccountSavedPlaylistIds = createSelector(
  [getUserPlaylists, getUserId],
  (collections, userId) =>
    collections
      .filter((c) => !c.is_album && c.user.id !== userId)
      .map(({ id }) => id)
)

export const getAccountOwnedPlaylistIds = createSelector(
  [getUserPlaylists, getUserId],
  (collections, userId) =>
    collections
      .filter((c) => !c.is_album && c.user.id === userId)
      .map(({ id }) => id)
)

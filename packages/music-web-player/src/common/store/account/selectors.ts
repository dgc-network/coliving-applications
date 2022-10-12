import { removeNullable } from '@coliving/common'
import { createSelector } from 'reselect'

import { CommonState } from 'common/store'
import { getCollections } from 'common/store/cache/collections/selectors'
import { getUser, getUsers } from 'common/store/cache/users/selectors'

import { AccountCollection } from './reducer'

const internalGetAccountCollections = (state: CommonState) =>
  state.account.collections
const internalGetUserContentLists = (state: CommonState) =>
  Object.values(state.account.collections)
const internalGetAccountUser = (state: CommonState) =>
  getUser(state, { id: getUserId(state) })

export const getHasAccount = (state: CommonState) => !!state.account.userId
export const getUserId = (state: CommonState) => state.account.userId
export const getAccountStatus = (state: CommonState) => state.account.status
export const getUserContentListOrder = (state: CommonState) =>
  state.account.orderedContentLists
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
export const getAccountHasDigitalContents = createSelector(
  [internalGetAccountUser],
  (user) => (user ? user.digital_content_count > 0 : false)
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
export const getContentListLibrary = (state: CommonState) => {
  return getAccountUser(state)?.content_list_library ?? null
}

/**
 * Gets the account and full contentList metadatas.
 * TODO: Add handle directly to contentList metadata so we don't need to join against users.
 */
export const getAccountWithCollections = createSelector(
  [getAccountUser, internalGetUserContentLists, getCollections, getUsers],
  (account, userContentLists, collections, users) => {
    if (!account) return undefined
    return {
      ...account,
      collections: [...userContentLists]
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
 * Gets the account's contentList nav bar info
 */
export const getAccountNavigationContentLists = (state: CommonState) => {
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
 * Gets user contentLists with contentLists marked delete removed.
 */
export const getUserContentLists = createSelector(
  [internalGetUserContentLists, getCollections],
  (contentLists, collections) => {
    // Strange filter:
    // If we haven't cached the collection (e.g. on first load), always return it.
    // If we have cached it and it's marked delete, don't return it bc we know better now.
    return contentLists.filter(
      (p) => !collections[p.id] || !collections[p.id]._marked_deleted
    )
  }
)

export const getAccountCollections = createSelector(
  [internalGetAccountCollections, getCollections],
  (accountCollections, collections) => {
    return Object.keys(accountCollections).reduce((acc, cur) => {
      const digital_content = accountCollections[cur as unknown as number]
      if (!collections[digital_content.id] || collections[digital_content.id]._marked_deleted)
        return acc
      return {
        ...acc,
        [digital_content.id]: digital_content
      }
    }, {} as { [id: number]: AccountCollection })
  }
)

export const getAccountWithContentLists = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      contentLists: account.collections.filter((c) => !c.is_album)
    }
  }
)

export const getAccountWithOwnContentLists = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      contentLists: account.collections.filter(
        (c) => account && !c.is_album && account.user_id === c.content_list_owner_id
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

export const getAccountWithContentListsAndAlbums = createSelector(
  [getAccountWithCollections],
  (account) => {
    if (!account) return undefined
    return {
      ...account,
      contentLists: account.collections.filter((c) => !c.is_album),
      albums: account.collections.filter((c) => c.is_album)
    }
  }
)

export const getAccountWithSavedContentListsAndAlbums = createSelector(
  [getUserHandle, getAccountWithCollections],
  (handle, account) => {
    if (!account) return undefined
    return {
      ...account,
      contentLists: account.collections.filter(
        (c) => !c.is_album && c.ownerHandle !== handle
      ),
      albums: account.collections.filter(
        (c) => c.is_album && c.ownerHandle !== handle
      )
    }
  }
)

export const getAccountOwnedContentLists = createSelector(
  [getUserContentLists, getUserId],
  (collections, userId) =>
    collections.filter((c) => !c.is_album && c.user.id === userId)
)

export const getAccountAlbumIds = createSelector(
  [getUserContentLists],
  (collections) => collections.filter((c) => c.is_album).map(({ id }) => id)
)

export const getAccountSavedContentListIds = createSelector(
  [getUserContentLists, getUserId],
  (collections, userId) =>
    collections
      .filter((c) => !c.is_album && c.user.id !== userId)
      .map(({ id }) => id)
)

export const getAccountOwnedContentListIds = createSelector(
  [getUserContentLists, getUserId],
  (collections, userId) =>
    collections
      .filter((c) => !c.is_album && c.user.id === userId)
      .map(({ id }) => id)
)

import { ID, Status } from '@coliving/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { keyBy } from 'lodash'

const initialState = {
  collections: {} as { [id: number]: AccountCollection },
  // Used to digital_content the ordering of contentLists in the user's left nav
  // Array of strings that are either smart collection identifiers or user-generated collection ids
  orderedContentLists: [] as string[],
  userId: null as number | null,
  status: Status.LOADING,
  hasFavoritedItem: false,
  connectivityFailure: false, // Did we fail from no internet connectivity?
  needsAccountRecovery: false
}

export type AccountCollection = {
  id: ID
  name: string
  is_album: boolean
  user: { id: ID; handle: string }
}

type FetchAccountSucceededPayload = {
  userId: ID
  collections: AccountCollection[]
  orderedContentLists: string[]
  hasFavoritedItem: boolean
}

type FetchAccountFailedPayload = {
  reason: 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_NOT_FOUND' | 'LIBS_ERROR'
}

type RenameAccountContentListPayload = {
  collectionId: ID
  name: string
}

export type InstagramProfile = {
  id: string
  username: string
  biography?: string
  business_email?: string
  edge_follow?: { count: number }
  edge_followed_by?: { count: number }
  external_url?: string
  full_name?: string
  is_business_account?: boolean
  is_private?: boolean
  is_verified: boolean
  profile_pic_url?: string
  profile_pic_url_hd?: string
}

export type TwitterProfile = {
  screen_name: string
  name: string
  verified: boolean
  profile_image_url_https: string
  profile_banner_url?: string
}

export type AccountImage = { url: string; file: any }

const slice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    fetchAccount: () => {},
    fetchAccountRequested: (state) => {
      state.status = Status.LOADING
    },
    fetchAccountSucceeded: (
      state,
      action: PayloadAction<FetchAccountSucceededPayload>
    ) => {
      const { userId, orderedContentLists, collections, hasFavoritedItem } =
        action.payload
      state.userId = userId
      state.orderedContentLists = orderedContentLists
      state.collections = keyBy(collections, 'id')
      state.status = Status.SUCCESS
      state.hasFavoritedItem = hasFavoritedItem
    },
    fetchAccountFailed: (
      state,
      _action: PayloadAction<FetchAccountFailedPayload>
    ) => {
      state.status = Status.ERROR
    },
    fetchAccountNoInternet: (state) => {
      state.connectivityFailure = true
    },
    setReachable: (state) => {
      state.connectivityFailure = false
    },
    addAccountContentList: (state, action: PayloadAction<AccountCollection>) => {
      state.collections[action.payload.id] = action.payload
    },
    removeAccountContentList: (
      state,
      action: PayloadAction<{ collectionId: ID }>
    ) => {
      const { collectionId } = action.payload
      delete state.collections[collectionId]
    },
    renameAccountContentList: (
      state,
      action: PayloadAction<RenameAccountContentListPayload>
    ) => {
      const { collectionId, name } = action.payload
      state.collections[collectionId].name = name
    },
    fetchSavedAlbums: () => {},
    fetchSavedAlbumsSucceeded: (
      state,
      action: PayloadAction<{ collections: AccountCollection[] }>
    ) => {
      const { collections } = action.payload

      state.collections = {
        ...state.collections,
        ...keyBy(collections, 'id')
      }
    },
    fetchSavedContentLists: () => {},
    fetchSavedContentListsSucceeded: (
      state,
      action: PayloadAction<{ collections: AccountCollection[] }>
    ) => {
      const { collections } = action.payload

      state.collections = {
        ...state.collections,
        ...keyBy(collections, 'id')
      }
    },
    didFavoriteItem: (state) => {
      state.hasFavoritedItem = true
    },
    setNeedsAccountRecovery: (state) => {
      state.needsAccountRecovery = true
    },
    setContentListOrder: (state, action: PayloadAction<{ order: string[] }>) => {
      const { order } = action.payload
      state.orderedContentLists = order
    },
    fetchBrowserPushNotifications: () => {},
    subscribeBrowserPushNotifications: () => {},
    unsubscribeBrowserPushNotifications: () => {},
    twitterLogin: (
      state,
      action: PayloadAction<{ uuid: string; profile: any }>
    ) => {},
    instagramLogin: (
      state,
      action: PayloadAction<{ uuid: string; profile: InstagramProfile }>
    ) => {},
    showPushNotificationConfirmation: () => {}
  }
})

export const {
  fetchAccount,
  fetchAccountRequested,
  fetchAccountSucceeded,
  fetchAccountFailed,
  fetchAccountNoInternet,
  setReachable,
  addAccountContentList,
  removeAccountContentList,
  renameAccountContentList,
  fetchSavedAlbums,
  fetchSavedAlbumsSucceeded,
  fetchSavedContentLists,
  fetchSavedContentListsSucceeded,
  didFavoriteItem,
  setNeedsAccountRecovery,
  setContentListOrder,
  fetchBrowserPushNotifications,
  subscribeBrowserPushNotifications,
  unsubscribeBrowserPushNotifications,
  instagramLogin,
  twitterLogin,
  showPushNotificationConfirmation
} = slice.actions

export default slice

import { ID, FavoriteType } from '@coliving/common'

import { UserListStoreState } from 'common/store/userList/types'

export type FavoritesOwnState = {
  id: ID | null
  favoriteType: FavoriteType
}

export type FavoritesPageState = {
  favoritesPage: FavoritesOwnState
  userList: UserListStoreState
}

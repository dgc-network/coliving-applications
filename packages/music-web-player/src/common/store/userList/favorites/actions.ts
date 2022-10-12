import { ID, FavoriteType } from '@coliving/common'
import { createCustomAction } from 'typesafe-actions'

export const SET_FAVORITE = 'FAVORITING_USERS_PAGE/SET_FAVORITE'
export const GET_AGREEMENT_FAVORITE_ERROR =
  'FAVORITING_USERS_PAGE/GET_AGREEMENT_FAVORITE_ERROR'
export const GET_CONTENT_LIST_FAVORITE_ERROR =
  'FAVORITING_USERS_PAGE/GET_CONTENT_LIST_FAVORITE_ERROR'

export const setFavorite = createCustomAction(
  SET_FAVORITE,
  (id: ID, favoriteType: FavoriteType) => ({ id, favoriteType })
)
export const digitalContentFavoriteError = createCustomAction(
  GET_AGREEMENT_FAVORITE_ERROR,
  (id: ID, error: string) => ({ id, error })
)
export const contentListFavoriteError = createCustomAction(
  GET_CONTENT_LIST_FAVORITE_ERROR,
  (id: ID, error: string) => ({ id, error })
)

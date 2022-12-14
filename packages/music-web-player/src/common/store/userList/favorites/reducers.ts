import { FavoriteType } from '@coliving/common'
import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/userList/reducer'

import { USER_LIST_TAG } from '../../../../pages/favoritesPage/sagas'

import * as actions from './actions'
import { FavoritesOwnState } from './types'

type FavoriteActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null,
  favoriteType: FavoriteType.DIGITAL_CONTENT
}

const favoritesPageReducer = createReducer<FavoritesOwnState, FavoriteActions>(
  initialState,
  {
    [actions.SET_FAVORITE](state, action) {
      return {
        ...state,
        id: action.id,
        favoriteType: action.favoriteType
      }
    }
  }
)

export default combineReducers({
  favoritesPage: favoritesPageReducer,
  userList: userListReducer
})

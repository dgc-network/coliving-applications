import { UserCollection, Status, User } from '@coliving/common'
import { createSelector } from 'reselect'

import { CommonState } from 'common/store'
import { getCollections } from 'common/store/cache/collections/selectors'
import { getUsers } from 'common/store/cache/users/selectors'

const getExplore = (state: CommonState) => state.pages.explore

export type GetExplore = {
  contentLists: UserCollection[]
  profiles: User[]
  status: Status
}

export const makeGetExplore = () => {
  return createSelector(
    getExplore,
    getCollections,
    getUsers,
    (explore, collections, users) => {
      const contentLists = explore.contentLists
        .map((id) => collections[id])
        .filter(Boolean)
        .map((collection) => ({
          ...collection,
          user: users[collection.content_list_owner_id] || {}
        }))
      const profiles = explore.profiles.map((id) => users[id]).filter(Boolean)
      return {
        contentLists,
        profiles,
        status: explore.status
      }
    }
  )
}

export const getTab = (state: CommonState) => state.pages.explore.tab

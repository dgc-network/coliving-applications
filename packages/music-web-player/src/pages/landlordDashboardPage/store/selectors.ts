import { createSelector } from 'reselect'

import { getAccountUser } from 'common/store/account/selectors'
import { AppState } from 'store/types'

// Dashboard selectors
export const getDashboardStatus = (state: AppState) => state.dashboard.status
export const getDashboardDigitalContents = (state: AppState) => state.dashboard.digitalContents
export const getUnlistedDashboardDigitalContents = (state: AppState) =>
  state.dashboard.unlistedDigitalContents
export const getDashboardListenData = (state: AppState) =>
  state.dashboard.listenData

export const makeGetDashboard = () => {
  return createSelector(
    [getAccountUser, getDashboardDigitalContents, getUnlistedDashboardDigitalContents],
    (account, digitalContents, unlistedDigitalContents) => {
      const stats = {
        digitalContents: account ? account.digital_content_count : 0,
        contentLists: account ? account.content_list_count : 0,
        // albums: account ? account.album_count : 0,
        plays: digitalContents.reduce(
          (totalPlays: any, digital_content: { play_count: any }) => totalPlays + (digital_content.play_count || 0),
          0
        ),
        reposts: account ? account.repost_count : 0,
        // saves: account ? 0,
        followers: account ? account.follower_count : 0
      }
      return {
        account,
        digitalContents,
        unlistedDigitalContents,
        stats
      }
    }
  )
}

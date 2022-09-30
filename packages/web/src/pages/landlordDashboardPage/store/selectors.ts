import { createSelector } from 'reselect'

import { getAccountUser } from 'common/store/account/selectors'
import { AppState } from 'store/types'

// Dashboard selectors
export const getDashboardStatus = (state: AppState) => state.dashboard.status
export const getDashboardAgreements = (state: AppState) => state.dashboard.agreements
export const getUnlistedDashboardAgreements = (state: AppState) =>
  state.dashboard.unlistedAgreements
export const getDashboardListenData = (state: AppState) =>
  state.dashboard.listenData

export const makeGetDashboard = () => {
  return createSelector(
    [getAccountUser, getDashboardAgreements, getUnlistedDashboardAgreements],
    (account, agreements, unlistedAgreements) => {
      const stats = {
        agreements: account ? account.agreement_count : 0,
        contentLists: account ? account.content_list_count : 0,
        // albums: account ? account.album_count : 0,
        plays: agreements.reduce(
          (totalPlays: any, agreement: { play_count: any }) => totalPlays + (agreement.play_count || 0),
          0
        ),
        reposts: account ? account.repost_count : 0,
        // saves: account ? 0,
        followers: account ? account.follower_count : 0
      }
      return {
        account,
        agreements,
        unlistedAgreements,
        stats
      }
    }
  )
}

import { createSelector } from 'reselect'

import type { AppState } from '..'

export const getBaseState = (state: AppState) => state.signon

export const getIsSigninError = (state: AppState) => getBaseState(state).isError
export const getEmailIsAvailable = (state: AppState) =>
  getBaseState(state).emailIsAvailable
export const getEmailIsValid = (state: AppState) =>
  getBaseState(state).emailIsValid
export const getEmailStatus = (state: AppState) =>
  getBaseState(state).emailStatus
export const getHandleIsValid = (state: AppState) =>
  getBaseState(state).handleIsValid
export const getHandleStatus = (state: AppState) =>
  getBaseState(state).handleStatus
export const getHandleError = (state: AppState) =>
  getBaseState(state).handleError
export const getUserId = (state: AppState) => getBaseState(state).userId
export const getUsersToFollow = (state: AppState) =>
  getBaseState(state).followLandlords.usersToFollow
export const getAllFollowLandlords = (state: AppState) =>
  getBaseState(state).followLandlords
export const getAccountAvailable = (state: AppState) =>
  getBaseState(state).accountAvailable
export const getFinalEmail = (state: AppState) => getBaseState(state).finalEmail
export const getFinalHandle = (state: AppState) =>
  getBaseState(state).finalHandle

const getSuggestedFollowIds = (state: AppState) => {
  const { selectedCategory, categories } = getBaseState(state).followLandlords
  return categories[selectedCategory] || []
}
export const makeGetFollowLandlords = () =>
  createSelector(
    [getSuggestedFollowIds, getUsersToFollow],
    (landlordIds: number[], users: any[]) =>
      landlordIds.map((aId) => users[aId]).filter(Boolean)
  )

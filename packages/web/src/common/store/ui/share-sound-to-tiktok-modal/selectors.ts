import { createSelector } from '@reduxjs/toolkit'

import { CommonState } from 'common/store'

const shareSoundToTikTokModalState = (state: CommonState) =>
  state.ui.shareSoundToTikTokModal

export const getAgreement = createSelector(
  shareSoundToTikTokModalState,
  (state) => state.agreement
)
export const getIsAuthenticated = createSelector(
  shareSoundToTikTokModalState,
  (state) => state.isAuthenticated
)
export const getStatus = createSelector(
  shareSoundToTikTokModalState,
  (state) => state.status
)
export const getOpenId = createSelector(
  shareSoundToTikTokModalState,
  (state) => state.openId
)
export const getAccessToken = createSelector(
  shareSoundToTikTokModalState,
  (state) => state.accessToken
)

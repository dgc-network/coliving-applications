import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { CommonState } from 'common/store'

export type Modals =
  | 'TiersExplainer'
  | 'TrendingRewardsExplainer'
  | 'ChallengeRewardsExplainer'
  | 'LinkSocialRewardsExplainer'
  | 'APIRewardsExplainer'
  | 'TransferAudioMobileWarning'
  | 'MobileConnectWalletsDrawer'
  | 'MobileEditCollectiblesDrawer'
  | 'Share'
  | 'ShareSoundToTikTok'
  | 'HCaptcha'
  | 'BrowserPushPermissionConfirmation'
  | 'DigitalcoinBreakdown'
  | 'CollectibleDetails'
  | 'DeactivateAccountConfirmation'
  | 'Cognito'
  | 'FeedFilter'
  | 'TrendingGenreSelection'
  | 'SocialProof'
  | 'MobileUpload'
  | 'EditFolder'
  | 'SignOutConfirmation'
  | 'Overflow'
  | 'AddToContentList'
  | 'DeleteContentListConfirmation'
  | 'FeatureFlagOverride'

export type ModalsState = { [modal in Modals]: boolean | 'closing' }

const initialState: ModalsState = {
  TiersExplainer: false,
  TrendingRewardsExplainer: false,
  ChallengeRewardsExplainer: false,
  LinkSocialRewardsExplainer: false,
  APIRewardsExplainer: false,
  TransferAudioMobileWarning: false,
  MobileConnectWalletsDrawer: false,
  MobileEditCollectiblesDrawer: false,
  Share: false,
  ShareSoundToTikTok: false,
  HCaptcha: false,
  BrowserPushPermissionConfirmation: false,
  DigitalcoinBreakdown: false,
  CollectibleDetails: false,
  DeactivateAccountConfirmation: false,
  Cognito: false,
  FeedFilter: false,
  TrendingGenreSelection: false,
  SocialProof: false,
  MobileUpload: false,
  EditFolder: false,
  SignOutConfirmation: false,
  Overflow: false,
  AddToContentList: false,
  DeleteContentListConfirmation: false,
  FeatureFlagOverride: false
}

const slice = createSlice({
  name: 'application/ui/modals',
  initialState,
  reducers: {
    setVisibility: (
      state,
      action: PayloadAction<{
        modal: Modals
        visible: boolean | 'closing'
      }>
    ) => {
      const { modal, visible } = action.payload
      state[modal] = visible
    }
  }
})

export const getModalVisibility = (state: CommonState, modal: Modals) =>
  state.ui.modals[modal]

export const getModalIsOpen = (state: CommonState) =>
  Object.values(state.ui.modals).some((isOpen) => isOpen)

export const { setVisibility } = slice.actions

export default slice.reducer

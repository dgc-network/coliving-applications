import type { ComponentType } from 'react'

import type { Modals } from '@coliving/web/src/common/store/ui/modals/slice'

import { AddToContentListDrawer } from 'app/components/addToContentListDrawer'
import { ApiRewardsDrawer } from 'app/components/apiRewardsDrawer/apiRewardsDrawer'
import { AudioBreakdownDrawer } from 'app/components/liveBreakdownDrawer'
import { TiersExplainerDrawer } from 'app/components/liveRewards'
import { ChallengeRewardsDrawer } from 'app/components/challengeRewardsDrawer'
import { CognitoDrawer } from 'app/components/cognitoDrawer/cognitoDrawer'
import { CollectibleDetailsDrawer } from 'app/components/collectibleDetailsDrawer'
import { ConnectWalletsDrawer } from 'app/components/connectWalletsDrawer'
import { DeactivateAccountConfirmationDrawer } from 'app/components/deactivateAccountConfirmationDrawer'
import { DeleteContentListConfirmationDrawer } from 'app/components/deleteContentListConfirmation-drawer'
import { DownloadAgreementProgressDrawer } from 'app/components/downloadAgreementProgressDrawer'
import { EditCollectiblesDrawer } from 'app/components/editCollectiblesDrawer'
import { EnablePushNotificationsDrawer } from 'app/components/enablePushNotificationsDrawer'
import { FeedFilterDrawer } from 'app/components/feedFilterDrawer'
import { ForgotPasswordDrawer } from 'app/components/forgotPasswordDrawer'
import { MobileUploadDrawer } from 'app/components/mobileUploadDrawer'
import { OverflowMenuDrawer } from 'app/components/overflowMenuDrawer'
import { ShareDrawer } from 'app/components/shareDrawer'
import { ShareToTikTokDrawer } from 'app/components/shareToTiktokDrawer'
import { SignOutConfirmationDrawer } from 'app/components/signOutConfirmationDrawer'
import { TransferAudioMobileDrawer } from 'app/components/transferLiveMobileDrawer'
import { TrendingRewardsDrawer } from 'app/components/trendingRewardsDrawer'
import { TrendingFilterDrawer } from 'app/screens/trendingScreen'

import { DiscordDrawer } from './components/discordDrawer'
import { useDrawerState } from './components/drawer'
import { useDrawer } from './hooks/useDrawer'
import type { Drawer } from './store/drawers/slice'

type CommonDrawerProps = {
  modal: ComponentType
  modalName: Modals
}

/*
 * Conditionally renders the drawers hooked up to @coliving/web/src/common/ui/modal slice
 */
const CommonDrawer = ({ modal: Modal, modalName }: CommonDrawerProps) => {
  const { modalState } = useDrawerState(modalName)

  if (modalState === false) return null

  return <Modal />
}

type NativeDrawerProps = {
  drawer: ComponentType
  drawerName: Drawer
}

/*
 * Conditionally renders the drawers hooked up to native store/drawers slice
 */
const NativeDrawer = ({ drawer: Drawer, drawerName }: NativeDrawerProps) => {
  const { visibleState } = useDrawer(drawerName)

  if (visibleState === false) return null

  return <Drawer />
}

const commonDrawersMap: { [Modal in Modals]?: ComponentType } = {
  TiersExplainer: TiersExplainerDrawer,
  TrendingRewardsExplainer: TrendingRewardsDrawer,
  ChallengeRewardsExplainer: ChallengeRewardsDrawer,
  APIRewardsExplainer: ApiRewardsDrawer,
  TransferAudioMobileWarning: TransferAudioMobileDrawer,
  MobileConnectWalletsDrawer: ConnectWalletsDrawer,
  MobileEditCollectiblesDrawer: EditCollectiblesDrawer,
  Share: ShareDrawer,
  ShareSoundToTikTok: ShareToTikTokDrawer,
  CollectibleDetails: CollectibleDetailsDrawer,
  DeactivateAccountConfirmation: DeactivateAccountConfirmationDrawer,
  Cognito: CognitoDrawer,
  FeedFilter: FeedFilterDrawer,
  TrendingGenreSelection: TrendingFilterDrawer,
  MobileUpload: MobileUploadDrawer,
  Overflow: OverflowMenuDrawer,
  SignOutConfirmation: SignOutConfirmationDrawer,
  AddToContentList: AddToContentListDrawer,
  AudioBreakdown: AudioBreakdownDrawer,
  DeleteContentListConfirmation: DeleteContentListConfirmationDrawer
}

const nativeDrawersMap: { [DrawerName in Drawer]?: ComponentType } = {
  EnablePushNotifications: EnablePushNotificationsDrawer,
  DownloadAgreementProgress: DownloadAgreementProgressDrawer,
  ForgotPassword: ForgotPasswordDrawer
}

const commonDrawers = Object.entries(commonDrawersMap) as [
  Modals,
  ComponentType
][]

const nativeDrawers = Object.entries(nativeDrawersMap) as [
  Drawer,
  ComponentType
][]

export const Drawers = () => {
  return (
    <>
      {commonDrawers.map(([modalName, Modal]) => {
        return (
          <CommonDrawer modal={Modal} modalName={modalName} key={modalName} />
        )
      })}
      {nativeDrawers.map(([drawerName, Drawer]) => (
        <NativeDrawer
          key={drawerName}
          drawerName={drawerName}
          drawer={Drawer}
        />
      ))}
      <DiscordDrawer />
    </>
  )
}

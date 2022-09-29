import { ComponentType } from 'react'

import { Client } from '@coliving/common'

import type { Modals as ModalTypes } from 'common/store/ui/modals/slice'
import AddToContentListModal from 'components/addToContentList/desktop/addToContentListModal'
import AppCTAModal from 'components/appCTAModal/appCTAModal'
import BrowserPushConfirmationModal from 'components/browserPushConfirmationModal/browserPushConfirmationModal'
import CollectibleDetailsModal from 'components/collectibles/components/collectibleDetailsModal'
import DeleteContentListConfirmationModal from 'components/deleteContentListConfirmation-modal/deleteContentListConfirmationModal'
import EditFolderModal from 'components/editFolderModal/editFolderModal'
import EditContentListModal from 'components/editContentList/desktop/editContentListModal'
import EditAgreementModal from 'components/editAgreement/editAgreementModal'
import EmbedModal from 'components/embedModal/embedModal'
import { FeatureFlagOverrideModal } from 'components/featureFlagOverrideModal'
import FirstUploadModal from 'components/firstUploadModal/firstUploadModal'
import PasswordResetModal from 'components/password-reset/PasswordResetModal'
import ServiceSelectionModal from 'components/service-selection/ServiceSelectionModal'
import { ShareModal } from 'components/share-modal/ShareModal'
import ShareSoundToTikTokModal from 'components/share-sound-to-tiktok-modal/ShareSoundToTikTokModal'
import { TipAudioModal } from 'components/tipping/tip-live/TipAudioModal'
import ConnectedMobileOverflowModal from 'components/agreementOverflowModal/connectedMobileOverflowModal'
import UnfollowConfirmationModal from 'components/unfollow-confirmation-modal/UnfollowConfirmationModal'
import UnloadDialog from 'components/unload-dialog/UnloadDialog'
import TierExplainerModal from 'components/user-badges/TierExplainerModal'
import ConnectedUserListModal from 'components/user-list-modal/ConnectedUserListModal'
import AudioBreakdownModal from 'pages/live-rewards-page/components/modals/AudioBreakdownModal'
import RewardsModals from 'pages/live-rewards-page/components/modals/RewardsModals'
import { getClient } from 'utils/clientUtil'

import { AppModal } from './AppModal'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const NATIVE_NAVIGATION_ENABLED =
  process.env.REACT_APP_NATIVE_NAVIGATION_ENABLED === 'true'

const appModalsMap = {
  Share: ShareModal
}

const appModals = Object.entries(appModalsMap) as [ModalTypes, ComponentType][]

const Modals = () => {
  const client = getClient()
  const isMobileClient = client === Client.MOBILE

  if (NATIVE_NAVIGATION_ENABLED) return null

  return (
    <>
      {appModals.map(([modalName, Modal]) => {
        return <AppModal key={modalName} name={modalName} modal={Modal} />
      })}
      <ServiceSelectionModal />
      <EditAgreementModal />
      <PasswordResetModal />
      <FirstUploadModal />
      <UnloadDialog />
      <RewardsModals />
      <ShareSoundToTikTokModal />
      {/* Enable and use this live breakdown modal until we get
      the feature flags to work for native mobile */}
      <AudioBreakdownModal />
      <CollectibleDetailsModal />

      {!NATIVE_MOBILE && client !== Client.ELECTRON && (
        <BrowserPushConfirmationModal />
      )}

      {!isMobileClient && (
        <>
          <EmbedModal />
          <EditContentListModal />
          <EditFolderModal />
          <AddToContentListModal />
          <FeatureFlagOverrideModal />
          <ConnectedUserListModal />
          <AppCTAModal />
          <TierExplainerModal />
        </>
      )}

      {isMobileClient && (
        <>
          {!NATIVE_MOBILE && <ConnectedMobileOverflowModal />}
          <UnfollowConfirmationModal />
          <DeleteContentListConfirmationModal />
        </>
      )}

      {!NATIVE_MOBILE && <TipAudioModal />}
    </>
  )
}

export default Modals

import { ComponentType } from 'react'

import { Client } from '@coliving/common'

import type { Modals as ModalTypes } from 'common/store/ui/modals/slice'
import AddToContentListModal from 'components/add-to-contentList/desktop/AddToContentListModal'
import AppCTAModal from 'components/app-cta-modal/AppCTAModal'
import BrowserPushConfirmationModal from 'components/browser-push-confirmation-modal/BrowserPushConfirmationModal'
import CollectibleDetailsModal from 'components/collectibles/components/CollectibleDetailsModal'
import DeleteContentListConfirmationModal from 'components/delete-contentList-confirmation-modal/DeleteContentListConfirmationModal'
import EditFolderModal from 'components/edit-folder-modal/EditFolderModal'
import EditContentListModal from 'components/edit-contentList/desktop/EditContentListModal'
import EditAgreementModal from 'components/edit-agreement/EditAgreementModal'
import EmbedModal from 'components/embed-modal/EmbedModal'
import { FeatureFlagOverrideModal } from 'components/feature-flag-override-modal'
import FirstUploadModal from 'components/first-upload-modal/FirstUploadModal'
import PasswordResetModal from 'components/password-reset/PasswordResetModal'
import ServiceSelectionModal from 'components/service-selection/ServiceSelectionModal'
import { ShareModal } from 'components/share-modal/ShareModal'
import ShareSoundToTikTokModal from 'components/share-sound-to-tiktok-modal/ShareSoundToTikTokModal'
import { TipAudioModal } from 'components/tipping/tip-live/TipAudioModal'
import ConnectedMobileOverflowModal from 'components/agreement-overflow-modal/ConnectedMobileOverflowModal'
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

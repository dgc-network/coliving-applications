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
import EditDigitalContentModal from 'components/editDigitalContent/editDigitalContentModal'
import EmbedModal from 'components/embedModal/embedModal'
import { FeatureFlagOverrideModal } from 'components/featureFlagOverrideModal'
import FirstUploadModal from 'components/firstUploadModal/firstUploadModal'
import PasswordResetModal from 'components/passwordReset/passwordResetModal'
import ServiceSelectionModal from 'components/serviceSelection/serviceSelectionModal'
import { ShareModal } from 'components/shareModal/shareModal'
import ShareSoundToTikTokModal from 'components/shareSoundToTiktokModal/shareSoundToTikTokModal'
import { TipAudioModal } from 'components/tipping/tipDigitalcoin/tipDigitalcoinModal'
import ConnectedMobileOverflowModal from 'components/digitalContentOverflowModal/connectedMobileOverflowModal'
import UnfollowConfirmationModal from 'components/unfollowConfirmationModal/unfollowConfirmationModal'
import UnloadDialog from 'components/unloadDialog/unloadDialog'
import TierExplainerModal from 'components/userBadges/tierExplainerModal'
import ConnectedUserListModal from 'components/userListModal/connectedUserListModal'
import DigitalcoinBreakdownModal from 'pages/liveRewardsPage/components/modals/digitalcoinBreakdownModal'
import RewardsModals from 'pages/liveRewardsPage/components/modals/rewardsModals'
import { getClient } from 'utils/clientUtil'

import { AppModal } from './appModal'

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
      <EditDigitalContentModal />
      <PasswordResetModal />
      <FirstUploadModal />
      <UnloadDialog />
      <RewardsModals />
      <ShareSoundToTikTokModal />
      {/* Enable and use this digitalcoin breakdown modal until we get
      the feature flags to work for native mobile */}
      <DigitalcoinBreakdownModal />
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

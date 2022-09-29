import { Suspense } from 'react'

import { isMobile } from 'utils/clientUtil'
import lazyWithPreload from 'utils/lazyWithPreload'

import ChallengeRewardsModal from './challengeRewards'
import TopAPIModal from './topAPI'
import TransferAudioMobileDrawer from './transferLiveMobileDrawer'
import TrendingRewardsModal from './trendingRewards'
import VerifiedUpload from './verifiedUpload'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const HCaptchaModal = lazyWithPreload(() => import('./hcaptchaModal'))
const CognitoModal = lazyWithPreload(() => import('./cognitoModal'))

const RewardsModals = () => {
  // TODO: preload HCaptchaModal when we decide to turn it on

  return (
    <>
      <TrendingRewardsModal />
      {!IS_NATIVE_MOBILE && <ChallengeRewardsModal />}
      <VerifiedUpload />
      <TopAPIModal />
      {!IS_NATIVE_MOBILE && (
        <Suspense fallback={null}>
          <HCaptchaModal />
          <CognitoModal />
        </Suspense>
      )}
      {!IS_NATIVE_MOBILE && isMobile() && <TransferAudioMobileDrawer />}
    </>
  )
}

export default RewardsModals
